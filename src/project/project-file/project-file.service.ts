/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
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
import { concat, find, isEqual, isNil, remove, uniq } from 'lodash';
import { BaseService } from '../../core/base.service';
import { ApiAccessControlService } from '../../FWAjs-utils/accessControl/accessControl.service';
import { ResourceTriplet } from '../../FWAjs-utils/utils/auth.interface';
import { EventSubscriber, Repository } from 'typeorm';
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
import { OWN_PROJECT_DOCUMENT, PARTICIPATING_PROJECT_DOCUMENT, PROJECT_DOCUMENT } from './accessControl/resourcesName.constants';
import { CANNOT_DELETE_PROJECT_DOCUMENT, CANNOT_LIST_PROJECT_DOCUMENTS, CANNOT_STREAM_PROJECT_DOCUMENT_FILE, CANNOT_UPDATE_PROJECT_DOCUMENT, CANNOT_UPLOAD_PROJECT_DOCUMENT, FAILED_TO_LOOKUP_PROJECT_DOCUMENT, PROJECT_DOCUMENT_WITH_SAME_TITLE_ALREADY_EXISTS_FOR_PROJECT } from './constants';
import { CreateProjectFileDto } from './dto/create-project-file.dto';
import { DeleteAllProjectFilesDto } from './dto/delete-all-project-files.dto';
import { DeleteProjectFileDto } from './dto/delete-project-file.dto';
import { ProjectFileGetOneDto } from './dto/get-one-project-file.dto';
import { Direction, ListProjectFilesDto } from './dto/list-project-files.dto';
import { ProjectFileDto } from './dto/project-file.dto';
import { StreamProjectFileResponse } from './dto/stream-project-file.dto';
import { UpdateProjectFileDto } from './dto/update-project-file.dto';
import { ProjectFile } from './entities/projectFile.entity';
import { File } from '../../file/entities/file.entity';
import { ProjectLocation } from '../location/entities/projectLocation.entity';

@Injectable()
export class ProjectFileService extends BaseService implements OnModuleInit {

    private readonly RESOURCES = <ResourceTriplet>{
        global: PROJECT_DOCUMENT,
        owned: OWN_PROJECT_DOCUMENT,
        shared: PARTICIPATING_PROJECT_DOCUMENT
    };

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //----------------------------------------------------------------------- 

    constructor(
        @InjectRepository(ProjectFile)
        protected readonly projectFileRepo: Repository<ProjectFile>,
        // @InjectRepository(File)
        // protected readonly fileRepo: Repository<File>,
        // @InjectRepository(ProjectLocation)
        // protected readonly locationRepo: Repository<ProjectLocation>,
        protected readonly accessControlService: ApiAccessControlService,
        protected readonly jwtService: JwtService,
        protected readonly moduleRef: ModuleRef,
        protected readonly eventEmitter: EventEmitter2,

    ) {
        super(jwtService, accessControlService, moduleRef, eventEmitter);
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Primitive(s)
    //***********************************************************************
    //-----------------------------------------------------------------------    

    async onModuleInit() {
        await onModuleDynamicInit(this, null, [
            'projectService',
            'participantService',
            'fileService'
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

    private sanitizeResponse(entity: any, attributes: any): ProjectFileDto {
        let dto = ProjectFile.toDto(entity);
        return dto;

        //return this.accessControlService.filter(dto, attributes);
    }

    //----------------------------------------------------------------------- 


    public async getFileRaw({ fileId }: { fileId: number }): Promise<ProjectFile> {
        try {
            return await this.projectFileRepo.findOne({
                where: { id: fileId },
                relations: ['file']

            });
        } catch (error) {
            throw FwaException({
                message: 'Failed to lookup project document!',
                messageCode: FAILED_TO_LOOKUP_PROJECT_DOCUMENT,
                messageData: { fileId: fileId },
            });
        }
    }

    //----------------------------------------------------------------------- 

    private async documentWithTitleAlreadyExists(fileTitle: string, projectId: number): Promise<boolean> {
        try {
            let count = 0;
            count = await this.projectFileRepo.count(
                {
                    project: { id: projectId },
                    title: fileTitle,
                }
            );
            return (count > 0);
        } catch (error) {
            throw FwaException({
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Failed to lookup project document',
                messageCode: FAILED_TO_LOOKUP_PROJECT_DOCUMENT,
                messageData: { title: fileTitle, project: projectId },
            });
        }
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Service API
    //***********************************************************************
    //----------------------------------------------------------------------- 

    async uploadProjectDocument(
        { token, projectId, ...dto }: CreateProjectFileDto,
    ): Promise<ProjectFileDto> {

        // TODO: The rollback entities (order: 1. projectFile, 2. project, 3. file ).
        // Check if they are empty in reverse order (3, 2, 1) to determine from which point to revert.
        // projectFile and project are readonly entities define here to give additional info in the catch section.

        let uploadedFileUuid = '';

        try {

            const attributesFilter = await this.filterGrantedAttributesForAction(token, projectId, CREATE_ACTION, this.RESOURCES);

            let sanitizedDto = this.accessControlService.filter(dto, attributesFilter);

            if (await this.documentWithTitleAlreadyExists(sanitizedDto.title, projectId)) {
                throw FwaException({
                    code: HttpStatus.CONFLICT,
                    message: 'A document with the same title already exists in the project',
                    messageCode: PROJECT_DOCUMENT_WITH_SAME_TITLE_ALREADY_EXISTS_FOR_PROJECT,
                    messageData: {
                        projectId: projectId,
                        title: sanitizedDto.title,
                        locationId: sanitizedDto.locationId
                    }
                })
            }

            const fileUploadDto = {
                file: sanitizedDto.files[0],
                metadata: {
                    name: sanitizedDto.title,
                    filePath: `projects/${projectId}`,
                    fileType: sanitizedDto.files[0].mimetype,
                    size: sanitizedDto.files[0].size,
                },
                token,
            };

            let file = await this.uploadFile(fileUploadDto);

            const { uuid, ...fileWithoutUuid } = file;
            uploadedFileUuid = uuid;

            delete sanitizedDto.files;

            let projectFile = this.projectFileRepo.create();

            Object.assign(projectFile, sanitizedDto);

            projectFile.project = await this.getProject(projectId);

            projectFile.file = new File();
            projectFile.file.uuid = uuid;

            if (!!sanitizedDto.locationId) {
                projectFile.location = new ProjectLocation();
                projectFile.location.id = sanitizedDto.locationId;
            }

            if (!projectFile.documentDate) {
                projectFile.documentDate = new Date();
            }

            const { id } = await this.projectFileRepo.save(projectFile);

            projectFile = await this.getFileRaw({ fileId: id, });
            return this.sanitizeResponse(projectFile, attributesFilter)
        } catch (error) {
            if (!!uploadedFileUuid) {
                const fileDeleteDto = { uuid: uploadedFileUuid, token };
                this.deleteFile(fileDeleteDto);
            }

            console.error(error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;

            throw FwaException({
                message: 'Cannot upload document within the project',
                messageCode: CANNOT_UPLOAD_PROJECT_DOCUMENT,
            });
        }
    }

    //----------------------------------------------------------------------- 

    async listProjectDocuments({
        token, ...query }: ListProjectFilesDto
    ) {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, query.projectId, READ_ACTION, this.RESOURCES);

            // Dynamically build query from properties defined in the given
            // query object. Properties without value (undefined) will be omitted.

            var alias = 'pdoc';
            var queryBuilder = this.projectFileRepo.createQueryBuilder(alias);

            let propertiesOfInterest = this.filterQueryProperties(query, attributesFilter);

            // Dynamically build where clause from properties of interest

            var isFirst = true;
            propertiesOfInterest.forEach(([prop, value]) => {
                var parameter = 'p_' + prop;
                var expression;
                var clause = '';
                // If type of property is string, then we have to peform
                // a fuzzy match using the like SQL operator. Otherwise
                // we're using the equality operator.

                if (typeof value === 'string') {
                    expression = `%${value}%`;
                    expression = expression.toLowerCase();
                    clause = `LOWER(${alias}.${prop}) like :${parameter}`;
                } else {
                    expression = value;
                    clause = `${alias}.${prop} = :${parameter}`;
                }
                // Combine all search critera using the boolean AND operator
                if (isFirst) {
                    queryBuilder
                        .where(clause)
                        .setParameter(parameter, expression);
                } else {
                    queryBuilder
                        .andWhere(clause)
                        .setParameter(parameter, expression);
                }
                isFirst = false;
            });

            // Do pagination if requested

            if (query.offset !== undefined) {
                queryBuilder.skip(query.offset);
            }
            if (query.size !== undefined) {
                queryBuilder.take(query.size);
            }

            if (
                query.property !== undefined &&
                query.direction !== undefined
            ) {
                //query.orderBy.forEach(criterium => {
                //let criterium = query.orderBy;
                if (query.direction === Direction.ASCENDING) {
                    queryBuilder.addOrderBy(`${alias}.${query.property}`, 'ASC');
                } else {
                    queryBuilder.addOrderBy(`${alias}.${query.property}`, 'DESC');
                }
            } else {
                queryBuilder.addOrderBy(`${alias}.id`, 'ASC');
            }
            //});

            queryBuilder.leftJoinAndSelect(`${alias}.file`, 'doc_file');
            queryBuilder.leftJoinAndSelect(`${alias}.location`, 'doc_location');

            const count = await queryBuilder.getCount();
            const totalCount = await this.projectFileRepo.count({
                where: {
                    project: { id: query.projectId },
                },
            });

            //console.log(queryBuilder.getQueryAndParameters())
            //const test = await queryBuilder.execute();

            const projectFiles = await queryBuilder.getMany();
            if (projectFiles.length <= 0) return [];

            const projectFilesWithFileMetadata = await Promise.all(
                projectFiles.map(async (projectFile) => {
                    let file = await this.getFileMetadata({
                        uuid: projectFile.file.uuid,
                        token,
                    });
                    const { uuid, ...fileMetaData } = file;
                    return { ...projectFile, ...fileMetaData };
                }));

            var results: ProjectFileDto[] = [];
            if (projectFilesWithFileMetadata != null) {
                projectFilesWithFileMetadata.forEach(async projectFile => {
                    let filtered = this.sanitizeResponse(projectFile, attributesFilter);
                    results.push(filtered);
                })

                return {
                    data: results,
                    count,
                    totalCount,
                };
            }
        } catch (error) {
            console.error(error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;

            throw FwaException({
                message: 'Cannot list documents from the project',
                messageCode: CANNOT_LIST_PROJECT_DOCUMENTS,
            });
        }
    }

    //----------------------------------------------------------------------- 

    async streamProjectDocumentFile(
        { token, ...dto }: ProjectFileGetOneDto,
    ): Promise<StreamProjectFileResponse> {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, READ_ACTION, this.RESOURCES);

            const projectFile = await this.getFileRaw({ fileId: dto.projectFileId, });

            const fileStreamDto = { uuid: projectFile.file.uuid, token };

            return this.streamFile(fileStreamDto);
        } catch (error) {
            console.error(error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;

            throw FwaException({
                message: 'Cannot stream the project document',
                messageCode: CANNOT_STREAM_PROJECT_DOCUMENT_FILE,
            });
        }
    }

    //----------------------------------------------------------------------- 

    async updateProjectDocument(
        { token, ...dto }: UpdateProjectFileDto,
    ): Promise<ProjectFileDto> {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, UPDATE_ACTION, this.RESOURCES);

            let sanitizedDto = this.accessControlService.filter(dto, attributesFilter);

            const projectFile = await this.getFileRaw({ fileId: dto.projectFileId });

            if (!!dto.files) {
                let uploadedFile = dto.files[0];

                const updateFileDto = {
                    file: uploadedFile,
                    metadata: {
                        uuid: projectFile.file.uuid,
                        name: sanitizedDto.title,
                        filePath: `projects/${sanitizedDto.projectId}`,
                        fileType: uploadedFile.mimetype,
                        size: uploadedFile.size,
                    },
                    token,
                };

                await this.updateFile(updateFileDto);
            }

            delete sanitizedDto.files;
            delete sanitizedDto.projectId;

            if (!!sanitizedDto.locationId) {
                projectFile.location = new ProjectLocation();
                projectFile.location.id = sanitizedDto.locationId;
            }
            delete sanitizedDto.locationId;

            await this.projectFileRepo.update(
                { id: projectFile.id, project: { id: dto.projectId } },
                sanitizedDto,
            );

            const updatedFile = await this.getFileRaw({ fileId: projectFile.id });
            return this.sanitizeResponse(updatedFile, attributesFilter);
        } catch (error) {
            console.error(error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;

            throw FwaException({
                message: 'Cannot update document within the project',
                messageCode: CANNOT_UPDATE_PROJECT_DOCUMENT,
            });
        }
    }

    //----------------------------------------------------------------------- 

    async deleteProjectDocument({ token, ...dto }: DeleteProjectFileDto): Promise<ProjectFileDto> {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, DELETE_ACTION, this.RESOURCES);

            const projectFile = await this.getFileRaw({ fileId: dto.projectFileId });

            const fileDeleteDto = { uuid: projectFile.file.uuid, token };

            this.deleteFile(fileDeleteDto);

            await this.projectFileRepo.delete({ id: projectFile.id });
            return this.sanitizeResponse(projectFile, attributesFilter);
        } catch (error) {
            console.error(error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            throw FwaException({
                message: 'Cannot delete document from the project',
                messageCode: CANNOT_DELETE_PROJECT_DOCUMENT,
            });
        }
    }

    //----------------------------------------------------------------------- 

    async deleteAllProjectDocuments({ token, ...dto }: DeleteAllProjectFilesDto): Promise<Number> {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, DELETE_ACTION, this.RESOURCES);

            let projectFiles;
            if (dto.locationId !== undefined) {
                projectFiles = await this.projectFileRepo.find({
                    where: {
                        project: { id: dto.projectId },
                        location: { id: dto.locationId }
                    }, relations: ['file']
                });
            } else {
                projectFiles = await this.projectFileRepo.find({
                    where: {
                        project: { id: dto.projectId },
                    }, relations: ['file']
                });
            }

            let count = 0;
            projectFiles.forEach(projectFile => {
                const fileDeleteDto = { uuid: projectFile.file.uuid, token };
                this.deleteFile(fileDeleteDto);
                this.projectFileRepo.delete(projectFile);
                count++;
            })

            return count;
        } catch (error) {
            console.error(error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            throw FwaException({
                message: 'Cannot delete document(s) from the project',
                messageCode: CANNOT_DELETE_PROJECT_DOCUMENT,
            });
        }
    }

}
