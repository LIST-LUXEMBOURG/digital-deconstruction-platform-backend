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
    Query,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiConsumes,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiTags,
} from '@nestjs/swagger';
import { ApiAccessControl, ApiAccessGuard, ApiAuth, ApiAuthGuard, ApiFile, CREATE_ACTION, DELETE_ACTION, READ_ACTION, UPDATE_ACTION } from '../FWAjs-utils';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

import {
    CreatePointOfInterestBodyDto,
    CreatePointOfInterestParamsDto,
} from './dto/create-point-of-interest.dto';

import {
    UpdatePointOfInterestBodyDto,
    UpdatePointOfInterestParamsDto,
} from './dto/update-point-of-interest.dto';

import {
    DeletePointOfInterestParamsDto,
} from './dto/delete-point-of-interest.dto';

import { PointOfInterest } from './entities/point-of-interest.entity';
import { PointOfInterestService } from './point-of-interest.service';
import { OWN_PROJECT_POINT_OF_INTEREST, PARTICIPATING_PROJECT_POINT_OF_INTEREST, POINT_OF_INTEREST } from './accessControl/resourcesName.constants';
import { UpsertPointOfInterestsParamsDto } from './dto/upsert-point-of-interests.dto';
import { PointOfInterestDto } from './dto/point-of-interest.dto';
import { ListPointOfInterestsParamsDto, ListPointOfInterestsQueryDto } from './dto/list-point-of-interests.dto';

@ApiTags('Point of Interests')
@Controller('projects/:projectId/scan/points-of-interest')
@UseGuards(ApiAuthGuard, ApiAccessGuard)
export class PointOfInterestController {

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor(s)
    //***********************************************************************
    //-----------------------------------------------------------------------

    constructor(
        private readonly pointOfInterestService: PointOfInterestService,
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
        summary: 'Create a point of interest',
        description:
            'Create a point of interest for a given **elementUid* in a **projectId**.',
    })
    @ApiOkResponse({
        description: 'The newly created point of interest',
        type: PointOfInterestDto,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: CREATE_ACTION, resource: POINT_OF_INTEREST },
        { action: CREATE_ACTION, resource: OWN_PROJECT_POINT_OF_INTEREST },
        { action: CREATE_ACTION, resource: PARTICIPATING_PROJECT_POINT_OF_INTEREST }])
    @Post()
    async createPointOfInterest(
        @Param() params: CreatePointOfInterestParamsDto,
        @Body() body: CreatePointOfInterestBodyDto,
        @Headers() { authorization },
    ) {
        return await this.pointOfInterestService.createPointOfInterest({
            token: authorization,
            ...params,
            ...body,
        });
    }

    //-----------------------------------------------------------------------

    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: UPDATE_ACTION, resource: POINT_OF_INTEREST },
        { action: UPDATE_ACTION, resource: OWN_PROJECT_POINT_OF_INTEREST },
        { action: UPDATE_ACTION, resource: PARTICIPATING_PROJECT_POINT_OF_INTEREST }])
    @ApiConsumes('multipart/form-data')
    @ApiFile('file')
    @UseInterceptors(AnyFilesInterceptor())
    @Post('import')
    async upsertPointOfInterests(
        @Param() params: UpsertPointOfInterestsParamsDto,
        @Headers() { authorization },
        @UploadedFiles() files: Array<Express.Multer.File>,
    ) {
        return await this.pointOfInterestService.upsertPointOfInterests({
            token: authorization,
            ...params,
            files
        });
    }
    //-----------------------------------------------------------------------
    //=======================================================================
    //= Read
    //=======================================================================
    //-----------------------------------------------------------------------

    @ApiOperation({
        summary: 'List the points of interest of a project',
        description:
            'Return the list of points of interest in the project identified by **projectId**.',
    })
    @ApiOkResponse({
        description: 'A list of points of interest',
        type: PointOfInterestDto,
        isArray: true,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: POINT_OF_INTEREST },
        { action: READ_ACTION, resource: OWN_PROJECT_POINT_OF_INTEREST },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT_POINT_OF_INTEREST }])

    @Get()
    async getPointsOfInterest(
        @Param() params: ListPointOfInterestsParamsDto,
        @Query() query: ListPointOfInterestsQueryDto,
        @Headers() { authorization },
    ) {
        return await this.pointOfInterestService.listPointsOfInterest({
            token: authorization,
            ...params,
            ...query,
        });
    }

    //-----------------------------------------------------------------------
    //=======================================================================
    //= Update
    //=======================================================================
    //----------------------------------------------------------------------- 

    @ApiOperation({
        summary: 'Update a point of interest',
        description:
            'Update a point of interest for a given **elementUid* in a **projectId**.',
    })
    @ApiOkResponse({
        description: 'The updated point of interest',
        type: PointOfInterestDto,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: UPDATE_ACTION, resource: POINT_OF_INTEREST },
        { action: UPDATE_ACTION, resource: OWN_PROJECT_POINT_OF_INTEREST },
        { action: UPDATE_ACTION, resource: PARTICIPATING_PROJECT_POINT_OF_INTEREST }])
    @Post(':pointOfInterestUid')
    async updatePointOfInterest(
        @Param() params: UpdatePointOfInterestParamsDto,
        @Body() body: UpdatePointOfInterestBodyDto,
        @Headers() { authorization },
    ) {
        return await this.pointOfInterestService.updatePointOfInterest({
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
        summary: 'Delete a point of interest',
        description:
            'Delete a point of interest in a **projectId**.',
    })
    @ApiOkResponse({
        description: 'The deleted point of interest',
        type: PointOfInterestDto,
    })
    @ApiAuth()
    @ApiBearerAuth()

    @ApiAccessControl([
        { action: DELETE_ACTION, resource: POINT_OF_INTEREST },
        { action: DELETE_ACTION, resource: OWN_PROJECT_POINT_OF_INTEREST },
        { action: DELETE_ACTION, resource: PARTICIPATING_PROJECT_POINT_OF_INTEREST }])
    @Delete(':pointOfInterestUid')
    async deletePointOfInterest(
        @Param() params: DeletePointOfInterestParamsDto,
        @Headers() { authorization },
    ) {
        return await this.pointOfInterestService.deletePointOfInterest({
            token: authorization,
            ...params,
        });
    }
}