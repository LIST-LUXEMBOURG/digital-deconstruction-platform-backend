/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { Body, Controller, Param, Headers, Post, UseGuards, Delete, Patch, Query, Get, Logger } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiAccessControl, ApiAccessGuard, ApiAuth, ApiAuthGuard, CREATE_ACTION, DELETE_ACTION, READ_ACTION, UPDATE_ACTION } from "../FWAjs-utils";
import { CIRCULARITY, OWN_PROJECT_CIRCULARITY, PARTICIPATING_PROJECT_CIRCULARITY } from "./accessControl/resourcesName.constants";
import { AnalyseInventoryCircularityParamsDto, AnalyseInventoryCircularityQueryDto } from "./dto/analyse-inventory-circularity.dto";
import { CreateInventoryCircularityBodyDto, CreateInventoryCircularityParamsDto, CreateInventoryCircularityQueryDto, CreateInventoryElementTypeCircularityParamsDto, CreateInventoryMaterialTypeCircularityParamsDto } from "./dto/create-inventory-circularity.dto";
import { DeleteInventoryCircularityParamsDto } from "./dto/delete-inventory-circularity.dto";
import { InventoryCircularityGetOneDto } from "./dto/get-one-inventory-circularity.dto";
import { InventoryCircularityDto } from "./dto/inventory-circularity.dto";
import { UpdateInventoryCircularityBodyDto, UpdateInventoryCircularityParamsDto } from "./dto/update-inventory-circularity.dto";
import { InventoryCircularityService } from "./inventory-circularity.service";

@ApiTags('Circularity')
@Controller('projects/:projectId')
@UseGuards(ApiAuthGuard, ApiAccessGuard)
export class InventoryCircularityController {

    //private _logger = new Logger("Controller");

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //----------------------------------------------------------------------- 

    constructor(
        private readonly inventoryCircularityService: InventoryCircularityService,
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
        summary: 'Attach a circularity object to one or more elements',
        description:
            'Create a circularity object for the elements identified by **elementUids**.',
    })
    @ApiOkResponse({
        description: 'A circularity object',
        type: InventoryCircularityDto,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: CREATE_ACTION, resource: CIRCULARITY },
        { action: CREATE_ACTION, resource: OWN_PROJECT_CIRCULARITY },
        { action: CREATE_ACTION, resource: PARTICIPATING_PROJECT_CIRCULARITY },
    ])
    @Post('inventory/elements/circularity')
    async createElementCircularity(
        @Param() { projectId }: CreateInventoryCircularityParamsDto,
        @Query() { elementUids }: CreateInventoryCircularityQueryDto,
        @Body() body: CreateInventoryCircularityBodyDto,
        @Headers() { authorization },
    ) {
        let elementTypeUid, materialTypeUid = undefined;

        return await this.inventoryCircularityService.createCircularity({
            token: authorization,
            projectId,
            elementUids,
            elementTypeUid,
            materialTypeUid,
            ...body,
        });
    }

    //----------------------------------------------------------------------- 

    @ApiOperation({
        summary: 'Attach a circularity object to an element type',
        description:
            'Create a circularity object for the element type identified by **elementTypeUid**.',
    })
    @ApiOkResponse({
        description: 'A circularity object',
        type: InventoryCircularityDto,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: CREATE_ACTION, resource: CIRCULARITY },
        { action: CREATE_ACTION, resource: OWN_PROJECT_CIRCULARITY },
        { action: CREATE_ACTION, resource: PARTICIPATING_PROJECT_CIRCULARITY },
    ])
    @Post('inventory/elements/types/:elementTypeUid/circularity')
    async createElementTypeCircularity(
        @Param() { projectId, elementTypeUid }: CreateInventoryElementTypeCircularityParamsDto,
        @Body() body: CreateInventoryCircularityBodyDto,
        @Headers() { authorization },
    ) {
        let elementUids, materialTypeUid = undefined;

        return await this.inventoryCircularityService.createCircularity({
            token: authorization,
            projectId,
            elementUids,
            elementTypeUid,
            materialTypeUid,
            ...body,
        });
    }

    //----------------------------------------------------------------------- 

    @ApiOperation({
        summary: 'Attach a circularity object to a material type',
        description:
            'Create a circularity object for the material type identified by **materialTypeUid**.',
    })
    @ApiOkResponse({
        description: 'A circularity object',
        type: InventoryCircularityDto,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: CREATE_ACTION, resource: CIRCULARITY },
        { action: CREATE_ACTION, resource: OWN_PROJECT_CIRCULARITY },
        { action: CREATE_ACTION, resource: PARTICIPATING_PROJECT_CIRCULARITY },
    ])
    @Post('inventory/materials/types/:materialTypeUid/circularity')
    async createMaterialTypeCircularity(
        @Param() { projectId, materialTypeUid }: CreateInventoryMaterialTypeCircularityParamsDto,
        @Body() body: CreateInventoryCircularityBodyDto,
        @Headers() { authorization },
    ) {
        let elementUids, elementTypeUid = undefined;

        return await this.inventoryCircularityService.createCircularity({
            token: authorization,
            projectId,
            elementUids,
            elementTypeUid,
            materialTypeUid,
            ...body,
        });
    }

    //-----------------------------------------------------------------------
    //=======================================================================
    //= Read
    //=======================================================================
    //-----------------------------------------------------------------------

    @ApiOperation({
        summary: 'Get one circularity object',
        description:
            'Get a circularity object identified by **circularityUid**.',
    })
    @ApiOkResponse({
        description: 'The read circularity object',
        type: InventoryCircularityDto,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: CIRCULARITY },
        { action: READ_ACTION, resource: OWN_PROJECT_CIRCULARITY },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT_CIRCULARITY },
    ])
    @Get('inventory/circularity/:circularityUid')
    async getOneElementType(
        @Param() params: InventoryCircularityGetOneDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryCircularityService.getOneCircularity({
            token: authorization,
            ...params,
        });
    }

    //-----------------------------------------------------------------------

    @ApiOperation({
        summary: 'Circularity Analysis of inventory elements',
        description: 'Circularity Analysis of inventory elements',
    })
    @ApiOkResponse({
        description: 'The top circularity objects by inventory elements',
        //       type: InventoryElementAnalysisDto,
        isArray: true,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: CIRCULARITY },
        { action: READ_ACTION, resource: OWN_PROJECT_CIRCULARITY },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT_CIRCULARITY },
    ])

    @Get('inventory/elements/circularity/analysis')
    async getInventoryElementCircularityAnalysis(
        @Param() params: AnalyseInventoryCircularityParamsDto,
        @Query() query: AnalyseInventoryCircularityQueryDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryCircularityService.getInventoryElementsCircularityAnalysis({
            token: authorization,
            ...query,
            ...params
        });
    }

    //-----------------------------------------------------------------------

    @ApiOperation({
        summary: 'Circularity Analysis of inventory element types',
        description: 'Circularity Analysis of inventory element types',
    })
    @ApiOkResponse({
        description: 'The top circularity objects by inventory element types',
        //       type: InventoryElementAnalysisDto,
        isArray: true,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: CIRCULARITY },
        { action: READ_ACTION, resource: OWN_PROJECT_CIRCULARITY },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT_CIRCULARITY },
    ])

    @Get('inventory/elements/types/circularity/analysis')
    async getInventoryElementTypesCircularityAnalysis(
        @Param() params: AnalyseInventoryCircularityParamsDto,
        @Query() query: AnalyseInventoryCircularityQueryDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryCircularityService.getInventoryElementTypesCircularityAnalysis({
            token: authorization,
            ...query,
            ...params
        });
    }

    //-----------------------------------------------------------------------

    @ApiOperation({
        summary: 'Circularity Analysis of inventory material types',
        description: 'Circularity Analysis of inventory material types',
    })
    @ApiOkResponse({
        description: 'The top circularity objects by inventory material types',
        //       type: InventoryElementAnalysisDto,
        isArray: true,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: CIRCULARITY },
        { action: READ_ACTION, resource: OWN_PROJECT_CIRCULARITY },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT_CIRCULARITY },
    ])

    @Get('inventory/materials/types/circularity/analysis')
    async getInventoryMaterialTypesCircularityAnalysis(
        @Param() params: AnalyseInventoryCircularityParamsDto,
        @Query() query: AnalyseInventoryCircularityQueryDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryCircularityService.getInventoryMaterialTypesCircularityAnalysis({
            token: authorization,
            ...query,
            ...params
        });
    }

    //-----------------------------------------------------------------------
    //=======================================================================
    //= Update
    //=======================================================================
    //-----------------------------------------------------------------------

    @ApiOperation({
        summary: 'Update a circularity object',
        description:
            'Update a circularity object identified by **circularityUid**.',
    })
    @ApiOkResponse({
        description: 'The updated circularity object',
        type: InventoryCircularityDto,

    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: UPDATE_ACTION, resource: CIRCULARITY },
        { action: UPDATE_ACTION, resource: OWN_PROJECT_CIRCULARITY },
        { action: UPDATE_ACTION, resource: PARTICIPATING_PROJECT_CIRCULARITY },
    ])
    @Patch('inventory/circularity/:circularityUid')
    async updateElementType(
        @Param() params: UpdateInventoryCircularityParamsDto,
        @Body() body: UpdateInventoryCircularityBodyDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryCircularityService.updateCircularity({
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
        summary: 'Delete a circularity object',
        description:
            'Delete a circularity object identified by **circularityUid**.',
    })
    @ApiOkResponse({
        description: 'The deleted circularity object',
        type: InventoryCircularityDto,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: DELETE_ACTION, resource: CIRCULARITY },
        { action: DELETE_ACTION, resource: OWN_PROJECT_CIRCULARITY },
        { action: DELETE_ACTION, resource: PARTICIPATING_PROJECT_CIRCULARITY },
    ])
    @Delete('inventory/circularity/:circularityUid')
    async deleteCircularity(
        @Param() { projectId, circularityUid }: DeleteInventoryCircularityParamsDto,
        @Body() body: CreateInventoryCircularityBodyDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryCircularityService.deleteCircularity({
            token: authorization,
            projectId,
            circularityUid,
            ...body,
        });
    }
}