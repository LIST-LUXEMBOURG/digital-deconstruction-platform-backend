/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ModuleRef } from '@nestjs/core';
import {
    HttpException,
    HttpStatus,
    Injectable,
    OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
    CREATE_ACTION,
    DELETE_ACTION,
    dispatchACDBs,
    FWACallFct,
    FwaException,
    onModuleDynamicInit,
    READ_ACTION,
    UPDATE_ACTION,
} from '../../FWAjs-utils';
import { RpcException } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';

import { ApiAccessControlService } from '../../FWAjs-utils/accessControl/accessControl.service';
import { Timeout } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FAILED_TO_LOOKUP_CLASSIFICATION_ENTRY } from '../constants';
import { ClassificationEntry } from '../../core/entities/classification-entry.entity';
import {
    CANNOT_COUNT_INVENTORY_ELEMENT_TYPES,
    CANNOT_CREATE_INVENTORY_ELEMENT_TYPE,
    CANNOT_DELETE_INVENTORY_ELEMENT_TYPE,
    CANNOT_DELETE_INVENTORY_ELEMENT_TYPE_WITH_DOCUMENTS,
    CANNOT_FETCH_INVENTORY_ELEMENT_TYPE,
    CANNOT_LIST_INVENTORY_ELEMENT_TYPES,
    CANNOT_UPDATE_INVENTORY_ELEMENT_TYPE,
    FAILED_TO_LOOKUP_INVENTORY_ELEMENT_TYPE,
    INVENTORY_ELEMENT_TYPE_ALREADY_EXISTS,
    INVENTORY_ELEMENT_TYPE_NOT_FOUND,
} from './constants/messageCode.constants';
import { InventoryFile } from './entities/inventory-file.entity';
import { ELEMENT_TYPE, OWN_PROJECT_ELEMENT_TYPE, PARTICIPATING_PROJECT_ELEMENT_TYPE } from './accessControl/resourcesName.constants';
import { BaseService } from '../../core/base.service';
import { ResourceTriplet } from '../../FWAjs-utils/utils/auth.interface';
import { InventoryElementTypeDto } from './dto/inventory-element-type.dto';
import { ElementType } from './entities/element-type.entity';
import { CreateInventoryElementTypeDto } from './dto/create-inventory-element-type.dto';
import { ListInventoryElementTypesDto } from './dto/list-inventory-element-types.dto';
import { InventoryElementTypeGetOneDto } from './dto/get-one-inventory-element-type.dto';
import { UpdateInventoryElementTypeDto } from './dto/update-inventory-element-type.dto';
import { DeleteInventoryElementTypeDto } from './dto/delete-inventory-element-type.dto';
import { QueryBuilder } from 'src/utils/search/query-builder';
import { QueryInventoryElementTypesDto } from './dto/query-inventory-element-types.dto';

@Injectable()
export class InventoryElementTypeService extends BaseService implements OnModuleInit {

    private readonly RESOURCES = <ResourceTriplet>{
        global: ELEMENT_TYPE,
        owned: OWN_PROJECT_ELEMENT_TYPE,
        shared: PARTICIPATING_PROJECT_ELEMENT_TYPE
    };

    private readonly ELEMENT_TYPE_PROPERTIES = [
        'uid',
        'projectId',
        'ifcId',
        'ifcType',
        'name',
        'description',
        'category',
        'historicalValue',
        'trademark',
        'designer',
    ];

    private readonly ELEMENT_TYPE_DEPENDENCIES: Record<string, string> = {
        classificationEntries: 'clse',
        files: 'fils'
    };


    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //----------------------------------------------------------------------- 
    constructor(
        @InjectRepository(ElementType)
        private readonly elementTypeRepo: Repository<ElementType>,

        protected readonly jwtService: JwtService,
        protected readonly accessControlService: ApiAccessControlService,

        protected readonly moduleRef: ModuleRef,
        protected readonly eventEmitter: EventEmitter2,
    ) { super(jwtService, accessControlService, moduleRef, eventEmitter); }

    //-----------------------------------------------------------------------

    async onModuleInit() {
        await onModuleDynamicInit(this, null, [
            'coreService',
            'projectService',
            'participantService',
            'inventoryFileService'
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

    private sanitizeResponse(entity: any, attributes: any): InventoryElementTypeDto {
        // if (!!entity.project) {
        //     entity.projectId = entity.project.id;
        // }
        return ElementType.toDto(entity);

        //return this.accessControlService.filter(ElementType.toDto(entity), attributes);
    }

    //----------------------------------------------------------------------- 

    public async getElementTypeRaw({ uid }: { uid: string }): Promise<ElementType> {
        try {
            return await this.elementTypeRepo.findOneOrFail({
                where: { uid },
                relations: ['project', 'classificationEntries', 'files', 'circularity']
            });
        } catch (error) {
            throw FwaException({
                code: HttpStatus.NOT_FOUND,
                message: 'The inventory element type was not found',
                messageCode: INVENTORY_ELEMENT_TYPE_NOT_FOUND,
                messageData: {
                    uid: uid,
                },
            });
        }
    }

    //----------------------------------------------------------------------- 

    private async inventoryElementTypeExists(projectId: number, elementTypeUid: string): Promise<boolean> {
        try {
            return await this.elementTypeRepo.count({
                where: {
                    uid: elementTypeUid,
                    project: {
                        id: projectId,
                    },
                }
            }) > 0;
        } catch (error) {
            throw FwaException({
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Failed to lookup inventory element type',
                messageCode: FAILED_TO_LOOKUP_INVENTORY_ELEMENT_TYPE,
                messageData: {
                    projectId: projectId,
                    elementTypeUid: elementTypeUid
                }
            });
        }
    }

    //----------------------------------------------------------------------- 

    private async inventoryElementTypeWithSameNameExists(projectId: number, elementTypeName: string): Promise<boolean> {
        try {
            return await this.elementTypeRepo.count({
                where: {
                    name: elementTypeName,
                    project: {
                        id: projectId,
                    },
                }
            }) > 0;
        } catch (error) {
            throw FwaException({
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Failed to lookup inventory element type',
                messageCode: FAILED_TO_LOOKUP_INVENTORY_ELEMENT_TYPE,
                messageData: {
                    projectId: projectId,
                    name: elementTypeName
                }
            });
        }
    }

    //----------------------------------------------------------------------- 

    private async lookupClassificationEntry(token: any, classificationEntry: Partial<ClassificationEntry>): Promise<ClassificationEntry> {
        try {
            // Get the classification entry, if it's not found the coreService will raise en Exception
            return await FWACallFct(
                this,
                { srv: 'coreService', cmd: 'getOneClassificationEntry' },
                {
                    token,
                    id: classificationEntry.id,
                });
        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    message: `Failed to lookup Classification Entry with Id ${classificationEntry.id}!`,
                    messageCode: FAILED_TO_LOOKUP_CLASSIFICATION_ENTRY,
                });
        }
    }

    //-----------------------------------------------------------------------

    private async fetchClassificationEntries(type: ElementType): Promise<ClassificationEntry[]> {

        return await Promise.all(type.classificationEntries.map(async (entry) => {
            return await FWACallFct(
                this,
                { srv: 'coreService', cmd: 'getOneClassificationEntry' },
                {
                    token: null,
                    id: entry
                },
            );
        }));
    }

    //-----------------------------------------------------------------------

    private async fetchInventoryFiles(type: ElementType): Promise<InventoryFile[]> {

        return await Promise.all(type.files.map(async (file) => {
            return await FWACallFct(
                this,
                { srv: 'inventoryFileService', cmd: 'getInventoryFileRaw' },
                {
                    uid: file.uid
                },
            );
        }));
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Service API
    //***********************************************************************
    //-----------------------------------------------------------------------

    //-----------------------------------------------------------------------
    //=======================================================================
    //* Element Types
    //=======================================================================
    //-----------------------------------------------------------------------

    public async createElementType({
        token,
        ...dto
    }: CreateInventoryElementTypeDto) {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, CREATE_ACTION, this.RESOURCES);

            if (await this.inventoryElementTypeWithSameNameExists(dto.projectId, dto.name))
                throw FwaException({
                    code: HttpStatus.CONFLICT,
                    message:
                        'An element type with the same name already exists',
                    messageCode: INVENTORY_ELEMENT_TYPE_ALREADY_EXISTS,
                    messageData: {
                        name: dto.name,
                    },
                });

            let sanitizedDto = this.accessControlService.filter(dto, attributesFilter);
            let { classificationEntries, projectId, ...fields } = sanitizedDto;

            let elementType = this.elementTypeRepo.create();
            elementType.project = await this.getProject(projectId);

            Object.assign(elementType, { ...fields });

            // Lookup the existing classification entries if property was specified.
            classificationEntries = [];
            if (sanitizedDto.classificationEntries) {
                classificationEntries = await Promise.all(sanitizedDto.classificationEntries.map(async entry => {
                    return await this.lookupClassificationEntry(token, entry);
                }));
            }
            elementType.classificationEntries = classificationEntries;

            const { uid } = await this.elementTypeRepo.save(elementType);
            elementType = await this.getElementTypeRaw({ uid });
            return this.sanitizeResponse(elementType, attributesFilter);
        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    message: 'Cannot create element type',
                    messageCode: CANNOT_CREATE_INVENTORY_ELEMENT_TYPE,
                });
        }
    }

    //-----------------------------------------------------------------------

    public async getInventoryElementTypes({
        token,
        ...dto
    }: ListInventoryElementTypesDto) {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, READ_ACTION, this.RESOURCES);

            let elementTypes = this.elementTypeRepo.find({
                where: {
                    project: { id: dto.projectId }
                }
            });

            let results: InventoryElementTypeDto[] = [];
            (await elementTypes).forEach(elementType => {
                results.push(this.sanitizeResponse(elementType, attributesFilter));
            })
            return results;
        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    message: 'Cannot list inventory element types',
                    messageCode: CANNOT_LIST_INVENTORY_ELEMENT_TYPES,
                });
        }
    }

    //-----------------------------------------------------------------------

    public async countInventoryElementTypes({
        token,
        ...query
    }: QueryInventoryElementTypesDto) {
        {
            try {
                const attributesFiltering = await this.filterGrantedAttributesForAction(token, query.projectId, READ_ACTION, this.RESOURCES);

                let alias = 'etyp';
                let rootEntity = 'elementType';

                let clause = this.buildFilterClause(rootEntity, alias, query, attributesFiltering, this.ELEMENT_TYPE_PROPERTIES, this.ELEMENT_TYPE_DEPENDENCIES);

                let queryBuilder = new QueryBuilder(this.elementTypeRepo, [clause]);
                let ormQuery = queryBuilder.build(alias);

                //console.log(ormQuery.getQueryAndParameters());

                const count = await ormQuery.getCount();

                return count;

            } catch (error) {
                console.log('error', error);
                if (
                    error instanceof HttpException ||
                    error instanceof RpcException
                )
                    throw error;
                else
                    throw FwaException({
                        message: 'Cannot count inventory element types',
                        messageCode: CANNOT_COUNT_INVENTORY_ELEMENT_TYPES,
                    });
            }
        }
    }

    //-----------------------------------------------------------------------

    public async queryInventoryElementTypes({
        token,
        ...query
    }: QueryInventoryElementTypesDto) {
        {
            try {
                const attributesFiltering = await this.filterGrantedAttributesForAction(token, query.projectId, READ_ACTION, this.RESOURCES);

                let alias = 'etyp';
                let rootEntity = 'elementType';

                let clause = this.buildFilterClause(rootEntity, alias, query, attributesFiltering, this.ELEMENT_TYPE_PROPERTIES, this.ELEMENT_TYPE_DEPENDENCIES);

                let queryBuilder = new QueryBuilder(this.elementTypeRepo, [clause]);
                let ormQuery = queryBuilder.build(alias);


                ormQuery.loadAllRelationIds();

                if (query.offset !== undefined) {
                    ormQuery.skip(query.offset);
                }
                if (query.size !== undefined) {
                    ormQuery.take(query.size);
                }

                //console.log(ormQuery.getQueryAndParameters());

                const count = await ormQuery.getCount();
                const totalCount = await this.elementTypeRepo.count({
                    where: {
                        project: { id: query.projectId },
                    },
                });
                const elementTypes = await ormQuery.getMany();

                let results: InventoryElementTypeDto[] = [];
                if (!!elementTypes) {
                    elementTypes.forEach(elementType => {
                        results.push(this.sanitizeResponse(elementType, attributesFiltering));
                    })
                }

                return {
                    data: results,
                    count,
                    totalCount,
                };

            } catch (error) {
                console.log('error', error);
                if (
                    error instanceof HttpException ||
                    error instanceof RpcException
                )
                    throw error;
                else
                    throw FwaException({
                        message: 'Cannot list inventory element types',
                        messageCode: CANNOT_LIST_INVENTORY_ELEMENT_TYPES,
                    });
            }
        }
    }

    //-----------------------------------------------------------------------

    public async getOneElementType({
        token,
        ...dto
    }: InventoryElementTypeGetOneDto) {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, READ_ACTION, this.RESOURCES);

            if (! await this.inventoryElementTypeExists(dto.projectId, dto.elementTypeUid))
                throw FwaException({
                    code: HttpStatus.CONFLICT,
                    message:
                        'The specified element type does not exist in the given project!',
                    messageCode: INVENTORY_ELEMENT_TYPE_NOT_FOUND,
                    messageData: {
                        projectId: dto.projectId,
                        elementTypeUid: dto.elementTypeUid,
                    },
                });


            let elementType = await this.getElementTypeRaw({ uid: dto.elementTypeUid });

            if (!!elementType.files) {
                elementType.files = await this.fetchInventoryFiles(elementType);
            }

            return this.sanitizeResponse(elementType, attributesFilter);

        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    message: 'Cannot fetch inventory element type',
                    messageCode: CANNOT_FETCH_INVENTORY_ELEMENT_TYPE,
                });
        }
    }

    //-----------------------------------------------------------------------

    public async updateElementType({
        token,
        ...dto
    }: UpdateInventoryElementTypeDto) {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, UPDATE_ACTION, this.RESOURCES);

            if (! await this.inventoryElementTypeExists(dto.projectId, dto.elementTypeUid))
                throw FwaException({
                    code: HttpStatus.CONFLICT,
                    message:
                        'The specified element type does not exist in the given project!',
                    messageCode: INVENTORY_ELEMENT_TYPE_NOT_FOUND,
                    messageData: {
                        projectId: dto.projectId,
                        elementTypeUid: dto.elementTypeUid,
                    },
                });

            let elementType = await this.getElementTypeRaw({ uid: dto.elementTypeUid });

            let filteredDto = this.accessControlService.filter(dto, attributesFilter);

            Object.assign(elementType, filteredDto);

            // Lookup the existing classification entries if property was specified.
            let classificationEntries: ClassificationEntry[] = [];
            if (filteredDto.classificationEntries) {
                classificationEntries = await Promise.all(filteredDto.classificationEntries.map(async entry => {
                    return await this.lookupClassificationEntry(token, entry);
                }));
                elementType.classificationEntries = classificationEntries;
            }

            const { uid } = await this.elementTypeRepo.save(elementType);
            elementType = await this.getElementTypeRaw({ uid });
            return this.sanitizeResponse(elementType, attributesFilter);
        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    message: 'Cannot update element type',
                    messageCode: CANNOT_UPDATE_INVENTORY_ELEMENT_TYPE,
                });
        }
    }

    //-----------------------------------------------------------------------

    public async deleteElementType({
        token,
        ...dto
    }: DeleteInventoryElementTypeDto) {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, DELETE_ACTION, this.RESOURCES);

            if (! await this.inventoryElementTypeExists(dto.projectId, dto.elementTypeUid))
                throw FwaException({
                    code: HttpStatus.CONFLICT,
                    message:
                        'The specified element type does not exist in the given project!',
                    messageCode: INVENTORY_ELEMENT_TYPE_NOT_FOUND,
                    messageData: {
                        projectId: dto.projectId,
                        elementTypeUid: dto.elementTypeUid,
                    },
                });

            let elementType = await this.getElementTypeRaw({ uid: dto.elementTypeUid });

            if (elementType.files && elementType.files.length > 0) {
                throw FwaException({
                    code: HttpStatus.CONFLICT,
                    message: `Element Type still has documents attached to it`,
                    messageCode: CANNOT_DELETE_INVENTORY_ELEMENT_TYPE_WITH_DOCUMENTS,
                    messageData: { elementTypeUid: dto.elementTypeUid },
                });
            }

            await this.elementTypeRepo.delete({ uid: elementType.uid });

            return this.sanitizeResponse(elementType, attributesFilter);
        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    code: HttpStatus.BAD_REQUEST,
                    message: 'Cannot delete element type',
                    messageCode: CANNOT_DELETE_INVENTORY_ELEMENT_TYPE,
                });
        }
    }


}
