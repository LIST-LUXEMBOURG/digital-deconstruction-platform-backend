/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiAccessControl, ApiAccessGuard, ApiAuth, ApiAuthGuard, CREATE_ACTION, DELETE_ACTION, READ_ACTION, UPDATE_ACTION } from '../FWAjs-utils';
import { OWN_PROJECT_3D_SCAN_CONFIG, PARTICIPATING_PROJECT_3D_SCAN_CONFIG, PROJECT_3D_SCAN_CONFIG } from './accessControl/resourcesName.constants';
import { CreateScanConfigBodyDto, CreateScanConfigParamsDto } from './dto/create-scan-config.dto';
import { DeleteScanConfigDto } from './dto/delete-scan-config.dto';
import { ScanConfigGetOneDto } from './dto/get-one-scan-config.dto';
import { ListScanConfigDto } from './dto/list-scan-config.dto';
import { ScanConfigDto } from './dto/scan-config.dto';
import { UpdateScanConfigBodyDto, UpdateScanConfigParamsDto } from './dto/update-scan-config.dto';
import { Scan3dConfigService } from './scan-config.service';

@ApiTags('Scans')
@Controller('projects/:projectId')
@UseGuards(ApiAuthGuard, ApiAccessGuard)
export class Scan3dConfigController {

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //----------------------------------------------------------------------- 

    constructor(
        private readonly scan3dConfigService: Scan3dConfigService
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

    // --- Create a project's 3D scan config ---
    @ApiOperation({
        summary: 'Create a new scan configuration',
        description: 'Create a new scan configuration for the project identified by **projectId**.',
    })
    @ApiCreatedResponse({
        description: 'The scan configuration has been successfully created',
        type: ScanConfigDto,
    })
    @Post('scan/config')
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: CREATE_ACTION, resource: PROJECT_3D_SCAN_CONFIG },
        { action: CREATE_ACTION, resource: OWN_PROJECT_3D_SCAN_CONFIG },
        { action: CREATE_ACTION, resource: PARTICIPATING_PROJECT_3D_SCAN_CONFIG }
    ])

    async createScanConfig(
        @Headers() { authorization },
        @Param() params: CreateScanConfigParamsDto,
        @Body() body: CreateScanConfigBodyDto
    ): Promise<ScanConfigDto> {
        return await this.scan3dConfigService.createScanConfig({
            token: authorization,
            ...params,
            ...body
        });
    }

    //-----------------------------------------------------------------------
    //=======================================================================
    //= Read
    //=======================================================================
    //----------------------------------------------------------------------- 

    @ApiOperation({
        summary: 'Lists scan configuration',
        description: 'Returns scan configurations for the project identified by **projectId**.',
    })
    @ApiCreatedResponse({
        description: 'The list of scan configurations has been successfully retrieved',
        type: ScanConfigDto,
    })
    @Get('scan/config')
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: PROJECT_3D_SCAN_CONFIG },
        { action: READ_ACTION, resource: OWN_PROJECT_3D_SCAN_CONFIG },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT_3D_SCAN_CONFIG }
    ])
    async listScanConfig(
        @Headers() { authorization },
        @Param() params: ListScanConfigDto,
    ): Promise<ScanConfigDto[]> {
        return await this.scan3dConfigService.listScanConfig({
            token: authorization,
            ...params
        });
    }

    //----------------------------------------------------------------------- 

    @ApiOperation({
        summary: 'Get one scan configuration',
        description: 'Get the scan configuration identified by **scanConfigId** for the project identified by **projectId**.',
    })
    @ApiCreatedResponse({
        description: 'The scan configuration has been successfully retrieved',
        type: ScanConfigDto,
    })
    @Get('scan/config/:scanConfigId')
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: PROJECT_3D_SCAN_CONFIG },
        { action: READ_ACTION, resource: OWN_PROJECT_3D_SCAN_CONFIG },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT_3D_SCAN_CONFIG }
    ])
    async getScanConfig(
        @Headers() { authorization },
        @Param() params: ScanConfigGetOneDto,
    ): Promise<ScanConfigDto> {
        return await this.scan3dConfigService.getScanConfig({
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
        summary: 'Update one scan configuration',
        description: 'Update the scan configuration identified by **scanConfigId** for the project identified by **projectId**.',
    })
    @ApiCreatedResponse({
        description: 'The project scan configuration has been successfully updated',
        type: ScanConfigDto,
    })
    @Patch('scan/config/:scanConfigId')
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: UPDATE_ACTION, resource: PROJECT_3D_SCAN_CONFIG },
        { action: UPDATE_ACTION, resource: OWN_PROJECT_3D_SCAN_CONFIG },
        { action: UPDATE_ACTION, resource: PARTICIPATING_PROJECT_3D_SCAN_CONFIG }
    ])
    async updateScanConfig(
        @Headers() { authorization },
        @Param() params: UpdateScanConfigParamsDto,
        @Body() body: UpdateScanConfigBodyDto,
    ): Promise<ScanConfigDto> {
        return await this.scan3dConfigService.updateScanConfig({
            token: authorization,
            ...params,
            ...body
        });
    }

    //-----------------------------------------------------------------------
    //=======================================================================
    //= Update
    //=======================================================================
    //----------------------------------------------------------------------- 

    @ApiOperation({
        summary: 'Delete one scan configuration',
        description: 'Delete the scan configuration identified by **scanConfigId** for the project identified by **projectId**.',
    })
    @ApiCreatedResponse({
        description: 'The project scan configuration has been successfully deleted',
        type: ScanConfigDto,
    })
    @Delete('scan/config/:scanConfigId')
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: DELETE_ACTION, resource: PROJECT_3D_SCAN_CONFIG },
        { action: DELETE_ACTION, resource: OWN_PROJECT_3D_SCAN_CONFIG },
        { action: DELETE_ACTION, resource: PARTICIPATING_PROJECT_3D_SCAN_CONFIG }
    ])
    async deleteScanConfig(
        @Headers() { authorization },
        @Param() params: DeleteScanConfigDto,
    ): Promise<ScanConfigDto> {
        return await this.scan3dConfigService.deleteScanConfig({
            token: authorization,
            ...params
        });
    }
}
