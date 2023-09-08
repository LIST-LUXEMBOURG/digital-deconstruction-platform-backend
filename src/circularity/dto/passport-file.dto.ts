/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsMimeType, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { Constructor } from '../../utils/dto/mixins.dto';
import { WithProjectId } from '../../project/dto';

export function WithBody<TBase extends Constructor>(Base: TBase) {
    class Body extends Base {
        @ApiProperty({
            type: String,
            required: true,
            description: 'The unique identifier of the passport document',
            example: '00015fec-321c-45f7-9067-f10115c2b9c9'
        })
        @IsUUID()
        @IsNotEmpty()
        uid: string;

        @ApiProperty({
            type: String,
            required: true,
            description: 'The unique identifier of the file containing the passport',
            example: '00361efd-f64d-4d46-8eaa-c539af71d998'
        })
        @IsUUID()
        @IsNotEmpty()
        fileUid: string;

        @ApiProperty({
            type: String,
            required: true,
            description: 'The unique identifier of the circularity object this passport is attached to',
            example: '00361efd-f64d-4d46-8eaa-c539af71d998'
        })
        @IsUUID()
        @IsNotEmpty()
        circularityUid: string;

        @ApiProperty({
            type: String,
            required: true,
            description: 'The mime type of the file containing the document',
            example: 'image/png'
        })
        @IsMimeType()
        @IsNotEmpty()
        fileType: string;

        @ApiProperty({
            type: String,
            required: true,
            description: 'The title of the passport document',
            example: 'Material Passport'
        })
        @IsString()
        @IsNotEmpty()
        title: string;

        @ApiProperty({
            type: Date,
            required: false,
            description: 'The creation date of the passport document',
            example: '2020-01-27'
        })
        @IsDate()
        @IsOptional()
        documentDate: Date;
    }
    return Body;
}

export class PassportFileDto extends WithBody(
    WithProjectId(class { }),
) { }
