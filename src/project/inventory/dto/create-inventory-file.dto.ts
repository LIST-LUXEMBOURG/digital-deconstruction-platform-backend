/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import {
    IsDate,
    IsNotEmpty,
    IsOptional,
    IsString,
} from 'class-validator';
import { Authorization } from '../../../FWAjs-utils/utils/auth.interface';
import { Constructor } from '../../../utils/dto/mixins.dto';
import { WithProjectId } from '../../dto';

export function WithParams<TBase extends Constructor>(Base: TBase) {
    class Params extends WithProjectId(Base) {
        @ApiProperty({
            type: String,
            required: true,
            description: 'The unique identifier of an element type',
        })
        @IsString()
        @IsNotEmpty()
        elementTypeUid: string;
    }

    return Params;
}

export function WithBody<TBase extends Constructor>(Base: TBase) {
    class Body extends Base {
        @ApiProperty({
            required: true,
            type: Array,
            description: 'The document files to upload',
        })
        readonly files: Express.Multer.File[];

        @ApiProperty({
            required: true,
            type: String,
            description: 'The title of the inventory document',
            example: 'Technical Datasheet'
        })
        @IsString()
        @IsNotEmpty()
        readonly title!: string;

        @ApiProperty({
            required: false,
            type: String,
            description: 'The description of the inventory document',
            example: 'The Technical Datasheet covers all properties pertaining to the correct handling and installation of the element'
        })
        @IsString()
        @IsOptional()
        readonly description?: string;

        @ApiProperty({
            required: false,
            type: String,
            description: 'The author of the inventory document',
            example: 'Robert A. Heinlein'
        })
        @IsString()
        @IsOptional()
        readonly documentAuthor?: string;

        @ApiProperty({
            required: false,
            type: Date,
            description: 'The publishing date of the inventory document',
            example: '27.1.2020'
        })
        @IsDate()
        @IsOptional()
        readonly documentDate?: Date;
    }
    return Body;
}
export class CreateInventoryFileParamsDto extends WithParams(class { }) { }
export class CreateInventoryFileBodyDto extends WithBody(class { }) { }
export class CreateInventoryFileDto extends WithBody(
    WithParams(Authorization),
) { }

export const CreateInventoryFileOpenApi = {
    title: {
        type: 'string',
        description: 'The title of the inventory document',
        example: 'Technical Datasheet'
    },
    description: {
        type: 'string',
        description: 'The description of the inventory document',
        example: 'The Technical Datasheet covers all properties pertaining to the correct handling and installation of the element'
    },
    documentAuthor: {
        type: 'string',
        description: 'The author of the inventory document',
        example: 'Robert A. Heinlein'
    },
    documentDate: {
        type: 'date',
        description: 'The publishing date of the inventory document',
        example: '27.1.2020'
    },
};