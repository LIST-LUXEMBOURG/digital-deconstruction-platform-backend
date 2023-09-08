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
import {
    Equal,
    LessThan,
    LessThanOrEqual,
    MoreThan,
    MoreThanOrEqual,
    Not,
    In,
    Repository,
} from 'typeorm';

import {
    dispatchACDBs,
    FWACallFct,
    FwaException,
    onModuleDynamicInit,
} from '../../FWAjs-utils';
import { Material } from './entities/material.entity';
import { MaterialType } from './entities/material-type.entity';
import { Element } from './entities/element.entity';
import { RpcException } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';

import { ApiAccessControlService } from '../../FWAjs-utils/accessControl/accessControl.service';
import { Timeout } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateForgeIfcMappingDto } from './dto/create-forge-ifc-mapping.dto';
import { ForgeIfcMapping } from './entities/forge-ifc-mapping.entity';
import { ClassificationEntry } from '../../core/entities/classification-entry.entity';
import { Property } from '../../core/entities/property.entity';
import { ElementType } from './entities/element-type.entity';
import { BaseService } from '../../core/base.service';
import { PropertyType } from 'src/core/entities/property-type.entity';

@Injectable()
export class InventoryService extends BaseService implements OnModuleInit {
    constructor(
        @InjectRepository(ElementType)
        private readonly elementTypeRepo: Repository<ElementType>,

        @InjectRepository(Element)
        private readonly elementRepo: Repository<Element>,

        @InjectRepository(Material)
        private readonly materialRepo: Repository<Material>,

        @InjectRepository(MaterialType)
        private readonly materialTypeRepo: Repository<MaterialType>,

        @InjectRepository(ForgeIfcMapping)
        private readonly forgeIfcMappingRepo: Repository<ForgeIfcMapping>,

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
            'coreService'
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
    // -- DRAFT --
    private queryWithOperator(text: string) {
        // This function only works with a single operator.
        // For a more elaborated function try to split by a separator character (like "//" or "\\") and use advanced operator
        // like: In, Between, Like, Any, IsNull

        // Example of text "eq:toto"
        let r = text.indexOf(':');
        if (r === 2) {
            // and then do the same as below.
            let [operator, value] = text.split(':');

            // Convert text to either integer or float, if not numerical value returns: NaN
            let numericalValue = (value as any) * 1;
            if (numericalValue !== NaN) (value as any) = numericalValue;

            switch (operator) {
                case 'eq':
                    return Equal(value);
                case 'ne':
                    return Not(value);
                case 'gt':
                    return MoreThan(value);
                case 'ge':
                    return MoreThanOrEqual(value);
                case 'lt':
                    return LessThan(value);
                case 'le':
                    return LessThanOrEqual(value);
                default:
                    throw new Error('Operator not found');
            }
        }
        let value = text;
        let numericalValue = (value as any) * 1;
        if (numericalValue !== NaN) (value as any) = numericalValue;

        return value;
        // how to use it
        // let formattedQuery = { where : {}}
        // for (const key of query){ formattedQuery.where[key] = queryWithOperator(query[key]) }
    }

    //-----------------------------------------------------------------------

    private async lookupClassificationEntries(token: any, entries: Array<Partial<ClassificationEntry>>): Promise<Array<ClassificationEntry>> {

        return await Promise.all(entries.map(async entry => {
            return FWACallFct(
                this,
                { srv: 'coreService', cmd: 'getClassificationEntryByCode' },
                {
                    token,
                    classificationSystemName: entry.classificationSystem.name,
                    classificationEntryCode: entry.code
                },
            );
        }));
    }

    //-----------------------------------------------------------------------

    private async lookupProperties(token: any, properties: Array<Property>): Promise<Array<Property>> {

        return await Promise.all(properties.map(async property => {
            const [propertyType, propertyUnit] = await FWACallFct(
                this,
                { srv: 'coreService', cmd: 'getOnePropertyTypeAndUnitByName' },
                {
                    token,
                    typeName: property.propertyType.name,
                    unitName: property.propertyUnit.name,
                    unitSymbol: property.propertyUnit.symbol,
                });
            property.propertyType = propertyType;
            property.propertyUnit = propertyUnit;
            return property;
        }));
    }

    //-----------------------------------------------------------------------

    private async fetchPropertyTypes(token: any): Promise<Array<PropertyType>> {

        let propertyTypeList = await FWACallFct(
            this,
            { srv: 'coreService', cmd: 'getPropertyTypes' },
            {
                token,
            });

        if (!!propertyTypeList)
            return propertyTypeList.data;
        else return null;
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Service API
    //***********************************************************************
    //-----------------------------------------------------------------------

    public async upsertInventory({ token, projectId, file }) {
        let recoveryFromStep;
        let previousRecord;
        try {
            // await this.sanitizeInventoryOnCreate(token, projectId);

            // Step 1: Check whether specified project exists.

            let project = await this.getProject(projectId);

            previousRecord = await this.elementRepo.findOne({
                where: { project },
            });

            recoveryFromStep = 'found';

            // Step 2: Parse file content. 

            const jsonObject = JSON.parse(file.buffer.toString());

            recoveryFromStep = 'parsed';

            // Step 3: Remove all elements, materials, and types for given project.
            // Import of data crushes previous inventory.

            // if (!!previousRecord) {
            // TODO: to check/test
            await this.elementRepo.delete({ project });
            await this.materialRepo.delete({ project });

            await this.elementTypeRepo.delete({ project });
            await this.materialTypeRepo.delete({ project });
            // }

            recoveryFromStep = 'deleted';

            // Step 4: Extract all unique element and material types from file content
            // and persist them for the given project.



            const elementTypesToSave = Element.getElementTypes(
                jsonObject,
                project.id,
            );
            const materialTypesToSave = Element.getMaterialTypes(
                jsonObject,
                project.id,
            );

            // elementTypesToSave.forEach(async elementType => {
            //     await this.elementTypeRepo.save(elementType);
            // });

            // materialTypesToSave.forEach(async materialType => {
            //     await this.materialTypeRepo.save(materialType);
            // });

            await this.elementTypeRepo.save(elementTypesToSave);
            await this.materialTypeRepo.save(materialTypesToSave);

            const elementTypes = await this.elementTypeRepo.find({
                where: { project },
            });

            const materialTypes = await this.materialTypeRepo.find({
                where: { project },
            });

            const propertyTypes = await this.fetchPropertyTypes(token);

            console.log(materialTypes);

            const elements = Element.getElements(jsonObject, project, {
                elementTypes,
                materialTypes,
                propertyTypes
            });

            console.log(elements.length);

            recoveryFromStep = 'mapped';

            // Step 6: Purge potential duplicates from file content

            const filteredInventory = Element.uniqueConstraints(elements);

            recoveryFromStep = 'reduced';

            // Step 7: Lookup classification entries and properties for each individual inventory element.

            filteredInventory.forEach(async element => {

                // Step 7.1a Lookup classification entries.

                // let mappedEntries: Array<ClassificationEntry> = [];
                // if (element.classificationEntries != null) {
                //     mappedEntries = await this.lookupClassificationEntries(token, element.classificationEntries);
                // }

                // // Step 7.1b Lookup property types and units.

                // let mappedProperties: Array<Property> = [];
                // if (element.properties != null) {
                //     mappedProperties = await this.lookupProperties(token, element.properties);
                // }

                // recoveryFromStep = 'classifications';

                // // Step 7.2 Clear classification entries and properties array and persist the element.

                // element.classificationEntries.splice(0, element.classificationEntries.length);
                // element.properties.splice(0, element.properties.length);

                // let saved = await this.elementRepo.save(element);

                // // Step 7.3 Fetch the saved element and add the mapped classification entries
                // // and properties to the newly saved element.

                // element = await this.elementRepo.findOne({
                //     where: { uid: saved.uid }, relations: ["classificationEntries", "properties"]
                // });

                // mappedEntries.forEach(entry => element.classificationEntries.push(entry));
                // mappedProperties.forEach(property => element.properties.push(property));

                // Step 7.4 Save the element to persist the classification entry mappings.

                await this.elementRepo.save(element);

            });

            // batch save by 1000 records
            // const numberOfChunk = Math.round(filteredInventory.length / 1000);
            // await this.elementRepo.save(filteredInventory, {
            //      chunk: numberOfChunk,
            //  });
            //await this.bulkSave(filteredInventory);

            recoveryFromStep = 'saved';
            return { done: true };
        } catch (error) {
            console.log('error', error);
            let recoveryError;
            switch (recoveryFromStep) {
                case 'saved':
                    // error occurs after saving...
                    // should not happen ¯\_(ツ)_/¯
                    recoveryError = FwaException({
                        code: HttpStatus.INTERNAL_SERVER_ERROR,
                        message: 'Failed to return a response',
                        messageCode: 'failedToRespond',
                    });
                    break;
                case 'classifications':
                    recoveryError = FwaException({
                        code: HttpStatus.BAD_REQUEST,
                        message:
                            'The file appears to use classification system/entries unknown to the platform.',
                        messageCode: 'invalidClassificationSystemOrEntry',
                    });
                // case 'reduced':
                case 'mapped':
                // no break here: -> continue in "parsed"
                case 'parsed':
                    // no break here: -> continue in "deleted"

                    recoveryError = FwaException({
                        code: HttpStatus.BAD_REQUEST,
                        message:
                            'The file does not have the right format, see documentation.',
                        messageCode: 'unvalidInventoryElementStructure',
                    });
                case 'deleted':
                    recoveryError =
                        recoveryError ??
                        FwaException({
                            code: HttpStatus.BAD_REQUEST,
                            message:
                                'Cannot parse the file, malforme file error',
                            messageCode: 'malformedFileStructure',
                        });

                    // await this.bulkSave(previousRecord);
                    break;
                case 'found':
                    // nothing to do
                    break;
                default:
                    break;
            }
            if (recoveryError) throw recoveryError;
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    code: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: 'Cannot import inventory file',
                    messageCode: 'cannotImportInventory',
                });
        }
    }

    //-----------------------------------------------------------------------

    public async bulkCreateForgeIfcMappings(token: string, projectId: number, forgeIfcMappings: CreateForgeIfcMappingDto[]) {
        try {
            // TODO create inventory element acdb

            // Get the project, if it's not found the projectService will raise en Exception
            const project = await FWACallFct(
                this,
                { srv: 'projectService', cmd: 'getOne' },
                {
                    token,
                    id: projectId,
                },
            );

            let start = 0;
            let chunkSize = 100;
            let end = (forgeIfcMappings.length > chunkSize) ? chunkSize : forgeIfcMappings.length;

            let done = false;

            while (!done) {
                if (end > forgeIfcMappings.length) {
                    end = forgeIfcMappings.length
                    done = true;
                };
                const slice = forgeIfcMappings.slice(start, end);
                let chunk: ForgeIfcMapping[] = slice.map(s => ({ uid: undefined, projectId: projectId, forgeId: s.forgeId, ifcId: s.ifcId }));
                this.forgeIfcMappingRepo.save(chunk);
                start = end;
                end += chunkSize;
            }
        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    message: 'Cannot create Forge IFC Mappings',
                    messageCode: 'cannotCreateForgeIfcMappings',
                });
        }
    }

    //-----------------------------------------------------------------------

    public async getMappingsByIfcIds(token: string, projectId: number, ifcIds: string[]) {
        try {
            // TODO create inventory element acdb

            // Get the project, if it's not found the projectService will raise en Exception
            const project = await FWACallFct(
                this,
                { srv: 'projectService', cmd: 'getOne' },
                {
                    token,
                    id: projectId,
                },
            );

            const mappings = await this.forgeIfcMappingRepo.find({
                where: {
                    ifcId: In(ifcIds),
                    projectId
                },
            });

            return mappings;

        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    message: 'Failed to fetch Mappings by Ifc Ids',
                    messageCode: 'failedToFetchMappingsByIfcIds',
                });
        }
    }

    //-----------------------------------------------------------------------

    public async getMappingsByForgeIds(token: string, projectId: number, forgeIds: string[]) {
        try {
            // TODO create inventory element acdb

            // Get the project, if it's not found the projectService will raise en Exception
            const project = await FWACallFct(
                this,
                { srv: 'projectService', cmd: 'getOne' },
                {
                    token,
                    id: projectId,
                },
            );

            const mappings = await this.forgeIfcMappingRepo.find({
                where: {
                    forgeId: In(forgeIds),
                    projectId
                },
            });

            return mappings;

        } catch (error) {
            console.log('error', error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            else
                throw FwaException({
                    message: 'Failed to fetch Mappings by Forge Ids',
                    messageCode: 'failedToFetchMappingsByForgeIds',
                });
        }
    }
}
