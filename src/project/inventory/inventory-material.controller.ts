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
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiTags,
} from '@nestjs/swagger';
import { ApiAccessControl, ApiAccessGuard, ApiAuth, ApiAuthGuard, CREATE_ACTION, DELETE_ACTION, READ_ACTION, UPDATE_ACTION } from '../../FWAjs-utils';

import {
    CreateInventoryMaterialBodyDto,
    CreateInventoryMaterialParamsDto,
} from './dto/create-inventory-material.dto';
import {
    UpdateInventoryMaterialBodyDto,
    UpdateInventoryMaterialParamsDto,
} from './dto/update-inventory-material.dto';
import { DeleteInventoryMaterialParamsDto } from './dto/delete-inventory-material.dto';
import { InventoryMaterialService } from './inventory-material.service';
import { MATERIAL, MATERIAL_TYPE, OWN_PROJECT_MATERIAL, OWN_PROJECT_MATERIAL_TYPE, PARTICIPATING_PROJECT_MATERIAL } from './accessControl/resourcesName.constants';
import { ListInventoryMaterialsDto } from './dto/list-inventory-materials.dto';
import { InventoryMaterialDto } from './dto/inventory-material.dto';
import { InventoryMaterialAnalysisDto } from './dto/inventory-material-analysis.dto';
import { AnalyseInventoryMaterialsDto } from './dto/analyse-inventory-materials.dto';

@ApiTags('Inventory Element Materials')
@Controller('projects/:projectId/inventory')
@UseGuards(ApiAuthGuard, ApiAccessGuard)
export class InventoryMaterialController {

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //----------------------------------------------------------------------- 

    constructor(
        private readonly inventoryMaterialService: InventoryMaterialService,
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
        summary: 'Create a material',
        description:
            'Create a material in the project identified by **projectId** for the inventory element identified by **elementUid**.',
    })
    @ApiOkResponse({
        description: 'A material',
        type: InventoryMaterialDto,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: CREATE_ACTION, resource: MATERIAL },
        { action: CREATE_ACTION, resource: OWN_PROJECT_MATERIAL },
        { action: CREATE_ACTION, resource: PARTICIPATING_PROJECT_MATERIAL },
    ])
    @Post('elements/:elementUid/materials')
    async createMaterial(
        @Param() params: CreateInventoryMaterialParamsDto,
        @Body() body: CreateInventoryMaterialBodyDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryMaterialService.createMaterial({
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
        summary: 'List the inventory materials for a given element',
        description:
            'Return the list of inventory materials for the element identified by **elementUid** in the project identified by **projectId**.',
    })
    @ApiOkResponse({
        description: 'A list of inventory materials',
        type: InventoryMaterialDto,
        isArray: true,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: MATERIAL },
        { action: READ_ACTION, resource: OWN_PROJECT_MATERIAL },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT_MATERIAL },
    ])
    @Get('elements/:elementUid/materials')
    async getInventoryElements(
        @Param() params: ListInventoryMaterialsDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryMaterialService.listMaterials({
            token: authorization,
            ...params,
        });
    }
    //-----------------------------------------------------------------------


    @ApiOperation({
        summary: 'List the distinct types of material in an inventory',
        description: 'Return a distinct list of material types.',
    })
    @ApiOkResponse({
        description: 'A distinct list of material types',
        type: InventoryMaterialAnalysisDto,
        isArray: true,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: MATERIAL },
        { action: READ_ACTION, resource: OWN_PROJECT_MATERIAL },
        { action: READ_ACTION, resource: MATERIAL_TYPE },
        { action: READ_ACTION, resource: OWN_PROJECT_MATERIAL_TYPE },
    ])
    @ApiParam({
        name: 'projectId',
        description: 'The project internal ID',
    })
    @Get('elements/materials/analysis')
    async getInventoryElementAnalysis(
        @Param() params: AnalyseInventoryMaterialsDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryMaterialService.getInventoryMaterialsAnalysis({
            token: authorization,
            ...params
        });
    }

    //-----------------------------------------------------------------------
    //=======================================================================
    //= Create
    //=======================================================================
    //----------------------------------------------------------------------- 

    @ApiOperation({
        summary: 'Update an inventory material',
        description:
            'Update a material identified by **materialUid** for an element identified by **elementUid** in a project identified by **projectId**.',
    })
    @ApiOkResponse({
        description: 'The updated inventory material',
        type: InventoryMaterialDto,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: UPDATE_ACTION, resource: MATERIAL },
        { action: UPDATE_ACTION, resource: OWN_PROJECT_MATERIAL },
        { action: UPDATE_ACTION, resource: PARTICIPATING_PROJECT_MATERIAL },
    ])
    @Patch('elements/:elementUid/materials/:materialUid')
    async updateMaterial(
        @Param() params: UpdateInventoryMaterialParamsDto,
        @Body() body: UpdateInventoryMaterialBodyDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryMaterialService.updateMaterial({
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
        summary: 'Delete a material',
        description:
            'Delete a material identified by **materialUid** from an inventory element identified by ***elementUid*** in a project identified by **projectId**.',
    })
    @ApiOkResponse({
        description: 'The deleted material',
        type: InventoryMaterialDto,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: DELETE_ACTION, resource: MATERIAL },
        { action: DELETE_ACTION, resource: OWN_PROJECT_MATERIAL },
        { action: DELETE_ACTION, resource: PARTICIPATING_PROJECT_MATERIAL },
    ])
    @Delete('elements/:elementUid/materials/:materialUid')
    async deleteMaterial(
        @Param() params: DeleteInventoryMaterialParamsDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryMaterialService.deleteMaterial({
            token: authorization,
            ...params
        });
    }
}
