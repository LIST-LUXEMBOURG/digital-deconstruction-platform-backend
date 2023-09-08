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
} from '../FWAjs-utils';
import { Direction } from '../project/inventory/dto/list-inventory-elements.dto';

import { Element } from '../project/inventory/entities/element.entity';
import { PointOfInterest } from './entities/point-of-interest.entity';
import { RpcException } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';

import {
    POINT_OF_INTEREST,
    OWN_PROJECT_POINT_OF_INTEREST,
    PARTICIPATING_PROJECT_POINT_OF_INTEREST,
} from './accessControl/resourcesName.constants';

import {
    POINT_OF_INTEREST_NOT_FOUND,
    CANNOT_RETRIEVE_POINT_OF_INTEREST,
    CANNOT_UPDATE_POINT_OF_INTEREST,
    CANNOT_DELETE_POINT_OF_INTEREST,
    FAILED_TO_LOOKUP_POINT_OF_INTEREST,
    POINT_OF_INTEREST_ALREADY_EXISTS,
    CANNOT_CREATE_POINT_OF_INTEREST,
    CANNOT_LIST_POINTS_OF_INTEREST
} from './constants/messageCode.constants';

import { ApiAccessControlService } from '../FWAjs-utils/accessControl/accessControl.service';
import { Timeout } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreatePointOfInterestDto } from './dto/create-point-of-interest.dto';
import { UpdatePointOfInterestDto } from './dto/update-point-of-interest.dto';
import { DeletePointOfInterestDto } from './dto/delete-point-of-interest.dto';
import { IndoorViewerPointOfInterest } from './pojo/indoor-viewer-point-of-interest.pojo';
import { BaseService } from '../core/base.service';
import { ResourceTriplet } from '../FWAjs-utils/utils/auth.interface';
import { UpsertPointOfInterestsDto } from './dto/upsert-point-of-interests.dto';
import { PointOfInterestDto } from './dto/point-of-interest.dto';
import { ListPointOfInterestsDto } from './dto/list-point-of-interests.dto';
import { INVENTORY, OWN_PROJECT_INVENTORY, PARTICIPATING_PROJECT_INVENTORY } from '../project/inventory/accessControl/resourcesName.constants';

@Injectable()
export class PointOfInterestService extends BaseService implements OnModuleInit {

    private readonly RESOURCES = <ResourceTriplet>{
        global: POINT_OF_INTEREST,
        owned: OWN_PROJECT_POINT_OF_INTEREST,
        shared: PARTICIPATING_PROJECT_POINT_OF_INTEREST
    };

    private readonly ELEMENT_RESOURCES = <ResourceTriplet>{
        global: INVENTORY,
        owned: OWN_PROJECT_INVENTORY,
        shared: PARTICIPATING_PROJECT_INVENTORY
    };

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //----------------------------------------------------------------------- 

    constructor(
        @InjectRepository(PointOfInterest)
        private readonly pointOfInterestRepo: Repository<PointOfInterest>,

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
            'inventoryElementService',
            'scan3dConfigService'
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

    // private sanititzeQuery(query: any, attributes: any): any {
    //     if (!!query.projectId) {


    //         query["project.id"] = query.projectId
    //         delete query.projectId;
    //     }
    //     return query; //this.accessControlService.filter(query, attributes);
    // }

    //-----------------------------------------------------------------------

    private sanitizeResponse(entity: any, attributes: any): PointOfInterestDto {
        return PointOfInterest.toDto(entity);
    }

    //-----------------------------------------------------------------------

    public async getPointOfInterestRaw({ uid }: { uid: string }): Promise<PointOfInterest> {
        try {
            return await this.pointOfInterestRepo.findOneOrFail({
                where: { uid },
                relations: ['location']
            });
        } catch (error) {
            throw FwaException({
                code: HttpStatus.NOT_FOUND,
                message: 'The point of interest was not found',
                messageCode: POINT_OF_INTEREST_NOT_FOUND,
                messageData: {
                    uid: uid,
                },
            });
        }
    }

    //-----------------------------------------------------------------------

    private async getScan3DConfig(projectId) {
        return await FWACallFct(
            this,
            { srv: 'scan3dConfigService', cmd: 'getScanConfigByProject' },
            {
                projectId: projectId,
            }
        );
    }

    //-----------------------------------------------------------------------

    private async getInventoryElementByUid(uid: string): Promise<Element> {
        return await FWACallFct(
            this,
            { srv: 'inventoryElementService', cmd: 'getInventoryElementRaw' },
            {
                uid: uid,
            }
        );
    }

    //-----------------------------------------------------------------------

    private async getInventoryElementByIfcId(ifcId: string): Promise<Element> {
        return await FWACallFct(
            this,
            { srv: 'inventoryElementService', cmd: 'getInventoryElementByIfcId' },
            {
                ifcId: ifcId,
            }
        );
    }

    //-----------------------------------------------------------------------

    private async getInventoryElementsByPointOfInterest(uid: string): Promise<Element[]> {
        return await FWACallFct(
            this,
            { srv: 'inventoryElementService', cmd: 'getInventoryElementsByPointOfInterest' },
            {
                pointOfInterestUid: uid,
            }
        );
    }

    //-----------------------------------------------------------------------

    private async assignPointOfInterestToElement(elementUid: string, pointOfInterest: PointOfInterest) {
        return await FWACallFct(
            this,
            { srv: 'inventoryElementService', cmd: 'assignPointOfInterest' },
            {
                uid: elementUid,
                pointOfInterest: pointOfInterest
            }
        );
    }

    //-----------------------------------------------------------------------

    private async removePointOfInterestToElement(elementUid: string, pointOfInterest: PointOfInterest) {
        return await FWACallFct(
            this,
            { srv: 'inventoryElementService', cmd: 'removePointOfInterest' },
            {
                uid: elementUid,
                pointOfInterest: pointOfInterest
            }
        );
    }

    //-----------------------------------------------------------------------

    private async pointOfInterestWithNameAlreadyExists(projectId: number, pointOfInterestName: string): Promise<boolean> {
        try {
            let count = 0;
            count = await this.pointOfInterestRepo.count({
                where: {
                    name: pointOfInterestName,
                    project: { id: projectId },
                }
            });
            return (count > 0);
        } catch (error) {
            console.log(error);
            throw FwaException({
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Failed to lookup point of interest',
                messageCode: FAILED_TO_LOOKUP_POINT_OF_INTEREST,
                messageData: { projectId: projectId, name: pointOfInterestName },
            });
        }
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Service API
    //***********************************************************************
    //-----------------------------------------------------------------------

    public async upsertPointOfInterests({ token, ...dto }: UpsertPointOfInterestsDto) {
        let recoveryFromStep;
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, CREATE_ACTION, this.RESOURCES);

            // Step 1: Lookup the projects' Scan3D configuration.

            const scan3DConfig = await this.getScan3DConfig(dto.projectId);

            recoveryFromStep = 'found';

            // Step 2: Parse file content. 

            const jsonObject = JSON.parse(dto.files[0].buffer.toString());

            // Step 3: Delete already exisiting POIs

            await this.pointOfInterestRepo.delete({ project: { id: dto.projectId } });

            let pois = IndoorViewerPointOfInterest.getPointOfInterests(jsonObject, dto.projectId, scan3DConfig);

            let project = await this.getProject(dto.projectId);
            pois.forEach(async poi => {
                let inventoryElement = await this.getInventoryElementByIfcId(poi.elementIfcId);

                let pointOfInterest = this.pointOfInterestRepo.create();
                Object.assign(pointOfInterest, { ...poi });
                pointOfInterest.project = project;

                const { uid } = await this.pointOfInterestRepo.save(pointOfInterest);

                pointOfInterest = await this.getPointOfInterestRaw({ uid });

                await this.assignPointOfInterestToElement(inventoryElement.uid, pointOfInterest);
            })





            console.log(pois);

        } catch (error) {
            console.log('error', error);
        }
    }

    //-----------------------------------------------------------------------

    public async createPointOfInterest({
        token,
        ...dto
    }: CreatePointOfInterestDto): Promise<PointOfInterestDto> {
        try {
            // Check whether user is entitled to update inventory elements (assign point of interest)
            const elementAttributes = await this.filterGrantedAttributesForAction(token, dto.projectId, UPDATE_ACTION, this.ELEMENT_RESOURCES);
            // if (!!elementAttributes.find(attribute => attribute === 'pointOfInterest')) {

            // }

            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, CREATE_ACTION, this.RESOURCES);

            let sanitizedDto = this.accessControlService.filter(dto, attributesFilter);

            const inventoryElement = await this.getInventoryElementByUid(sanitizedDto.elementUid);

            if (await this.pointOfInterestWithNameAlreadyExists(sanitizedDto.projectId, sanitizedDto.name))
                throw FwaException({
                    code: HttpStatus.CONFLICT,
                    message: 'A point of interest with the same name already exists',
                    messageCode: POINT_OF_INTEREST_ALREADY_EXISTS,
                    messageData: {
                        projectId: sanitizedDto.projectId,
                        name: sanitizedDto.name,
                    },
                });

            let pointOfInterest = this.pointOfInterestRepo.create();
            Object.assign(pointOfInterest, { ...sanitizedDto });
            pointOfInterest.project = await this.getProject(dto.projectId);

            const { uid } = await this.pointOfInterestRepo.save(pointOfInterest);

            pointOfInterest = await this.getPointOfInterestRaw({ uid });
            await this.assignPointOfInterestToElement(inventoryElement.uid, pointOfInterest);

            return this.sanitizeResponse(pointOfInterest, attributesFilter);

        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    message: 'Cannot create point of interest',
                    messageCode: CANNOT_CREATE_POINT_OF_INTEREST,
                });
        }
    }

    //-----------------------------------------------------------------------

    public async listPointsOfInterest({
        token,
        ...query
    }: ListPointOfInterestsDto) {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, query.projectId, READ_ACTION, this.RESOURCES);



            // Dynamically build query from properties defined in the given
            // query object. Properties without value (undefined) will be omitted.

            var alias = 'poi';
            var queryBuilder = this.pointOfInterestRepo.createQueryBuilder(alias);

            // Workaround to make sure returned column names match actual property
            // names of Dto. TypeORM prefixes column names with mandatory alias (e.g. 'elm')
            // by default.

            // var column = '';
            // attributesFilter.forEach((attribute) => {
            //     column = `${alias}.${attribute}`;
            //     queryBuilder.addSelect(column, attribute);
            // });

            // Filter only properties of interest, namely those which are part
            // of the authorized attributes and only those for which a value
            // has been specified.

            //            let sanititzedQuery = this.sanititzeQuery(query, attributesFilter);

            let propertiesOfInterest = Object.entries(query).filter(
                ([prop, value]) => {
                    if (
                        attributesFilter.indexOf(prop) >= 0 &&
                        value !== undefined
                    ) {
                        console.log([prop, value]);
                        return [prop, value];
                    }
                },
            );

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
                    queryBuilder.addOrderBy(`"${query.property}"`, 'ASC');
                } else {
                    queryBuilder.addOrderBy(`"${query.property}"`, 'DESC');
                }
            }
            //});

            queryBuilder.loadAllRelationIds();
            console.log(queryBuilder.getQueryAndParameters())
            const count = await queryBuilder.getCount();
            const totalCount = await this.pointOfInterestRepo.count({
                where: {
                    project: { id: query.projectId },
                },
            });
            const results = await queryBuilder.getMany();

            let pointOfInterests: PointOfInterestDto[] = [];

            if (results) {
                pointOfInterests = results.map(result => {
                    return this.sanitizeResponse(result, attributesFilter);
                })
            }

            return {
                data: pointOfInterests,
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
                    message: 'Cannot list points of interest',
                    messageCode: CANNOT_LIST_POINTS_OF_INTEREST,
                });
        }
    }

    //-----------------------------------------------------------------------

    public async updatePointOfInterest({
        token,
        ...dto
    }: UpdatePointOfInterestDto) {
        try {
            // Check whether user is entitled to update inventory elements (assign point of interest)
            const elementAttributes = await this.filterGrantedAttributesForAction(token, dto.projectId, UPDATE_ACTION, this.ELEMENT_RESOURCES);
            // if (!!elementAttributes.find(attribute => attribute === 'pointOfInterest')) {

            // }

            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, UPDATE_ACTION, this.RESOURCES);

            let sanitizedDto = this.accessControlService.filter(dto, attributesFilter);
            let pointOfInterest = await this.getPointOfInterestRaw({ uid: dto.pointOfInterestUid });

            if (sanitizedDto.name !== pointOfInterest.name) {
                if (await this.pointOfInterestWithNameAlreadyExists(dto.projectId, sanitizedDto.name))
                    throw FwaException({
                        code: HttpStatus.CONFLICT,
                        message: 'A point of interest with the same name already exists',
                        messageCode: POINT_OF_INTEREST_ALREADY_EXISTS,
                        messageData: {
                            projectId: sanitizedDto.projectId,
                            name: sanitizedDto.name,
                        },
                    });
            }

            Object.assign(pointOfInterest, { ...sanitizedDto });
            pointOfInterest.project = await this.getProject(dto.projectId);
            const { uid } = await this.pointOfInterestRepo.save(pointOfInterest);

            pointOfInterest = await this.getPointOfInterestRaw({ uid });
            const inventoryElement = await this.getInventoryElementByUid(dto.elementUid);

            let inventoryElements = await this.getInventoryElementsByPointOfInterest(dto.pointOfInterestUid);
            inventoryElements.forEach(async element => {
                if (element.uid !== dto.elementUid) {
                    await this.removePointOfInterestToElement(element.uid, pointOfInterest);
                }
            })
            await this.assignPointOfInterestToElement(inventoryElement.uid, pointOfInterest);

            return this.sanitizeResponse(pointOfInterest, attributesFilter);
        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    message: 'Cannot update point of interest',
                    messageCode: CANNOT_UPDATE_POINT_OF_INTEREST,
                });
        }
    }

    //-----------------------------------------------------------------------

    public async deletePointOfInterest({
        token,
        ...dto
    }: DeletePointOfInterestDto) {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, DELETE_ACTION, this.RESOURCES);

            let pointOfInterest = await this.getPointOfInterestRaw({ uid: dto.pointOfInterestUid });

            let inventoryElements = await this.getInventoryElementsByPointOfInterest(pointOfInterest.uid);
            inventoryElements.forEach(async element => {
                await this.removePointOfInterestToElement(element.uid, pointOfInterest);
            })

            await this.pointOfInterestRepo.delete(pointOfInterest);

            return this.sanitizeResponse(pointOfInterest, attributesFilter);
        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    code: HttpStatus.BAD_REQUEST,
                    message: 'Cannot delete point of interest',
                    messageCode: CANNOT_DELETE_POINT_OF_INTEREST,
                });
        }
    }

    //-----------------------------------------------------------------------

}