/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { ApiProperty } from "@nestjs/swagger";
import { Authorization } from "../../../FWAjs-utils/utils/auth.interface";

export class ProjectFileDto extends Authorization {
    @ApiProperty({
        required: false,
        type: String,
        description: 'The project-file title',
    })
    title: string;

    @ApiProperty({
        required: true,
        type: Number,
        description: 'The project internal ID',
    })
    projectId: number;

    @ApiProperty({
        required: false,
        type: String,
        description: 'The file internal UUID',
    })
    fileUid: string;

    @ApiProperty({
        required: false,
        type: String,
        description: 'The project-file description (exact match)',
    })
    description: string;

    @ApiProperty({
        required: false,
        type: Number,
        description: 'The  project-file location identifier',
    })
    locationId: number;

    @ApiProperty({
        required: false,
        type: String,
        description: 'The document author',
    })
    documentAuthor: string;

    @ApiProperty({
        required: false,
        type: String,
        description: 'The document date',
    })
    documentDate: string;

    // ---- File properties ----

    // A short name for the file, e.g. to diplay in lists.
    @ApiProperty({
        type: String,
        description:
            'The formated file name used to identify and sotre the file in the file-system',
        required: false,
    })
    name: string;

    // The original file name with its extension
    @ApiProperty({
        type: String,
        description: 'The original file name with its extension',
        required: false,
    })
    originalName: string;

    // The internal ID of the user who uploaded the file
    @ApiProperty({
        type: Number,
        description: 'The internal ID of the user who uploaded the file',
        required: false,
    })
    uploadedBy: number;

    // The date and time of object creation, in UTC (Zulu time) format
    @ApiProperty({
        type: String,
        description:
            'The date and time of object creation, in UTC (Zulu time) format',
        required: false,
    })
    uploadedAt: string;

    // The date and time of object modification, in UTC (Zulu time) format
    @ApiProperty({
        type: String,
        description:
            'The date and time of object modification, in UTC (Zulu time) format',
        required: false,
    })
    updatedAt: string;

    // The file size in number of bytes
    @ApiProperty({
        type: Number,
        description: 'The file size in number of bytes',
        required: false,
    })
    size: number;

    // The file path in the file system (UNIX format)
    @ApiProperty({
        type: String,
        description: 'The file path in the file system (UNIX format)',
        required: false,
    })
    filePath: string;

    // The file mime-type
    @ApiProperty({
        type: String,
        description: 'The file mime-type',
        required: false,
    })
    fileType: string;
}