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
import { ELEMENT_PROPERTY, ELEMENT_TYPE, INVENTORY, OWN_PROJECT_ELEMENT_PROPERTY, OWN_PROJECT_ELEMENT_TYPE, OWN_PROJECT_INVENTORY, PARTICIPATING_PROJECT_ELEMENT_PROPERTY, PARTICIPATING_PROJECT_ELEMENT_TYPE, PARTICIPATING_PROJECT_INVENTORY } from './accessControl/resourcesName.constants';
import { AddInventoryElementPropertyBodyDto, AddInventoryElementPropertyParamsDto } from './dto/add-inventory-element-property.dto';
import { AnalyseInventoryElementsDto } from './dto/analyse-inventory-elements.dto';
import {
    CreateInventoryElementBodyDto,
    CreateInventoryElementParamsDto,
} from './dto/create-inventory-element.dto';

import { DeleteInventoryElementParamsDto } from './dto/delete-inventory-element.dto';
import { DeleteInventoryPropertyParamsDto } from './dto/delete-inventory-property.dto';
import { ElementGetOneDto } from './dto/get-one-element.dto';
import { InventoryElementAnalysisDto } from './dto/inventory-element-analysis.dto';
import { InventoryElementPropertyDto } from './dto/inventory-element-property.dto';
import { InventoryElementDto } from './dto/inventory-element.dto';
import { ListInventoryElementIdentifiersDto } from './dto/list-inventory-element-identifiers.dto';
import {
    ListInventoryElementsParamsDto,
    ListInventoryElementsQueryDto
} from './dto/list-inventory-elements.dto';
import { QueryInventoryElementsParamsDto, QueryInventoryElementsQueryDto } from './dto/query-inventory-elements.dto';
import {
    UpdateInventoryElementBodyDto,
    UpdateInventoryElementParamsDto,
} from './dto/update-inventory-element.dto';
import { UpdateInventoryPropertyBodyDto, UpdateInventoryPropertyParamsDto } from './dto/update-inventory-property.dto';
import { Element } from './entities/element.entity';
import { InventoryElementService } from './inventory-element.service';
import { SummariseInventoryElementsByReuseDecisionDto } from './dto/summarise-inventory-elements-by-reuse-decision.dto';
import { InventoryElementSummaryDto } from './dto/inventory-element-summary.dto';
import { SummariseInventoryElementsByReusePotentialDto } from './dto/summarise-inventory-elements-by-reuse-potential.dto';

@ApiTags('Inventory Elements')
@Controller('projects/:projectId/inventory')
@UseGuards(ApiAuthGuard, ApiAccessGuard)
export class InventoryElementController {
    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //----------------------------------------------------------------------- 

    constructor(
        private readonly inventoryElementService: InventoryElementService,
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
        summary: 'Create an inventory element',
        description:
            'Create an inventory element in the project identified by **projectId**.',
    })
    @ApiOkResponse({
        description: 'An inventory element',
        type: InventoryElementDto,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: CREATE_ACTION, resource: INVENTORY },
        { action: CREATE_ACTION, resource: OWN_PROJECT_INVENTORY },
        { action: CREATE_ACTION, resource: PARTICIPATING_PROJECT_INVENTORY },
    ])
    @Post('elements')
    async createInventoryElement(
        @Param() { projectId }: CreateInventoryElementParamsDto,
        @Body() body: CreateInventoryElementBodyDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryElementService.createInventoryElement({
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
        summary: 'List the inventory elements of a project',
        description:
            'Return the list of inventory elements in the project identified by **projectId**.',
    })
    @ApiOkResponse({
        description: 'A list of inventory elements',
        type: InventoryElementDto,
        isArray: true,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: INVENTORY },
        { action: READ_ACTION, resource: OWN_PROJECT_INVENTORY },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT_INVENTORY },
    ])
    @Get('elements')
    async getInventoryElements(
        @Param() params: ListInventoryElementsParamsDto,
        @Query() query: ListInventoryElementsQueryDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryElementService.listInventoryElements({
            token: authorization,
            ...params,
            ...query,
        });
    }

    //-----------------------------------------------------------------------
    //=======================================================================
    //= Read
    //=======================================================================
    //----------------------------------------------------------------------- 

    @ApiOperation({
        summary: 'List the inventory elements of a project',
        description:
            'Return the list of inventory elements in the project identified by **projectId**.',
    })
    @ApiOkResponse({
        description: 'A list of inventory elements',
        type: InventoryElementDto,
        isArray: true,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: INVENTORY },
        { action: READ_ACTION, resource: OWN_PROJECT_INVENTORY },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT_INVENTORY },
    ])
    @Get('elements')
    async listInventoryElements(
        @Param() params: ListInventoryElementsParamsDto,
        @Query() query: ListInventoryElementsQueryDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryElementService.listInventoryElements({
            token: authorization,
            ...params,
            ...query,
        });
    }

    //----------------------------------------------------------------------- 

    @ApiOperation({
        summary: 'Counts the inventory elements of a project',
        description:
            'Return the number of inventory elements in the project identified by **projectId** matching the given conditions.',
    })
    @ApiOkResponse({
        description: 'The number of matching inventory elements',
        type: Number,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: INVENTORY },
        { action: READ_ACTION, resource: OWN_PROJECT_INVENTORY },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT_INVENTORY },
    ])
    @Get('elements/query/count')
    async countInventoryElements(
        @Param() params: QueryInventoryElementsParamsDto,
        @Query() query: QueryInventoryElementsQueryDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryElementService.countInventoryElements({
            token: authorization,
            ...params,
            ...query,
        });
    }

    //----------------------------------------------------------------------- 

    @ApiOperation({
        summary: 'Query the inventory elements of a project',
        description:
            'Return the list of inventory elements in the project identified by **projectId** matching the given conditions.',
    })
    @ApiOkResponse({
        description: 'A filtered list of inventory elements',
        type: InventoryElementDto,
        isArray: true,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: INVENTORY },
        { action: READ_ACTION, resource: OWN_PROJECT_INVENTORY },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT_INVENTORY },
    ])
    @Get('elements/query')
    async queryInventoryElements(
        @Param() params: QueryInventoryElementsParamsDto,
        @Query() query: QueryInventoryElementsQueryDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryElementService.queryInventoryElements({
            token: authorization,
            ...params,
            ...query,
        });
    }

    //----------------------------------------------------------------------- 

    @ApiOperation({
        summary: 'List the inventory elements identifiers of a project',
        description:
            'Return the list of inventory elements identifiers in the project identified by **projectId**.',
    })
    @ApiOkResponse({
        description: 'A list of inventory elements indentifiers',
        type: InventoryElementDto,
        isArray: true,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: INVENTORY },
        { action: READ_ACTION, resource: OWN_PROJECT_INVENTORY },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT_INVENTORY },
    ])
    @Get('elements/identifiers')
    async getInventoryElementIdentifiers(
        @Param() params: ListInventoryElementIdentifiersDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryElementService.listInventoryElementIdentifiers({
            token: authorization,
            ...params
        });
    }

    //-----------------------------------------------------------------------

    @ApiOperation({
        summary: 'Fetch dependencies of an inventory element',
        description:
            'Fetch dependencies of an inventory element identified by **uid**.',
    })
    @ApiOkResponse({
        description: 'An inventory element',
        type: InventoryElementDto,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: INVENTORY },
        { action: READ_ACTION, resource: OWN_PROJECT_INVENTORY },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT_INVENTORY },
    ])
    @Get('elements/:elementUid/dependencies')
    async fetchInventoryElementDependencies(
        @Param() params: ElementGetOneDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryElementService.fetchInventoryElementDependencies({
            token: authorization, ...params,
        });
    }

    //-----------------------------------------------------------------------

    @ApiOperation({
        summary: 'List the distinct types of elements in an inventory',
        description: 'Return a distinct list of element types.',
    })
    @ApiOkResponse({
        description: 'A distinct list of element types',
        type: InventoryElementAnalysisDto,
        isArray: true,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: INVENTORY },
        { action: READ_ACTION, resource: OWN_PROJECT_INVENTORY },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT_INVENTORY },
        { action: READ_ACTION, resource: ELEMENT_TYPE },
        { action: READ_ACTION, resource: OWN_PROJECT_ELEMENT_TYPE },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT_ELEMENT_TYPE },
    ])

    @Get('elements/analysis')
    async getInventoryElementAnalysis(
        @Param() params: AnalyseInventoryElementsDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryElementService.getInventoryElementsAnalysis({
            token: authorization,
            ...params
        });
    }

    //-----------------------------------------------------------------------

    @ApiOperation({
        summary: 'Summarise material volumes and mass by reuse decision',
        description: 'Summarise material volumes and mass by reuse decision',
    })
    @ApiOkResponse({
        description: 'Counts, total volumes and total mass of elements grouped by reuse decision',
        type: InventoryElementSummaryDto,
        isArray: true,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: INVENTORY },
        { action: READ_ACTION, resource: OWN_PROJECT_INVENTORY },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT_INVENTORY },
    ])

    @Get('elements/summary/reuse-decision')
    async getInventoryElementSummaryByReuseDecision(
        @Param() params: SummariseInventoryElementsByReuseDecisionDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryElementService.getInventorElementsReuseDecisionSummary({
            token: authorization,
            ...params
        });
    }

    //-----------------------------------------------------------------------

    @ApiOperation({
        summary: 'Summarise material volumes and mass by reuse decision',
        description: 'Summarise material volumes and mass by reuse decision',
    })
    @ApiOkResponse({
        description: 'Counts, total volumes and total mass of elements grouped by reuse decision',
        type: InventoryElementSummaryDto,
        isArray: true,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: INVENTORY },
        { action: READ_ACTION, resource: OWN_PROJECT_INVENTORY },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT_INVENTORY },
    ])

    @Get('elements/summary/reuse-potential')
    async getInventoryElementSummaryByReusePotential(
        @Param() params: SummariseInventoryElementsByReusePotentialDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryElementService.getInventorElementsReusePotentialSummary({
            token: authorization,
            ...params
        });
    }

    //-----------------------------------------------------------------------
    //=======================================================================
    //= Update
    //=======================================================================
    //----------------------------------------------------------------------- 

    @ApiOperation({
        summary: 'Update an inventory element',
        description:
            'Update an inventory element identified by **uid** in a project identified by **projectId**.',
    })
    @ApiOkResponse({
        description: 'The updated inventory element',
        type: InventoryElementDto,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: UPDATE_ACTION, resource: INVENTORY },
        { action: UPDATE_ACTION, resource: OWN_PROJECT_INVENTORY },
        { action: UPDATE_ACTION, resource: PARTICIPATING_PROJECT_INVENTORY },
    ])
    @Patch('elements/:elementUid')
    async updateInventoryElement(
        @Param() params: UpdateInventoryElementParamsDto,
        @Body() body: UpdateInventoryElementBodyDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryElementService.updateInventoryElement({
            token: authorization,
            ...params,
            ...body,
        });
    }

    //-----------------------------------------------------------------------

    @ApiOperation({
        summary: 'Add a new property to the given inventory element',
        description:
            'Create a new property and adds it to the inventory element identifiy by  **elementUid**.',
    })
    @ApiOkResponse({
        description: 'The updated inventory element',
        type: InventoryElementDto,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: UPDATE_ACTION, resource: INVENTORY },
        { action: UPDATE_ACTION, resource: OWN_PROJECT_INVENTORY },
        { action: UPDATE_ACTION, resource: PARTICIPATING_PROJECT_INVENTORY },
    ])
    @Patch('elements/:elementUid/properties')
    async addPropertyToElement(
        @Param() params: AddInventoryElementPropertyParamsDto,
        @Body() body: AddInventoryElementPropertyBodyDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryElementService.addPropertyToInventoryElement({
            token: authorization,
            ...params,
            ...body,
        });
    }

    //-----------------------------------------------------------------------

    @ApiOperation({
        summary: 'Update an inventory property',
        description:
            'Update an inventory property identified by **elementUid** in a project identified by **projectId**.',
    })
    @ApiOkResponse({
        description: 'The updated inventory property',
        type: InventoryElementPropertyDto,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: UPDATE_ACTION, resource: ELEMENT_PROPERTY },
        { action: UPDATE_ACTION, resource: OWN_PROJECT_ELEMENT_PROPERTY },
        { action: UPDATE_ACTION, resource: PARTICIPATING_PROJECT_ELEMENT_PROPERTY },
    ])
    @Patch('elements/:elementUid/properties/:propertyUid')
    async updateInventoryElementProperty(
        @Param() params: UpdateInventoryPropertyParamsDto,
        @Body() body: UpdateInventoryPropertyBodyDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryElementService.updateInventoryElementProperty({
            token: authorization,
            ...params,
            ...body,
        });
    }

    //-----------------------------------------------------------------------

    @ApiOperation({
        summary: 'Delete an inventory property',
        description:
            'Delete an inventory property identified by **uid** in a project identified by **projectId**.',
    })
    @ApiOkResponse({
        description: 'The deleted inventory property',
        type: InventoryElementPropertyDto,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: UPDATE_ACTION, resource: ELEMENT_PROPERTY },
        { action: UPDATE_ACTION, resource: OWN_PROJECT_ELEMENT_PROPERTY },
        { action: UPDATE_ACTION, resource: PARTICIPATING_PROJECT_ELEMENT_PROPERTY },
    ])
    @Delete('elements/:elementUid/properties/:propertyUid')
    async deleteInventoryElementProperty(
        @Param() params: DeleteInventoryPropertyParamsDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryElementService.deleteInventoryElementProperty({
            token: authorization,
            ...params
        });
    }

    //-----------------------------------------------------------------------
    //=======================================================================
    //= Update
    //=======================================================================
    //----------------------------------------------------------------------- 

    @ApiOperation({
        summary: 'Delete an inventory element',
        description:
            'Delete an inventory element identified by **uid** in a project identified by **projectId**.',
    })
    @ApiOkResponse({
        description: 'The deleted inventory element',
        type: InventoryElementDto,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: DELETE_ACTION, resource: INVENTORY },
        { action: DELETE_ACTION, resource: OWN_PROJECT_INVENTORY },
        { action: DELETE_ACTION, resource: PARTICIPATING_PROJECT_INVENTORY },
    ])
    @Delete('elements/:elementUid')
    async deleteInventoryElement(
        @Param() params: DeleteInventoryElementParamsDto,
        @Headers() { authorization },
    ) {
        return await this.inventoryElementService.deleteInventoryElement({
            token: authorization,
            ...params,
        });
    }
}
