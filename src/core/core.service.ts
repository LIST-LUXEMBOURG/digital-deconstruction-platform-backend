/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { ClassificationSystem } from './entities/classification-system.entity';
import { ClassificationEntry } from './entities/classification-entry.entity';
import { HttpException, HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository, TreeRepository } from 'typeorm';
import { Direction } from './dto/classification-systems.dto';
import { JwtService } from '@nestjs/jwt';
import { ApiAccessControlService } from '../FWAjs-utils/accessControl/accessControl.service';
import { dispatchACDBs, FwaException, onModuleDynamicInit, READ_ACTION } from '../FWAjs-utils';
import { CLASSIFICATION_ENTRY, CLASSIFICATION_SYSTEM, PROPERTY_TYPE, PROPERTY_UNIT } from './accessControl/resourcesName.constants';
import { RpcException } from '@nestjs/microservices';
import { Timeout } from '@nestjs/schedule';
import { ModuleRef } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClassificationEntriesDto } from './dto/classification-entries.dto';
import { CANNOT_CREATE_PROPERTY_TYPE, CANNOT_FIND_CLASSIFICATION_ENTRY, CANNOT_FIND_PROPERTY_TYPE, CANNOT_FIND_PROPERTY_TYPE_WITH_MATCHING_UNIT, PROPERTY_TYPE_ALREADY_EXISTS } from './constants/messageCode.constants';
import { ClassificationEntryGetOneDto } from './dto/get-one-classifcation-entry.dto';
import { ClassificationEntryByCodeParamsDto } from './dto/get-classification-entry-by-code.dto';
import { PropertyUnit } from './entities/property-unit.entity';
import { PropertyType } from './entities/property-type.entity';
import { PropertyTypeByNameParamsDto } from './dto/get-property-type-by-name.dto';
import { PropertyTypeGetOneByIdDto } from './dto/get-one-property-type-by-id.dto';
import { PropertyTypeGetOneByNameDto } from './dto/get-one-property-type-by-name.dto';
import { CreatePropertyTypeDto } from './dto/create-property-type.dto';
import { ClassificationEntryDto } from './dto/classification-entry.dto';

@Injectable()
export class CoreService implements OnModuleInit {
    constructor(
        @InjectRepository(ClassificationSystem)
        private readonly classificationSystemRepo: TreeRepository<ClassificationSystem>,

        @InjectRepository(ClassificationEntry)
        private readonly classificationEntryRepo: Repository<ClassificationEntry>,

        @InjectRepository(PropertyUnit)
        private readonly propertyUnitRepo: TreeRepository<PropertyUnit>,

        @InjectRepository(PropertyType)
        private readonly propertyTypeRepo: Repository<PropertyType>,

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
        await onModuleDynamicInit(this, null, null);
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

    private sanitizeResponse(entity: any, attributes: any): ClassificationEntryDto {
        let dto = ClassificationEntry.toDto(entity);
        let filtered = this.accessControlService.filter(dto, attributes);
        return filtered;
    }

    //-----------------------------------------------------------------------

    private async sanitizeOnRead(token, resource: string) {
        const tokenPayload = await this.jwtService.verifyAsync(token);

        const permissions = this.accessControlService.getGrantedPermissions(
            tokenPayload.user.roles,
            [
                { action: READ_ACTION, resource },
            ],
        );

        let allApplicableAttributes =
            permissions.find((p) => p.resource === resource).attributes || [];

        if (allApplicableAttributes.length === 0)
            // Not allowed to read inventory elements
            throw FwaException({
                code: HttpStatus.FORBIDDEN,
                message:
                    `Not allowed to list objects of type ${resource}`,
                messageCode: 'readClassificationSystemsNotAllowed',
            });

        return allApplicableAttributes;
    }

    //-----------------------------------------------------------------------

    public async getOneClassificationEntry(getOnePayload: ClassificationEntryGetOneDto): Promise<ClassificationEntry> {
        const { token, id } = getOnePayload;
        try {
            return await this.classificationEntryRepo.findOneOrFail({ where: { id: id }, loadRelationIds: false, });
        } catch (error) {
            console.log(error);
            throw FwaException({
                code: HttpStatus.NOT_FOUND,
                message: 'Cannot find the classification entry',
                messageCode: CANNOT_FIND_CLASSIFICATION_ENTRY,
                messageData: { entryId: id },
            });
        }
    }

    //-----------------------------------------------------------------------

    public async getOnePropertyTypeAndUnitById(getOnePayload: PropertyTypeGetOneByIdDto): Promise<[PropertyType, PropertyUnit]> {
        const { token, id, unitId } = getOnePayload;
        let propertyType: PropertyType = undefined;
        let propertyUnit: PropertyUnit = undefined;
        let noMatchingUnitFound = false;
        try {
            if (unitId) {
                propertyType = await this.propertyTypeRepo.findOneOrFail({ where: { id: id }, relations: ["propertyUnits"], });
                propertyUnit = propertyType.propertyUnits.find(unit => unit.id === unitId);
                noMatchingUnitFound = (propertyUnit == undefined);
            } else {
                propertyType = await this.propertyTypeRepo.findOneOrFail({ where: { id: id } });
            }
        } catch (error) {
            console.log(error);
            throw FwaException({
                code: HttpStatus.NOT_FOUND,
                message: 'Cannot find the property type',
                messageCode: CANNOT_FIND_PROPERTY_TYPE,
                messageData: { type: id },
            });
        }

        // If a unitId was specified and it isn't part of the ones available for the
        // the given property type, then raise an error.

        if (noMatchingUnitFound) {
            throw FwaException({
                code: HttpStatus.NOT_FOUND,
                message: 'Cannot find the property type with a matching unit',
                messageCode: CANNOT_FIND_PROPERTY_TYPE_WITH_MATCHING_UNIT,
                messageData: { type: id, unitId: unitId },
            });
        }

        return [propertyType, propertyUnit];
    }

    //-----------------------------------------------------------------------

    public async getOnePropertyTypeAndUnitByName(getOnePayload: PropertyTypeGetOneByNameDto): Promise<[PropertyType, PropertyUnit]> {
        const { token, typeName, unitName, unitSymbol } = getOnePayload;
        let propertyType: PropertyType = undefined;
        let propertyUnit: PropertyUnit = undefined;
        let noMatchingUnitFound = false;
        try {
            if (unitName || unitSymbol) {
                propertyType = await this.propertyTypeRepo.findOneOrFail({ where: { name: typeName }, relations: ["propertyUnits"], });
                propertyUnit = propertyType.propertyUnits.find(unit => ((unit.name === unitName) || (unit.symbol === unitSymbol)));
                noMatchingUnitFound = (propertyUnit == undefined);
            } else {
                propertyType = await this.propertyTypeRepo.findOneOrFail({ where: { name: typeName } });
            }
        } catch (error) {
            console.log(error);
            throw FwaException({
                code: HttpStatus.NOT_FOUND,
                message: 'Cannot find the property type',
                messageCode: CANNOT_FIND_PROPERTY_TYPE,
                messageData: { type: typeName },
            });
        }

        // If a unitId was specified and it isn't part of the ones available for the
        // the given property type, then raise an error.

        if (noMatchingUnitFound) {
            throw FwaException({
                code: HttpStatus.NOT_FOUND,
                message: 'Cannot find the property type with a matching unit',
                messageCode: CANNOT_FIND_PROPERTY_TYPE_WITH_MATCHING_UNIT,
                messageData: { type: typeName, unitName: unitName, unitSymbol: unitSymbol },
            });
        }

        return [propertyType, propertyUnit];
    }
    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Service API
    //***********************************************************************
    //-----------------------------------------------------------------------

    public async getClassificationSystems({
        token
    }) {
        {
            try {
                const attributesFiltering = await this.sanitizeOnRead(
                    token,
                    CLASSIFICATION_SYSTEM
                );

                const systems = await this.classificationSystemRepo.findTrees();

                return {
                    data: this.accessControlService.filter(
                        systems,
                        attributesFiltering,
                    ),
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
                        message: 'Cannot retrieve classification systems',
                        messageCode: 'cannotRetrieveClassificationSystems',
                    });
            }
        }
    }

    //-----------------------------------------------------------------------

    public async getClassificationEntries({
        token,
        ...query
    }: ClassificationEntriesDto) {
        {
            try {
                const attributesFiltering = await this.sanitizeOnRead(
                    token,
                    CLASSIFICATION_ENTRY
                );

                // Dynamically build query from properties defined in the given
                // query object. Properties without value (undefined) will be omitted.

                var alias = 'cent';
                var queryBuilder = this.classificationEntryRepo.createQueryBuilder(alias);

                // Filter only properties of interest, namely those which are part
                // of the authorized attributes and only those for which a value
                // has been specified.

                let propertiesOfInterest = Object.entries(query).filter(
                    ([prop, value]) => {
                        if (
                            attributesFiltering.indexOf(prop) >= 0 &&
                            value !== undefined
                        ) {
                            return [prop, value];
                        }
                    },
                );

                // Dynamically build where clause from properties of interest

                var isFirst = true;
                propertiesOfInterest.forEach(([prop, value]) => {
                    var parameter = 'p_' + prop;
                    var expression: string;
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
                } else {
                    queryBuilder.addOrderBy(`${alias}.uid`, 'ASC');
                }
                //});

                queryBuilder.loadAllRelationIds();
                console.log(queryBuilder.getQueryAndParameters())
                const count = await queryBuilder.getCount();
                const totalCount = await this.classificationEntryRepo.count();
                const res = await queryBuilder.getMany();

                return {
                    data: this.accessControlService.filter(
                        res,
                        attributesFiltering,
                    ),
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
                        message: 'Cannot retrieve classification entries',
                        messageCode: 'cannotRetrieveClassificationEntries',
                    });
            }
        }
    }

    //-----------------------------------------------------------------------

    public async getClassificationEntryByCode({
        token,
        ...query
    }: ClassificationEntryByCodeParamsDto) {
        try {
            // Look for classification systems matching given name.

            const systems = await this.classificationSystemRepo.find({ name: ILike(`%${query.systemName}%`) });

            // If none were found, throw an error.

            if ((!systems) || (systems.length == 0))
                throw FwaException({
                    code: HttpStatus.NOT_FOUND,
                    message: 'No matching classification system found',
                    messageCode: 'classificationSystemNotFound',
                    messageData: {
                        name: query.systemName,
                    },
                });

            var systemIds = [];
            systemIds = systems.map(system => system.id);

            // Look for one classification entry matching the specified entry code
            // in the found classification systems.

            const entries = await this.classificationEntryRepo.find({
                code: ILike(`${query.entryCode}`),
                classificationSystem: In(systemIds)
            });

            // We're expecting exactly one entry. If none or more than one are
            // found, then throw the corresponding error.

            if ((!entries) || (entries.length == 0)) {
                throw FwaException({
                    code: HttpStatus.NOT_FOUND,
                    message: 'No matching classification entry found',
                    messageCode: 'classificationEntryNotFound',
                    messageData: {
                        code: query.entryCode,
                    },
                });
            } else if (entries.length > 1) {
                throw FwaException({
                    code: HttpStatus.BAD_REQUEST,
                    message: 'More than one classification entry found',
                    messageCode: 'moreThanOneClassificationEntryFound',
                    messageData: {
                        name: query.systemName,
                        code: query.entryCode,
                    },
                });
            }
            return entries[0];

        } catch (error) {
            console.log('error', error);
            if (
                error instanceof HttpException ||
                error instanceof RpcException
            )
                throw error;
            else
                throw FwaException({
                    message: 'Cannot retrieve classification entry',
                    messageCode: 'cannotRetrieveClassificationEntry',
                });
        }
    }

    //-----------------------------------------------------------------------

    public async getPropertyUnits({
        token
    }) {
        {
            try {
                const attributesFiltering = await this.sanitizeOnRead(
                    token,
                    PROPERTY_UNIT
                );

                const systems = await this.propertyUnitRepo.findTrees();

                return {
                    data: this.accessControlService.filter(
                        systems,
                        attributesFiltering,
                    ),
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
                        message: 'Cannot retrieve property units',
                        messageCode: 'cannotRetrievePropertyUnits',
                    });
            }
        }
    }

    //-----------------------------------------------------------------------

    public async getPropertyTypes({
        token,
    }) {
        {
            try {
                const attributesFiltering = await this.sanitizeOnRead(
                    token,
                    PROPERTY_TYPE
                );
                const systems = await this.propertyTypeRepo.find({ relations: ["propertyUnits"] });

                return {
                    data: this.accessControlService.filter(
                        systems,
                        attributesFiltering,
                    ),
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
                        message: 'Cannot retrieve property types',
                        messageCode: 'cannotRetrievePropertyTypes',
                    });
            }
        }
    }

    //-----------------------------------------------------------------------

    public async createPropertyType({
        token,
        ...type
    }: CreatePropertyTypeDto) {
        try {
            // Check if a property type with the same name already exists.
            const propertyTypeNameAlreadyExists =
                await this.propertyTypeRepo.findOne({
                    where: {
                        name: type.name,
                    },
                });

            // Throw an error if property type already exists
            if (propertyTypeNameAlreadyExists)
                throw FwaException({
                    code: HttpStatus.CONFLICT,
                    message:
                        'A property type with the same name already exists',
                    messageCode: PROPERTY_TYPE_ALREADY_EXISTS,
                    messageData: {
                        name: type.name,
                    },
                });

            let propertyUnits: PropertyUnit[];
            propertyUnits = await Promise.all(type.propertyUnits.map(async (unit) => {
                const propertyUnit = await this.propertyUnitRepo.findOne({
                    where: [{ id: unit.id },
                    { name: unit.name },
                    { symbol: unit.symbol }],
                    loadRelationIds: false,
                })
                return propertyUnit;
            }));

            type.propertyUnits = propertyUnits;
            this.propertyTypeRepo.save(type);
            return type;
        } catch (error) {
            console.log('error', error);
            if (
                error instanceof HttpException ||
                error instanceof RpcException
            )
                throw error;
            else
                throw FwaException({
                    message: 'Cannot create property type',
                    messageCode: CANNOT_CREATE_PROPERTY_TYPE
                    ,
                });
        }
    }

    //-----------------------------------------------------------------------

    public async getPropertyTypeByName({
        token,
        ...query
    }: PropertyTypeByNameParamsDto) {
        try {
            // Look for classification systems matching given name.

            const propertyTypes = await this.propertyTypeRepo.find({
                where: { name: ILike(`%${query.propertyTypeName}%`) },
                relations: ["propertyUnits"]
            });

            // If none were found, throw an error.

            if ((!propertyTypes) || (propertyTypes.length == 0))
                throw FwaException({
                    code: HttpStatus.NOT_FOUND,
                    message: 'No matching property type found',
                    messageCode: 'propertyTypeNotFound',
                    messageData: {
                        name: query.propertyTypeName,
                    },
                });
            if (propertyTypes.length > 1) {
                throw FwaException({
                    code: HttpStatus.BAD_REQUEST,
                    message: 'More than one property type found',
                    messageCode: 'moreThanOnePropertyTypeFound',
                    messageData: {
                        name: query.propertyTypeName,
                    },
                });
            }

            return propertyTypes[0];

        } catch (error) {
            console.log('error', error);
            if (
                error instanceof HttpException ||
                error instanceof RpcException
            )
                throw error;
            else
                throw FwaException({
                    message: 'Cannot lookup property type',
                    messageCode: 'cannotLookupPropertyType',
                });
        }
    }

}