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
    Patch,
    Post,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiConsumes,
    ApiInternalServerErrorResponse,
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
    ApiFile,
    CREATE_ACTION,
    READ_ACTION,
} from '../../FWAjs-utils';
import { PARTICIPATING_PROJECT } from '../accessControl/resourcesName.constants';
import {
    INVENTORY,
    OWN_PROJECT_INVENTORY,
} from './accessControl/resourcesName.constants';


import { InventoryService } from './inventory.service';


@ApiTags('Inventory')
@Controller('projects')
@UseGuards(ApiAuthGuard, ApiAccessGuard)
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) { }

    //-----------------------------------------------------------------------
    //-- Routes using InventoryService --------------------------------------
    //-----------------------------------------------------------------------

    @ApiOperation({
        summary: 'Create or update a project inventory',
        description: `Create or update a project inventory by uploading a well-formatted json file. <br/>\
            Example:  
            <pre>
            <code>
            [{
                &emsp;"Name": "Stair:Residential - 200mm Max Riser 250mm Tread:198878",
                &emsp;"IfcId": "21ldoMpbP4VfsJ0XGY_34d", 
                &emsp;"RevitId": "198878", 
                &emsp;"IfcType": "IfcStair", 
                &emsp;"Description": "placeholder string", 
                &emsp;"ClassificationCode": "placeholder code", 
                &emsp;"Location": "Level 1", 
                &emsp;"ReusePotential": "0,55", 
                &emsp;"Volume": 0.0, 
                &emsp;"MaterialVolumes": [{ 
                &emsp;&emsp;"Material": { 
                &emsp;&emsp;&emsp;"Name": "Wood - Flooring", 
                &emsp;&emsp;&emsp;"TotalVolume": 0.0 
                &emsp;&emsp;}, 
                &emsp;&emsp;"Volume": 0.0 
                &emsp;}] 
            }, {
                &emsp;another object...
            }]
            </code>
            </pre>
            `,
    })
    @ApiOkResponse({
        description: 'Inventory successfully uploaded',
    })
    @ApiBadRequestResponse({
        description:
            'The file does not have the right format, see documentation.',
    })
    @ApiInternalServerErrorResponse({
        description: 'Cannot import inventory file',
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: CREATE_ACTION, resource: INVENTORY },
        { action: CREATE_ACTION, resource: OWN_PROJECT_INVENTORY },
        { action: CREATE_ACTION, resource: PARTICIPATING_PROJECT },
    ])
    @ApiParam({
        name: 'projectId',
        description: 'The project internal ID',
    })
    @ApiConsumes('multipart/form-data')
    @ApiFile('file')
    @UseInterceptors(AnyFilesInterceptor())
    @Post(':projectId/inventory')
    async upsertProjectInventory(
        @Param('projectId') projectId: number,
        @Headers() { authorization },
        @UploadedFiles() files: Array<Express.Multer.File>,
    ) {
        return await this.inventoryService.upsertInventory({
            projectId,
            token: authorization,
            file: files[0],
        });
    }




}
