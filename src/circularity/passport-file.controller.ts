/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Response, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiAccessControl, ApiAccessGuard, ApiAuth, ApiAuthGuard, ApiFile, CREATE_ACTION, DELETE_ACTION, READ_ACTION, UPDATE_ACTION } from "../FWAjs-utils";
import { OWN_PROJECT_PASSPORT_FILE, PARTICIPATING_PROJECT_PASSPORT_FILE, PASSPORT_FILE } from "./accessControl/resourcesName.constants";
import { CreatePassportFileBodyDto, CreatePassportFileOpenApi, CreatePassportFileParamsDto } from "./dto/create-passport-file.dto";
import { DeletePassportFileParamsDto } from "./dto/delete-passport-file.dto";
import { PassportFileGetOneDto } from "./dto/get-one-passport-file.dto";
import { ListPassportFilesDto } from "./dto/list-passport-files.dto";
import { PassportFileDto } from "./dto/passport-file.dto";
import { UpdatePassportFileBodyDto, UpdatePassportFileOpenApi, UpdatePassportFileParamsDto } from "./dto/update-passport-file.dto";
import { PassportFileService } from "./passport-file.service";

@ApiTags('Circularity - Material Passports')
@Controller('projects/:projectId/inventory/circularity/:circularityUid')
@UseGuards(ApiAuthGuard, ApiAccessGuard)
export class PassportFileController {
    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //----------------------------------------------------------------------- 

    constructor(
        private readonly passportFileService: PassportFileService,
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
        summary: 'Upload a (material) passport document for a circularity object',
        description:
            'Uploads an passport document to to a circularity object identified by **circularityUid***.',
    })
    @ApiOkResponse({
        description: 'A (material) passport document',
        type: PassportFileDto,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @Post('files')
    @ApiConsumes('multipart/form-data')
    @ApiFile('file', CreatePassportFileOpenApi, ['file', 'title'])
    @UseInterceptors(AnyFilesInterceptor())
    @ApiAccessControl([
        { action: CREATE_ACTION, resource: PASSPORT_FILE },
        { action: CREATE_ACTION, resource: OWN_PROJECT_PASSPORT_FILE },
        { action: CREATE_ACTION, resource: PARTICIPATING_PROJECT_PASSPORT_FILE },
    ])
    async createPassportDocument(
        @Param() params: CreatePassportFileParamsDto,
        @Body() body: CreatePassportFileBodyDto,
        @Headers() { authorization },
        @UploadedFiles() files: Array<Express.Multer.File>,
    ) {
        const result = await this.passportFileService.createPassportDocument({
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

    //-----------------------------------------------------------------------
    //=======================================================================
    //= Read
    //=======================================================================
    //-----------------------------------------------------------------------

    @ApiOperation({
        summary: 'List the passport documents for a given circularity object',
        description:
            'Return the list of passport documents for the circularity object identified by *circularityUid** in the project identified by **projectId**.',
    })
    @ApiOkResponse({
        description: 'A list of passport documents',
        type: PassportFileDto,
        isArray: true,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: PASSPORT_FILE },
        { action: READ_ACTION, resource: OWN_PROJECT_PASSPORT_FILE },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT_PASSPORT_FILE },
    ])
    @Get('files')
    async getPassportDocuments(
        @Param() params: ListPassportFilesDto,
        @Headers() { authorization },
    ) {
        return await this.passportFileService.listPassportDocuments({
            token: authorization,
            ...params,
        });
    }

    //-----------------------------------------------------------------------

    @ApiOperation({
        summary: 'Stream a (material) passport document for a circularity object',
        description:
            'Streams an (material) passport document for a circularity object identified by **circularityUid***.',
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: PASSPORT_FILE },
        { action: READ_ACTION, resource: OWN_PROJECT_PASSPORT_FILE },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT_PASSPORT_FILE },
    ]) @Get('files/:passportFileUid/stream')
    async streamPassportDocument(
        @Param() params: PassportFileGetOneDto,
        @Headers() { authorization },
        @Response({ passthrough: false }) response,
    ) {
        const { stream, metadata } = await this.passportFileService.streamPassportDocument({
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
        summary: 'Download a (material) passport document for a circularity object',
        description: `Downloads the content of a (material) passport document for a circularity object identified by **circularityUid***..`,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: PASSPORT_FILE },
        { action: READ_ACTION, resource: OWN_PROJECT_PASSPORT_FILE },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT_PASSPORT_FILE },
    ])
    @Get('files/:passportFileUid/')
    async downloadPassportDocument(
        @Param() params: PassportFileGetOneDto,
        @Headers() { authorization },
        @Response({ passthrough: false }) response,
    ) {
        const { stream, metadata } = await this.passportFileService.streamPassportDocument({
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
        summary: 'Update a (material) passport document for a circularity object',
        description: 'Updates a (material) passport document identified by **passportFileUid** for a a circularity object identified by **circularityUid***',
    })
    @ApiOkResponse({
        description: 'Successfully updated a (material) passport document',
        type: PassportFileDto,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @Patch('files/:passportFileUid')
    @ApiConsumes('multipart/form-data')
    @ApiFile('file', UpdatePassportFileOpenApi, [])
    @UseInterceptors(AnyFilesInterceptor())
    @ApiAccessControl([
        { action: UPDATE_ACTION, resource: PASSPORT_FILE },
        { action: UPDATE_ACTION, resource: OWN_PROJECT_PASSPORT_FILE },
        { action: UPDATE_ACTION, resource: PARTICIPATING_PROJECT_PASSPORT_FILE },
    ])
    async updatePassportDocument(
        @Param() params: UpdatePassportFileParamsDto,
        @Body() body: UpdatePassportFileBodyDto,
        @Headers() { authorization },
        @UploadedFiles() files: Array<Express.Multer.File>,
    ) {
        const result = await this.passportFileService.updatePassportDocument({
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
        summary: 'Delete a (material) passport document for a circularity object',
        description: 'Deletes a (material) passport identified by **passportFileUid** from a circularity identified by **circularityUid***',
    })
    @ApiOkResponse({
        description: 'Successfully deleted a (material) passport document',
        type: PassportFileDto,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @Delete('files/:passportFileUid')
    @ApiAccessControl([
        { action: DELETE_ACTION, resource: PASSPORT_FILE },
        { action: DELETE_ACTION, resource: OWN_PROJECT_PASSPORT_FILE },
        { action: DELETE_ACTION, resource: PARTICIPATING_PROJECT_PASSPORT_FILE },
    ])
    async deleteProjectFile(
        @Param() params: DeletePassportFileParamsDto,
        @Headers() { authorization },
    ) {
        const result = await this.passportFileService.deletePassportDocument({
            token: authorization,
            ...params,
        });

        return result;
    }
}