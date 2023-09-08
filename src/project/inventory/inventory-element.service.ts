/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import {
    HttpException,
    HttpStatus,
    Injectable,
    OnModuleInit
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
    CREATE_ACTION,
    DELETE_ACTION,
    FWACallFct,
    FwaException,
    onModuleDynamicInit,
    READ_ACTION,
    UPDATE_ACTION
} from '../../FWAjs-utils';
import { ApiAccessControlService } from '../../FWAjs-utils/accessControl/accessControl.service';
import {
    ELEMENT_PROPERTY,
    INVENTORY,
    OWN_PROJECT_ELEMENT_PROPERTY,
    OWN_PROJECT_INVENTORY,
    PARTICIPATING_PROJECT_ELEMENT_PROPERTY,
    PARTICIPATING_PROJECT_INVENTORY
} from './accessControl/resourcesName.constants';
import {
    CANNOT_ADD_PROPERTY_TO_INVENTORY_ELEMENT, CANNOT_ANALYSE_INVENTORY_ELEMENTS, CANNOT_COUNT_INVENTORY_ELEMENTS, CANNOT_CREATE_INVENTORY_ELEMENT, CANNOT_DELETE_INVENTORY_ELEMENT, CANNOT_DELETE_INVENTORY_ELEMENT_PROPERTY, CANNOT_FETCH_INVENTORY_ELEMENT_DEPENDENCIES, CANNOT_LIST_INVENTORY_ELEMENTS, CANNOT_LIST_INVENTORY_ELEMENT_IDENTIFIERS, CANNOT_UPDATE_INVENTORY_ELEMENT, CANNOT_UPDATE_INVENTORY_ELEMENT_PROPERTY, FAILED_TO_ASSIGN_POINT_OF_INTEREST_TO_INVENTORY_ELEMENT, FAILED_TO_LOOKUP_INVENTORY_ELEMENT,
    FAILED_TO_LOOKUP_INVENTORY_ELEMENT_PROPERTY, FAILED_TO_REMOVE_POINT_OF_INTEREST_FROM_INVENTORY_ELEMENT, INVENTORY_ELEMENT_NOT_FOUND
} from './constants/messageCode.constants';

import { CreateInventoryElementDto } from './dto/create-inventory-element.dto';
import { DeleteInventoryElementDto } from './dto/delete-inventory-element.dto';
import { ElementGetOneDto } from './dto/get-one-element.dto';
import { Direction, ListInventoryElementsDto } from './dto/list-inventory-elements.dto';
import { UpdateInventoryElementDto } from './dto/update-inventory-element.dto';

import { ClassTransformOptions, plainToClass } from 'class-transformer';
import { isUUID } from 'class-validator';
import { Circularity } from 'src/circularity/entities/circularity.entity';
import { Clause } from 'src/utils/search/clause';
import { Condition } from 'src/utils/search/condition';
import { Expression } from 'src/utils/search/expression';
import { Join } from 'src/utils/search/join';
import { Operator } from 'src/utils/search/operator';
import { QueryBuilder } from 'src/utils/search/query-builder';
import { Ordering, Select } from 'src/utils/search/select';
import { BaseService } from '../../core/base.service';
import { PropertyType } from '../../core/entities/property-type.entity';
import { PropertyUnit } from '../../core/entities/property-unit.entity';
import { Property } from '../../core/entities/property.entity';
import { ResourceTriplet } from '../../FWAjs-utils/utils/auth.interface';
import { PointOfInterest } from '../../scan/entities/point-of-interest.entity';
import { FAILED_TO_CREATE_PROPERTIES, FAILED_TO_LOOKUP_MATERIAL_TYPE, FAILED_TO_LOOKUP_POINT_OF_INTEREST, INVENTORY_ELEMENT_ALREADY_EXISTS } from '../constants';
import { AddInventoryElementPropertyDto } from './dto/add-inventory-element-property.dto';
import { AnalyseInventoryElementsDto } from './dto/analyse-inventory-elements.dto';
import { DeleteInventoryPropertyDto } from './dto/delete-inventory-property.dto';
import { InventoryElementPropertyDto } from './dto/inventory-element-property.dto';
import { InventoryElementDto } from './dto/inventory-element.dto';
import { ListInventoryElementIdentifiersDto } from './dto/list-inventory-element-identifiers.dto';
import { QueryInventoryElementsDto } from './dto/query-inventory-elements.dto';
import { UpdateInventoryPropertyDto } from './dto/update-inventory-property.dto';
import { ElementType } from './entities/element-type.entity';
import { Element, HazardAssessment, HazardAssessmentStatus, ReuseDecision, SurfaceDamage } from './entities/element.entity';
import { MaterialType } from './entities/material-type.entity';
import { Material } from './entities/material.entity';
import { TreeNode } from 'src/utils/tree/tree';
import { SummariseInventoryElementsByReuseDecisionDto } from './dto/summarise-inventory-elements-by-reuse-decision.dto';
import { InventoryElementSummaryDto } from './dto/inventory-element-summary.dto';
import { ResourceLimits } from 'worker_threads';
import { SummariseInventoryElementsByReusePotentialDto } from './dto/summarise-inventory-elements-by-reuse-potential.dto';

@Injectable()
export class InventoryElementService extends BaseService implements OnModuleInit {

    private readonly RESOURCES = <ResourceTriplet>{
        global: INVENTORY,
        owned: OWN_PROJECT_INVENTORY,
        shared: PARTICIPATING_PROJECT_INVENTORY
    };

    private readonly PROPERTY_RESOURCES = <ResourceTriplet>{
        global: ELEMENT_PROPERTY,
        owned: OWN_PROJECT_ELEMENT_PROPERTY,
        shared: PARTICIPATING_PROJECT_ELEMENT_PROPERTY
    };

    private readonly ELEMENT_PROPERTIES = [
        'uid',
        'projectId',
        'ifcId',
        'revitId',
        'name',
        'description',
        'reusePotential',
        'reuseDecision',
        'surfaceDamage',
        'hazardAssessment',
        'hazardAssessmentStatus',
    ];

    private readonly ELEMENT_DEPENDENCIES: Record<string, string> = {
        elementType: 'etyp',
        properties: 'prop',
        materials: 'mtrl',
        pointOfInterest: 'poit',
        circularities: 'circ'
    };

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //----------------------------------------------------------------------- 

    constructor(
        @InjectRepository(Element)
        private readonly elementRepo: Repository<Element>,

        @InjectRepository(ElementType)
        private readonly elementTypeRepo: Repository<ElementType>,

        @InjectRepository(Material)
        private readonly materialRepo: Repository<Material>,

        @InjectRepository(MaterialType)
        private readonly materialTypeRepo: Repository<MaterialType>,

        @InjectRepository(PointOfInterest)
        private readonly pointOfInterestRepo: Repository<PointOfInterest>,

        @InjectRepository(Property)
        private readonly propertyRepo: Repository<Property>,

        @InjectRepository(PropertyType)
        private readonly propertyTypeRepo: Repository<PropertyType>,

        @InjectRepository(PropertyUnit)
        private readonly propertyUnitRepo: Repository<PropertyUnit>,

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
            'coreService',
            'inventoryElementTypeService',
            'inventoryCircularityService'
        ]);
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Primitives
    //***********************************************************************
    //----------------------------------------------------------------------- 

    private sanitizeResponse(dto: any, attributes: any): InventoryElementDto {
        if (!!dto.project) {
            dto.projectId = dto.project.id; //dto.project.id;
        }
        return this.accessControlService.filter(dto, attributes);
    }

    //----------------------------------------------------------------------- 

    private sanitizePropertyResponse(dto: any, attributes: any): InventoryElementPropertyDto {
        if (!!dto.element) {
            dto.elementUid = dto.element.uid;
        }
        return this.accessControlService.filter(dto, attributes);
    }

    //----------------------------------------------------------------------- 

    public async getInventoryElementRaw({ uid }: { uid: string }): Promise<Element> {
        try {
            return await this.elementRepo.findOneOrFail({
                where: { uid },
                relations: ['project', 'elementType', 'materials', 'properties', 'pointOfInterest', 'circularities'],
            });
        } catch (error) {
            throw FwaException({
                code: HttpStatus.NOT_FOUND,
                message: 'The inventory element was not found',
                messageCode: INVENTORY_ELEMENT_NOT_FOUND,
                messageData: {
                    uid: uid,
                },
            });
        }
    }

    //-----------------------------------------------------------------------

    public async getInventoryElementByIfcId({ ifcId }: { ifcId: string }) {
        try {

            return await this.elementRepo.findOneOrFail({
                where: { ifcId },
                relations: ['project', 'elementType', 'materials', 'properties', 'pointOfInterest', 'circularities'],
            });

        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    message: 'Cannot find inventory element',
                    messageCode: INVENTORY_ELEMENT_NOT_FOUND,
                    messageData: {
                        ifcId
                    }
                });
        }
    }

    //----------------------------------------------------------------------- 

    public async getInventoryElementPropertyRaw({ uid }: { uid: string }): Promise<Property> {
        try {
            return await this.propertyRepo.findOneOrFail({
                where: { uid },
                relations: ['propertyType', 'propertyUnit']
            });
        } catch (error) {
            throw FwaException({
                code: HttpStatus.NOT_FOUND,
                message: 'The inventory element property was not found',
                messageCode: FAILED_TO_LOOKUP_INVENTORY_ELEMENT_PROPERTY,
                messageData: {
                    uid: uid,
                },
            });
        }
    }

    //----------------------------------------------------------------------- 

    public async getInventoryElementsByPointOfInterest({ pointOfInterestUid }: { pointOfInterestUid: string }): Promise<Element[]> {
        try {
            return await this.elementRepo.find(
                { pointOfInterest: { uid: pointOfInterestUid } },
            );
        } catch (error) {
            throw FwaException({
                code: HttpStatus.NOT_FOUND,
                message: 'Failed to lookup inventory elements by point of interest',
                messageCode: FAILED_TO_LOOKUP_INVENTORY_ELEMENT,
                messageData: {
                    pointOfInterestUid: pointOfInterestUid
                },
            });
        }
    }

    //----------------------------------------------------------------------- 

    public async assignPointOfInterest({ uid, pointOfInterest }: { uid: string, pointOfInterest: PointOfInterest }) {
        try {
            await this.elementRepo.update(
                { uid: uid },
                { pointOfInterest: pointOfInterest },
            );
        } catch (error) {
            throw FwaException({
                code: HttpStatus.NOT_FOUND,
                message: 'Failed to assign point of interest to inventory element',
                messageCode: FAILED_TO_ASSIGN_POINT_OF_INTEREST_TO_INVENTORY_ELEMENT,
                messageData: {
                    uid: uid,
                    pointOfInterest: pointOfInterest.uid
                },
            });
        }
    }

    //----------------------------------------------------------------------- 

    public async removePointOfInterest({ uid, pointOfInterest }: { uid: string, pointOfInterest: PointOfInterest }) {
        try {
            await this.elementRepo.update(
                { uid: uid, pointOfInterest: pointOfInterest },
                { pointOfInterest: null }
            );
        } catch (error) {
            throw FwaException({
                code: HttpStatus.NOT_FOUND,
                message: 'Failed to remove point of interest from inventory element',
                messageCode: FAILED_TO_REMOVE_POINT_OF_INTEREST_FROM_INVENTORY_ELEMENT,
                messageData: {
                    uid: uid,
                    pointOfInterest: pointOfInterest.uid
                },
            });
        }
    }

    //----------------------------------------------------------------------- 

    private async inventoryElementExists(uid: string): Promise<boolean> {
        try {
            return await this.elementRepo.count({
                uid,
            }) > 0;
        } catch (error) {
            throw FwaException({
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Failed to lookup inventory element',
                messageCode: FAILED_TO_LOOKUP_INVENTORY_ELEMENT,
                messageData: { uid: uid },
            });
        }
    }

    //-----------------------------------------------------------------------

    private async inventoryElementWithNameAlreadyExists(projectId: number, name: string): Promise<boolean> {
        try {
            return await this.elementRepo.count({
                where: { name: name, project: { id: projectId } },
            }) > 0;
        } catch (error) {
            throw FwaException({
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Failed to lookup project',
                messageCode: FAILED_TO_LOOKUP_INVENTORY_ELEMENT,
                messageData: { projectId: projectId, name: name },
            });
        }
    }

    //-----------------------------------------------------------------------

    private async fetchInventoryMaterials(element: Element): Promise<Material[]> {

        const materials = await this.materialRepo.find({
            where: { element: element.uid },
            loadRelationIds: true,
        })

        if (materials != null) {
            return await Promise.all(materials.map(async (material) => {
                const materialType = await this.materialTypeRepo.findOne({
                    where: { uid: material.materialType },
                    relations: ['circularity']
                })
                material.materialType = materialType;
                return material;
            }));
        }
    }

    //-----------------------------------------------------------------------

    private async fetchInventoryProperties(element: Element): Promise<Property[]> {
        const properties = await this.propertyRepo.find({
            where: { element: element.uid },
            loadRelationIds: true,
        })

        if (properties != null) {
            return await Promise.all(properties.map(async (property) => {
                const propertyType = await this.propertyTypeRepo.findOne({
                    where: { id: property.propertyType },
                    loadRelationIds: false,
                });
                const propertyUnit = await this.propertyUnitRepo.findOne({
                    where: { id: property.propertyUnit },
                    loadRelationIds: false,
                });
                property.propertyType = propertyType;
                property.propertyUnit = propertyUnit;
                return property;
            }));
        }
    }

    //-----------------------------------------------------------------------

    private async lookupElementType(token: any, projectId: number, elementType: Partial<ElementType>): Promise<ElementType> {
        return await FWACallFct(
            this,
            { srv: 'inventoryElementTypeService', cmd: 'getOneElementType' },
            {
                token,
                projectId: projectId,
                elementTypeUid: elementType.uid
            },
        );
    }

    //-----------------------------------------------------------------------

    private async lookupMaterialType(materialType: Partial<MaterialType>): Promise<MaterialType> {
        try {
            return await this.materialTypeRepo.findOne({
                where: { uid: materialType.uid },
                loadRelationIds: true,
            });
        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    message: `Failed to lookup Material Type with Uid ${materialType.uid}!`,
                    messageCode: FAILED_TO_LOOKUP_MATERIAL_TYPE,
                });
        }
    }

    //-----------------------------------------------------------------------

    private async lookupPropertyTypeAndUnitByName(token: any, typeName: string, unitName: string, unitSymbol: string): Promise<[PropertyType, PropertyUnit]> {
        return await FWACallFct(
            this,
            { srv: 'coreService', cmd: 'getOnePropertyTypeAndUnitByName' },
            {
                token,
                typeName: typeName,
                unitName: unitName,
                unitSymbol: unitSymbol
            },
        );
    }

    //-----------------------------------------------------------------------

    private async lookupPropertyTypeAndUnitById(token: any, propertyTypeId: number, propertyUnitId: number): Promise<[PropertyType, PropertyUnit]> {

        return await FWACallFct(
            this,
            { srv: 'coreService', cmd: 'getOnePropertyTypeAndUnitById' },
            {
                token,
                id: propertyTypeId,
                unitId: propertyUnitId
            },
        );
    }

    //-----------------------------------------------------------------------

    private async lookupCircularity(token: any, projectId: number, circularity: Partial<Circularity>): Promise<Circularity> {
        return await FWACallFct(
            this,
            { srv: 'inventoryCircularityService', cmd: 'getOneCircularity' },
            {
                token,
                projectId: projectId,
                circularityUid: circularity.uid
            },
        );
    }

    //-----------------------------------------------------------------------
    // private async lookupPropertyType(propertyType: Partial<PropertyType>, propertyUnit: Partial<PropertyUnit>): Promise<[PropertyType, PropertyUnit]> {
    //     let foundPropertyType: PropertyType = undefined;
    //     let foundPropertyUnit: PropertyUnit = undefined;
    //     let noMatchingUnitFound = false;

    //     try {
    //         if (propertyUnit.name || propertyUnit.symbol) {
    //             foundPropertyType = await this.propertyTypeRepo.findOneOrFail({ where: { name: propertyType.name }, relations: ["propertyUnits"], });
    //             foundPropertyUnit = foundPropertyType.propertyUnits.find(unit => ((unit.name === propertyUnit.name) || (unit.symbol === propertyUnit.symbol)));
    //             noMatchingUnitFound = (foundPropertyUnit == undefined);
    //         } else {
    //             foundPropertyType = await this.propertyTypeRepo.findOneOrFail({ where: { name: propertyType.name } });
    //         }
    //     } catch (error) {
    //         console.log(error);
    //         throw FwaException({
    //             code: HttpStatus.NOT_FOUND,
    //             message: 'Cannot find the property type',
    //             messageCode: CANNOT_FIND_PROPERTY_TYPE,
    //             messageData: { type: propertyType.name },
    //         });
    //     }

    //     // If a unitId was specified and it isn't part of the ones available for the
    //     // the given property type, then raise an error.

    //     if (noMatchingUnitFound) {
    //         throw FwaException({
    //             code: HttpStatus.NOT_FOUND,
    //             message: 'Cannot find the property type with a matching unit',
    //             messageCode: CANNOT_FIND_PROPERTY_TYPE_WITH_MATCHING_UNIT,
    //             messageData: { type: propertyType.name, unitName: propertyUnit.name, unitSymbol: propertyUnit.symbol },
    //         });
    //     }

    //     return [foundPropertyType, foundPropertyUnit];
    // }
    //-----------------------------------------------------------------------

    // private async lookupProperty(property: Partial<Property>): Promise<Property> {
    //     try {
    //         return await this.propertyRepo.findOne({
    //             where: { uid: property.uid },
    //             loadRelationIds: true,
    //         });
    //     } catch (error) {
    //         console.log('error', error);
    //         if (error instanceof HttpException || error instanceof RpcException)
    //             throw error;
    //         else
    //             throw FwaException({
    //                 message: `Failed to lookup Property with Uid ${property.uid}!`,
    //                 messageCode: FAILED_TO_LOOKUP_PROPERTY,
    //             });
    //     }
    // }

    //-----------------------------------------------------------------------

    private async lookupPointOfInterest(pointOfInterest: Partial<PointOfInterest>): Promise<PointOfInterest> {
        try {
            return await this.pointOfInterestRepo.findOne({
                where: { uid: pointOfInterest.uid },
                loadRelationIds: true,
            });
        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    message: `Failed to lookup Point of Interest with Uid ${pointOfInterest.uid}!`,
                    messageCode: FAILED_TO_LOOKUP_POINT_OF_INTEREST,
                });
        }
    }

    //-----------------------------------------------------------------------

    private async createMaterials(projectId: number, materials: Partial<Material>[]): Promise<Material[]> {

        let materialTypes: MaterialType[] = [];
        let materialInstances: Material[] = [];
        if (materials) {
            materialTypes = await Promise.all(materials.map(async material => {
                return await this.lookupMaterialType(material.materialType);
            }));

            const project = await this.getProject(projectId);
            materialInstances = materials.map((mat) => {
                let material: Material;

                function getMaterialType() {
                    if (mat.materialType !== null)
                        return (
                            materialTypes.find(
                                (type) => type.name === mat.materialType.name,
                            ) || null
                        );
                    return null;
                }

                material = {
                    uid: undefined,
                    project: project,
                    mass: mat.mass,
                    volume: mat.volume,
                    materialType: getMaterialType(),
                    element: undefined,
                };

                return material;
            });

            // materialInstances.forEach((instance) => {
            //     this.materialRepo.save(instance);
            // })
        }
        return materialInstances;
    }

    //-----------------------------------------------------------------------

    private async createProperties(token: any, properties: Partial<Property>[]): Promise<Property[]> {

        let propertyTypesAndUnits: [PropertyType, PropertyUnit][] = [];
        let propertyInstances: Property[] = [];

        if (properties) {
            try {

                propertyTypesAndUnits = await Promise.all(properties.map(async property => {
                    if (!!property.propertyUnit) {
                        return await this.lookupPropertyTypeAndUnitByName(token,
                            property.propertyType.name,
                            property.propertyUnit.name,
                            property.propertyUnit.symbol);
                    } else {
                        return await this.lookupPropertyTypeAndUnitByName(token,
                            property.propertyType.name,
                            null,
                            null);
                    }
                }));

                propertyInstances = properties.map((prop) => {
                    let property: Property;

                    function getPropertyTypeAndUnit() {
                        if (prop.propertyType !== null)
                            return (
                                propertyTypesAndUnits.find(
                                    ([type, unit]) => type.name === prop.propertyType.name,
                                ) || null
                            );
                        return null;
                    }

                    property = {
                        uid: undefined,
                        propertyType: getPropertyTypeAndUnit()[0],
                        propertyUnit: getPropertyTypeAndUnit()[1],
                        value: prop.value,
                        element: undefined
                    };

                    if (property.propertyType.isNumeric) {
                        // toNumeric method will throw an error if conversion fails!
                        Property.toNumeric(prop.value);
                    }

                    return property;
                });

                // propertyInstances.forEach((instance) => {
                //     this.propertyRepo.save(instance);
                // })
                return propertyInstances;
            } catch (error) {
                console.log('error', error);
                if (error instanceof HttpException || error instanceof RpcException)
                    throw error;
                else
                    throw FwaException({
                        message: `Failed to create properties!`,
                        messageCode: FAILED_TO_CREATE_PROPERTIES,
                    });
            }

        }
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Service API
    //***********************************************************************
    //-----------------------------------------------------------------------

    public async listInventoryElements({
        token,
        ...query
    }: ListInventoryElementsDto) {
        {
            try {
                const attributesFiltering = await this.filterGrantedAttributesForAction(token, query.projectId, READ_ACTION, this.RESOURCES);

                // Dynamically build query from properties defined in the given
                // query object. Properties without value (undefined) will be omitted.

                var alias = 'elmt';
                var queryBuilder = this.elementRepo.createQueryBuilder(alias);

                let propertiesOfInterest = this.filterQueryProperties(query, attributesFiltering);

                // Dynamically build where clause from properties of interest

                var isFirst = true;
                propertiesOfInterest.forEach(([prop, value]) => {
                    var parameter = 'p_' + prop;
                    var expression;
                    var clause = '';
                    // If type of property is string, then we have to peform
                    // a fuzzy match using the like SQL operator. Otherwise
                    // we're using the equality operator.

                    var isEnum = (Object.values(SurfaceDamage).includes(value)) ||
                        Object.values(ReuseDecision).includes(value) ||
                        Object.values(HazardAssessment).includes(value) ||
                        Object.values(HazardAssessmentStatus).includes(value);

                    var isUuid = isUUID(value);

                    if (isEnum || isUuid) {
                        expression = value;
                        clause = `${alias}.${prop} = :${parameter}`;
                    } else if (typeof value === 'string') {
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
                } else {
                    queryBuilder.addOrderBy(`${alias}.uid`, 'ASC');
                }
                //});

                queryBuilder.loadAllRelationIds();

                const count = await queryBuilder.getCount();
                const totalCount = await this.elementRepo.count({
                    where: {
                        project: { id: query.projectId },
                    },
                });
                const elements = await queryBuilder.getMany();

                let results: InventoryElementDto[] = [];
                if (!!elements) {
                    elements.forEach(element => {
                        results.push(this.sanitizeResponse(element, attributesFiltering));
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
                        message: 'Cannot list inventory elements',
                        messageCode: CANNOT_LIST_INVENTORY_ELEMENTS,
                    });
            }
        }
    }

    //-----------------------------------------------------------------------

    public async countInventoryElements({
        token,
        ...query
    }: QueryInventoryElementsDto) {
        {
            try {
                const attributesFiltering = await this.filterGrantedAttributesForAction(token, query.projectId, READ_ACTION, this.RESOURCES);

                let alias = 'elmt';
                let rootEntity = 'element';

                let clause = this.buildFilterClause(rootEntity, alias, query, attributesFiltering, this.ELEMENT_PROPERTIES, this.ELEMENT_DEPENDENCIES);

                let queryBuilder = new QueryBuilder(this.elementRepo, [clause]);
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
                        message: 'Cannot count inventory elements',
                        messageCode: CANNOT_COUNT_INVENTORY_ELEMENTS,
                    });
            }
        }
    }

    //-----------------------------------------------------------------------

    public async queryInventoryElements({
        token,
        ...query
    }: QueryInventoryElementsDto) {
        {
            try {
                const attributesFiltering = await this.filterGrantedAttributesForAction(token, query.projectId, READ_ACTION, this.RESOURCES);

                let alias = 'elmt';
                let rootEntity = 'element';

                let clause = this.buildFilterClause(rootEntity, alias, query, attributesFiltering, this.ELEMENT_PROPERTIES, this.ELEMENT_DEPENDENCIES);

                let queryBuilder = new QueryBuilder(this.elementRepo, [clause]);
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
                const totalCount = await this.elementRepo.count({
                    where: {
                        project: { id: query.projectId },
                    },
                });
                const elements = await ormQuery.getMany();

                let results: InventoryElementDto[] = [];
                if (!!elements) {
                    elements.forEach(element => {
                        results.push(this.sanitizeResponse(element, attributesFiltering));
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
                        message: 'Cannot list inventory elements',
                        messageCode: CANNOT_LIST_INVENTORY_ELEMENTS,
                    });
            }
        }
    }

    //-----------------------------------------------------------------------

    public async listInventoryElementIdentifiers({
        token,
        ...dto
    }: ListInventoryElementIdentifiersDto) {
        {
            try {
                const attributesFiltering = await this.filterGrantedAttributesForAction(token, dto.projectId, READ_ACTION, this.RESOURCES);

                const elements = await this.elementRepo
                    .createQueryBuilder('elmt')
                    .select('elmt.uid', 'uid')
                    .addSelect('elmt.ifcId', 'ifcId')
                    .addSelect('elmt.revitId', 'revitId')
                    .addSelect('elmt.reusePotential', 'reusePotential')
                    .where('elmt.projectId = :projectId', { projectId: dto.projectId })
                    .getRawMany();

                return {
                    data: elements,
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
                        message: 'Cannot list inventory element identifiers',
                        messageCode: CANNOT_LIST_INVENTORY_ELEMENT_IDENTIFIERS,
                    });
            }
        }
    }

    //-----------------------------------------------------------------------

    // public async getInventoryElementByIfcId({
    //     token,
    //     ...dto
    // }: ElementGetOneByIfcIdDto) {
    //     try {
    //         const attributesFiltering = await this.filterGrantedAttributesForAction(token, dto.projectId, READ_ACTION, this.RESOURCES);

    //         let element = await this.elementRepo.findOneOrFail({
    //             where: { ifcId: dto.elementIfcId },
    //             relations: ['elementType', 'materials', 'properties', 'pointOfInterest'],
    //         });

    //         return this.sanitizeResponse(element, attributesFiltering)

    //     } catch (error) {
    //         console.log('error', error);
    //         if (error instanceof HttpException || error instanceof RpcException)
    //             throw error;
    //         else
    //             throw FwaException({
    //                 message: 'Cannot find inventory element',
    //                 messageCode: INVENTORY_ELEMENT_NOT_FOUND,
    //                 messageData: {
    //                     projectId: dto.projectId,
    //                     ifcId: dto.elementIfcId
    //                 }
    //             });
    //     }
    // }

    //-----------------------------------------------------------------------

    public async createInventoryElement({
        token,
        ...dto
    }: CreateInventoryElementDto) {
        try {
            const attributesFiltering = await this.filterGrantedAttributesForAction(token, dto.projectId, CREATE_ACTION, this.RESOURCES);

            // If so, then throw an error
            if (await this.inventoryElementWithNameAlreadyExists(dto.projectId, dto.name))
                throw FwaException({
                    code: HttpStatus.CONFLICT,
                    message:
                        'An inventory element with the same name already exists!',
                    messageCode: INVENTORY_ELEMENT_ALREADY_EXISTS,
                    messageData: {
                        name: dto.name,
                    },
                });



            let element = this.elementRepo.create();
            let filteredDto = this.accessControlService.filter(dto, attributesFiltering);

            Object.assign(element, filteredDto);

            element.project = await this.getProject(dto.projectId);

            // Lookup the existing element type if property was specified.
            let elementType: ElementType = undefined;
            if (filteredDto.elementType) {
                elementType = await this.lookupElementType(token, dto.projectId, filteredDto.elementType);
                element.elementType = elementType;
            }

            // Lookup the existing material types and create new materials
            // if corresponding property was specifed.

            let materials: Material[] = [];
            if (filteredDto.materials) {
                materials = await this.createMaterials(dto.projectId, filteredDto.materials);
            }
            element.materials = materials;

            // Lookup the existing element properties and create new properties
            // if corresponding property was specifed.

            let properties: Property[] = [];
            if (filteredDto.properties) {
                properties = await this.createProperties(token, filteredDto.properties);
            }
            element.properties = properties;

            // Lookup the existing point of interest if property was specified.
            let pointOfInterest: PointOfInterest = undefined;
            if (filteredDto.pointOfInterest) {
                pointOfInterest = await this.lookupPointOfInterest(filteredDto.pointOfInterest);
                element.pointOfInterest = pointOfInterest;
            }

            const { uid } = await this.elementRepo.save(element);

            element = await this.getInventoryElementRaw({ uid });

            return this.sanitizeResponse(element, attributesFiltering);

        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    message: 'Cannot create inventory element',
                    messageCode: CANNOT_CREATE_INVENTORY_ELEMENT,
                });
        }
    }

    //-----------------------------------------------------------------------

    public async fetchInventoryElementDependencies({
        token,
        ...dto
    }: ElementGetOneDto) {
        try {
            //const project = await this.getProject(dto.projectId);

            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, READ_ACTION, this.RESOURCES);
            const inventoryElement = await this.getInventoryElementRaw({ uid: dto.elementUid });

            if (inventoryElement.elementType)
                inventoryElement.elementType = await this.lookupElementType(token, dto.projectId, inventoryElement.elementType);
            if (inventoryElement.materials)
                inventoryElement.materials = await this.fetchInventoryMaterials(inventoryElement);
            if (inventoryElement.properties)
                inventoryElement.properties = await this.fetchInventoryProperties(inventoryElement);
            if (inventoryElement.pointOfInterest)
                inventoryElement.pointOfInterest = await this.lookupPointOfInterest(inventoryElement.pointOfInterest);
            if (inventoryElement.circularities) {
                let circularites: Circularity[] = [];
                circularites = await Promise.all(inventoryElement.circularities.map(async circularityUid => {
                    return await this.lookupCircularity(token, dto.projectId, circularityUid)
                }));
                inventoryElement.circularities = circularites;
            }

            return this.sanitizeResponse(inventoryElement, attributesFilter);
        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    message: 'Cannot fetch inventory element dependencies',
                    messageCode: CANNOT_FETCH_INVENTORY_ELEMENT_DEPENDENCIES,
                });
        }
    }

    // ----------------------------------------------------------------------

    public async getInventoryElementsAnalysis({
        token,
        ...dto }: AnalyseInventoryElementsDto) {
        try {
            const typesCount = await this.elementRepo
                .createQueryBuilder('m')
                .select('m.elementTypeUid', 'uid')
                .addSelect('COUNT(m.elementTypeUid)', 'count')
                .addSelect('SUM(m.reusePotential)', 'sumReusePotential')
                .addSelect('MIN(m.reusePotential)', 'minReusePotential')
                .addSelect('MAX(m.reusePotential)', 'maxReusePotential')
                .addSelect("COUNT (case WHEN m.reuseDecision = 'backfilling' then 1 else null end)", 'decisionBackfillingCount')
                .addSelect("COUNT (case WHEN m.reuseDecision = 'recycling' then 1 else null end)", 'decisionRecyclingCount')
                .addSelect("COUNT (case WHEN m.reuseDecision = 'reuse' then 1 else null end)", 'decisionReuseCount')
                .addSelect("COUNT (case WHEN m.reuseDecision = 'undefined' then 1 else null end)", 'decisionUndefinedCount')
                .addSelect("COUNT (case WHEN m.reusePotential = 0 then 1 else null end)", 'potentialUndefinedCount')
                .addSelect("COUNT (case WHEN m.reusePotential > 0 AND m.reusePotential <  0.4 then 1 else null end)", 'potentialBackfillingCount')
                .addSelect("COUNT (case WHEN m.reusePotential >= 0.4 AND m.reusePotential < 0.7 then 1 else null end)", 'potentialRecyclingCount')
                .addSelect("COUNT (case WHEN m.reusePotential >= 0.7 then 1 else null end)", 'potentialReuseCount')
                .where('m.projectId = :projectId', { projectId: dto.projectId })
                .groupBy('m.elementTypeUid')
                .getRawMany();

            const nonTypesCount = await this.elementRepo
                .createQueryBuilder('m')
                .addSelect("COUNT (case WHEN m.reuseDecision = 'backfilling' then 1 else null end)", 'decisionBackfillingCount')
                .addSelect("COUNT (case WHEN m.reuseDecision = 'recycling' then 1 else null end)", 'decisionRecyclingCount')
                .addSelect("COUNT (case WHEN m.reuseDecision = 'reuse' then 1 else null end)", 'decisionReuseCount')
                .addSelect("COUNT (case WHEN m.reuseDecision = 'undefined' then 1 else null end)", 'decisionUndefinedCount')
                .addSelect("COUNT (case WHEN m.reusePotential = 0 then 1 else null end)", 'potentialUndefinedCount')
                .addSelect("COUNT (case WHEN m.reusePotential > 0 AND m.reusePotential <  0.4 then 1 else null end)", 'potentialBackfillingCount')
                .addSelect("COUNT (case WHEN m.reusePotential >= 0.4 AND m.reusePotential < 0.7 then 1 else null end)", 'potentialRecyclingCount')
                .addSelect("COUNT (case WHEN m.reusePotential >= 0.7 then 1 else null end)", 'potentialReuseCount')
                .where('m.projectId = :projectId', { projectId: dto.projectId })
                .andWhere('m.elementTypeUid IS NULL')
                .groupBy('m.uid')
                .getRawMany();


            const baseTypes = await this.elementTypeRepo.find({
                where: {
                    project: { id: dto.projectId },
                },
            });

            let decisionBackfillingCount = 0;
            let decisionRecyclingCount = 0;
            let decisionReuseCount = 0;
            let decisionUndefinedCount = 0;
            let potentialBackfillingCount = 0;
            let potentialRecyclingCount = 0;
            let potentialReuseCount = 0;
            let potentialUndefinedCount = 0;

            //            const types = await Promise.all(
            const types = baseTypes.map(type => {
                const index = typesCount.findIndex(
                    (tc) => tc.uid === type.uid,
                );

                let count = 0;
                let averageReusePotential = '0.00';
                let maxReusePotential = 0;
                let minReusePotential = 0;


                if (index >= 0) {
                    averageReusePotential = (typesCount[index].sumReusePotential / typesCount[index].count).toFixed(2);
                    maxReusePotential = (typesCount[index].maxReusePotential);
                    minReusePotential = (typesCount[index].minReusePotential);
                    decisionBackfillingCount += parseInt(typesCount[index].decisionBackfillingCount);
                    decisionRecyclingCount += parseInt(typesCount[index].decisionRecyclingCount);
                    decisionReuseCount += parseInt(typesCount[index].decisionReuseCount);
                    decisionUndefinedCount += parseInt(typesCount[index].decisionUndefinedCount);
                    potentialBackfillingCount += parseInt(typesCount[index].potentialBackfillingCount);
                    potentialRecyclingCount += parseInt(typesCount[index].potentialRecyclingCount);
                    potentialReuseCount += parseInt(typesCount[index].potentialReuseCount);
                    potentialUndefinedCount += parseInt(typesCount[index].potentialUndefinedCount);
                    count = parseInt(typesCount[index].count);
                }

                return {
                    minReusePotential,
                    averageReusePotential,
                    maxReusePotential,
                    ...type,
                    count,
                };
            });

            nonTypesCount.forEach((nonType) => {
                decisionBackfillingCount += parseInt(nonType.decisionBackfillingCount);
                decisionRecyclingCount += parseInt(nonType.decisionRecyclingCount);
                decisionReuseCount += parseInt(nonType.decisionReuseCount);
                decisionUndefinedCount += parseInt(nonType.decisionUndefinedCount);
                potentialBackfillingCount += parseInt(nonType.potentialBackfillingCount);
                potentialRecyclingCount += parseInt(nonType.potentialRecyclingCount);
                potentialReuseCount += parseInt(nonType.potentialReuseCount);
                potentialUndefinedCount += parseInt(nonType.potentialUndefinedCount);
            })

            // the total number of elements, if you want the total number of types replace elementRepo by elementTypeRepo
            const count = await this.elementRepo.count({
                where: { project: { id: dto.projectId } },
            });

            // const backfillingCount = await this.elementRepo.count({
            //     where: {
            //         project: { id: dto.projectId },
            //         reuseDecision: ReuseDecision.BACKFILLING
            //     }
            // });

            // const recyclingCount = await this.elementRepo.count({
            //     where: {
            //         project: { id: dto.projectId },
            //         reuseDecision: ReuseDecision.RECYCLING
            //     }
            // });

            // const reuseCount = await this.elementRepo.count({
            //     where: {
            //         project: { id: dto.projectId },
            //         reuseDecision: ReuseDecision.REUSE
            //     }
            // });




            return {
                types, count,
                decisionBackfillingCount, decisionRecyclingCount, decisionReuseCount, decisionUndefinedCount,
                potentialBackfillingCount, potentialRecyclingCount, potentialReuseCount, potentialUndefinedCount
            };
        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    code: HttpStatus.BAD_REQUEST,
                    message: 'Cannot get element analysis',
                    messageCode: CANNOT_ANALYSE_INVENTORY_ELEMENTS,
                });
        }
    }

    //-----------------------------------------------------------------------

    public async getInventorElementsReuseDecisionSummary({
        token,
        ...dto }: SummariseInventoryElementsByReuseDecisionDto) {
        try {
            const results = await this.elementRepo
                .createQueryBuilder('e')
                .select('COUNT(e.uid)', 'count')
                .addSelect('e.reuseDecision', 'reuseDecision')
                .innerJoin('e.materials', 'material')
                .addSelect('SUM(material.mass)', 'sumMass')
                .addSelect('SUM(material.volume)', 'sumVolume')
                .where('e.projectId = :projectId', { projectId: dto.projectId })
                .groupBy('e.reuseDecision')
                .getRawMany();

            let summary: InventoryElementSummaryDto[] = new Array();

            results.forEach(result => {
                ;
                let dto = new InventoryElementSummaryDto();
                dto = Object.assign(dto, {
                    reuseDecision: result.reuseDecision,
                    count: result.count,
                    totalVolume: result.sumVolume,
                    totalMass: result.sumMass
                });

                summary.push(dto);
            })

            return summary;
        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    code: HttpStatus.BAD_REQUEST,
                    message: 'Cannot get element reuse decision summary',
                    messageCode: CANNOT_ANALYSE_INVENTORY_ELEMENTS,
                });
        }
    }

    //-----------------------------------------------------------------------

    public async getInventorElementsReusePotentialSummary({
        token,
        ...dto }: SummariseInventoryElementsByReusePotentialDto) {
        try {
            const results = await this.elementRepo
                .createQueryBuilder('e')
                .select('COUNT(e.uid)', 'count')
                .addSelect('(case WHEN e.reusePotential = 0 then \'' + ReuseDecision.UNDEFINED + '\' else' +
                    '(case WHEN e.reusePotential > 0 AND e.reusePotential < 0.4 then \'' + ReuseDecision.BACKFILLING + '\' else ' +
                    '(case WHEN e.reusePotential >= 0.4 AND e.reusePotential < 0.7 then \'' + ReuseDecision.RECYCLING + '\' else \'' + ReuseDecision.REUSE + '\' end) end) end)', 'potential')
                .innerJoin('e.materials', 'material')
                .addSelect('SUM(material.mass)', 'sumMass')
                .addSelect('SUM(material.volume)', 'sumVolume')
                .where('e.projectId = :projectId', { projectId: dto.projectId })
                .groupBy('potential')
                .getRawMany();

            let summary: InventoryElementSummaryDto[] = new Array();

            results.forEach(result => {
                let dto = new InventoryElementSummaryDto();
                dto = Object.assign(dto, {
                    reuseDecision: result.potential,
                    count: result.count,
                    totalVolume: result.sumVolume,
                    totalMass: result.sumMass
                });

                summary.push(dto);
            })

            return summary;
        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    code: HttpStatus.BAD_REQUEST,
                    message: 'Cannot get element reuse potential summary',
                    messageCode: CANNOT_ANALYSE_INVENTORY_ELEMENTS,
                });
        }
    }

    //-----------------------------------------------------------------------

    public async updateInventoryElement({
        token,
        ...dto
    }: UpdateInventoryElementDto) {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, UPDATE_ACTION, this.RESOURCES);

            let sanitizedDto = this.accessControlService.filter(dto, attributesFilter);

            console.log(sanitizedDto);

            let inventoryElement = await this.getInventoryElementRaw({ uid: dto.elementUid });

            let { elementType, materials, properties, pointOfInterest, ...fields } = sanitizedDto;

            Object.assign(inventoryElement, { ...fields });

            // Lookup the existing element type if property was specified.
            elementType = undefined;
            if (dto.elementType) {
                elementType = await this.lookupElementType(token, dto.projectId, sanitizedDto.elementType);
                inventoryElement.elementType = elementType;
            }

            // Lookup the existing material types and create new materials
            // if corresponding property was specifed.

            materials = [];
            if (dto.materials) {
                let newMaterials = dto.materials.filter((material) => !isUUID(material.uid));
                let existingMaterials = dto.materials.filter((material) => isUUID(material.uid));
                materials = await this.createMaterials(dto.projectId, newMaterials);
                existingMaterials.forEach((exisiting) => materials.push(exisiting));
            }
            inventoryElement.materials = materials;

            // Lookup the existing element properties and create new properties
            // if corresponding property was specifed.

            properties = [];
            if (dto.properties) {
                let newProperties = dto.properties.filter((property) => !isUUID(property.uid));
                let existingProperties = dto.properties.filter((property) => isUUID(property.uid));
                properties = await this.createProperties(token, newProperties);
                existingProperties.forEach((exisiting) => properties.push(exisiting));
            }
            inventoryElement.properties = properties;

            // Lookup the existing point of interest if property was specified.
            pointOfInterest = undefined;
            if (dto.pointOfInterest) {
                pointOfInterest = await this.lookupPointOfInterest(dto.pointOfInterest);
            }
            inventoryElement.pointOfInterest = pointOfInterest;

            console.log(inventoryElement);

            // Update the element
            await this.elementRepo.save(inventoryElement);

            return await this.fetchInventoryElementDependencies({ token, elementUid: dto.elementUid, projectId: dto.projectId });
        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    message: 'Cannot update inventory element',
                    messageCode: CANNOT_UPDATE_INVENTORY_ELEMENT,
                });
        }
    }

    //-----------------------------------------------------------------------

    // public async addMaterialToElement({
    //     token,
    //     ...dto
    // }: AddInventoryElementMaterialDto) {
    //     try {
    //         const attributesFiltering = await this.filterGrantedAttributesForAction(token, dto.projectId, UPDATE_ACTION, this.RESOURCES);

    //         // Check if the element exits.
    //         const inventoryElement = await this.getInventoryElementRaw({ uid: dto.elementUid });

    //         dto.materials.forEach(async function (material) {
    //             const inventoryMaterial = await this.materialRepo.findOne({
    //                 where: { uid: material.materialUid },
    //             });

    //             if (!inventoryMaterial)
    //                 throw FwaException({
    //                     code: HttpStatus.NOT_FOUND,
    //                     message: 'The material was not found',
    //                     messageCode: INVENTORY_MATERIAL_NOT_FOUND,
    //                     messageData: {
    //                         uid: dto.elementUid,
    //                     },
    //                 });

    //             inventoryElement.materials.push(inventoryMaterial);
    //         });

    //         // Update the element
    //         await this.elementRepo.save(inventoryElement);
    //         const result = await this.getInventoryElementRaw({ uid: dto.elementUid });

    //         return this.accessControlService.filter(
    //             result,
    //             attributesFiltering,
    //         );
    //     } catch (error) {
    //         console.log('error', error);
    //         if (error instanceof HttpException || error instanceof RpcException)
    //             throw error;
    //         else
    //             throw FwaException({
    //                 message: 'Cannot add material to inventory element',
    //                 messageCode: CANNOT_ADD_MATERIAL_TO_INVENTORY_ELEMENT,
    //             });
    //     }
    // }

    //-----------------------------------------------------------------------

    public async addPropertyToInventoryElement({
        token,
        projectId,
        propertyTypeId,
        propertyUnitId,
        elementUid,
        ...payload
    }: AddInventoryElementPropertyDto) {
        try {
            const attributesFiltering = await this.filterGrantedAttributesForAction(token, projectId, UPDATE_ACTION, this.RESOURCES);

            // Get the element.
            const element = await this.getInventoryElementRaw({ uid: elementUid });

            const [propertyType, propertyUnit] = await this.lookupPropertyTypeAndUnitById(token, propertyTypeId, propertyUnitId);

            //const propertyUnit = propertyType.propertyUnits.find(unit => unit.id === propertyUnitId);

            let property = this.propertyRepo.create(payload);
            property.propertyType = propertyType;
            property.propertyUnit = propertyUnit;
            property = await this.propertyRepo.save(property);

            // Get the specified property type. If it's not found, the coreService will raise en Exception

            element.properties.push(property);
            return await this.elementRepo.save(element);
        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    message: 'Cannot add property to inventory element',
                    messageCode: CANNOT_ADD_PROPERTY_TO_INVENTORY_ELEMENT,
                });
        }
    }

    //-----------------------------------------------------------------------

    public async updateInventoryElementProperty({
        token,
        ...dto
    }: UpdateInventoryPropertyDto) {
        try {
            const attributesFiltering = await this.filterGrantedAttributesForAction(token, dto.projectId, UPDATE_ACTION, this.PROPERTY_RESOURCES);

            let property = await this.getInventoryElementPropertyRaw({ uid: dto.propertyUid });

            let filteredDto = this.accessControlService.filter(dto, attributesFiltering);

            let propertyType: PropertyType;
            let propertyUnit: PropertyUnit;

            [propertyType, propertyUnit] = await this.lookupPropertyTypeAndUnitById(token, dto.propertyTypeId, dto.propertyUnitId);

            Object.assign(property, { ...filteredDto });

            property.propertyType = propertyType;
            property.propertyUnit = propertyUnit;

            await this.propertyRepo.save(property);
            property = await this.getInventoryElementPropertyRaw({ uid: property.uid });
            return this.sanitizePropertyResponse(property, attributesFiltering);
        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    message: 'Cannot update inventory element property',
                    messageCode: CANNOT_UPDATE_INVENTORY_ELEMENT_PROPERTY,
                });
        }
    }

    //-----------------------------------------------------------------------

    public async deleteInventoryElementProperty({
        token,
        ...dto
    }: DeleteInventoryPropertyDto) {
        try {
            const attributesFiltering = await this.filterGrantedAttributesForAction(token, dto.projectId, UPDATE_ACTION, this.PROPERTY_RESOURCES);

            let property = await this.getInventoryElementPropertyRaw({ uid: dto.propertyUid });

            await this.propertyRepo.delete(property);
            return this.sanitizePropertyResponse(property, attributesFiltering);
        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    code: HttpStatus.BAD_REQUEST,
                    message: 'Cannot delete inventory element property',
                    messageCode: CANNOT_DELETE_INVENTORY_ELEMENT_PROPERTY,
                });
        }
    }

    //-----------------------------------------------------------------------

    public async deleteInventoryElement({
        token,
        elementUid,
        projectId,
    }: DeleteInventoryElementDto) {
        try {
            const attributesFiltering = await this.filterGrantedAttributesForAction(token, projectId, DELETE_ACTION, this.RESOURCES);

            // Check if the element exits.
            const elementExists = await this.elementRepo.findOne({
                where: { uid: elementUid },
            });

            if (!elementExists)
                throw FwaException({
                    code: HttpStatus.NOT_FOUND,
                    message: 'The inventory element was not found',
                    messageCode: INVENTORY_ELEMENT_NOT_FOUND,
                    messageData: { uid: elementUid },
                });

            // Get the element before deletion
            const inventoryElement = await this.elementRepo.findOne({
                where: { uid: elementUid },
                loadRelationIds: true,
            });
            await this.elementRepo.delete(elementUid);
            return this.sanitizeResponse(inventoryElement, attributesFiltering);
        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    code: HttpStatus.BAD_REQUEST,
                    message: 'Cannot delete inventory element',
                    messageCode: CANNOT_DELETE_INVENTORY_ELEMENT,
                });
        }
    }

    //-----------------------------------------------------------------------
}
