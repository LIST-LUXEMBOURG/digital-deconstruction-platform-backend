/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { HttpException, HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { Timeout } from '@nestjs/schedule';
import { InjectRepository, InjectEntityManager } from '@nestjs/typeorm';
import { lchmod } from 'fs';
import { clone, concat, find, flatten, isEqual, isNil, remove, uniq } from 'lodash';
import { BaseService } from '../../core/base.service';
import { CREATE_ACTION, DELETE_ACTION, dispatchACDBs, FWACallFct, FwaException, onModuleDynamicInit, READ_ACTION, UPDATE_ACTION } from '../../FWAjs-utils';
import { ApiAccessControlService } from '../../FWAjs-utils/accessControl/accessControl.service';
import { ResourceTriplet } from '../../FWAjs-utils/utils/auth.interface';
import { EntityManager, TreeRepository } from 'typeorm';
import { OWN_PROJECT_LOCATION, PARTICIPATING_PROJECT_LOCATION, PROJECT_LOCATION } from './accessControl/resourcesName.constants';
import { CANNOT_CREATE_LOCATION, CANNOT_DELETE_LOCATION, CANNOT_DELETE_LOCATION_WITH_DOCUMENTS, CANNOT_DELETE_LOCATION_WITH_SUBDIVISIONS, CANNOT_FIND_LOCATION, CANNOT_FIND_PARENT_LOCATION_IN_PROJECT, CANNOT_LIST_LOCATIONS, CANNOT_UPDATE_LOCATION, FAILED_TO_LOOKUP_PROJECT_LOCATION, LOCATION_NAME_CONFLICT, LOCATION_TYPE_CONFLICT, NOT_ALLOWED_TO_CREATE_LOCATION_IN_PROJECT, NOT_ALLOWED_TO_DELETE_LOCATION_IN_PROJECT, NOT_ALLOWED_TO_READ_LOCATION_IN_PROJECT, NOT_ALLOWED_TO_UPDATE_LOCATION_IN_PROJECT } from './constants';

import { CreateProjectLocationDto } from './dto/create-project-location.dto';
import { DeleteProjectLocationDto } from './dto/delete-project-location.dto';
import { ProjectLocationOneDto } from './dto/get-one-project-location.dto';
import { ListProjectLocationsDto } from './dto/list-project-locations.dto';
import { ProjectLocationDto } from './dto/project-location.dto';
import { UpdateProjectLocationDto } from './dto/update-project-location.dto';
import { LocationType, ProjectLocation } from './entities/projectLocation.entity';
import { LocationRules } from './utils/location.rules';

@Injectable()
export class LocationService extends BaseService implements OnModuleInit {

    private readonly RESOURCES = <ResourceTriplet>{
        global: PROJECT_LOCATION,
        owned: OWN_PROJECT_LOCATION,
        shared: PARTICIPATING_PROJECT_LOCATION
    };

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //----------------------------------------------------------------------- 

    constructor(
        @InjectEntityManager('default')
        protected readonly entityManager: EntityManager,
        @InjectRepository(ProjectLocation)
        protected readonly locationRepo: TreeRepository<ProjectLocation>,
        protected readonly jwtService: JwtService,
        protected readonly accessControlService: ApiAccessControlService,
        protected readonly moduleRef: ModuleRef,
        protected readonly eventEmitter: EventEmitter2,
    ) { super(jwtService, accessControlService, moduleRef, eventEmitter); }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Primitive(s)
    //***********************************************************************
    //-----------------------------------------------------------------------    

    async onModuleInit() {
        await onModuleDynamicInit(this, null, [
            'projectService',
            'participantService',
            'projectFileService'
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

    private sanitizeResponse(entity: any, attributes: any): ProjectLocationDto {
        let dto = ProjectLocation.toDto(entity);
        let filtered = this.accessControlService.filter(dto, attributes);
        return filtered;
    }

    //----------------------------------------------------------------------- 

    private sanitizeRecursive(location: any, attributes: any): ProjectLocationDto {
        let locationDto = this.sanitizeResponse(location, attributes);
        if (!!location.subdivisions && location.subdivisions.length > 0) {
            let subdivsionDtos: ProjectLocationDto[] = [];
            subdivsionDtos = location.subdivisions.map(subdivision => {
                return this.sanitizeRecursive(subdivision, attributes);
            });
            locationDto.subdivisions.splice(0);
            subdivsionDtos.forEach(subdivisionDto => {
                locationDto.subdivisions.push(subdivisionDto);
            });
        }
        return locationDto;
    }

    //----------------------------------------------------------------------- 

    public async getLocationRaw({ id }: { id: number }): Promise<ProjectLocation> {
        try {
            return await this.locationRepo.findOne({
                where: { id },
                relations: ['project', 'parentLocation'] //, 'pointOfInterests']
            });
        } catch (error) {
            throw FwaException({
                message: 'Failed to lookup project location!',
                messageCode: FAILED_TO_LOOKUP_PROJECT_LOCATION,
                messageData: { locationId: id },
            });
        }
    }

    //----------------------------------------------------------------------- 

    private async locationWithNameAlreadyExists(locationName: string, parentLocationId: number, projectId: number): Promise<boolean> {
        try {
            let count = 0;
            if (!!parentLocationId) {
                count = await this.locationRepo.count(
                    {
                        parentLocation: { id: parentLocationId },
                        name: locationName,
                    }
                );
            } else {
                count = await this.locationRepo.count(
                    {
                        project: { id: projectId },
                        type: LocationType.SITE,
                        name: locationName,
                    }
                );
            }
            return (count > 0);
        } catch (error) {
            throw FwaException({
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Failed to lookup project location',
                messageCode: FAILED_TO_LOOKUP_PROJECT_LOCATION,
                messageData: { name: locationName, parentLocation: parentLocationId, project: projectId },
            });
        }
    }

    //----------------------------------------------------------------------- 

    private async fetchSubDivisions(location: ProjectLocation): Promise<ProjectLocation> {

        let descendant: ProjectLocation = await this.locationRepo.findDescendantsTree(location, { relations: ['parentLocation'] }); //, 'pointOfInterests'] });

        if (!!descendant.subdivisions && descendant.subdivisions.length > 0) {
            let results: ProjectLocation[] = [];
            results = await Promise.all(descendant.subdivisions.map(async subdivision => {
                let populated = await this.fetchSubDivisions(subdivision);
                return populated;
            }));

            let sortedById = results.sort((div1, div2) => div1.id - div2.id);

            descendant.subdivisions.splice(0);
            sortedById.forEach(result => {
                descendant.subdivisions.push(result);
            });

        }
        return descendant;
    }

    //-----------------------------------------------------------------------

    private async hasAttachedFiles(token, location: ProjectLocation): Promise<boolean> {
        const projectFiles = await FWACallFct(
            this,
            {
                srv: 'projectFileService',
                cmd: 'listProjectDocuments',
            },
            {
                token,
                projectId: location.project.id
            },
        );

        let hasAttachedDocuments = false;
        if (projectFiles !== undefined && projectFiles.data !== undefined) {
            let files = projectFiles.data;
            hasAttachedDocuments = (files.filter(file => file.locationId === location.id).length > 0);

        }

        return hasAttachedDocuments;
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Service API
    //***********************************************************************
    //----------------------------------------------------------------------- 

    async createLocation(
        { token, ...dto }: CreateProjectLocationDto,
    ): Promise<ProjectLocationDto> {
        try {
            const tokenPayload = await this.jwtService.verifyAsync(token);
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, CREATE_ACTION, this.RESOURCES)

            let sanitizedDto = this.accessControlService.filter(dto, attributesFilter);

            let project = await this.getProject(dto.projectId);

            let parentLocation;

            if (sanitizedDto.type === LocationType.SITE && !!sanitizedDto.parentLocationId) {
                throw FwaException({
                    code: HttpStatus.CONFLICT,
                    message: `A 'site' location cannot have a parentLocation in the tree`,
                    messageCode: LOCATION_TYPE_CONFLICT,
                    messageData: {
                        projectId: sanitizedDto.projectId,
                        parentLocationId: sanitizedDto.parentLocationId,
                    },
                });
            } else if (sanitizedDto.type !== LocationType.SITE && !sanitizedDto.parentLocationId) {
                throw FwaException({
                    code: HttpStatus.CONFLICT,
                    message: `Root location must be a 'site' location`,
                    messageCode: LOCATION_TYPE_CONFLICT,
                    messageData: {
                        projectId: sanitizedDto.projectId,
                    },
                });
            } else if (sanitizedDto.type !== LocationType.SITE && !!sanitizedDto.parentLocationId) {

                try {
                    parentLocation = await this.locationRepo.findOneOrFail({
                        id: sanitizedDto.parentLocationId,
                    });
                } catch (error) {
                    throw FwaException({
                        code: HttpStatus.NOT_FOUND,
                        message: `Cannot find the parent location in the project`,
                        messageCode: CANNOT_FIND_PARENT_LOCATION_IN_PROJECT,
                        messageData: {
                            projectId: sanitizedDto.projectId,
                            parentLocationId: sanitizedDto.parentLocationId,
                        },
                    });
                }

                LocationRules.RULES.forEach(rule => {
                    if ((parentLocation.type === rule.parent) &&
                        !rule.children.includes(sanitizedDto.type)) {
                        throw FwaException({
                            code: HttpStatus.CONFLICT,
                            message: rule.message,
                            messageCode: LOCATION_TYPE_CONFLICT,
                            messageData: {
                                projectId: sanitizedDto.projectId,
                                parentLocationId:
                                    sanitizedDto.parentLocationId,
                            },
                        });
                    }
                });
            }

            if (await this.locationWithNameAlreadyExists(sanitizedDto.name, sanitizedDto.parentLocationId, sanitizedDto.projectId)) {
                throw FwaException({
                    code: HttpStatus.CONFLICT,
                    message: `Name is already taken by a sibling location`,
                    messageCode: LOCATION_NAME_CONFLICT,
                    messageData: {
                        projectId: sanitizedDto.projectId,
                        locationName: sanitizedDto.name,
                        locationType: sanitizedDto.type,
                        parentLocationId: sanitizedDto.parentLocationId
                    },
                });
            }

            delete sanitizedDto.projectId;
            delete sanitizedDto.parentLocationId;

            let location: ProjectLocation = Object.assign(
                sanitizedDto,
                { createdBy: tokenPayload.user.id },
            );

            location.project = project;
            if (!!parentLocation) {
                location.parentLocation = new ProjectLocation();
                location.parentLocation.id = parentLocation.id;
            }

            const { id } = await this.locationRepo.save(location);

            // Fix to circumvent typeorm bug not correctly updating closure table.
            // if (!!parentLocation) {
            //     let parentId = parentLocation.id;

            //     let query = this.entityManager.createQueryBuilder()
            //         .update('project_location_closure')
            //         .set({ ['id_ancestor']: { id: parentId } })
            //         .where('"id_descendant" = :descendantId', { descendantId: id })
            //         .andWhere('"id_ancestor" = :ancestorId', { ancestorId: id });
            //     query.execute();
            // }

            location = await this.getLocationRaw({ id });
            return this.sanitizeResponse(location, attributesFilter);
            //return this.accessControlService.filter(location, attributesFilter);

        } catch (error) {
            console.error(error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;

            throw FwaException({
                message: 'Cannot create a new location for the project',
                messageCode: CANNOT_CREATE_LOCATION,
            });
        }
    }

    //----------------------------------------------------------------------- 

    async listLocations({
        token,
        projectId,
    }: ListProjectLocationsDto): Promise<ProjectLocationDto[]> {
        try {
            const tokenPayload = await this.jwtService.verifyAsync(token);
            const attributesFilter = await this.filterGrantedAttributesForAction(token, projectId, READ_ACTION, this.RESOURCES)

            const rootLocations = await this.locationRepo.find({
                where: {
                    project: { id: projectId },
                    parentLocation: null,
                    type: LocationType.SITE
                }, relations: ['parentLocation'] //, 'pointOfInterests']
            });
            let locations: ProjectLocation[] = [];

            locations = await Promise.all(rootLocations.map(async rootLocation => {
                return await this.fetchSubDivisions(rootLocation);
            }));

            let locationsDto = locations.map(location => {
                return this.sanitizeRecursive(location, attributesFilter);
            })
            return locationsDto;

        } catch (error) {
            console.error(error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;

            throw FwaException({
                message: 'Cannot list locations from the project',
                messageCode: CANNOT_LIST_LOCATIONS,
            });
        }
    }

    //----------------------------------------------------------------------- 

    async getProjectLocation({
        token, ...dto
    }: ProjectLocationOneDto): Promise<ProjectLocationDto> {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, READ_ACTION, this.RESOURCES);

            let location = await this.getLocationRaw({ id: dto.locationId });

            // return await this.accessControlService.filter(
            //     location,
            //     attributesFiltering,
            // )
            return this.sanitizeResponse(location, attributesFilter);
        } catch (error) {
            console.error(error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;

            throw FwaException({
                message: 'Cannot find the project location',
                messageCode: CANNOT_FIND_LOCATION,
                messageData: { locationId: dto.locationId }
            });
        }
    }

    //-----------------------------------------------------------------------

    async deleteProjectLocation({
        token,
        ...dto
    }: DeleteProjectLocationDto): Promise<ProjectLocationDto> {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, DELETE_ACTION, this.RESOURCES);

            let location = await this.getLocationRaw({ id: dto.locationId });

            if (!!location.subdivisions && location.subdivisions.length > 0) {
                throw FwaException({
                    code: HttpStatus.CONFLICT,
                    message: `Cannot delete a project location with subdivisions`,
                    messageCode: CANNOT_DELETE_LOCATION_WITH_SUBDIVISIONS,
                    messageData: { locationId: location.id },
                });
            }

            if (await this.hasAttachedFiles(token, location)) {
                throw FwaException({
                    code: HttpStatus.CONFLICT,
                    message: `Location still has documents attached to it`,
                    messageCode: CANNOT_DELETE_LOCATION_WITH_DOCUMENTS,
                    messageData: { locationId: location.id },
                });
            }

            await this.locationRepo.delete({ id: location.id });

            return this.sanitizeResponse(location, attributesFilter);
        } catch (error) {
            console.error(error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;

            throw FwaException({
                message: 'Cannot delete location from the project',
                messageCode: CANNOT_DELETE_LOCATION,
            });
        }
    }
    //-----------------------------------------------------------------------

    async updateProjectLocation({
        token,
        ...dto }: UpdateProjectLocationDto): Promise<ProjectLocationDto> {
        try {

            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, UPDATE_ACTION, this.RESOURCES);

            let filteredDto = await this.accessControlService.filter(
                dto,
                attributesFilter,
            )

            let location = await this.getLocationRaw({ id: dto.locationId });

            Object.assign(location, { ...filteredDto });

            await this.locationRepo.save(location);

            location = await this.getLocationRaw({ id: location.id });

            return this.sanitizeResponse(location, attributesFilter);

        } catch (error) {
            console.error(error);

            if (error instanceof HttpException || error instanceof RpcException)
                throw error;

            throw FwaException({
                message: 'Cannot update project location',
                messageCode: CANNOT_UPDATE_LOCATION,
            });
        }
    }
}
