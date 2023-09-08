/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { HttpException, HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { Timeout } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceTriplet } from '../..//FWAjs-utils/utils/auth.interface';
import { User } from '../../auth/user/entities/user.entity';
import { BaseService } from '../../core/base.service';
import {
    CREATE_ACTION,
    DELETE_ACTION,
    dispatchACDBs,
    FWACallFct,
    FwaException,
    onModuleDynamicInit,
    READ_ACTION,
    UPDATE_ACTION
} from '../../FWAjs-utils';
import { ApiAccessControlService } from '../../FWAjs-utils/accessControl/accessControl.service';
import {
    OWN_PROJECT_PARTICIPANT,
    PROJECT_PARTICIPANT
} from './accessControl/resourcesName.constants';
import {
    CANNOT_CREATE_PROJECT_PARTICIPANT,
    CANNOT_LIST_PARTICIPANTS,
    CANNOT_READ_PROJECT_PARTICIPANT,
    CANNOT_REMOVE_PARTICIPANT,
    CANNOT_UPDATE_PARTICIPANT,
    FAILED_TO_LOOKUP_PARTICIPANT,
    PROJECT_PARTICIPANT_ALREADY_ASSIGNED,
    PROJECT_PARTICIPANT_USER_NOT_FOUND
} from './constants/messageCode.constants';
import { CreateProjectParticipantDto } from './dto/create-project-participant.dto';
import { ProjectParticipantOneDto } from './dto/get-one-project-participant.dto';
import { ListProjectParticipantsDto } from './dto/list-project-participants.dto';
import { ProjectParticipantDto } from './dto/project-participant.dto';
import { UpdateProjectParticipantDto } from './dto/update-project-participant.dto';
import { ProjectParticipant } from './entities/projectParticipant.entity';

@Injectable()
export class ParticipantService extends BaseService implements OnModuleInit {

    private readonly RESOURCES = <ResourceTriplet>{
        global: PROJECT_PARTICIPANT,
        owned: OWN_PROJECT_PARTICIPANT,
        shared: undefined
    };

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //----------------------------------------------------------------------- 

    constructor(
        @InjectRepository(ProjectParticipant)
        private readonly participantRepo: Repository<ProjectParticipant>,
        protected readonly jwtService: JwtService,
        protected readonly accessControlService: ApiAccessControlService,
        protected readonly moduleRef: ModuleRef,
        protected readonly eventEmitter: EventEmitter2,
    ) { super(jwtService, accessControlService, moduleRef, eventEmitter); }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Primitive(s)
    //***********************************************************************
    //-----------------------------------------------------------------------    

    async onModuleInit() {
        await onModuleDynamicInit(this, null, [
            'projectService',
            'userService',
        ]);
    }

    //-----------------------------------------------------------------------    

    @Timeout(2000)
    async sendACDB() {
        dispatchACDBs(
            this,
            (await import('./accessControl/accessControl.database')).default,
        );
    }

    //----------------------------------------------------------------------- 

    private sanitizeResponse(entity: any, attributes: any): ProjectParticipantDto {
        let dto = ProjectParticipant.toDto(entity);
        return dto;

        //return this.accessControlService.filter(dto, attributes);
    }


    //-----------------------------------------------------------------------

    private async getUser(token, userId): Promise<User> {
        return await FWACallFct(
            this,
            { srv: 'userService', cmd: 'getOne' },
            {
                token,
                id: userId,
            }
        );
    }

    //----------------------------------------------------------------------- 

    private async participantAlreadyExists(projectId: number, userId: number): Promise<boolean> {
        try {
            let count = await this.participantRepo.count(
                {
                    user: { id: userId },
                    project: { id: projectId },

                },
            );
            return (count > 0);
        } catch (error) {
            throw FwaException({
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Failed to lookup participant',
                messageCode: FAILED_TO_LOOKUP_PARTICIPANT,
                messageData: { projectId: projectId, userId: userId },
            });
        }
    }

    //----------------------------------------------------------------------- 

    public async getParticipantRaw({ projectId, userId }: { projectId: number, userId: number }): Promise<ProjectParticipant> {
        try {
            return await this.participantRepo.findOne({
                where: { user: { id: userId }, project: { id: projectId } }
            });
        } catch (error) {
            throw FwaException({
                message: 'Failed to lookup participant',
                messageCode: FAILED_TO_LOOKUP_PARTICIPANT,
                messageData: { projectId: projectId, userId: userId },
            });
        }
    }

    //----------------------------------------------------------------------- 

    protected async getParticipant(projectId, userId): Promise<ProjectParticipant> {
        return this.getParticipantRaw({ projectId, userId });
    }

    //----------------------------------------------------------------------- 

    private async getParticipantById(participantId: number): Promise<ProjectParticipant> {
        try {
            return await this.participantRepo.findOne({
                where: { id: participantId },
                relations: ['project', 'user'],
            });
        } catch (error) {
            throw FwaException({
                message: 'Failed to lookup participant',
                messageCode: FAILED_TO_LOOKUP_PARTICIPANT,
                messageData: { participantId: participantId },
            });
        }
    }
    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Service API
    //***********************************************************************
    //----------------------------------------------------------------------- 

    public async createProjectParticipant(
        { token, ...dto }: CreateProjectParticipantDto,
    ): Promise<ProjectParticipantDto> {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, CREATE_ACTION, this.RESOURCES);

            let sanitizedDto = this.accessControlService.filter(dto, attributesFilter,);

            let project = await this.getProject(dto.projectId);

            // Check whether specified owner exists.
            let user = await this.getUser(token, sanitizedDto.userId);
            if (user === undefined)
                throw FwaException({
                    code: HttpStatus.NOT_FOUND,
                    message: `The userId ${sanitizedDto.userId} does not exist!`,
                    messageCode: PROJECT_PARTICIPANT_USER_NOT_FOUND,
                });

            if (await this.participantAlreadyExists(project.id, user.id))
                throw FwaException({
                    code: HttpStatus.CONFLICT,
                    message: `User is already a participant in the project`,
                    messageCode: PROJECT_PARTICIPANT_ALREADY_ASSIGNED,
                    messageData: {
                        userId: user.id,
                        projectId: project.id,
                    },
                });

            let participant = this.participantRepo.create();
            participant.project = project;
            participant.user = user;
            participant.role = sanitizedDto.role;

            const { id } = await this.participantRepo.save(participant);

            participant = await this.getParticipantById(id);
            return this.sanitizeResponse(participant, attributesFilter);

        } catch (error) {
            console.error(error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;

            throw FwaException({
                message: 'Cannot create a project participant',
                messageCode: CANNOT_CREATE_PROJECT_PARTICIPANT,
            });
        }
    }

    //-----------------------------------------------------------------------

    public async listProjectParticipants({
        token,
        ...dto
    }: ListProjectParticipantsDto): Promise<ProjectParticipantDto[]> {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, READ_ACTION, this.RESOURCES);

            const participants = await this.participantRepo.find({
                where: {
                    project: { id: dto.projectId }
                }, relations: ['project', 'user']
            });

            var results: ProjectParticipantDto[] = [];
            if (participants != null) {
                participants.forEach(async participant => {
                    let filtered = this.sanitizeResponse(participant, attributesFilter);
                    results.push(filtered);
                })
            }
            return results;
        } catch (error) {
            console.error(error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;

            throw FwaException({
                message: 'Cannot list participants from the project',
                messageCode: CANNOT_LIST_PARTICIPANTS,
            });
        }
    }

    //-----------------------------------------------------------------------

    async getProjectParticipant({
        token,
        ...dto
    }: ProjectParticipantOneDto): Promise<ProjectParticipantDto> {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, READ_ACTION, this.RESOURCES);

            let participant = await this.getParticipantRaw({ projectId: dto.projectId, userId: dto.userId });

            return this.sanitizeResponse(participant, attributesFilter);
        } catch (error) {
            console.error(error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;

            throw FwaException({
                message: 'Cannot read the project participant',
                messageCode: CANNOT_READ_PROJECT_PARTICIPANT,
                messageData: { ...dto }
            });
        }
    }

    //-----------------------------------------------------------------------

    async updateProjectParticipant(
        { token, ...dto }: UpdateProjectParticipantDto,
    ): Promise<ProjectParticipantDto> {
        try {

            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, UPDATE_ACTION, this.RESOURCES);

            let participant = await this.getParticipantRaw({ projectId: dto.projectId, userId: dto.userId });
            participant.role = dto.role;

            await this.participantRepo.save(participant);

            participant = await this.getParticipantById(participant.id);

            return this.sanitizeResponse(participant, attributesFilter);
        } catch (error) {
            console.error(error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;

            throw FwaException({
                message: 'Cannot update a participant to the project',
                messageCode: CANNOT_UPDATE_PARTICIPANT,
            });
        }
    }
    //-----------------------------------------------------------------------

    async deleteProjectParticipant(
        { token, ...dto }: CreateProjectParticipantDto,
    ): Promise<ProjectParticipantDto> {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, DELETE_ACTION, this.RESOURCES);

            let participant = await this.getParticipantRaw({ projectId: dto.projectId, userId: dto.userId });
            await this.participantRepo.delete({ id: participant.id });

            return this.sanitizeResponse(participant, attributesFilter);
        } catch (error) {
            console.error(error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;

            throw FwaException({
                message: 'Cannot remove a participant from the project',
                messageCode: CANNOT_REMOVE_PARTICIPANT,
            });
        }
    }

    //-----------------------------------------------------------------------

}
