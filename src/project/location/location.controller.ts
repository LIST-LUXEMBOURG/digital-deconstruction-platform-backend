/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiConflictResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiAccessControl, ApiAccessGuard, ApiAuth, ApiAuthGuard, CREATE_ACTION, DELETE_ACTION, READ_ACTION, UPDATE_ACTION } from '../../FWAjs-utils';
import { OWN_PROJECT_LOCATION, PARTICIPATING_PROJECT_LOCATION, PROJECT_LOCATION } from './accessControl/resourcesName.constants';
import { CreateProjectLocationBodyDto, CreateProjectLocationParamsDto } from './dto/create-project-location.dto';
import { DeleteProjectLocationDto } from './dto/delete-project-location.dto';
import { ProjectLocationOneDto } from './dto/get-one-project-location.dto';
import { ListProjectLocationsDto } from './dto/list-project-locations.dto';
import { ProjectLocationDto } from './dto/project-location.dto';
import { UpdateProjectLocationBodyDto, UpdateProjectLocationParamsDto } from './dto/update-project-location.dto';
import { LocationService } from './location.service';

@ApiTags('Projects - Locations')
@Controller('projects')
@UseGuards(ApiAuthGuard, ApiAccessGuard)
export class LocationController {
    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //----------------------------------------------------------------------- 

    constructor(private readonly projectLocationService: LocationService) { }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Controller Routes
    //***********************************************************************
    //-----------------------------------------------------------------------

    //-----------------------------------------------------------------------
    //=======================================================================
    //= Create
    //=======================================================================
    //----------------------------------------------------------------------- 

    @ApiOperation({
        summary: 'Create a new location',
        description: `Create a new location inside the project identified by **projectId**`,
    })
    @ApiOkResponse({
        description: 'Successfully created a new location inside the project',
        type: ProjectLocationDto,
    })
    @ApiNotFoundResponse({
        description:
            '- Project not found \
            - parentLocation not found',
    })
    @Post(':projectId/locations')
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: CREATE_ACTION, resource: PROJECT_LOCATION },
        { action: CREATE_ACTION, resource: OWN_PROJECT_LOCATION },
    ])
    async createLocation(
        @Headers() { authorization },
        @Param() { projectId }: CreateProjectLocationParamsDto,
        @Body() locationCreateDto: CreateProjectLocationBodyDto,
    ): Promise<ProjectLocationDto> {
        return await this.projectLocationService.createLocation({
            token: authorization,
            projectId,
            ...locationCreateDto,
        });
    }

    //-----------------------------------------------------------------------
    //=======================================================================
    //= Read
    //=======================================================================
    //----------------------------------------------------------------------- 

    // --- List a project's locations ---
    @ApiOperation({
        summary: "Return the project's spatial structure.",
        description: `Return the list of site locations of the project identified by **projectId**. 
        If some sites have subdivisions, they are included in the site objects and so forth down to the last level of subdivision. 
        Hence, the entire spatial structure of a project is returned.`,
    })
    @ApiOkResponse({
        description: "Project's spatial structure successfully returned",
        type: [ProjectLocationDto],
        isArray: true,
    })
    @ApiNotFoundResponse({
        description: '- Project not found',
    })
    @Get(':projectId/locations')
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: PROJECT_LOCATION },
        { action: READ_ACTION, resource: OWN_PROJECT_LOCATION },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT_LOCATION },
    ])
    async listLocations(
        @Headers() { authorization },
        @Param() { projectId }: ListProjectLocationsDto,
    ): Promise<ProjectLocationDto[]> {
        return await this.projectLocationService.listLocations({
            token: authorization,
            projectId,
        });
    }

    //-----------------------------------------------------------------------

    @ApiOperation({
        summary: 'Fetch one project location',
        description: `Returns the project location identified by **locationId** in project identified by **projectId**`,
    })
    @ApiOkResponse({
        description: 'Project Location returned',
        type: ProjectLocationDto,
    })
    @ApiNotFoundResponse({
        description: 'Project not found',
    })
    @Get(':projectId/locations/:locationId')
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: PROJECT_LOCATION },
        { action: READ_ACTION, resource: OWN_PROJECT_LOCATION },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT_LOCATION },
    ])
    async getProjectLocation(
        @Headers() { authorization },
        @Param() body: ProjectLocationOneDto,
    ): Promise<ProjectLocationDto> {
        return await this.projectLocationService.getProjectLocation({
            token: authorization,
            ...body,
        });
    }

    //-----------------------------------------------------------------------
    //=======================================================================
    //= Update
    //=======================================================================
    //-----------------------------------------------------------------------

    @ApiOperation({
        summary: 'Update a DDC project location.',
        description: `Update the DDC project location with the internal **locationID**, 
        that is in the project identified by **projectID**.`,
    })
    @ApiOkResponse({
        description: 'Location successfully updated',
        type: ProjectLocationDto,
    })
    @ApiNotFoundResponse({
        description:
            "- Project not found\n\
                      - Project's location not found",
    })
    @ApiConflictResponse({
        description: `Can't update the location data\n\
        - name already in use\n\
        - can't change type of location with subdivisions\n\
        - coordinates only allowed in sites`,
    })
    @Patch(':projectId/locations/:locationId')
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: UPDATE_ACTION, resource: PROJECT_LOCATION },
        { action: UPDATE_ACTION, resource: OWN_PROJECT_LOCATION },
    ])
    async updateLocation(
        @Headers() { authorization },
        @Param() params: UpdateProjectLocationParamsDto,
        @Body() body: UpdateProjectLocationBodyDto,
    ): Promise<ProjectLocationDto> {
        return await this.projectLocationService.updateProjectLocation({
            token: authorization,
            ...params,
            ...body,
        });
    }
    //-----------------------------------------------------------------------
    //=======================================================================
    //= Delete
    //=======================================================================
    //----------------------------------------------------------------------- 

    // --- Delete a project's locations ---
    @ApiOperation({
        summary: 'Delete a DDC project location.',
        description: `Delete the DDC project location with the internal **locationID**, 
        that is in the project identified by **projectID**.`,
    })
    @ApiOkResponse({
        description: 'Location successfully deleted',
        type: ProjectLocationDto,
    })
    @ApiNotFoundResponse({
        description:
            "- Project not found\n\
                      - Project's location not found",
    })
    @ApiConflictResponse({
        description: `can't delete locations with subdivisions or associated data / files`,
    })
    @Delete(':projectId/locations/:locationId')
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAuth()
    @ApiAccessControl([
        { action: DELETE_ACTION, resource: PROJECT_LOCATION },
        { action: DELETE_ACTION, resource: OWN_PROJECT_LOCATION },
    ])
    async deleteLocation(
        @Headers() { authorization },
        @Param() { projectId, locationId }: DeleteProjectLocationDto,
    ): Promise<ProjectLocationDto> {
        return await this.projectLocationService.deleteProjectLocation({
            token: authorization,
            projectId,
            locationId,
        });
    }

    // --- Update a project's locations ---

}
