/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { HttpException, HttpStatus, Injectable, OnModuleInit } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { JwtService } from "@nestjs/jwt";
import { RpcException } from "@nestjs/microservices";
import { Timeout } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BaseService } from "../core/base.service";
import { CREATE_ACTION, DELETE_ACTION, dispatchACDBs, FwaException, onModuleDynamicInit, READ_ACTION, UPDATE_ACTION } from "../FWAjs-utils";
import { ApiAccessControlService } from "../FWAjs-utils/accessControl/accessControl.service";
import { ResourceTriplet } from "../FWAjs-utils/utils/auth.interface";
import { Project } from "../project/entities";
import { OWN_PROJECT_PASSPORT_FILE, PARTICIPATING_PROJECT_PASSPORT_FILE, PASSPORT_FILE } from "./accessControl/resourcesName.constants";
import { CANNOT_CREATE_PASSPORT_FILE, CANNOT_DELETE_PASSPORT_FILE, CANNOT_FIND_PASSPORT_FILE, CANNOT_LIST_PASSPORT_FILES, CANNOT_STREAM_PASSPORT_FILE, CANNOT_UPDATE_PASSPORT_FILE, FAILED_TO_LOOKUP_PASSPORT_FILE, PASSPORT_FILE_ALREADY_EXISTS, PASSPORT_FILE_NOT_FOUND } from "./constants/messageCode.constants";
import { CreatePassportFileDto } from "./dto/create-passport-file.dto";
import { DeletePassportFileDto } from "./dto/delete-passport-file.dto";
import { PassportFileGetOneDto } from "./dto/get-one-passport-file.dto";
import { ListPassportFilesDto } from "./dto/list-passport-files.dto";
import { PassportFileDto } from "./dto/passport-file.dto";
import { StreamPassportFileResponse } from "./dto/stream-passport-file.dto";
import { UpdatePassportFileDto } from "./dto/update-passport-file.dto";
import { Circularity } from "./entities/circularity.entity";
import { PassportFile } from "./entities/passport-file.entity";

@Injectable()
export class PassportFileService extends BaseService implements OnModuleInit {

    private readonly RESOURCES = <ResourceTriplet>{
        global: PASSPORT_FILE,
        owned: OWN_PROJECT_PASSPORT_FILE,
        shared: PARTICIPATING_PROJECT_PASSPORT_FILE
    };

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //----------------------------------------------------------------------- 

    constructor(
        @InjectRepository(PassportFile)
        private readonly passportFileRepo: Repository<PassportFile>,

        protected readonly jwtService: JwtService,
        protected readonly accessControlService: ApiAccessControlService,

        protected readonly moduleRef: ModuleRef,
        protected readonly eventEmitter: EventEmitter2,
    ) { super(jwtService, accessControlService, moduleRef, eventEmitter); }

    //-----------------------------------------------------------------------

    async onModuleInit() {
        await onModuleDynamicInit(this, null, [
            'projectService',
            'participantService',
            'fileService',
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
    //***********************************************************************
    //* Primitives
    //***********************************************************************
    //----------------------------------------------------------------------- 

    private sanitizeResponse(entity: any, attributes: any): PassportFileDto {
        return PassportFile.toDto(entity);
        // if (!!dto.project) {
        //     dto.projectId = dto.project.id;
        // }
        // if (!!dto.file) {
        //     dto.fileUid = dto.file.Uid;
        //     dto.fileType = dto.file.fileType;
        // }
        // return this.accessControlService.filter(dto, attributes);
    }

    //-----------------------------------------------------------------------

    public async getPassportFileRaw({ uid }: { uid: string }): Promise<PassportFile> {
        try {
            return await this.passportFileRepo.findOneOrFail({
                where: { uid },
                relations: ['project', 'file']
            });
        } catch (error) {
            throw FwaException({
                code: HttpStatus.NOT_FOUND,
                message: 'The passport file was not found',
                messageCode: PASSPORT_FILE_NOT_FOUND,
                messageData: {
                    uid: uid,
                },
            });
        }
    }

    //----------------------------------------------------------------------- 

    private async passportFileExists(projectId: number, circularityUid: string, passportFileTitle: string): Promise<boolean> {
        try {
            return await this.passportFileRepo.count({
                project: { id: projectId },
                title: passportFileTitle,
                circularity: { uid: circularityUid },
            }) > 0;
        } catch (error) {
            throw FwaException({
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Failed to lookup passport file',
                messageCode: FAILED_TO_LOOKUP_PASSPORT_FILE,
                messageData: {
                    projectId: projectId,
                    circularityUid: circularityUid,
                    name: passportFileTitle
                }
            });
        }
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Service API
    //***********************************************************************
    //-----------------------------------------------------------------------

    public async createPassportDocument({
        token,
        ...dto
    }: CreatePassportFileDto
    ): Promise<PassportFileDto> {

        let uploadedFileUuid = '';
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, CREATE_ACTION, this.RESOURCES);

            let sanitizedDto = this.accessControlService.filter(dto, attributesFilter);

            if (await this.passportFileExists(dto.projectId, dto.circularityUid, dto.title))
                throw FwaException({
                    code: HttpStatus.CONFLICT,
                    message: 'A file with the same title already exists in the project',
                    messageCode: PASSPORT_FILE_ALREADY_EXISTS,
                    messageData: {
                        projectId: dto.projectId,
                        title: dto.title,
                        circularityUid: dto.circularityUid
                    }
                })

            const fileUploadDto = {
                file: sanitizedDto.files[0],
                metadata: {
                    name: sanitizedDto.title,
                    filePath: `projects/${sanitizedDto.projectId}/circularity/${sanitizedDto.circularityUid}`,
                    fileType: sanitizedDto.files[0].mimetype,
                    size: sanitizedDto.files[0].size,
                },
                token,
            };

            let uploadedFile = await this.uploadFile(fileUploadDto);
            uploadedFileUuid = uploadedFile.uuid;

            let passportFile = this.passportFileRepo.create();
            Object.assign(passportFile, { ...sanitizedDto });
            passportFile.file = uploadedFile;
            passportFile.project = new Project();
            passportFile.project.id = sanitizedDto.projectId;
            passportFile.circularity = new Circularity();
            passportFile.circularity.uid = sanitizedDto.circularityUid;

            const { uid } = await this.passportFileRepo.save(passportFile);

            passportFile = await this.getPassportFileRaw({ uid });
            return this.sanitizeResponse(passportFile, attributesFilter);
        } catch (error) {
            if (!!uploadedFileUuid) {
                // Rollback file upload
                const fileDeleteDto = { uuid: uploadedFileUuid, token };
                this.deleteFile(fileDeleteDto);
            }

            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    message: 'Cannot create passport file',
                    messageCode: CANNOT_CREATE_PASSPORT_FILE,
                });
        }
    }

    //-----------------------------------------------------------------------

    public async listPassportDocuments({
        token,
        ...dto }: ListPassportFilesDto) {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, READ_ACTION, this.RESOURCES);

            let documents = this.passportFileRepo.find({
                where: {
                    circularity: { uid: dto.circularityUid },
                    project: { id: dto.projectId }
                }, relations: ['file']
            });

            let results: PassportFileDto[] = [];
            (await documents).forEach(document => {
                results.push(this.sanitizeResponse(document, attributesFilter));
            })
            return results;
        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    message: 'Cannot list passport documents',
                    messageCode: CANNOT_LIST_PASSPORT_FILES,
                });
        }
    }

    //-----------------------------------------------------------------------

    async streamPassportDocument({
        token,
        ...dto }: PassportFileGetOneDto,
    ): Promise<StreamPassportFileResponse> {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, READ_ACTION, this.RESOURCES);

            let passportFile = await this.getPassportFileRaw({ uid: dto.passportFileUid });

            const fileStreamDto = { uuid: passportFile.file.uuid, token };

            return this.streamFile(fileStreamDto);
        } catch (error) {
            console.error(error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;

            throw FwaException({
                message: 'Cannot stream the passport file',
                messageCode: CANNOT_STREAM_PASSPORT_FILE,
            });
        }
    }

    //----------------------------------------------------------------------- 

    async updatePassportDocument(
        { token, ...dto }: UpdatePassportFileDto,
    ): Promise<PassportFileDto> {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, UPDATE_ACTION, this.RESOURCES);

            let sanitizedDto = this.accessControlService.filter(dto, attributesFilter);

            let passportFile = await this.getPassportFileRaw({ uid: dto.passportFileUid });

            Object.assign(passportFile, { ...sanitizedDto });

            if (!!sanitizedDto.files && sanitizedDto.files.length > 0) {
                const fileUploadDto = {
                    file: sanitizedDto.files[0],
                    metadata: {
                        name: sanitizedDto.title,
                        filePath: `projects/${sanitizedDto.projectId}/circularity/${sanitizedDto.circularityUid}`,
                        fileType: sanitizedDto.files[0].mimetype,
                        size: sanitizedDto.files[0].size,
                    },
                    token,
                };
                let updatedFile = await this.updateFile(fileUploadDto);
                passportFile.file = updatedFile;
            }

            await this.passportFileRepo.save(passportFile);
            const { uid } = await this.passportFileRepo.save(passportFile);

            passportFile = await this.getPassportFileRaw({ uid });
            return this.sanitizeResponse(passportFile, attributesFilter);
        } catch (error) {
            console.error(error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;

            throw FwaException({
                message: 'Cannot update passport file',
                messageCode: CANNOT_UPDATE_PASSPORT_FILE,
            });
        }
    }

    //----------------------------------------------------------------------- 

    public async deletePassportDocument({
        token,
        ...dto
    }: DeletePassportFileDto
    ): Promise<PassportFileDto> {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, DELETE_ACTION, this.RESOURCES);

            const passportFile = await this.passportFileRepo.findOne({
                where: {
                    project: { id: dto.projectId },
                    uid: dto.passportFileUid,
                    circularity: { uid: dto.circularityUid },
                },
                relations: ['file']
            });

            if (!passportFile)
                throw FwaException({
                    code: HttpStatus.NOT_FOUND,
                    message: 'Cannot find passport file',
                    messageCode: CANNOT_FIND_PASSPORT_FILE,
                    messageData: {
                        projectId: dto.projectId,
                        passportFileUid: dto.passportFileUid,
                        circularityUid: dto.circularityUid
                    }
                })

            const fileDeleteDto = { uuid: passportFile.file.uuid, token };
            this.deleteFile(fileDeleteDto);

            await this.passportFileRepo.delete({ uid: passportFile.uid });
            return this.sanitizeResponse(passportFile, attributesFilter);
        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    message: 'Cannot delete passport file',
                    messageCode: CANNOT_DELETE_PASSPORT_FILE,
                });
        }
    }

}