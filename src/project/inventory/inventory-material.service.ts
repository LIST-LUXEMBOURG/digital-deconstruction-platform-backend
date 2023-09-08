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
    dispatchACDBs,
    FWACallFct,
    FwaException,
    onModuleDynamicInit,
    READ_ACTION,
    UPDATE_ACTION,
} from '../../FWAjs-utils';
import { Material } from './entities/material.entity';
import { RpcException } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';

import { ApiAccessControlService } from '../../FWAjs-utils/accessControl/accessControl.service';
import { Timeout } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateInventoryMaterialDto } from './dto/create-inventory-material.dto';
import { UpdateInventoryMaterialDto } from './dto/update-inventory-material.dto';
import { DeleteInventoryMaterialDto } from './dto/delete-inventory-material.dto';
import { BaseService } from '../../core/base.service';
import { CANNOT_ANALYSE_INVENTORY_MATERIALS, CANNOT_CREATE_INVENTORY_MATERIAL, CANNOT_DELETE_INVENTORY_MATERIAL, CANNOT_LIST_INVENTORY_MATERIALS, CANNOT_UPDATE_INVENTORY_MATERIAL, FAILED_TO_LOOKUP_INVENTORY_MATERIAL, INVENTORY_MATERIAL_ALREADY_EXISTS, INVENTORY_MATERIAL_NOT_FOUND } from './constants/messageCode.constants';
import { ResourceTriplet } from '../../FWAjs-utils/utils/auth.interface';
import { MATERIAL, OWN_PROJECT_MATERIAL, PARTICIPATING_PROJECT_MATERIAL } from './accessControl/resourcesName.constants';
import { ListInventoryMaterialsDto } from './dto/list-inventory-materials.dto';
import { InventoryMaterialDto } from './dto/inventory-material.dto';
import { MaterialType } from './entities/material-type.entity';
import { AnalyseInventoryMaterialsDto } from './dto/analyse-inventory-materials.dto';

@Injectable()
export class InventoryMaterialService extends BaseService implements OnModuleInit {

    private readonly RESOURCES = <ResourceTriplet>{
        global: MATERIAL,
        owned: OWN_PROJECT_MATERIAL,
        shared: PARTICIPATING_PROJECT_MATERIAL
    };

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //----------------------------------------------------------------------- 

    constructor(
        @InjectRepository(Material)
        private readonly materialRepo: Repository<Material>,

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

    private sanitizeResponse(entity: Material, attributes: any): InventoryMaterialDto {

        return Material.toDto(entity);

        //return this.accessControlService.filter(dto, attributes);
    }

    //----------------------------------------------------------------------- 

    public async getMaterialRaw({ uid }: { uid: string }): Promise<Material> {
        try {
            return await this.materialRepo.findOneOrFail({
                where: { uid },
                relations: ['project', 'materialType']
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

    private async inventoryMaterialExists(projectId: number, elementUid: string, materialUid: string): Promise<boolean> {
        try {
            return await this.materialRepo.count({
                where: {
                    element: {
                        uid: elementUid,
                    },
                    project: {
                        id: projectId,
                    },
                    uid: materialUid,
                }
            }) > 0;
        } catch (error) {
            throw FwaException({
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Failed to lookup inventory element',
                messageCode: FAILED_TO_LOOKUP_INVENTORY_MATERIAL,
                messageData: {
                    projectId: projectId,
                    elementUid: elementUid,
                    uid: materialUid
                }
            });
        }
    }

    //----------------------------------------------------------------------- 

    private async inventoryMaterialAlreadyExistsForElement(projectId: number, elementUid: string, materialTypeUid: string): Promise<boolean> {
        try {
            return await this.materialRepo.count({
                where: {
                    materialType: {
                        uid: materialTypeUid,
                    },
                    element: {
                        uid: elementUid,
                    },
                    project: {
                        id: projectId,
                    }
                }
            }) > 0;
        } catch (error) {
            throw FwaException({
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Failed to lookup inventory element',
                messageCode: FAILED_TO_LOOKUP_INVENTORY_MATERIAL,
                messageData: {
                    projectId: projectId,
                    elementUid: elementUid,
                    materialTypeUid: materialTypeUid
                }
            });
        }
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Service API
    //***********************************************************************
    //-----------------------------------------------------------------------

    public async createMaterial({
        token,
        ...dto
    }: CreateInventoryMaterialDto) {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, READ_ACTION, this.RESOURCES);

            if (await this.inventoryMaterialAlreadyExistsForElement(dto.projectId, dto.elementUid, dto.materialTypeUid))
                throw FwaException({
                    code: HttpStatus.CONFLICT,
                    message: 'A material with the same material type already exists for the given element',
                    messageCode: INVENTORY_MATERIAL_ALREADY_EXISTS,
                    messageData: {
                        projectId: dto.projectId,
                        elementUid: dto.elementUid,
                        materialTypeUid: dto.materialTypeUid
                    },
                });

            // Create a new material entity.
            let material = this.materialRepo.create();
            material.project = await this.getProject(dto.projectId);

            let filteredDto = this.accessControlService.filter(dto, attributesFilter);

            Object.assign(material, { ...filteredDto });

            var result = await this.materialRepo.save(material);
            return this.sanitizeResponse(result, attributesFilter);
        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    message: 'Cannot create inventory material',
                    messageCode: CANNOT_CREATE_INVENTORY_MATERIAL,
                });
        }
    }

    //-----------------------------------------------------------------------

    public async listMaterials({
        token,
        ...dto }: ListInventoryMaterialsDto) {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, READ_ACTION, this.RESOURCES);

            let materials = this.materialRepo.find({
                where: {
                    element: { uid: dto.elementUid },
                    project: { id: dto.projectId }
                }, relations: ['project', 'materialType']
            });

            let results: InventoryMaterialDto[] = [];
            (await materials).forEach(material => {
                results.push(this.sanitizeResponse(material, attributesFilter));
            })
            return results;
        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    message: 'Cannot list inventory materials',
                    messageCode: CANNOT_LIST_INVENTORY_MATERIALS,
                });
        }
    }

    //-----------------------------------------------------------------------

    public async updateMaterial({
        token,
        ...dto
    }: UpdateInventoryMaterialDto) {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, UPDATE_ACTION, this.RESOURCES);

            let material: Material;

            if (this.inventoryMaterialExists(dto.projectId, dto.elementUid, dto.materialUid)) {
                material = await this.getMaterialRaw({ uid: dto.materialUid });
            } else {
                throw FwaException({
                    code: HttpStatus.NOT_FOUND,
                    message: 'The inventory material was not found',
                    messageCode: INVENTORY_MATERIAL_NOT_FOUND,
                    messageData: {
                        uid: dto.materialUid,
                    },
                });
            }

            let filteredDto = this.accessControlService.filter(dto, attributesFilter);

            Object.assign(material, { ...filteredDto });

            // Update the material
            material = await this.materialRepo.save(material);
            return this.sanitizeResponse(material, attributesFilter);
        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    message: 'Cannot update material',
                    messageCode: CANNOT_UPDATE_INVENTORY_MATERIAL,
                });
        }
    }

    //-----------------------------------------------------------------------

    public async deleteMaterial({
        token,
        ...dto
    }: DeleteInventoryMaterialDto) {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, UPDATE_ACTION, this.RESOURCES);

            let material: Material;

            if (this.inventoryMaterialExists(dto.projectId, dto.elementUid, dto.materialUid)) {
                material = await this.getMaterialRaw({ uid: dto.materialUid });
            } else {
                throw FwaException({
                    code: HttpStatus.NOT_FOUND,
                    message: 'The inventory material was not found',
                    messageCode: INVENTORY_MATERIAL_NOT_FOUND,
                    messageData: {
                        uid: dto.materialUid,
                    },
                });
            }

            await this.materialRepo.delete(material);
            return this.sanitizeResponse(material, attributesFilter);
        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    code: HttpStatus.BAD_REQUEST,
                    message: 'Cannot delete inventory material',
                    messageCode: CANNOT_DELETE_INVENTORY_MATERIAL,
                });
        }
    }

    // ----------------------------------------------------------------------

    public async getInventoryMaterialsAnalysis({
        token,
        ...dto }: AnalyseInventoryMaterialsDto) {
        try {
            const typesCount = await this.materialRepo
                .createQueryBuilder('m')
                .select('m.materialTypeUid', 'uid')
                .addSelect('COUNT(m.materialTypeUid)', 'count')
                .addSelect('SUM(m.volume)', 'totalVolume')
                .addSelect('SUM(m.mass)', 'totalMass')
                .where('m.projectId = :projectId', { projectId: dto.projectId })
                .groupBy('m.materialTypeUid')
                .getRawMany();

            const baseTypes = await this.materialTypeRepo.find({
                where: {
                    project: { id: dto.projectId },
                }, relations: ['project']
            });

            let overallVolume: number = 0;
            let overallMass: number = 0;

            const types = baseTypes.map((type) => {
                const index = typesCount.findIndex((tc) => tc.uid === type.uid);
                const found = (index !== -1);

                overallVolume += (found) ? parseFloat(typesCount[index].totalVolume) : 0;
                overallMass += (found) ? parseFloat(typesCount[index].totalMass) : 0;
                return {
                    ...MaterialType.toDto(type),
                    count: (found) ? typesCount[index].count : 0,
                    totalVolume: (found) ? typesCount[index].totalVolume : 0,
                    totalMass: (found) ? typesCount[index].totalMass : 0,
                };
            });

            // the total number of materials, if you want the total number of types replace materialRepo by materialTypeRepo
            const count = await this.materialRepo.count({
                where: { project: { id: dto.projectId } },
            });

            return { materials: types, count, overallVolume, overallMass };
        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    code: HttpStatus.BAD_REQUEST,
                    message: 'Cannot get material analysis',
                    messageCode: CANNOT_ANALYSE_INVENTORY_MATERIALS,
                });
        }
    }

    // ----------------------------------------------------------------------
}
