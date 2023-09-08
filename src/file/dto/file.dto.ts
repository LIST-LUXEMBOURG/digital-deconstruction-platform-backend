import { Authorization } from "../../FWAjs-utils/utils/auth.interface";

/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

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

export class UploadFileDto extends Authorization {
    uuid?: string;
    file: Express.Multer.File;
    metadata: UploadMetadataDto;
}

export class FileDto {
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