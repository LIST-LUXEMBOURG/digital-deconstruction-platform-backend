/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
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
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiTags,
} from '@nestjs/swagger';
import {
    ApiAccessControl,
    ApiAccessGuard,
    ApiAuth,
    ApiAuthGuard,
    CREATE_ACTION,
    DELETE_ACTION,
    READ_ACTION,
    UPDATE_ACTION,
} from '../../FWAjs-utils';
import {
    OWN_PROJECT_PARTICIPANT,
    PROJECT_PARTICIPANT,
} from './accessControl/resourcesName.constants';

import { CreateProjectParticipantBodyDto, CreateProjectParticipantParamsDto } from './dto/create-project-participant.dto';
import { DeleteProjectParticipantParamsDto } from './dto/delete-project-participant.dto';
import { ListProjectParticipantsDto } from './dto/list-project-participants.dto';
import { ProjectParticipantDto } from './dto/project-participant.dto';
import { UpdateProjectParticipantBodyDto, UpdateProjectParticipantParamsDto } from './dto/update-project-participant.dto';
import { ProjectParticipant } from './entities/projectParticipant.entity';
import { ParticipantService } from './participant.service';

@ApiTags('Projects - Participants')
@Controller('projects')
@UseGuards(ApiAuthGuard, ApiAccessGuard)
export class ParticipantController {

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //----------------------------------------------------------------------- 

    constructor(
        private readonly projectParticipantService: ParticipantService,
    ) { }

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
        summary: 'Add a participant to a project',
        description: `Add a user identified by userId as participant to the project identified by **projectId**. The user can be a guest or a contributor.`,
    })
    @ApiOkResponse({
        description: 'Successfully added a new participant',
        type: ProjectParticipant,
    })
    @ApiNotFoundResponse({
        description: '- Project not found \
            - User not found ',
    })
    @ApiParam({
        name: 'projectId',
        description: "The project's internal Id",
    })
    @ApiParam({
        name: 'userId',
        description: 'The participnts internal userId',
    })
    @Post(':projectId/participants/:userId')
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: CREATE_ACTION, resource: PROJECT_PARTICIPANT },
        { action: CREATE_ACTION, resource: OWN_PROJECT_PARTICIPANT },
    ])
    async addParticipant(
        @Headers() { authorization },
        @Param() params: CreateProjectParticipantParamsDto,
        @Body() body: CreateProjectParticipantBodyDto,
    ): Promise<ProjectParticipantDto> {
        return await this.projectParticipantService.createProjectParticipant({
            token: authorization,
            ...params,
            ...body,
        });
    }

    //-----------------------------------------------------------------------
    //=======================================================================
    //= Read
    //=======================================================================
    //----------------------------------------------------------------------- 

    @ApiOperation({
        summary: "Return the project's list of participants",
        description: `Return the list of participants of the project identified by **projectId**.`,
    })
    @ApiOkResponse({
        description: "Project's participants successfully returned",
        type: ProjectParticipant,
        isArray: true,
    })
    @ApiNotFoundResponse({
        description: '- Project not found',
    })
    @Get(':projectId/participants')
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: PROJECT_PARTICIPANT },
        { action: READ_ACTION, resource: OWN_PROJECT_PARTICIPANT },
    ])
    async listParticipants(
        @Headers() { authorization },
        @Param() params: ListProjectParticipantsDto,
    ): Promise<ProjectParticipantDto[]> {
        return await this.projectParticipantService.listProjectParticipants({
            token: authorization,
            ...params,
        });
    }

    //-----------------------------------------------------------------------
    //=======================================================================
    //= Update
    //=======================================================================
    //-----------------------------------------------------------------------
    // --- Update a participant from a project ---

    @ApiOperation({
        summary: "Modify a project participant's role",
        description: `Modify the role of the participant identified by **userId**
        in the project identified by **projectId**.`,
    })
    @ApiOkResponse({
        description: 'Successfully modify the participant',
        type: ProjectParticipant,
    })
    @ApiNotFoundResponse({
        description: '- Project not found \
            - User not found ',
    })
    @ApiParam({
        name: 'projectId',
        description: "The project's internal Id",
    })
    @ApiParam({
        name: 'userId',
        description: 'The participnts internal userId',
    })
    @Patch(':projectId/participants/:userId')
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAuth()
    @ApiAccessControl([
        { action: UPDATE_ACTION, resource: PROJECT_PARTICIPANT },
        { action: UPDATE_ACTION, resource: OWN_PROJECT_PARTICIPANT },
    ])
    async UpdateParticipant(
        @Headers() { authorization },
        @Param() params: UpdateProjectParticipantParamsDto,
        @Body() body: UpdateProjectParticipantBodyDto,
    ): Promise<ProjectParticipantDto> {
        return await this.projectParticipantService.updateProjectParticipant({
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
        summary: 'Remove the user from the list of project participants',
        description: `Remove the user identified by **userID** as participant from the project identified by **projectId**.
        The deleted particiaption object is returned.`,
    })
    @ApiOkResponse({
        description: 'Successfully removed the participant',
        type: ProjectParticipant,
    })
    @ApiNotFoundResponse({
        description: '- Project not found \
            - User not found ',
    })
    @ApiParam({
        name: 'projectId',
        description: "The project's internal Id",
    })
    @ApiParam({
        name: 'userId',
        description: 'The participnts internal userId',
    })
    @Delete(':projectId/participants/:userId')
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAuth()
    @ApiAccessControl([
        { action: DELETE_ACTION, resource: PROJECT_PARTICIPANT },
        { action: DELETE_ACTION, resource: OWN_PROJECT_PARTICIPANT },
    ])
    async removeParticipant(
        @Headers() { authorization },
        @Param() params: DeleteProjectParticipantParamsDto,
    ): Promise<ProjectParticipantDto> {
        return await this.projectParticipantService.deleteProjectParticipant({
            token: authorization,
            ...params,
        });
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* End of Controller
    //***********************************************************************
    //-----------------------------------------------------------------------
}
