/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
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
import { BaseService } from '../../core/base.service';
import { CANNOT_COUNT_INVENTORY_MATERIAL_TYPES, CANNOT_CREATE_INVENTORY_MATERIAL_TYPE, CANNOT_FETCH_INVENTORY_MATERIAL_TYPE, CANNOT_LIST_INVENTORY_MATERIAL_TYPES, CANNOT_UPDATE_INVENTORY_MATERIAL_TYPE, FAILED_TO_LOOKUP_INVENTORY_MATERIAL_TYPE, INVENTORY_MATERIAL_NOT_FOUND, INVENTORY_MATERIAL_TYPE_ALREADY_EXISTS, INVENTORY_MATERIAL_TYPE_NOT_FOUND } from './constants/messageCode.constants';
import { ResourceTriplet } from '../../FWAjs-utils/utils/auth.interface';
import { MATERIAL_TYPE, OWN_PROJECT_MATERIAL_TYPE, PARTICIPATING_PROJECT_MATERIAL_TYPE } from './accessControl/resourcesName.constants';
import { MaterialType } from './entities/material-type.entity';
import { ListInventoryMaterialTypesDto } from './dto/list-inventory-material-types.dto';
import { CreateInventoryMaterialTypeDto } from './dto/create-inventory-material-type.dto';
import { UpdateInventoryMaterialTypeDto } from './dto/update-inventory-material-type.dto';
import { DeleteInventoryMaterialTypeDto } from './dto/delete-inventory-material-type.dto';
import { InventoryMaterialDto } from './dto/inventory-material.dto';
import { InventoryMaterialTypeDto } from './dto/inventory-matertial-type.dto';
import { InventoryMaterialTypeGetOneDto } from './dto/get-one-inventory-material-type.dto';
import { QueryInventoryMaterialTypesDto } from './dto/query-inventory-material-types.dto';
import { QueryBuilder } from 'src/utils/search/query-builder';

@Injectable()
export class InventoryMaterialTypeService extends BaseService implements OnModuleInit {

    private readonly RESOURCES = <ResourceTriplet>{
        global: MATERIAL_TYPE,
        owned: OWN_PROJECT_MATERIAL_TYPE,
        shared: PARTICIPATING_PROJECT_MATERIAL_TYPE
    };

    private readonly MATERIAL_TYPE_PROPERTIES = [
        'uid',
        'name',
        'description',
        'category',
        'isHazard',
        'projectId',
    ];

    private readonly MATERIAL_TYPE_DEPENDENCIES: Record<string, string> = {
    };

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //----------------------------------------------------------------------- 

    constructor(
        @InjectRepository(MaterialType)
        private readonly materialTypeRepo: Repository<MaterialType>,

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

    private sanitizeResponse(entity: MaterialType, attributes: any): InventoryMaterialTypeDto {
        return MaterialType.toDto(entity);

        //return this.accessControlService.filter(dto, attributes);
    }

    //----------------------------------------------------------------------- 

    public async getMaterialTypeRaw({ uid }: { uid: string }): Promise<MaterialType> {
        try {
            return await this.materialTypeRepo.findOneOrFail({
                where: { uid },
                relations: ['project', 'circularity']
            });
        } catch (error) {
            throw FwaException({
                code: HttpStatus.NOT_FOUND,
                message: 'The inventory material was not found',
                messageCode: INVENTORY_MATERIAL_NOT_FOUND,
                messageData: {
                    uid: uid,
                },
            });
        }
    }

    //----------------------------------------------------------------------- 

    private async inventoryMaterialTypeExists(projectId: number, materialTypeUid: string): Promise<boolean> {
        try {
            let count = 0;
            count = await this.materialTypeRepo.count({
                where: {
                    uid: materialTypeUid,
                    project: { id: projectId },
                }
            });
            return (count > 0);
        } catch (error) {
            console.log(error);
            throw FwaException({
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Failed to lookup material type',
                messageCode: FAILED_TO_LOOKUP_INVENTORY_MATERIAL_TYPE,
                messageData: { projectId: projectId, materialTypeUid: materialTypeUid },
            });
        }
    }

    //----------------------------------------------------------------------- 

    private async materialTypeWithNameAlreadyExists(projectId: number, materialTypeName: string): Promise<boolean> {
        try {
            let count = 0;
            count = await this.materialTypeRepo.count({
                where: {
                    name: materialTypeName,
                    project: { id: projectId },
                }
            });
            return (count > 0);
        } catch (error) {
            console.log(error);
            throw FwaException({
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Failed to lookup material type',
                messageCode: FAILED_TO_LOOKUP_INVENTORY_MATERIAL_TYPE,
                messageData: { projectId: projectId, materialTypeName: materialTypeName },
            });
        }
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Service API
    //***********************************************************************
    //-----------------------------------------------------------------------

    public async createMaterialType({
        token,
        ...dto
    }: CreateInventoryMaterialTypeDto) {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, CREATE_ACTION, this.RESOURCES);

            // Check whether material type already exists for given project
            if (await this.materialTypeWithNameAlreadyExists(dto.projectId, dto.name))
                throw FwaException({
                    code: HttpStatus.CONFLICT,
                    message: 'A material type with the same name already exists',
                    messageCode: INVENTORY_MATERIAL_TYPE_ALREADY_EXISTS,
                    messageData: {
                        name: dto.name,
                    },
                });

            // Create a new material type entity.
            let materialType = this.materialTypeRepo.create();
            materialType.project = await this.getProject(dto.projectId);

            let filteredDto = this.accessControlService.filter(dto, attributesFilter);

            Object.assign(materialType, { ...filteredDto });

            var result = await this.materialTypeRepo.save(materialType);
            return this.sanitizeResponse(result, attributesFilter);
        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    message: 'Cannot create inventory material type',
                    messageCode: CANNOT_CREATE_INVENTORY_MATERIAL_TYPE,
                });
        }
    }

    //-----------------------------------------------------------------------

    public async listMaterialTypes({
        token,
        ...dto
    }: ListInventoryMaterialTypesDto) {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, READ_ACTION, this.RESOURCES);

            const materialTypes = await this.materialTypeRepo.find({
                where: {
                    project: { id: dto.projectId },
                }, relations: ['project', 'circularity']
            });

            let results: InventoryMaterialTypeDto[] = [];
            materialTypes.forEach(materialType => {
                results.push(this.sanitizeResponse(materialType, attributesFilter));
            })
            return results;
        } catch (error) {
            console.log('error', error);
            if (
                error instanceof HttpException ||
                error instanceof RpcException
            )
                throw error;
            else
                throw FwaException({
                    message: 'Cannot list inventory material types',
                    messageCode: CANNOT_LIST_INVENTORY_MATERIAL_TYPES,
                });
        }
    }

    //-----------------------------------------------------------------------

    public async countInventoryMaterialTypes({
        token,
        ...query
    }: QueryInventoryMaterialTypesDto) {
        {
            try {
                const attributesFiltering = await this.filterGrantedAttributesForAction(token, query.projectId, READ_ACTION, this.RESOURCES);

                let alias = 'mtyp';
                let rootEntity = 'materialType';

                let clause = this.buildFilterClause(rootEntity, alias, query, attributesFiltering, this.MATERIAL_TYPE_PROPERTIES, this.MATERIAL_TYPE_DEPENDENCIES);

                let queryBuilder = new QueryBuilder(this.materialTypeRepo, [clause]);
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
                        message: 'Cannot count inventory material types',
                        messageCode: CANNOT_COUNT_INVENTORY_MATERIAL_TYPES,
                    });
            }
        }
    }

    //-----------------------------------------------------------------------

    public async queryInventoryMaterialTypes({
        token,
        ...query
    }: QueryInventoryMaterialTypesDto) {
        {
            try {
                const attributesFiltering = await this.filterGrantedAttributesForAction(token, query.projectId, READ_ACTION, this.RESOURCES);

                let alias = 'mtyp';
                let rootEntity = 'materialType';

                let clause = this.buildFilterClause(rootEntity, alias, query, attributesFiltering, this.MATERIAL_TYPE_PROPERTIES, this.MATERIAL_TYPE_DEPENDENCIES);

                let queryBuilder = new QueryBuilder(this.materialTypeRepo, [clause]);
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
                const totalCount = await this.materialTypeRepo.count({
                    where: {
                        project: { id: query.projectId },
                    },
                });
                const materialTypes = await ormQuery.getMany();

                let results: InventoryMaterialTypeDto[] = [];
                if (!!materialTypes) {
                    materialTypes.forEach(materialType => {
                        results.push(this.sanitizeResponse(materialType, attributesFiltering));
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
                        message: 'Cannot list inventory material types',
                        messageCode: CANNOT_LIST_INVENTORY_MATERIAL_TYPES,
                    });
            }
        }
    }

    //-----------------------------------------------------------------------

    public async getOneMaterialType({
        token,
        ...dto
    }: InventoryMaterialTypeGetOneDto) {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, READ_ACTION, this.RESOURCES);

            if (! await this.inventoryMaterialTypeExists(dto.projectId, dto.materialTypeUid))
                throw FwaException({
                    code: HttpStatus.CONFLICT,
                    message:
                        'The specified element type does not exist in the given project!',
                    messageCode: INVENTORY_MATERIAL_TYPE_NOT_FOUND,
                    messageData: {
                        projectId: dto.projectId,
                        materialTypeUid: dto.materialTypeUid,
                    },
                });


            let materialType = await this.getMaterialTypeRaw({ uid: dto.materialTypeUid });

            return this.sanitizeResponse(materialType, attributesFilter);

        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    message: 'Cannot fetch inventory element type',
                    messageCode: CANNOT_FETCH_INVENTORY_MATERIAL_TYPE,
                });
        }
    }

    //-----------------------------------------------------------------------

    public async updateMaterialType({
        token,
        ...dto
    }: UpdateInventoryMaterialTypeDto) {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, UPDATE_ACTION, this.RESOURCES);

            // Check if the element exits.
            const materialType = await this.getMaterialTypeRaw({ uid: dto.materialTypeUid });

            let filteredDto = this.accessControlService.filter(dto, attributesFilter);
            Object.assign(materialType, { ...filteredDto });
            await this.materialTypeRepo.save(materialType);

            let result = await this.getMaterialTypeRaw({ uid: dto.materialTypeUid });
            return this.sanitizeResponse(result, attributesFilter);
        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    message: 'Cannot update material type',
                    messageCode: CANNOT_UPDATE_INVENTORY_MATERIAL_TYPE,
                });
        }
    }

    //-----------------------------------------------------------------------

    public async deleteMaterialType({
        token,
        ...dto
    }: DeleteInventoryMaterialTypeDto) {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, DELETE_ACTION, this.RESOURCES);

            // Check if the element exits.
            const materialType = await this.getMaterialTypeRaw({ uid: dto.materialTypeUid });
            let filteredDto = this.accessControlService.filter(materialType, attributesFilter);

            await this.materialTypeRepo.delete(filteredDto);
            return filteredDto;
        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    code: HttpStatus.BAD_REQUEST,
                    message: 'Cannot delete material type',
                    messageCode: 'cannotDeleteMaterialType',
                });
        }
    }
}