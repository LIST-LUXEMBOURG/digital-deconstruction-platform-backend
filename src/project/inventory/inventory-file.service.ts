/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { HttpException, HttpStatus, Injectable, OnModuleInit } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { JwtService } from "@nestjs/jwt";
import { RpcException } from "@nestjs/microservices";
import { Timeout } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { BaseService } from "../../core/base.service";
import { CREATE_ACTION, DELETE_ACTION, dispatchACDBs, FwaException, onModuleDynamicInit, READ_ACTION, UPDATE_ACTION } from "../../FWAjs-utils";
import { ApiAccessControlService } from "../../FWAjs-utils/accessControl/accessControl.service";
import { ResourceTriplet } from "../../FWAjs-utils/utils/auth.interface";
import { Repository } from "typeorm";
import { INVENTORY_FILE, OWN_PROJECT_INVENTORY_FILE, PARTICIPATING_PROJECT_INVENTORY_FILE } from "./accessControl/resourcesName.constants";
import { CANNOT_CREATE_INVENTORY_FILE, CANNOT_DELETE_INVENTORY_FILE, CANNOT_FIND_INVENTORY_FILE, CANNOT_STREAM_INVENTORY_FILE, CANNOT_UPDATE_INVENTORY_FILE, FAILED_TO_LOOKUP_INVENTORY_FILE, INVENTORY_FILE_ALREADY_EXISTS, INVENTORY_FILE_NOT_FOUND } from "./constants/messageCode.constants";
import { CreateInventoryFileDto } from "./dto/create-inventory-file.dto";
import { DeleteInventoryFileDto } from "./dto/delete-inventory-file.dto";
import { InventoryFileGetOneDto } from "./dto/get-one-inventory-file.dto";
import { InventoryFileDto } from "./dto/inventory-file.dto";
import { StreamInventoryFileResponse } from "./dto/stream-inventory-file.dto";
import { UpdateInventoryFileDto } from "./dto/update-inventory-file.dto";
import { InventoryFile } from "./entities/inventory-file.entity";
import { Project } from "../entities";
import { ElementType } from "./entities/element-type.entity";

@Injectable()
export class InventoryFileService extends BaseService implements OnModuleInit {

    private readonly RESOURCES = <ResourceTriplet>{
        global: INVENTORY_FILE,
        owned: OWN_PROJECT_INVENTORY_FILE,
        shared: PARTICIPATING_PROJECT_INVENTORY_FILE
    };

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //----------------------------------------------------------------------- 

    constructor(
        @InjectRepository(InventoryFile)
        private readonly inventoryFileRepo: Repository<InventoryFile>,

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

    private sanitizeResponse(entity: any, attributes: any): InventoryFileDto {
        return InventoryFile.toDto(entity);
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

    public async getInventoryFileRaw({ uid }: { uid: string }): Promise<InventoryFile> {
        try {
            return await this.inventoryFileRepo.findOneOrFail({
                where: { uid },
                relations: ['project', 'file']
            });
        } catch (error) {
            throw FwaException({
                code: HttpStatus.NOT_FOUND,
                message: 'The inventory file was not found',
                messageCode: INVENTORY_FILE_NOT_FOUND,
                messageData: {
                    uid: uid,
                },
            });
        }
    }

    //----------------------------------------------------------------------- 

    private async inventoryFileExists(projectId: number, elementTypeUid: string, inventoryFileTitle: string): Promise<boolean> {
        try {
            return await this.inventoryFileRepo.count({
                project: { id: projectId },
                title: inventoryFileTitle,
                elementType: { uid: elementTypeUid },
            }) > 0;
        } catch (error) {
            throw FwaException({
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Failed to lookup inventory element type',
                messageCode: FAILED_TO_LOOKUP_INVENTORY_FILE,
                messageData: {
                    projectId: projectId,
                    elementTypeUid: elementTypeUid,
                    name: inventoryFileTitle
                }
            });
        }
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Service API
    //***********************************************************************
    //-----------------------------------------------------------------------

    public async createInventoryDocument({
        token,
        ...dto
    }: CreateInventoryFileDto
    ): Promise<InventoryFileDto> {

        let uploadedFileUuid = '';
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, CREATE_ACTION, this.RESOURCES);

            let sanitizedDto = this.accessControlService.filter(dto, attributesFilter);

            if (await this.inventoryFileExists(dto.projectId, dto.elementTypeUid, dto.title))
                throw FwaException({
                    code: HttpStatus.CONFLICT,
                    message: 'A file with the same title already exists in the project',
                    messageCode: INVENTORY_FILE_ALREADY_EXISTS,
                    messageData: {
                        projectId: dto.projectId,
                        title: dto.title,
                        elementTypeUid: dto.elementTypeUid
                    }
                })

            const fileUploadDto = {
                file: sanitizedDto.files[0],
                metadata: {
                    name: sanitizedDto.title,
                    filePath: `projects/${sanitizedDto.projectId}/elementTypes/${sanitizedDto.elementTypeUid}`,
                    fileType: sanitizedDto.files[0].mimetype,
                    size: sanitizedDto.files[0].size,
                },
                token,
            };

            let uploadedFile = await this.uploadFile(fileUploadDto);
            uploadedFileUuid = uploadedFile.uuid;

            let inventoryFile = this.inventoryFileRepo.create();
            Object.assign(inventoryFile, { ...sanitizedDto });
            inventoryFile.file = uploadedFile;
            inventoryFile.project = new Project();
            inventoryFile.project.id = sanitizedDto.projectId;
            inventoryFile.elementType = new ElementType();
            inventoryFile.elementType.uid = sanitizedDto.elementTypeUid;

            const { uid } = await this.inventoryFileRepo.save(inventoryFile);

            inventoryFile = await this.getInventoryFileRaw({ uid });
            return this.sanitizeResponse(inventoryFile, attributesFilter);
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
                    message: 'Cannot create inventory file',
                    messageCode: CANNOT_CREATE_INVENTORY_FILE,
                });
        }
    }

    //-----------------------------------------------------------------------

    async streamInventoryDocument({
        token,
        ...dto }: InventoryFileGetOneDto,
    ): Promise<StreamInventoryFileResponse> {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, READ_ACTION, this.RESOURCES);

            let inventoryFile = await this.getInventoryFileRaw({ uid: dto.inventoryFileUid });

            const fileStreamDto = { uuid: inventoryFile.file.uuid, token };

            return this.streamFile(fileStreamDto);
        } catch (error) {
            console.error(error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;

            throw FwaException({
                message: 'Cannot stream the inventory file',
                messageCode: CANNOT_STREAM_INVENTORY_FILE,
            });
        }
    }

    //----------------------------------------------------------------------- 

    async updateInventoryDocument(
        { token, ...dto }: UpdateInventoryFileDto,
    ): Promise<InventoryFileDto> {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, UPDATE_ACTION, this.RESOURCES);

            let sanitizedDto = this.accessControlService.filter(dto, attributesFilter);

            let inventoryFile = await this.getInventoryFileRaw({ uid: dto.inventoryFileUid });

            const fileUploadDto = {
                file: sanitizedDto.files[0],
                metadata: {
                    name: sanitizedDto.title,
                    filePath: `projects/${sanitizedDto.projectId}/elementTypes/${sanitizedDto.elementTypeUid}`,
                    fileType: sanitizedDto.files[0].mimetype,
                    size: sanitizedDto.files[0].size,
                },
                token,
            };

            let updatedFile = await this.updateFile(fileUploadDto);

            Object.assign(inventoryFile, { ...sanitizedDto });
            inventoryFile.file = updatedFile;
            await this.inventoryFileRepo.save(inventoryFile);
            const { uid } = await this.inventoryFileRepo.save(inventoryFile);

            inventoryFile = await this.getInventoryFileRaw({ uid });
            return this.sanitizeResponse(inventoryFile, attributesFilter);
        } catch (error) {
            console.error(error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;

            throw FwaException({
                message: 'Cannot update document within the project',
                messageCode: CANNOT_UPDATE_INVENTORY_FILE,
            });
        }
    }

    //----------------------------------------------------------------------- 

    public async deleteInventoryDocument({
        token,
        ...dto
    }: DeleteInventoryFileDto
    ): Promise<InventoryFileDto> {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, DELETE_ACTION, this.RESOURCES);

            const inventoryFile = await this.inventoryFileRepo.findOne({
                where: {
                    project: { id: dto.projectId },
                    uid: dto.inventoryFileUid,
                    elementType: { uid: dto.elementTypeUid },
                },
                relations: ['file']
            });

            if (!inventoryFile)
                throw FwaException({
                    code: HttpStatus.NOT_FOUND,
                    message: 'Cannot find inventory file',
                    messageCode: CANNOT_FIND_INVENTORY_FILE,
                    messageData: {
                        projectId: dto.projectId,
                        inventoryFileUid: dto.inventoryFileUid,
                        elementTypeUid: dto.elementTypeUid
                    }
                })

            const fileDeleteDto = { uuid: inventoryFile.file.uuid, token };
            this.deleteFile(fileDeleteDto);

            await this.inventoryFileRepo.delete({ uid: inventoryFile.uid });
            return this.sanitizeResponse(inventoryFile, attributesFilter);
        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    message: 'Cannot delete inventory file',
                    messageCode: CANNOT_DELETE_INVENTORY_FILE,
                });
        }
    }

}