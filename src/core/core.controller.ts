/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { Controller, Get, Query, Headers, UseGuards, Param, Post, Body } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { ApiAccessGuard, ApiAuth, ApiAuthGuard } from "../FWAjs-utils";
import { CoreService } from "./core.service";
import { ClassificationSystem } from "./entities/classification-system.entity";
import { ClassificationEntryQueryDto } from "./dto/classification-entries.dto";
import { ClassificationEntry } from "./entities/classification-entry.entity";
import { ClassificationEntryByCodeParamsDto } from "./dto/get-classification-entry-by-code.dto";
import { PropertyUnit } from "./entities/property-unit.entity";
import { PropertyType } from "./entities/property-type.entity";
import { CreatePropertyTypeBodyDto } from "./dto/create-property-type.dto";

@ApiTags('Core')
@Controller('core')
@UseGuards(ApiAuthGuard, ApiAccessGuard)
export class CoreController {
    constructor(
        private readonly coreService: CoreService,
    ) { }

    //-----------------------------------------------------------------------
    //-- Routes using InventoryElementService -------------------------------
    //-----------------------------------------------------------------------

    @ApiOperation({
        summary: 'List the available classification system',
        description:
            'Return the list of classification systems supported by the platform.',
    })
    @ApiOkResponse({
        description: 'A list of classification systems',
        type: ClassificationSystem,
        isArray: true,
    })
    @ApiAuth()
    @ApiBearerAuth()

    @Get('classification-systems')
    async getClassificationSystems(
        @Headers() { authorization },
    ) {
        return await this.coreService.getClassificationSystems({
            token: authorization
        });
    }

    //-----------------------------------------------------------------------
    //-- Routes using InventoryElementService -------------------------------
    //-----------------------------------------------------------------------

    @ApiOperation({
        summary: 'List the available classification entries',
        description:
            'Return the list of classification entries available in all available classification systems',
    })
    @ApiOkResponse({
        description: 'A list of classification entries',
        type: ClassificationEntry,
        isArray: true,
    })
    @ApiAuth()
    @ApiBearerAuth()

    @Get('classification-entries')
    async getClassificationEntries(
        @Query() query: ClassificationEntryQueryDto,
        @Headers() { authorization },
    ) {
        return await this.coreService.getClassificationEntries({
            token: authorization,
            ...query,
        });
    }

    //-----------------------------------------------------------------------

    @Get('classification-systems/:systemName/classification-entries/:entryCode')
    async getClassificationEntry(

        @Param() params: ClassificationEntryByCodeParamsDto,
        @Headers() { authorization },
    ) {
        return await this.coreService.getClassificationEntryByCode({
            token: authorization,
            ...params,
        });
    }

    //-----------------------------------------------------------------------
    //-- Property Units -----------------------------------------------------
    //-----------------------------------------------------------------------

    @ApiOperation({
        summary: 'List the available property units',
        description:
            'Return the list of property units supported by the platform.',
    })
    @ApiOkResponse({
        description: 'A list of property units',
        type: PropertyUnit,
        isArray: true,
    })
    @ApiAuth()
    @ApiBearerAuth()

    @Get('property-units')
    async getPropertyUnits(
        @Headers() { authorization },
    ) {
        return await this.coreService.getPropertyUnits({
            token: authorization
        });
    }

    //-----------------------------------------------------------------------
    //-- Property Types -----------------------------------------------------
    //-----------------------------------------------------------------------

    @ApiOperation({
        summary: 'List the available property types',
        description:
            'Return the list of property types supported by the platform.',
    })
    @ApiOkResponse({
        description: 'A list of property types',
        type: PropertyType,
        isArray: true,
    })
    @ApiAuth()
    @ApiBearerAuth()

    @Get('property-types')
    async getPropertyTypes(
        @Headers() { authorization },
    ) {
        return await this.coreService.getPropertyTypes({
            token: authorization
        });
    }

    //-----------------------------------------------------------------------

    @ApiOperation({
        summary: 'Add a new property type',
        description:
            'Create a new property type',
    })
    @ApiOkResponse({
        description: 'The newly created property type',
        type: PropertyType,
    })
    @ApiAuth()
    @ApiBearerAuth()

    @Post('property-types')
    async createPropertyType(
        @Body() body: CreatePropertyTypeBodyDto,
        @Headers() { authorization },
    ) {
        return await this.coreService.createPropertyType({
            token: authorization,
            ...body,
        });
    }
}
