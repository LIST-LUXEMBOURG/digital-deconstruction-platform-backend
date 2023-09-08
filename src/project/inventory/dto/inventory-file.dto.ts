/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsMimeType, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { Authorization } from '../../../FWAjs-utils/utils/auth.interface';
import { Constructor } from '../../../utils/dto/mixins.dto';
import { WithProjectId } from '../../dto';
import { MaterialType } from '../entities/material-type.entity';

export function WithBody<TBase extends Constructor>(Base: TBase) {
    class Body extends Base {
        @ApiProperty({
            type: String,
            required: true,
            description: 'The unique identifier of an inventory document',
            example: '00015fec-321c-45f7-9067-f10115c2b9c9'
        })
        @IsUUID()
        @IsNotEmpty()
        uid: string;

        @ApiProperty({
            type: String,
            required: true,
            description: 'The unique identifier of the file containing the document',
            example: '00361efd-f64d-4d46-8eaa-c539af71d998'
        })
        @IsUUID()
        @IsNotEmpty()
        fileUid: string;

        @ApiProperty({
            type: String,
            required: true,
            description: 'The unique identifier of the element type this document is attached to',
            example: '00361efd-f64d-4d46-8eaa-c539af71d998'
        })
        @IsUUID()
        @IsNotEmpty()
        elementTypeUid: string;

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
            description: 'The title of the inventory document',
            example: 'Technical Datasheet'
        })
        @IsString()
        @IsNotEmpty()
        title: string;

        @ApiProperty({
            type: String,
            required: false,
            description: 'The description of the inventory document',
            example: 'The Technical Datasheet covers all properties pertaining to the correct handling and installation of the element'
        })
        @IsString()
        @IsOptional()
        description: string;

        @ApiProperty({
            type: String,
            required: false,
            description: 'The author of the inventory document',
            example: 'Robert A. Heinlein'
        })
        @IsString()
        @IsOptional()
        documentAuthor: string;

        @ApiProperty({
            type: Date,
            required: false,
            description: 'The publishing date of the inventory document',
            example: '27.1.2020'
        })
        @IsDate()
        @IsOptional()
        documentDate: Date;
    }
    return Body;
}


export class InventoryFileDto extends WithBody(
    WithProjectId(class { }),
) { }
