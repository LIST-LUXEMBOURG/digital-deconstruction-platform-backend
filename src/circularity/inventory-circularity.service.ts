/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ModuleRef } from '@nestjs/core';
import {
    HttpException,
    HttpStatus,
    Injectable,
    Logger,
    OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import {
    CREATE_ACTION,
    DELETE_ACTION,
    dispatchACDBs,
    FWACallFct,
    FwaException,
    onModuleDynamicInit,
    READ_ACTION,
    UPDATE_ACTION,
} from '../FWAjs-utils';
import { RpcException } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';

import { ApiAccessControlService } from '../FWAjs-utils/accessControl/accessControl.service';
import { Timeout } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
    CIRCULARITY_NOT_FOUND,
    FAILED_TO_LOOKUP_CIRCULARITY,
    CIRCULARITY_ALREADY_EXISTS,
    CIRCULARITY_REQUIRES_ELEMENT_TYPE_OR_MATERIAL_TYPE,
    CANNOT_FETCH_CIRCULARITY,
    CANNOT_CREATE_CIRCULARITY,
    CANNOT_DELETE_CIRCULARITY,
    CANNOT_UPDATE_CIRCULARITY,
    CANNOT_FETCH_CIRCULARITY_ANALYSIS,
    FAILED_TO_LOOKUP_CIRCULARITY_TOTALS
} from './constants/messageCode.constants';
import { CIRCULARITY, OWN_PROJECT_CIRCULARITY, PARTICIPATING_PROJECT_CIRCULARITY } from './accessControl/resourcesName.constants';
import { BaseService } from '../core/base.service';
import { ResourceTriplet } from '../FWAjs-utils/utils/auth.interface';
import { Circularity } from './entities/circularity.entity';
import { InventoryCircularityDto } from './dto/inventory-circularity.dto';
import { CreateInventoryCircularityDto } from './dto/create-inventory-circularity.dto';
import { Project } from '../project/entities/project.entity';
import { Element } from '../project/inventory/entities/element.entity';
import { ElementType } from '../project/inventory/entities/element-type.entity';
import { MaterialType } from '../project/inventory/entities/material-type.entity';
import { DeleteInventoryCircularityDto } from './dto/delete-inventory-circularity.dto';
import { UpdateInventoryCircularityDto } from './dto/update-inventory-circularity.dto';
import { InventoryCircularityGetOneDto } from './dto/get-one-inventory-circularity.dto';
import { isArray } from 'lodash';
import { AnalyseInventoryCircularityDto, CircularityFirstOrder } from './dto/analyse-inventory-circularity.dto';

enum CircularityScope {
    ELEMENT = 'element',
    ELEMENT_TYPE = 'elementType',
    MATERIAL_TYPE = 'materialType',
    UNDEFINED = 'undefined',
}

@Injectable()
export class InventoryCircularityService extends BaseService implements OnModuleInit {

    private readonly RESOURCES = <ResourceTriplet>{
        global: CIRCULARITY,
        owned: OWN_PROJECT_CIRCULARITY,
        shared: PARTICIPATING_PROJECT_CIRCULARITY
    };

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //----------------------------------------------------------------------- 

    constructor(
        @InjectRepository(Circularity)
        private readonly circularityRepo: Repository<Circularity>,

        protected readonly jwtService: JwtService,
        protected readonly accessControlService: ApiAccessControlService,

        protected readonly moduleRef: ModuleRef,
        protected readonly eventEmitter: EventEmitter2,
    ) {
        super(jwtService, accessControlService, moduleRef, eventEmitter);
        //this.logger = new Logger("Circularity");
    }

    //-----------------------------------------------------------------------

    async onModuleInit() {
        await onModuleDynamicInit(this, null, [
            'coreService',
            'projectService',
            'participantService',
            'inventoryElementService',
            'inventoryElementTypeService',
            'inventoryMaterialTypeService'
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

    private sanitizeResponse(entity: any, attributes: any): InventoryCircularityDto {

        return Circularity.toDto(entity);
    }

    //-----------------------------------------------------------------------

    public async getCircularityRaw({ uid }: { uid: string }): Promise<Circularity> {
        try {
            return await this.circularityRepo.findOneOrFail({
                where: { uid },
                relations: ['project']
            });
        } catch (error) {
            throw FwaException({
                code: HttpStatus.NOT_FOUND,
                message: 'The circularity object was not found',
                messageCode: CIRCULARITY_NOT_FOUND,
                messageData: {
                    uid: uid,
                },
            });
        }
    }

    //----------------------------------------------------------------------- 

    private async circularityExists(projectId: number, circularityUid: string): Promise<boolean> {
        try {
            let count = 0;
            count = await this.circularityRepo.count({
                where: {
                    uid: circularityUid,
                    project: { id: projectId },
                }
            });
            return (count > 0);
        } catch (error) {
            console.log(error);
            throw FwaException({
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Failed to lookup circularity',
                messageCode: FAILED_TO_LOOKUP_CIRCULARITY,
                messageData: { projectId: projectId, circularityUid: circularityUid },
            });
        }
    }

    //-----------------------------------------------------------------------

    private async lookupElement(elementUid: string): Promise<Element> {

        return await FWACallFct(
            this,
            { srv: 'inventoryElementService', cmd: 'getInventoryElementRaw' },
            {
                uid: elementUid
            },
        );
    }

    //-----------------------------------------------------------------------

    private async lookupElementType(token: any, projectId: number, elementTypeUid: string): Promise<ElementType> {
        return await FWACallFct(
            this,
            { srv: 'inventoryElementTypeService', cmd: 'getOneElementType' },
            {
                token,
                projectId: projectId,
                elementTypeUid: elementTypeUid
            },
        );
    }

    //-----------------------------------------------------------------------

    private async lookupMaterialType(token: any, projectId: number, materialTypeUid: string): Promise<MaterialType> {
        return await FWACallFct(
            this,
            { srv: 'inventoryMaterialTypeService', cmd: 'getOneMaterialType' },
            {
                token,
                projectId: projectId,
                materialTypeUid: materialTypeUid
            },
        );
    }

    //----------------------------------------------------------------------- 

    private async circularityMapped(projectId: number, elementUids: string[], elementTypeUid: string, materialTypeUid: string): Promise<boolean> {

        try {
            if (!!elementUids) {
                let query = this.circularityRepo.createQueryBuilder('circ')
                    .leftJoin('circ.elements', 'element')
                    .where('circ.projectId = :projectId', { projectId: projectId })
                    .andWhere("element.uid = ANY (:uids)", { uids: elementUids });
                return await query.getCount() > 0;
            } else if (!!elementTypeUid) {
                return await this.circularityRepo.count({
                    project: { id: projectId },
                    elementType: { uid: elementTypeUid }
                }) > 0;
            } else if (!!materialTypeUid) {
                return await this.circularityRepo.count({
                    project: { id: projectId },
                    materialType: { uid: materialTypeUid }
                }) > 0;
            }

        } catch (error) {
            throw FwaException({
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Failed to lookup circularity object',
                messageCode: FAILED_TO_LOOKUP_CIRCULARITY,
                messageData: {
                    projectId: projectId,
                    elementTypeUid: elementTypeUid,
                    materialTypeUid: materialTypeUid,
                }
            });
        }
    }
    //----------------------------------------------------------------------- 

    private async getCircularityTotals(projectId: number, scope: CircularityScope) {

        let query: SelectQueryBuilder<Circularity>;

        query = this.circularityRepo
            .createQueryBuilder('c')
            .select('SUM(c.marketValue)', 'totalMarketValue')
            .addSelect('SUM(c.savingsCO2)', 'totalSavingsCO2')
            .addSelect('SUM(c.socialBalance)', 'totalSocialBalance');

        switch (scope) {
            case CircularityScope.ELEMENT:
                query.innerJoin('c.elements', 'element')
                    .where('c.projectId = :projectId', { projectId: projectId });
                break;
            case CircularityScope.ELEMENT_TYPE:
                query.where('c.elementTypeUid IS NOT NULL')
                    .andWhere('c.projectId = :projectId', { projectId: projectId })
                break;
            case CircularityScope.MATERIAL_TYPE:
                query.where('c.materialTypeUid IS NOT NULL')
                    .andWhere('c.projectId = :projectId', { projectId: projectId })
                break;
            case CircularityScope.UNDEFINED:
                throw FwaException({
                    code: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: 'Unknown Circularity Scope specified',
                    messageCode: FAILED_TO_LOOKUP_CIRCULARITY_TOTALS,
                    messageData: {
                        projectId: projectId,
                        offendingScope: scope,
                    }
                });
        }

        return query.getRawOne();
    }

    //-----------------------------------------------------------------------

    private setCircularityOrdering(ordering: CircularityFirstOrder, query: SelectQueryBuilder<Circularity>): SelectQueryBuilder<Circularity> {
        switch (ordering) {
            case CircularityFirstOrder.MARKET_VALUE:
                query.orderBy('c.marketValue', 'DESC')
                    .addOrderBy('c.savingsCO2', 'DESC')
                    .addOrderBy('c.socialBalance', 'DESC')
                break;

            case CircularityFirstOrder.SAVINGS_CO2:
                query.orderBy('c.savingsCO2', 'DESC')
                    .addOrderBy('c.socialBalance', 'DESC')
                    .addOrderBy('c.marketValue', 'DESC')
                break;

            case CircularityFirstOrder.SOCIAL_BALANCE:
                query.orderBy('c.socialBalance', 'DESC')
                    .addOrderBy('c.marketValue', 'DESC')
                    .addOrderBy('c.savingsCO2', 'DESC')
                break;
        }
        return query;
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Service API
    //***********************************************************************
    //-----------------------------------------------------------------------

    public async createCircularity({
        token,
        ...dto
    }: CreateInventoryCircularityDto
    ): Promise<InventoryCircularityDto> {

        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, CREATE_ACTION, this.RESOURCES);

            if (!isArray(dto.elementUids)) {
                dto.elementUids = [dto.elementUids];
            }

            let sanitizedDto = this.accessControlService.filter(dto, attributesFilter);

            if (await this.circularityMapped(dto.projectId, dto.elementUids, dto.elementTypeUid, dto.materialTypeUid))
                throw FwaException({
                    code: HttpStatus.CONFLICT,
                    message: 'One or more of the specified element(s) already have a circularity object!',
                    messageCode: CIRCULARITY_ALREADY_EXISTS,
                    messageData: {
                        projectId: dto.projectId,
                        elementUids: dto.elementUids,
                        elementTypeUid: dto.elementTypeUid,
                        materialTypeUid: dto.materialTypeUid
                    }
                })

            let circularity = this.circularityRepo.create();
            Object.assign(circularity, { ...sanitizedDto });
            circularity.project = new Project();
            circularity.project.id = sanitizedDto.projectId;
            if (!!sanitizedDto.elementTypeUid) {
                circularity.elementType = await this.lookupElementType(token, dto.projectId, sanitizedDto.elementTypeUid);
            } else if (!!sanitizedDto.materialTypeUid) {
                circularity.materialType = await this.lookupMaterialType(token, dto.projectId, sanitizedDto.materialTypeUid);
            } else if (!!sanitizedDto.elementUids) {
                // Lookup the existing Elements if property was specified.
                let elements: Element[] = [];
                elements = await Promise.all(sanitizedDto.elementUids.map(async elementUid => {
                    return await this.lookupElement(elementUid);
                }));
                circularity.elements = elements;
            } else {
                throw FwaException({
                    code: HttpStatus.PRECONDITION_FAILED,
                    message: 'Either Element Type UUID, Material Type UUID or 1..n Element UUIDs must be provided',
                    messageCode: CIRCULARITY_REQUIRES_ELEMENT_TYPE_OR_MATERIAL_TYPE,
                    messageData: {
                        projectId: dto.projectId,
                        elementTypeUid: dto.elementTypeUid,
                        materialTypeUid: dto.materialTypeUid
                    }
                })
            }

            const { uid } = await this.circularityRepo.save(circularity);

            circularity = await this.getCircularityRaw({ uid });
            return this.sanitizeResponse(circularity, attributesFilter);
        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    message: 'Cannot create circularity object',
                    messageCode: CANNOT_CREATE_CIRCULARITY,
                });
        }
    }

    //-----------------------------------------------------------------------

    public async getOneCircularity({
        token,
        ...dto
    }: InventoryCircularityGetOneDto) {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, READ_ACTION, this.RESOURCES);

            if (! await this.circularityExists(dto.projectId, dto.circularityUid))
                throw FwaException({
                    code: HttpStatus.CONFLICT,
                    message:
                        'The specified circularity object does not exist in the given project!',
                    messageCode: CIRCULARITY_NOT_FOUND,
                    messageData: {
                        projectId: dto.projectId,
                        circularityUid: dto.circularityUid,
                    },
                });

            let circularity = await this.getCircularityRaw({ uid: dto.circularityUid });

            return this.sanitizeResponse(circularity, attributesFilter);

        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    message: 'Cannot fetch inventory circularity object',
                    messageCode: CANNOT_FETCH_CIRCULARITY,
                });
        }
    }

    // ----------------------------------------------------------------------

    public async getInventoryElementsCircularityAnalysis({
        token,
        ...dto }: AnalyseInventoryCircularityDto) {
        try {
            const totals = await this.getCircularityTotals(dto.projectId, CircularityScope.ELEMENT);

            let top = this.circularityRepo
                .createQueryBuilder('c')
                .select('c.marketValue', 'marketValue')
                .addSelect('c.savingsCO2', 'savingsCO2')
                .addSelect('c.socialBalance', 'socialBalance')
                .innerJoin('c.elements', 'element')
                .addSelect('element.uid', 'elementUid')
                .addSelect('element.name', 'elementName')
                .where('c.projectId = :projectId', { projectId: dto.projectId });

            top = this.setCircularityOrdering(dto.ordering, top);

            let results = await top.limit(dto.limit).getRawMany();

            let restMarketValue = totals.totalMarketValue;
            let restSavingsCO2 = totals.totalSavingsCO2;
            let restSocialBalance = totals.totalSocialBalance;

            results.forEach((result) => {
                restMarketValue -= result.marketValue;
                restSavingsCO2 -= result.savingsCO2;
                restSocialBalance -= result.socialBalance;
            });

            results.push({
                marketValue: restMarketValue,
                savingsCO2: restSavingsCO2,
                socialBalance: restSocialBalance
            });

            return { results };
        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    message: 'Cannot fetch inventory circularity analysis for elements',
                    messageCode: CANNOT_FETCH_CIRCULARITY_ANALYSIS,
                });
        }
    }

    // ----------------------------------------------------------------------

    public async getInventoryElementTypesCircularityAnalysis({
        token,
        ...dto }: AnalyseInventoryCircularityDto) {
        try {
            const totals = await this.getCircularityTotals(dto.projectId, CircularityScope.ELEMENT_TYPE);

            let top = this.circularityRepo
                .createQueryBuilder('c')
                .select('c.marketValue', 'marketValue')
                .addSelect('c.savingsCO2', 'savingsCO2')
                .addSelect('c.socialBalance', 'socialBalance')
                .innerJoin('c.elementType', 'elementType')
                .addSelect('elementType.uid', 'elementTypeUid')
                .addSelect('elementType.name', 'elementTypeName')
                .where('c.projectId = :projectId', { projectId: dto.projectId });

            top = this.setCircularityOrdering(dto.ordering, top);

            let results = await top.limit(dto.limit).getRawMany();

            let restMarketValue = totals.totalMarketValue;
            let restSavingsCO2 = totals.totalSavingsCO2;
            let restSocialBalance = totals.totalSocialBalance;

            results.forEach((result) => {
                restMarketValue -= result.marketValue;
                restSavingsCO2 -= result.savingsCO2;
                restSocialBalance -= result.socialBalance;
            });

            results.push({
                marketValue: restMarketValue,
                savingsCO2: restSavingsCO2,
                socialBalance: restSocialBalance
            });

            return { results };
        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    message: 'Cannot fetch inventory circularity analysis for element types',
                    messageCode: CANNOT_FETCH_CIRCULARITY_ANALYSIS,
                });
        }
    }

    // ----------------------------------------------------------------------

    public async getInventoryMaterialTypesCircularityAnalysis({
        token,
        ...dto }: AnalyseInventoryCircularityDto) {
        try {
            const totals = await this.getCircularityTotals(dto.projectId, CircularityScope.MATERIAL_TYPE);

            let top = this.circularityRepo
                .createQueryBuilder('c')
                .select('c.marketValue', 'marketValue')
                .addSelect('c.savingsCO2', 'savingsCO2')
                .addSelect('c.socialBalance', 'socialBalance')
                .innerJoin('c.materialType', 'materialType')
                .addSelect('materialType.uid', 'materialTypeUid')
                .addSelect('materialType.name', 'materialTypeName')
                .where('c.projectId = :projectId', { projectId: dto.projectId });

            top = this.setCircularityOrdering(dto.ordering, top);

            let results = await top.limit(dto.limit).getRawMany();

            let restMarketValue = totals.totalMarketValue;
            let restSavingsCO2 = totals.totalSavingsCO2;
            let restSocialBalance = totals.totalSocialBalance;

            results.forEach((result) => {
                restMarketValue -= result.marketValue;
                restSavingsCO2 -= result.savingsCO2;
                restSocialBalance -= result.socialBalance;
            });

            results.push({
                marketValue: restMarketValue,
                savingsCO2: restSavingsCO2,
                socialBalance: restSocialBalance
            });

            return { results };
        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    message: 'Cannot fetch inventory circularity analysis for material types',
                    messageCode: CANNOT_FETCH_CIRCULARITY_ANALYSIS,
                });
        }
    }
    //-----------------------------------------------------------------------

    public async updateCircularity({
        token,
        ...dto
    }: UpdateInventoryCircularityDto) {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, UPDATE_ACTION, this.RESOURCES);

            let circularity = await this.getCircularityRaw({ uid: dto.circularityUid });

            let filteredDto = this.accessControlService.filter(dto, attributesFilter);

            Object.assign(circularity, filteredDto);

            const { uid } = await this.circularityRepo.save(circularity);
            circularity = await this.getCircularityRaw({ uid });
            return this.sanitizeResponse(circularity, attributesFilter);
        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    message: 'Cannot update circularity object',
                    messageCode: CANNOT_UPDATE_CIRCULARITY,
                });
        }
    }

    //-----------------------------------------------------------------------

    public async deleteCircularity({
        token,
        ...dto
    }: DeleteInventoryCircularityDto) {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, DELETE_ACTION, this.RESOURCES);

            let circularity = await this.getCircularityRaw({ uid: dto.circularityUid });

            if (circularity) {
                await this.circularityRepo.delete({ uid: circularity.uid });
            }
            return this.sanitizeResponse(circularity, attributesFilter);
        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    code: HttpStatus.BAD_REQUEST,
                    message: 'Cannot delete circularity object',
                    messageCode: CANNOT_DELETE_CIRCULARITY,
                });
        }
    }

}