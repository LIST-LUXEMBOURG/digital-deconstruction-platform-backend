/*
 *   Copyright (c) 2021-2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { Timeout } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { CONTRIBUTOR } from '../auth/auth/constants';
import { User } from '../auth/user/entities/user.entity';
import {
    CREATE_ACTION, DELETE_ACTION, dispatchACDBs,
    FWACallFct,
    FwaException,
    onModuleDynamicInit,
    READ_ACTION,
    UPDATE_ACTION
} from '../FWAjs-utils';
import { ApiAccessControlService } from '../FWAjs-utils/accessControl/accessControl.service';
import DatabaseQueryError, {
    DatabaseQueryDriver
} from '../FWAjs-utils/exceptions/database';
import { Not, Repository } from 'typeorm';
import {
    OWN_PROJECT,
    PARTICIPATING_PROJECT,
    PROJECT
} from './accessControl/resourcesName.constants';
import {
    ACTION_NOT_ALLOWED_ON_PROJET,
    CANNOT_CREATE_PROJECT, CANNOT_DELETE_PROJECT, CANNOT_FIND_PROJECT, CANNOT_UPDATE_PROJECT, FAILED_TO_LOOKUP_PROJECT,
    NOT_ALLOWED_TO_UPDATE_PROJECT_OWNER,
    PROJECT_SHORT_NAME_ALREADY_IN_USE
} from './constants';
import { CreateProjectDto } from './dto/create-project.dto';
import { DeleteProjectDto } from './dto/delete-project.dto';
import { ProjectGetOneDto } from './dto/get-one-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './entities/project.entity';
import { ProjectAddress } from './entities/projectAddress.entity';
import { ProjectParticipant } from './participant/entities/projectParticipant.entity';
import { Role } from 'src/auth/role/entities';

const DatabaseError = DatabaseQueryError(DatabaseQueryDriver.typeorm);

@Injectable()
export class ProjectService {

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //-----------------------------------------------------------------------    

    constructor(
        @InjectRepository(Project)
        private readonly projectRepo: Repository<Project>,
        @InjectRepository(ProjectAddress)
        private readonly projectAddressRepo: Repository<ProjectAddress>,
        private readonly jwtService: JwtService,
        private readonly accessControlService: ApiAccessControlService,
        private readonly moduleRef: ModuleRef,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Primitive(s)
    //***********************************************************************
    //-----------------------------------------------------------------------    

    async onModuleInit() {
        await onModuleDynamicInit(this, null, [
            'userService',
            'participantService',
            'projectFileService'
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

    private async getParticipant(token, userId, projectId): Promise<ProjectParticipant> {
        return await FWACallFct(
            this,
            { srv: 'participantService', cmd: 'getParticipantRaw' },
            {
                userId: userId,
                projectId: projectId,
            }
        );
    }

    //-----------------------------------------------------------------------

    private hasPermissions(permissions, resource) {
        return permissions.find((permission) => permission.resource === resource,).attributes.length > 0;
    }

    //-----------------------------------------------------------------------

    private getPermissionAttributes(permissions, resource) {
        return permissions.find((permission) => permission.resource === resource,).attributes;
    }

    //-----------------------------------------------------------------------

    private async filterGrantedAttributesForAction(token, projectId, action) {
        const tokenPayload = await this.jwtService.verifyAsync(token);

        const permissions = this.accessControlService.getGrantedPermissions(
            tokenPayload.user.roles,
            [
                { action: action, resource: PROJECT },
                { action: action, resource: OWN_PROJECT },
                { action: action, resource: PARTICIPATING_PROJECT },
            ],
        );

        let isProjectOwner = false;
        let isProjectContributor = false;
        let participantRole = 'None';

        if (projectId) {
            let project = await this.getProjectRaw({ id: projectId });
            let participant = await this.getParticipant(token, tokenPayload.user.id, projectId);
            if (participant) {
                participantRole = participant.role;
            }

            isProjectOwner = (project.owner.id === tokenPayload.user.id);
            isProjectContributor = (!!participant && participantRole === CONTRIBUTOR);
        }
        if (
            !(this.hasPermissions(permissions, PROJECT) ||
                (this.hasPermissions(permissions, OWN_PROJECT) && isProjectOwner) ||
                (this.hasPermissions(permissions, PARTICIPATING_PROJECT) && isProjectContributor)
            )
        ) {
            {
                throw FwaException({
                    code: HttpStatus.UNAUTHORIZED,
                    message: `Users with role ${participantRole} are not allowed to ${action} an project in project with Id ${projectId}!`,
                    messageCode: ACTION_NOT_ALLOWED_ON_PROJET,
                    messageData: { projectId: projectId },
                });
            }
        }

        let allApplicableAttributes = this.getPermissionAttributes(permissions, PROJECT) || [];

        if (isProjectOwner) {
            allApplicableAttributes = [].concat(allApplicableAttributes, this.getPermissionAttributes(permissions, OWN_PROJECT) || []);
        }
        if (isProjectContributor) {
            allApplicableAttributes = [].concat(allApplicableAttributes, this.getPermissionAttributes(permissions, PARTICIPATING_PROJECT) || []);
        }

        return allApplicableAttributes;
    }

    //----------------------------------------------------------------------- 

    public async getProjectRaw({ id }: { id: number }): Promise<Project> {
        try {
            return await this.projectRepo.findOneOrFail({
                where: { id },
                relations: ['fullAddress', 'owner'],
            });
        } catch (error) {
            throw FwaException({
                code: HttpStatus.NOT_FOUND,
                message: 'Cannot find the project',
                messageCode: CANNOT_FIND_PROJECT,
                messageData: { projectId: id },
            });
        }
    }

    //----------------------------------------------------------------------- 

    private async projectWithNameAlreadyExists(name: string): Promise<boolean> {
        try {
            return await this.projectRepo.count({
                shortName: name,
            }) > 0;
        } catch (error) {
            throw FwaException({
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Failed to lookup project',
                messageCode: FAILED_TO_LOOKUP_PROJECT,
                messageData: { shortName: name },
            });
        }
    }

    //-----------------------------------------------------------------------

    private async deleteAllProjectDocuments(token, projectId): Promise<Number> {
        return await FWACallFct(
            this,
            { srv: 'projectFileService', cmd: 'deleteAllProjectDocuments' },
            {
                token,
                projectId: projectId,
            }
        );
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Service API
    //***********************************************************************
    //----------------------------------------------------------------------- 

    async createProject(dto: CreateProjectDto): Promise<Project> {
        try {
            const { token } = dto;
            //delete dto.token;
            const tokenPayload = await this.jwtService.verifyAsync(token);

            const attributesFiltering = await this.filterGrantedAttributesForAction(token, null, CREATE_ACTION);

            let newProject = this.projectRepo.create(dto);
            let newAddress = this.projectAddressRepo.create(dto.fullAddress);
            newProject.fullAddress = newAddress;

            // If an owner was specified, then we'll have to lookup the corresponding user.
            // Otherwise, we're using the calling user as the project owner.
            if (!!dto.owner) {
                newProject.owner = await this.getUser(token, dto.owner.id);
            } else {
                newProject.owner = await this.getUser(token, tokenPayload.user.id);
            }

            // Check whether a project with an identical short name already exists.
            if (await this.projectWithNameAlreadyExists(dto.shortName)) {
                throw FwaException({
                    code: HttpStatus.CONFLICT,
                    message: `The short name ${dto.shortName} is already in use`,
                    messageCode: PROJECT_SHORT_NAME_ALREADY_IN_USE,
                    messageData: {
                        shortName: dto.shortName,
                    },
                });
            }

            newProject.createdBy = tokenPayload.user.id;

            const project: any = await this.projectRepo.save(newProject);

            const projectToReturn = await this.projectRepo.findOne({
                where: { id: project.id },
                relations: ['fullAddress', 'owner'],
            });

            var result = await this.accessControlService.filter(
                projectToReturn,
                attributesFiltering,
            )

            return result;
        } catch (e) {
            console.error(e)
            if (e instanceof HttpException || e instanceof RpcException)
                throw e;

            let databaseError = DatabaseError(e);
            if (databaseError) throw databaseError;

            throw FwaException({
                message: 'Cannot create the project',
                messageCode: CANNOT_CREATE_PROJECT,
            });
        }
    }

    //----------------------------------------------------------------------- 

    async getAllProjects(token: string): Promise<Project[]> {
        const attributesFiltering = await this.filterGrantedAttributesForAction(token, null, READ_ACTION);

        const tokenPayload = await this.jwtService.verifyAsync(token);

        var projects: Project[] = [];

        if (tokenPayload.user.roles.find(role => role === 'ProjectAdministrator')) {
            projects = await this.projectRepo.find({
                relations: ['owner', 'fullAddress']
            });
        } else {
            var alias = 'proj';
            var queryBuilder = this.projectRepo.createQueryBuilder(alias);
            queryBuilder.leftJoinAndSelect('proj.participants', 'participants')
            queryBuilder.leftJoinAndSelect('proj.fullAddress', 'fullAddress')
            queryBuilder.leftJoinAndSelect('proj.owner', 'owner')
            queryBuilder.where('owner.id = :user', { user: tokenPayload.user.id })
            queryBuilder.orWhere('participants.user = :user', { user: tokenPayload.user.id })
            //queryBuilder.loadAllRelationIds();
            //console.log(queryBuilder.getQueryAndParameters());

            projects = await queryBuilder.getMany();
        }

        var results: Project[] = [];
        if (projects != null) {
            projects.forEach(async project => {
                let filtered = await this.accessControlService.filter(
                    project,
                    attributesFiltering,
                );
                results.push(filtered);
            })
        }

        return results;
    }

    //----------------------------------------------------------------------- 

    async getProject(dto: ProjectGetOneDto): Promise<Project> {
        try {
            const { token, projectId } = dto;

            const attributesFiltering = await this.filterGrantedAttributesForAction(token, projectId, READ_ACTION);

            let project = await this.getProjectRaw({ id: projectId });

            return await this.accessControlService.filter(
                project,
                attributesFiltering,
            )

        } catch (error) {
            console.error(error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;

            throw FwaException({
                message: 'Cannot find the project',
                messageCode: CANNOT_FIND_PROJECT,
                messageData: { ...dto }
            });
        }
    }

    //----------------------------------------------------------------------- 

    async updateProject(dto: UpdateProjectDto): Promise<Project> {
        try {
            const { token, projectId } = dto;
            const tokenPayload = await this.jwtService.verifyAsync(token);
            const attributesFiltering = await this.filterGrantedAttributesForAction(token, projectId, UPDATE_ACTION);


            let project = await this.getProjectRaw({ id: projectId });

            // Check whether specified owner exists.
            let newOwner = await this.getUser(token, dto.owner.id);

            let ownerChangeRequested = newOwner.id !== project.owner.id;
            let requesterIsOwner = (project.owner.id === tokenPayload.user.id);

            if (ownerChangeRequested && requesterIsOwner && !attributesFiltering.includes('owner')) {
                throw FwaException({
                    code: HttpStatus.FORBIDDEN,
                    message: `Not allowed to change the owner of the project`,
                    messageCode: NOT_ALLOWED_TO_UPDATE_PROJECT_OWNER,
                    messageData: { projectId: projectId },
                });
            }

            let filteredDto = await this.accessControlService.filter(
                dto,
                attributesFiltering,
            )

            Object.assign(project, { ...filteredDto });

            // Check whether a project with an identical short name already exists.
            if ((dto.shortName !== project.shortName) && this.projectWithNameAlreadyExists(project.shortName)) {
                throw FwaException({
                    code: HttpStatus.CONFLICT,
                    message: `The short name ${dto.shortName} is already in use`,
                    messageCode: PROJECT_SHORT_NAME_ALREADY_IN_USE,
                    messageData: {
                        shortName: dto.shortName,
                    },
                });
            }

            //Apply changes in the project and return the sanitized project
            await this.projectRepo.save(project);

            project = await this.getProjectRaw({ id: projectId });

            return await this.accessControlService.filter(
                project,
                attributesFiltering,
            )

        } catch (error) {
            console.error(error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;

            throw FwaException({
                message: 'Cannot update the project',
                messageCode: CANNOT_UPDATE_PROJECT,
            });
        }
    }

    //----------------------------------------------------------------------- 

    async deleteProject(dto: DeleteProjectDto): Promise<Project> {
        try {
            const { token, projectId } = dto;

            const attributesFiltering = await this.filterGrantedAttributesForAction(token, projectId, DELETE_ACTION);

            let project = await this.getProjectRaw({ id: projectId });

            await this.projectRepo.delete({ id: projectId });

            return await this.accessControlService.filter(
                project,
                attributesFiltering,
            )
        } catch (error) {
            console.error(error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;

            throw FwaException({
                message: 'Cannot delete the project',
                messageCode: CANNOT_DELETE_PROJECT,
            });
        }
    }

    //----------------------------------------------------------------------- 
}
