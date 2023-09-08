/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

// import { DeepPartial } from 'typeorm';
import { Authorization } from '../../FWAjs-utils/utils/auth.interface';
import { File } from '../entities/file.entity';

// export type UploadDto = DeepPartial<File>;

export class UploadDto extends Authorization {
    file: Express.Multer.File;
    metadata: UploadMetadataDto;
}

// file field
// fieldname: 'file',
// originalname: 'dart.txt',
// encoding: '7bit',
// mimetype: 'text/plain',
// buffer: <Buffer 20 0a 69 6d  ... 401 more bytes>,
// size: 451,

export class UploadMetadataDto {
    name: string;
    originalName?: string; // from file
    uploadedBy?: number;
    uploadedAt?: string;
    updatedAt?: string;
    size: number;
    filePath: string;
    fileType: string;
}

export const UploadFileOpenApi = {
    name: {
        type: 'string',
        description:
            'The format file name used to identify and store the file in the file-system',
    },
    filePath: {
        type: 'string',
        description:
            'The path where the file will be stored in the file-system',
    },
};

export type UploadResponse = File;

export class UpdateMetadataDto {
    uuid?: string;
    name: string;
    originalName?: string; // from file
    uploadedBy?: number;
    uploadedAt?: string;
    updatedAt?: string;
    size: number;
    filePath: string;
    fileType: string;
}

export class UpdateDto extends Authorization {
    file: Express.Multer.File;
    metadata: UpdateMetadataDto;
}
