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
    ELEMENT_TYPE,
    OWN_PROJECT_ELEMENT_TYPE,
    PARTICIPATING_PROJECT_ELEMENT_TYPE,
} from './accessControl/resourcesName.constants';


import { InventoryElementTypeService } from './inventory-element-type.service';
import { InventoryElementTypeDto } from './dto/inventory-element-type.dto';
import { CreateInventoryElementTypeBodyDto, CreateInventoryElementTypeParamsDto } from './dto/create-inventory-element-type.dto';
import { InventoryElementTypeGetOneDto } from './dto/get-one-inventory-element-type.dto';
import { UpdateInventoryElementTypeBodyDto, UpdateInventoryElementTypeParamsDto } from './dto/update-inventory-element-type.dto';
import { DeleteInventoryElementTypeParamsDto } from './dto/delete-inventory-element-type.dto';
import { QueryInventoryElementTypesParamsDto, QueryInventoryElementTypesQueryDto } from './dto/query-inventory-element-types.dto';

@ApiTags('Inventory Element Types')
@Controller('projects/:projectId/inventory')
@UseGuards(ApiAuthGuard, ApiAccessGuard)
export class InventoryElementTypeController {

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //----------------------------------------------------------------------- 

    constructor(
        private readonly inventoryElementTypesService: InventoryElementTypeService,
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
        summary: 'Create an element type',
        description:
            'Create an element type in the project identified by **projectId**.',
    })
    @ApiOkResponse({
        description: 'An element type',
        type: InventoryElementTypeDto,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: CREATE_ACTION, resource: ELEMENT_TYPE },
        { action: CREATE_ACTION, resource: OWN_PROJECT_ELEMENT_TYPE },
        { action: CREATE_ACTION, resource: PARTICIPATING_PROJECT_ELEMENT_TYPE },
    ])
    @Post('elements/types')
    async createElementType(
        @Param() { projectId }: CreateInventoryElementTypeParamsDto,
        @Body() body: CreateInventoryElementTypeBodyDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryElementTypesService.createElementType({
            token: authorization,
            projectId,
            ...body,
        });
    }

    //-----------------------------------------------------------------------
    //=======================================================================
    //= Read
    //=======================================================================
    //----------------------------------------------------------------------- 

    @ApiOperation({
        summary: 'List the type of elements in the project inventory',
        description:
            'Return the list of element types in the project identified by **projectId**.',
    })
    @ApiOkResponse({
        description: 'A list of inventory element types',
        type: InventoryElementTypeDto,
        isArray: true,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: ELEMENT_TYPE },
        { action: READ_ACTION, resource: OWN_PROJECT_ELEMENT_TYPE },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT_ELEMENT_TYPE },
    ])
    @Get('elements/types')
    async getInventoryElementTypes(
        @Param() params: CreateInventoryElementTypeParamsDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryElementTypesService.getInventoryElementTypes({
            token: authorization,
            ...params,
        });
    }

    //----------------------------------------------------------------------- 

    @ApiOperation({
        summary: 'Counts the inventory element types of a project',
        description:
            'Return the number of inventory element types in the project identified by **projectId** matching the given conditions.',
    })
    @ApiOkResponse({
        description: 'The number of matching inventory element types',
        type: Number,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: ELEMENT_TYPE },
        { action: READ_ACTION, resource: OWN_PROJECT_ELEMENT_TYPE },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT_ELEMENT_TYPE },
    ])
    @Get('elements/types/query/count')
    async countInventoryElementTypes(
        @Param() params: QueryInventoryElementTypesParamsDto,
        @Query() query: QueryInventoryElementTypesQueryDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryElementTypesService.countInventoryElementTypes({
            token: authorization,
            ...params,
            ...query,
        });
    }

    //----------------------------------------------------------------------- 

    @ApiOperation({
        summary: 'Query the inventory element types of a project',
        description:
            'Return the list of inventory element types in the project identified by **projectId** matching the given conditions.',
    })
    @ApiOkResponse({
        description: 'A filtered list of inventory element types',
        type: InventoryElementTypeDto,
        isArray: true,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: ELEMENT_TYPE },
        { action: READ_ACTION, resource: OWN_PROJECT_ELEMENT_TYPE },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT_ELEMENT_TYPE },
    ])
    @Get('elements/types/query')
    async queryInventoryElementTypes(
        @Param() params: QueryInventoryElementTypesParamsDto,
        @Query() query: QueryInventoryElementTypesQueryDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryElementTypesService.queryInventoryElementTypes({
            token: authorization,
            ...params,
            ...query,
        });
    }

    //-----------------------------------------------------------------------

    @ApiOperation({
        summary: 'Get one element type',
        description:
            'Get one element type identified by **uid**.',
    })
    @ApiOkResponse({
        description: 'An element type',
        type: InventoryElementTypeDto,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: ELEMENT_TYPE },
        { action: READ_ACTION, resource: OWN_PROJECT_ELEMENT_TYPE },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT_ELEMENT_TYPE },
    ])
    @Get('elements/types/:elementTypeUid')
    async getOneElementType(
        @Param() params: InventoryElementTypeGetOneDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryElementTypesService.getOneElementType({
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
        summary: 'Update an element type',
        description:
            'Update an element type identified by **uid** in a project identified by **projectId**.',
    })
    @ApiOkResponse({
        description: 'The updated element type',
        type: InventoryElementTypeDto,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: UPDATE_ACTION, resource: ELEMENT_TYPE },
        { action: UPDATE_ACTION, resource: OWN_PROJECT_ELEMENT_TYPE },
        { action: UPDATE_ACTION, resource: PARTICIPATING_PROJECT_ELEMENT_TYPE },
    ])
    @Patch('elements/types/:elementTypeUid')
    async updateElementType(
        @Param() params: UpdateInventoryElementTypeParamsDto,
        @Body() body: UpdateInventoryElementTypeBodyDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryElementTypesService.updateElementType({
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
        summary: 'Delete an element type',
        description:
            'Delete an element type identified by **uid** in a project identified by **projectId**.',
    })
    @ApiOkResponse({
        description: 'The deleted element type',
        type: InventoryElementTypeDto,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: DELETE_ACTION, resource: ELEMENT_TYPE },
        { action: DELETE_ACTION, resource: OWN_PROJECT_ELEMENT_TYPE },
        { action: DELETE_ACTION, resource: PARTICIPATING_PROJECT_ELEMENT_TYPE },
    ])
    @Delete('elements/types/:elementTypeUid')
    async deleteElementType(
        @Param() params: DeleteInventoryElementTypeParamsDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryElementTypesService.deleteElementType({
            token: authorization,
            ...params
        });
    }
}
