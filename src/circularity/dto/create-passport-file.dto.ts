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
    IsUUID,
} from 'class-validator';
import { Authorization } from '../../FWAjs-utils/utils/auth.interface';
import { Constructor } from '../../utils/dto/mixins.dto';
import { WithProjectId } from '../../project/dto';

export function WithParams<TBase extends Constructor>(Base: TBase) {
    class Params extends WithProjectId(Base) {
        @ApiProperty({
            type: String,
            required: true,
            description: 'The unique identifier of a circularity object',
        })
        @IsUUID()
        @IsNotEmpty()
        circularityUid: string;
    }

    return Params;
}

export function WithBody<TBase extends Constructor>(Base: TBase) {
    class Body extends Base {
        @ApiProperty({
            required: true,
            type: Array,
            description: 'The passport files to upload',
        })
        readonly files: Express.Multer.File[];

        @ApiProperty({
            required: true,
            type: String,
            description: 'The title of the passport document',
            example: 'Material Passport'
        })
        @IsString()
        @IsNotEmpty()
        readonly title!: string;

        @ApiProperty({
            required: false,
            type: Date,
            description: 'The publishing date of the passport document',
            example: '2020-01-27'
        })
        @IsDate()
        @IsOptional()
        readonly documentDate?: Date;
    }
    return Body;
}
export class CreatePassportFileParamsDto extends WithParams(class { }) { }
export class CreatePassportFileBodyDto extends WithBody(class { }) { }
export class CreatePassportFileDto extends WithBody(
    WithParams(Authorization),
) { }

export const CreatePassportFileOpenApi = {
    title: {
        type: 'string',
        description: 'The title of the passport document',
        example: 'Material Passport'
    },
    documentDate: {
        type: 'date',
        description: 'The publishing date of the passport document',
        example: '2020-01-27'
    },
};