/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import {
    Controller,
    Get,
    Headers,
    HttpStatus,
    Param, Query,
    Response
} from '@nestjs/common';
import {
    ApiBearerAuth, ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags
} from '@nestjs/swagger';
import { ApiAuth, ApiFwaException } from '../FWAjs-utils';
import { getTag } from '../utils/ordered-swagger-tag';
import { GetOneDto } from './dto/get-one.dto';
import { FileService } from './file.service';

// Only for testing purpose, not loaded in production
@ApiTags('Files')
@Controller('files')
export class FileController {
    constructor(private readonly fileService: FileService) { }

    @ApiOperation({
        summary: 'Download a file identified by UUID',
        description:
            'Return a "ReadStream" object with the appropriate download headers (content-disposition, size,...)',
    })
    @ApiOkResponse({
        description: 'A binary file',
    })
    @ApiFwaException(ApiNotFoundResponse, 'File not found', {
        code: HttpStatus.NOT_FOUND,
        message:
            'File not found at location: "filePath" or File not found in the database',
        messageCode: 'fileNotFound',
        messageData: {
            filePath: '/file/path',
        },
    })
    @ApiAuth()
    @ApiBearerAuth()
    @Get('/:uuid')
    async downloadFile(
        @Query() query: GetOneDto,
        @Param('uuid') uuid: string,
        @Headers() { authorization },
        @Response({ passthrough: false }) response,
    ) {
        try {
            const { stream, metadata } = await this.fileService.stream({
                uuid,
                token: authorization,
            });
            response.set({
                // 'Content-Type': 'text/plain',  // metadata.contentType ? meta.contentType : application/octet-stream
                'Content-Disposition': `attachment; filename="${metadata.originalName}"`,
            });
            stream.pipe(response);
        } catch (error) {
            console.error('download file error', error);
        }
    }
}
