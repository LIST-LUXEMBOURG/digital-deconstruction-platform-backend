/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import {
    Body,
    Controller,
    Get,
    Headers,
    Param,
    Put,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiTags,
} from '@nestjs/swagger';
import { ApiAccessGuard, ApiAuth, ApiAuthGuard } from '../../FWAjs-utils';
import { BimModelService } from './bim-model.service';


import { AutodeskAccessTokenResponse } from './dto/autodesk-access-token.dto';
import { CreateAutodeskCredentialsBodyDto, CreateAutodeskCredentialsParamsDto } from './dto/create-autodesk-credentials.dto';

@ApiTags('Autodesk Forge')
@Controller('projects')
@UseGuards(ApiAuthGuard, ApiAccessGuard)
export class BimModelController {

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //----------------------------------------------------------------------- 

    constructor(private readonly bimModelService: BimModelService) { }

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
        summary: 'Creates Autodesk credentials for the given project',
        description: 'Stores the given Autodesk Forge BIM model provided in Urn together with the given credentials for the given project',
    })
    @ApiOkResponse({
        description: 'Successfully requested an Autodesk access token for the specified project',
        type: AutodeskAccessTokenResponse,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @Put(':projectId/autodesk')
    async saveAutodeskCredentials(
        @Param() params: CreateAutodeskCredentialsParamsDto,
        @Body() body: CreateAutodeskCredentialsBodyDto,
        @Headers() { authorization },
    ) {
        return await this.bimModelService.saveAutodeskCredentials({
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
        summary: 'Get an Autodesk access token for the current project',
        description: 'WIP',
    })
    @ApiOkResponse({
        description: 'Successfully requested an Autodesk access token for the specified project',
        type: AutodeskAccessTokenResponse,
    })

    @ApiAuth()
    @ApiBearerAuth()
    @ApiParam({
        name: 'projectId',
        description: 'The project internal ID',
    })
    @Get(':projectId/autodesk')
    async getAutodeskAccessToken(
        @Param('projectId') projectId: number,
        @Headers() { authorization },
    ) {
        return await this.bimModelService.getAutodeskAccessToken({
            projectId,
            token: authorization,
        });
    }

    //-----------------------------------------------------------------------


}
