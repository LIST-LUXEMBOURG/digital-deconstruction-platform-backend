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

import { MATERIAL_TYPE, OWN_PROJECT_MATERIAL_TYPE, PARTICIPATING_PROJECT_MATERIAL_TYPE } from './accessControl/resourcesName.constants';

import { InventoryMaterialTypeService } from './inventory-material-type.service';
import { MaterialType } from './entities/material-type.entity';
import { CreateInventoryMaterialTypeBodyDto, CreateInventoryMaterialTypeParamsDto } from './dto/create-inventory-material-type.dto';
import { ListInventoryMaterialTypesDto } from './dto/list-inventory-material-types.dto';
import { UpdateInventoryMaterialTypeBodyDto, UpdateInventoryMaterialTypeParamsDto } from './dto/update-inventory-material-type.dto';
import { DeleteInventoryMaterialTypeParamsDto } from './dto/delete-inventory-material-type.dto';
import { InventoryMaterialTypeDto } from './dto/inventory-matertial-type.dto';
import { InventoryMaterialTypeGetOneDto } from './dto/get-one-inventory-material-type.dto';
import { QueryInventoryMaterialTypesParamsDto, QueryInventoryMaterialTypesQueryDto } from './dto/query-inventory-material-types.dto';

@ApiTags('Inventory Material Types')
@Controller('projects/:projectId/inventory')
@UseGuards(ApiAuthGuard, ApiAccessGuard)
export class InventoryMaterialTypeController {

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //----------------------------------------------------------------------- 

    constructor(
        private readonly inventoryMaterialTypeService: InventoryMaterialTypeService,
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
        summary: 'Create a material type',
        description:
            'Create a material type in the project identified by **projectId**.',
    })
    @ApiOkResponse({
        description: 'The newly created material type',
        type: InventoryMaterialTypeDto,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: CREATE_ACTION, resource: MATERIAL_TYPE },
        { action: CREATE_ACTION, resource: OWN_PROJECT_MATERIAL_TYPE },
        { action: CREATE_ACTION, resource: PARTICIPATING_PROJECT_MATERIAL_TYPE },
    ])
    @Post('materials/types')
    async createMaterialType(
        @Param() params: CreateInventoryMaterialTypeParamsDto,
        @Body() body: CreateInventoryMaterialTypeBodyDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryMaterialTypeService.createMaterialType({
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
        summary: 'List the type of materials in the project inventory',
        description:
            'Return the list of material types in the project identified by **projectId**.',
    })
    @ApiOkResponse({
        description: 'A list of inventory material types',
        type: InventoryMaterialTypeDto,
        isArray: true,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: MATERIAL_TYPE },
        { action: READ_ACTION, resource: OWN_PROJECT_MATERIAL_TYPE },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT_MATERIAL_TYPE },
    ])
    @Get('materials/types')
    async listMaterialTypes(
        @Param() params: ListInventoryMaterialTypesDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryMaterialTypeService.listMaterialTypes({
            token: authorization,
            ...params,
        });
    }

    //----------------------------------------------------------------------- 

    @ApiOperation({
        summary: 'Counts the inventory material types of a project',
        description:
            'Return the number of inventory material types in the project identified by **projectId** matching the given conditions.',
    })
    @ApiOkResponse({
        description: 'The number of matching inventory material types',
        type: Number,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: MATERIAL_TYPE },
        { action: READ_ACTION, resource: OWN_PROJECT_MATERIAL_TYPE },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT_MATERIAL_TYPE },
    ])
    @Get('materials/types/query/count')
    async countInventoryMaterialTypes(
        @Param() params: QueryInventoryMaterialTypesParamsDto,
        @Query() query: QueryInventoryMaterialTypesQueryDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryMaterialTypeService.countInventoryMaterialTypes({
            token: authorization,
            ...params,
            ...query,
        });
    }

    //----------------------------------------------------------------------- 

    @ApiOperation({
        summary: 'Query the inventory material types of a project',
        description:
            'Return the list of inventory material types in the project identified by **projectId** matching the given conditions.',
    })
    @ApiOkResponse({
        description: 'A filtered list of inventory material types',
        type: InventoryMaterialTypeDto,
        isArray: true,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: MATERIAL_TYPE },
        { action: READ_ACTION, resource: OWN_PROJECT_MATERIAL_TYPE },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT_MATERIAL_TYPE },
    ])
    @Get('materials/types/query')
    async queryInventoryMaterialTypes(
        @Param() params: QueryInventoryMaterialTypesParamsDto,
        @Query() query: QueryInventoryMaterialTypesQueryDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryMaterialTypeService.queryInventoryMaterialTypes({
            token: authorization,
            ...params,
            ...query,
        });
    }

    //-----------------------------------------------------------------------

    @ApiOperation({
        summary: 'Get one material type',
        description:
            'Get one material type identified by **uid**.',
    })
    @ApiOkResponse({
        description: 'A material type',
        type: InventoryMaterialTypeDto,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: MATERIAL_TYPE },
        { action: READ_ACTION, resource: OWN_PROJECT_MATERIAL_TYPE },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT_MATERIAL_TYPE },
    ])
    @Get('materials/types/:materialTypeUid')
    async getOneElementType(
        @Param() params: InventoryMaterialTypeGetOneDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryMaterialTypeService.getOneMaterialType({
            token: authorization,
            ...params,
        });
    }

    //-----------------------------------------------------------------------
    //=======================================================================
    //= Update
    //=======================================================================
    //----------------------------------------------------------------------- 

    @ApiOperation({
        summary: 'Update a material type',
        description:
            'Update a material type identified by **materialTypeUid** in a project identified by **projectId**.',
    })
    @ApiOkResponse({
        description: 'The updated inventory material type',
        type: InventoryMaterialTypeDto,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: UPDATE_ACTION, resource: MATERIAL_TYPE },
        { action: UPDATE_ACTION, resource: OWN_PROJECT_MATERIAL_TYPE },
        { action: UPDATE_ACTION, resource: PARTICIPATING_PROJECT_MATERIAL_TYPE },
    ])
    @Patch('materials/types/:materialTypeUid')
    async updateMaterial(
        @Param() params: UpdateInventoryMaterialTypeParamsDto,
        @Body() body: UpdateInventoryMaterialTypeBodyDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryMaterialTypeService.updateMaterialType({
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
        summary: 'Delete a material type',
        description:
            'Delete a material type identified by **materialTypeUid** from the project identified by **projectId**.',
    })
    @ApiOkResponse({
        description: 'The deleted material type',
        type: InventoryMaterialTypeDto,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: DELETE_ACTION, resource: MATERIAL_TYPE },
        { action: DELETE_ACTION, resource: OWN_PROJECT_MATERIAL_TYPE },
        { action: DELETE_ACTION, resource: PARTICIPATING_PROJECT_MATERIAL_TYPE },
    ])
    @Delete('materials/types/:materialTypeUid')
    async deleteMaterial(
        @Param() params: DeleteInventoryMaterialTypeParamsDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryMaterialTypeService.deleteMaterialType({
            token: authorization,
            ...params
        });
    }
}
