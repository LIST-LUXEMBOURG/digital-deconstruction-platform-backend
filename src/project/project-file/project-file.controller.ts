/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import {
    Body,
    Controller,
    Delete,
    Get,
    Headers,
    HttpStatus,
    Param,
    Patch,
    Post, Query, Response,
    UploadedFile,
    UploadedFiles,
    UseGuards,
    UseInterceptors
} from '@nestjs/common';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import {
    ApiBearerAuth,
    ApiConflictResponse,
    ApiConsumes, ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiTags
} from '@nestjs/swagger';
import {
    ApiAccessControl,
    ApiAccessGuard,
    ApiAuth,
    ApiAuthGuard,
    ApiFile,
    ApiFwaException,
    CREATE_ACTION, DELETE_ACTION, READ_ACTION,
    UPDATE_ACTION
} from '../../FWAjs-utils';
import { getTag } from '../../utils/ordered-swagger-tag';
import { CANNOT_FIND_PROJECT } from '../constants';
import { OWN_PROJECT_DOCUMENT, PARTICIPATING_PROJECT_DOCUMENT, PROJECT_DOCUMENT } from './accessControl/resourcesName.constants';
import { PROJECT_DOCUMENT_WITH_SAME_TITLE_ALREADY_EXISTS_FOR_PROJECT } from './constants';
import { CreateProjectFileBodyDto, CreateProjectFileOpenApi, CreateProjectFileParamsDto } from './dto/create-project-file.dto';
import { DeleteProjectFileDto } from './dto/delete-project-file.dto';
import { ProjectFileGetOneDto } from './dto/get-one-project-file.dto';
import { ListProjectFilesDto, ListProjectFilesParamsDto, ListProjectFilesQueryDto } from './dto/list-project-files.dto';
import { UpdateProjectFileBodyDto, UpdateProjectFileParamsDto } from './dto/update-project-file.dto';
import { ProjectFile } from './entities/projectFile.entity';
import { ProjectFileService } from './project-file.service';
import { StreamProjectFileResponse } from './dto/stream-project-file.dto';

@ApiTags('Projects - Documents')
@Controller('projects')
@UseGuards(ApiAuthGuard, ApiAccessGuard)
export class ProjectFileController {

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //----------------------------------------------------------------------- 

    constructor(private readonly projectFileService: ProjectFileService) { }

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
        summary: 'Upload a single document',
        description: `Submit one new document and its meta data to the project identified by **projectId**`,
    })
    @ApiOkResponse({
        description: 'Successfully uploaded a document (file) to the project',
        type: ProjectFile,
    })
    @ApiFwaException(ApiNotFoundResponse, '', {
        code: HttpStatus.NOT_FOUND,
        message: 'Project not found',
        messageCode: CANNOT_FIND_PROJECT,
        messageData: {
            projectId: 'projectId',
        },
    })
    @ApiFwaException(ApiConflictResponse, '', {
        code: HttpStatus.CONFLICT,
        message: 'A file with the same title already exists in the project',
        messageCode: PROJECT_DOCUMENT_WITH_SAME_TITLE_ALREADY_EXISTS_FOR_PROJECT,
        messageData: {
            projectId: 27,
            title: 'As build',
            locationId: 52
        },
        thrownOn: '2021-12-13T15:29:17.792Z',
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiParam({
        name: 'projectId',
        description: 'The internal project Id',
    })
    @Post(':projectId/files/')
    @ApiConsumes('multipart/form-data')
    @ApiFile('file', CreateProjectFileOpenApi, ['file', 'title'])
    @UseInterceptors(AnyFilesInterceptor())
    @ApiAccessControl([
        { action: CREATE_ACTION, resource: PROJECT_DOCUMENT },
        { action: CREATE_ACTION, resource: OWN_PROJECT_DOCUMENT },
        { action: CREATE_ACTION, resource: PARTICIPATING_PROJECT_DOCUMENT },
    ])
    async uploadProjectFile(
        @Param() params: CreateProjectFileParamsDto,
        @Body() body: CreateProjectFileBodyDto,
        @Headers() { authorization },
        @UploadedFiles() files: Array<Express.Multer.File>,
    ) {
        const result = await this.projectFileService.uploadProjectDocument({
            token: authorization,
            ...params,
            ...body,
            files,
        });

        return result;
    }

    //-----------------------------------------------------------------------
    //=======================================================================
    //= Read
    //=======================================================================
    //----------------------------------------------------------------------- 

    @ApiOperation({
        summary: 'List the documents of a project',
        description: `Return the documents in the project identified by **projectId**.`,
    })
    @ApiOkResponse({
        description: 'A list of project documents (file) meta-data',
        type: ProjectFile,
        isArray: true,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: PROJECT_DOCUMENT },
        { action: READ_ACTION, resource: OWN_PROJECT_DOCUMENT },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT_DOCUMENT },
    ])

    @Get(':projectId/files/')
    async getProjectFiles(
        @Param() params: ListProjectFilesParamsDto,
        @Query() query: ListProjectFilesQueryDto,
        @Headers() { authorization },
    ) {
        return await this.projectFileService.listProjectDocuments({
            token: authorization,
            ...params,
            ...query,
        });
    }

    //----------------------------------------------------------------------- 

    @ApiOperation({
        summary: 'Streams a project document',
        description: `Stream a project document for the project identified by **projectId**`,
    })
    @ApiOkResponse({
        description: 'Project file meta-data successfully changed',
        type: ProjectFile,
    })

    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: PROJECT_DOCUMENT },
        { action: READ_ACTION, resource: OWN_PROJECT_DOCUMENT },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT_DOCUMENT },
    ])
    @Get(':projectId/files/:projectFileId/stream')
    async getProjectFileStream(
        @Param() params: ProjectFileGetOneDto,
        @Headers() { authorization },
        @Response({ passthrough: false }) response,
    ) {
        const { stream, metadata } = await this.projectFileService.streamProjectDocumentFile({
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
        summary: 'Download the content of a project document',
        description: `Downloads the content the project document identified by **projectFileId"" in the project identified by **projectId**.`,
    })
    @ApiOkResponse({
        description: 'A list of project documents (file) meta-data',
        type: StreamProjectFileResponse,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: PROJECT_DOCUMENT },
        { action: READ_ACTION, resource: OWN_PROJECT_DOCUMENT },
        { action: READ_ACTION, resource: PARTICIPATING_PROJECT_DOCUMENT },
    ])
    @Get(':projectId/files/:projectFileId')
    async downloadProjectFile(
        @Param() params: ProjectFileGetOneDto,
        @Headers() { authorization },
        @Response({ passthrough: false }) response,
    ) {
        const { stream, metadata } = await this.projectFileService.streamProjectDocumentFile({
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
        summary: 'Modify an existing project file',
        description: `Modify the existing file identified by **projectFileId**, which is attached to the project identified by **projectId**`,
    })
    @ApiOkResponse({
        description: 'Project file meta-data successfully changed',
        type: ProjectFile,
    })
    @ApiFwaException(ApiNotFoundResponse, '', {
        code: HttpStatus.NOT_FOUND,
        message: 'Failed to lookup project document!',
        messageCode: 'failedToLookupProjectDocument',
        messageData: {
            fileId: 27,
        },
        thrownOn: '2021-12-13T15:29:17.792Z',
    })
    @ApiAuth()
    @ApiBearerAuth()
    @Patch(':projectId/files/:projectFileId')
    @ApiConsumes('multipart/form-data')
    @ApiFile('file', CreateProjectFileOpenApi, [])
    @UseInterceptors(AnyFilesInterceptor())
    @ApiAccessControl([
        { action: UPDATE_ACTION, resource: PROJECT_DOCUMENT },
        { action: UPDATE_ACTION, resource: OWN_PROJECT_DOCUMENT },
        { action: UPDATE_ACTION, resource: PARTICIPATING_PROJECT_DOCUMENT },
    ])
    async updateProjectFile(
        @Param() params: UpdateProjectFileParamsDto,
        @Body() body: UpdateProjectFileBodyDto,
        @Headers() { authorization },
        @UploadedFiles() files: Array<Express.Multer.File> | undefined | null,
    ) {
        const result = await this.projectFileService.updateProjectDocument({
            token: authorization,
            ...params,
            ...body,
            files: files.length > 0 ? files : undefined,
        });

        return result;
    }

    //-----------------------------------------------------------------------
    //=======================================================================
    //= Delete
    //=======================================================================
    //----------------------------------------------------------------------- 

    @ApiOperation({
        summary: 'Delete a project document',
        description: 'Delete a project document by its fileId (UUID)',
    })
    @ApiOkResponse({
        description: 'Successfully deleted a project document',
        type: ProjectFile,
    })
    @ApiAuth()
    @ApiBearerAuth()
    @Delete(':projectId/files/:projectFileId')
    @ApiAccessControl([
        { action: DELETE_ACTION, resource: PROJECT_DOCUMENT },
        { action: DELETE_ACTION, resource: OWN_PROJECT_DOCUMENT },
        { action: DELETE_ACTION, resource: PARTICIPATING_PROJECT_DOCUMENT },
    ])
    async deleteProjectFile(
        @Param() params: DeleteProjectFileDto,
        @Headers() { authorization },
    ) {
        const result = await this.projectFileService.deleteProjectDocument({
            ...params,
            token: authorization,
        });

        return result;
    }
}
