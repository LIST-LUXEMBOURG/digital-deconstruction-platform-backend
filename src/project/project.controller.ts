/*
 *   Copyright (c) 2021-2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import {
    Body,
    Controller,
    Delete,
    Get,
    Headers,
    Param,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiConflictResponse,
    ApiCreatedResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiTags,
} from '@nestjs/swagger';
// LIST libraries
import {
    ApiAccessControl,
    ApiAccessGuard,
    ApiAuth,
    ApiAuthGuard,
    CREATE_ACTION,
    DELETE_ACTION,
    READ_ACTION,
    UPDATE_ACTION,
} from '../FWAjs-utils';
import { getTag } from '../utils/ordered-swagger-tag';
// ACDBs
import {
    OWN_PROJECT,
    PARTICIPATING_PROJECT,
    PROJECT,
} from './accessControl/resourcesName.constants';
// DTOs
import { CreateProjectDto } from './dto/create-project.dto';
import { DeleteProjectDto } from './dto/delete-project.dto';
import { ProjectGetOneDto } from './dto/get-one-project.dto';
import { UpdateProjectBodyDto, UpdateProjectParamsDto } from './dto/update-project.dto';
// Entities
import { Project } from './entities';
// Services
import { ProjectService } from './project.service';

@ApiTags('Projects')
@Controller('projects')
@UseGuards(ApiAuthGuard, ApiAccessGuard)
export class ProjectController {
    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //----------------------------------------------------------------------- 

    constructor(private readonly projectService: ProjectService) { }

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
        summary: 'Create a new project.',
        description: `Create a new deconstruction project, which will become the central anchor point for all data objects, files etc. that belong to this project`,
    })
    @ApiCreatedResponse({
        description: 'The project has been successfully created',
        type: Project,
    })
    @ApiConflictResponse({ description: 'The project name is already in use' })
    @Post()
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([{ action: CREATE_ACTION, resource: PROJECT }])
    async createProject(
        @Headers() { authorization },
        @Body() body: CreateProjectDto,
    ): Promise<Project> {
        return await this.projectService.createProject({
            token: authorization,
            ...body,
        });
    }

    //-----------------------------------------------------------------------
    //=======================================================================
    //= Read
    //=======================================================================
    //----------------------------------------------------------------------- 

    @ApiOperation({
        summary:
            'Return a list of projects that match a provided *pattern*, and that are accessible to the connected user. (Pattern matching not implemented ATM)',
        description: `Return a list of projects that match a provided pattern, and that are accessible to the connected user.`,
    })
    @ApiOkResponse({
        description: 'List of projects returned',
        type: Project,
        isArray: true,
    })
    @Get()
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: PROJECT },
        { action: READ_ACTION, resource: OWN_PROJECT },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT },
    ])
    async listProjects(@Headers() { authorization }): Promise<Project[]> {
        return await this.projectService.getAllProjects(authorization);
    }

    //----------------------------------------------------------------------- 

    @ApiOperation({
        summary: 'Return DDC project',
        description: `Return the DDC project matching the specified **projectId**.`,
    })
    @ApiOkResponse({
        description: 'Project successfully returned',
        type: Project,
    })
    @ApiNotFoundResponse({
        description: 'Project not found',
    })
    @Get(':projectId')
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: PROJECT },
        { action: READ_ACTION, resource: OWN_PROJECT },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT },
    ])
    async getOneProject(
        @Headers() { authorization },
        @Param() body: ProjectGetOneDto,
    ): Promise<Project> {
        return await this.projectService.getProject({
            token: authorization,
            ...body,
        });
    }

    //-----------------------------------------------------------------------
    //=======================================================================
    //= Update
    //=======================================================================
    //-----------------------------------------------------------------------
    //----------------------------------------------------------------------- 

    @ApiOperation({
        summary: 'Modify DDC project',
        description: `Modify the DDC project with the internal **projectId**.`,
    })
    @ApiOkResponse({
        description: 'Project successfully updated',
        type: Project,
    })
    @ApiNotFoundResponse({
        description: 'Project not found',
    })
    @ApiParam({
        name: 'projectId',
        description: 'The internal project Id',
    })
    @Patch(':projectId')
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: UPDATE_ACTION, resource: PROJECT },
        { action: UPDATE_ACTION, resource: OWN_PROJECT },
    ])
    async updateProject(
        @Headers() { authorization },
        @Param() params: UpdateProjectParamsDto,
        @Body() body: UpdateProjectBodyDto,
    ): Promise<Project> {
        return await this.projectService.updateProject({
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

    @ApiOperation({
        summary: 'Delete DDC Project and all its content.',
        description: `Delete the DDC project with the internal projectId, and all of its contents, inluding all files and data objects that refer to it.`,
    })
    @ApiOkResponse({
        description: 'Project deleted',
        type: Project,
    })
    @ApiNotFoundResponse({
        description: 'Project not found',
    })
    @Delete(':projectId')
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([{ action: DELETE_ACTION, resource: PROJECT }])
    async deleteProject(
        @Headers() { authorization },
        @Param() params: DeleteProjectDto,
    ): Promise<Project> {
        return await this.projectService.deleteProject({ token: authorization, ...params });
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* End of Controller
    //***********************************************************************
    //-----------------------------------------------------------------------

}
