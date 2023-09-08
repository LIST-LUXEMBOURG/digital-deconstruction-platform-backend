/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { Headers, Body, Controller, Param, Response, Post, UploadedFiles, UseGuards, UseInterceptors, Delete, Get, Patch } from "@nestjs/common";
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { ApiAccessControl, ApiAccessGuard, ApiAuth, ApiAuthGuard, ApiFile, CREATE_ACTION, DELETE_ACTION, READ_ACTION, UPDATE_ACTION } from "../../FWAjs-utils";
import { INVENTORY_FILE, OWN_PROJECT_INVENTORY_FILE, PARTICIPATING_PROJECT_INVENTORY_FILE } from "./accessControl/resourcesName.constants";
import { CreateInventoryFileBodyDto, CreateInventoryFileOpenApi, CreateInventoryFileParamsDto } from "./dto/create-inventory-file.dto";
import { DeleteInventoryFileParamsDto } from "./dto/delete-inventory-file.dto";
import { InventoryFileGetOneDto } from "./dto/get-one-inventory-file.dto";
import { InventoryFileDto } from "./dto/inventory-file.dto";
import { UpdateInventoryFileBodyDto, UpdateInventoryFileParamsDto } from "./dto/update-inventory-file.dto";
import { InventoryFileService } from "./inventory-file.service";

@ApiTags('Inventory Documents')
@Controller('projects/:projectId/inventory/elements/types/:elementTypeUid')
@UseGuards(ApiAuthGuard, ApiAccessGuard)
export class InventoryFileController {
    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //----------------------------------------------------------------------- 

    constructor(
        private readonly inventoryFileService: InventoryFileService,
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
        summary: 'Upload an inventory document for an inventory element type',
        description:
            'Uploads an inventory document to to an element type identified by **elementTypeUid***.',
    })
    @ApiOkResponse({
        description: 'An inventory document',
        type: InventoryFileDto,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @Post('files')
    @ApiConsumes('multipart/form-data')
    @ApiFile('file', CreateInventoryFileOpenApi, ['file', 'title'])
    @UseInterceptors(AnyFilesInterceptor())
    @ApiAccessControl([
        { action: CREATE_ACTION, resource: INVENTORY_FILE },
        { action: CREATE_ACTION, resource: OWN_PROJECT_INVENTORY_FILE },
        { action: CREATE_ACTION, resource: PARTICIPATING_PROJECT_INVENTORY_FILE },
    ])
    async createInventoryDocument(
        @Param() params: CreateInventoryFileParamsDto,
        @Body() body: CreateInventoryFileBodyDto,
        @Headers() { authorization },
        @UploadedFiles() files: Array<Express.Multer.File>,
    ) {
        const result = await this.inventoryFileService.createInventoryDocument({
            token: authorization,
            ...params,
            ...body,
            files
        });

        return result;
    }

    //-----------------------------------------------------------------------
    //=======================================================================
    //= Read
    //=======================================================================
    //----------------------------------------------------------------------- 

    @ApiOperation({
        summary: 'Stream an inventory document for an inventory element type',
        description:
            'Streams an inventory document from an element type identified by **elementTypeUid***.',
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: INVENTORY_FILE },
        { action: READ_ACTION, resource: OWN_PROJECT_INVENTORY_FILE },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT_INVENTORY_FILE },
    ]) @Get('files/:inventoryFileUid/stream')
    async streamInventoryDocument(
        @Param() params: InventoryFileGetOneDto,
        @Headers() { authorization },
        @Response({ passthrough: false }) response,
    ) {
        const { stream, metadata } = await this.inventoryFileService.streamInventoryDocument({
            ...params,
            token: authorization,
        });

        response.set({
            'Content-Type': metadata.fileType
                ? metadata.fileType
                : 'application/octet-stream',
        });

        stream.pipe(response);
    }

    //----------------------------------------------------------------------- 

    @ApiOperation({
        summary: 'Download an inventory document for an inventory element type',
        description: `Downloads the content of an inventory document from an element type identified by **elementTypeUid***..`,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: INVENTORY_FILE },
        { action: READ_ACTION, resource: OWN_PROJECT_INVENTORY_FILE },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT_INVENTORY_FILE },
    ])
    @Get('files/:inventoryFileUid/')
    async downloadInventoryDocument(
        @Param() params: InventoryFileGetOneDto,
        @Headers() { authorization },
        @Response({ passthrough: false }) response,
    ) {
        const { stream, metadata } = await this.inventoryFileService.streamInventoryDocument({
            ...params,
            token: authorization,
        });

        response.set({
            'Content-Disposition': `attachment; filename="${metadata.originalName}"`,
        });

        stream.pipe(response);
    }
    //-----------------------------------------------------------------------
    //=======================================================================
    //= Update
    //=======================================================================
    //----------------------------------------------------------------------- 

    @ApiOperation({
        summary: 'Update an inventory document for an inventory element type',
        description: 'Updates an inventory document identified by **inventoryFileUid** for an element type identified by **elementTypeUid***',
    })
    @ApiOkResponse({
        description: 'Successfully updated an inventory document',
        type: InventoryFileDto,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @Patch('files/:inventoryFileUid')
    @ApiConsumes('multipart/form-data')
    @ApiFile('file', CreateInventoryFileOpenApi, ['file', 'title'])
    @UseInterceptors(AnyFilesInterceptor())
    @ApiAccessControl([
        { action: UPDATE_ACTION, resource: INVENTORY_FILE },
        { action: UPDATE_ACTION, resource: OWN_PROJECT_INVENTORY_FILE },
        { action: UPDATE_ACTION, resource: PARTICIPATING_PROJECT_INVENTORY_FILE },
    ])
    async updateInventoryDocument(
        @Param() params: UpdateInventoryFileParamsDto,
        @Body() body: UpdateInventoryFileBodyDto,
        @Headers() { authorization },
        @UploadedFiles() files: Array<Express.Multer.File>,
    ) {
        const result = await this.inventoryFileService.updateInventoryDocument({
            token: authorization,
            ...params,
            ...body,
            files
        });

        return result;
    }

    //-----------------------------------------------------------------------
    //=======================================================================
    //= Delete
    //=======================================================================
    //----------------------------------------------------------------------- 

    @ApiOperation({
        summary: 'Delete an inventory document for an inventory element type',
        description: 'Deletes an inventory document identified by **inventoryFileUid** from an element type identified by **elementTypeUid***',
    })
    @ApiOkResponse({
        description: 'Successfully deleted a project document',
        type: InventoryFileDto,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @Delete('files/:inventoryFileUid')
    @ApiAccessControl([
        { action: DELETE_ACTION, resource: INVENTORY_FILE },
        { action: DELETE_ACTION, resource: OWN_PROJECT_INVENTORY_FILE },
        { action: DELETE_ACTION, resource: PARTICIPATING_PROJECT_INVENTORY_FILE },
    ])
    async deleteProjectFile(
        @Param() params: DeleteInventoryFileParamsDto,
        @Headers() { authorization },
    ) {
        const result = await this.inventoryFileService.deleteInventoryDocument({
            token: authorization,
            ...params,
        });

        return result;
    }
}