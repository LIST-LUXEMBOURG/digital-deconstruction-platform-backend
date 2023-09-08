/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { Authorization } from '../../FWAjs-utils/utils/auth.interface';
import { File } from '../entities/file.entity';

/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
export class ListDto extends Authorization {
    uuid?: string;
    name?: string;
    originalName?: string;
    uploadedBy?: number;
    // START Not display in Swagger because it requires an exact string date.
    uploadedAt?: string;
    updatedAt?: string;
    // END
    size?: number;
    filePath?: string;
    fileType?: string;
}

export class ListQueryDto {
    @ApiProperty({
        required: false,
        type: String,
        example: '342c8bb8-0d88-4ba1-8a0b-dacb160e4196',
        description: 'The file unique identifier',
    })
    @IsOptional()
    uuid?: string;

    @ApiProperty({
        required: false,
        type: String,
        example: 'my-file-name',
        description: 'The file unique name',
    })
    @IsOptional()
    name?: string;

    @ApiProperty({
        required: false,
        type: String,
        example: 'building-scan.bim',
        description: 'The original file name',
    })
    @IsOptional()
    originalName?: string;

    @ApiProperty({
        required: false,
        type: Number,
        example: 10,
        description: 'The file unique identifier',
    })
    @IsOptional()
    uploadedBy?: number;

    // Not display in Swagger because it requires an exact string date.
    @IsOptional()
    uploadedAt?: string;
    @IsOptional()
    updatedAt?: string;

    @ApiProperty({
        required: false,
        type: Number,
        example: 1024,
        description: 'The file size in bytes',
    })
    @IsOptional()
    size?: number;

    @ApiProperty({
        required: false,
        type: String,
        example: '/projects/1',
        description: 'The file path',
    })
    @IsOptional()
    filePath?: string;

    @ApiProperty({
        required: false,
        type: String,
        example: 'image/png',
        description: 'The file mime-type',
    })
    @IsOptional()
    fileType?: string;
}

export type ListResponse = File[];
