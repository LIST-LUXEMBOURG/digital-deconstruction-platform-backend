/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import {
    IsDate,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator';
import { Authorization } from '../../../FWAjs-utils/utils/auth.interface';
import { Constructor } from '../../../utils/dto/mixins.dto';
import { WithProjectId } from '../../dto';

export function WithBody<TBase extends Constructor>(Base: TBase) {
    class Body extends Base {
        @ApiProperty({
            required: true,
            type: Array,
            description: 'The files objects',
        })
        readonly files: Express.Multer.File[];

        @ApiProperty({
            required: true,
            type: String,
            description: 'The file title',
        })
        @IsString()
        @IsNotEmpty()
        readonly title!: string;

        @ApiProperty({
            required: false,
            type: String,
            description: 'The file description',
        })
        @IsString()
        @IsOptional()
        readonly description?: string;

        @ApiProperty({
            required: false,
            type: Number,
            description: 'The location id',
        })
        @IsNumber()
        @IsOptional()
        readonly locationId?: number;

        @ApiProperty({
            required: false,
            type: String,
            description: 'The document author',
        })
        @IsString()
        @IsOptional()
        readonly documentAuthor?: string;

        @ApiProperty({
            required: false,
            type: Date,
            description: 'The document date',
        })
        @IsDate()
        @IsOptional()
        readonly documentDate?: Date;
    }
    return Body;
}
export class CreateProjectFileParamsDto extends WithProjectId(class { }) { }
export class CreateProjectFileBodyDto extends WithBody(class { }) { }
export class CreateProjectFileDto extends WithBody(
    WithProjectId(Authorization),
) { }

export const CreateProjectFileOpenApi = {
    title: {
        type: 'string',
        description: 'The document title'
    },
    description: {
        type: 'string',
        description: "A description of the documents' content"
    },
    locationId: {
        type: 'number',
        description: 'To id of the project location this document belongs to, (if any)'
    },
    documentAuthor: {
        type: 'string',
        description: 'The author of the document (if known)'
    },
    documentDate: {
        type: 'date',
        description: 'The date of the document (if known)'
    }
};