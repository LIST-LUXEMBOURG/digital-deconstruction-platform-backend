/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsDate,
    IsEnum,
    IsIn,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUrl,
} from 'class-validator';
import { Authorization } from '../../../FWAjs-utils/utils/auth.interface';
import { Constructor } from '../../../utils/dto/mixins.dto';
import { WithProjectId } from '../../dto';

export function WithParams<TBase extends Constructor>(Base: TBase) {
    class Params extends WithProjectId(Base) {
        @ApiProperty({
            type: Number,
            required: true,
            description: 'The unique identifier of the project file',
        })
        @IsNumber()
        projectFileId: number;
    }

    return Params;
}

export function WithBody<TBase extends Constructor>(Base: TBase) {
    class Body extends Base {
        @ApiProperty({
            required: false,
            type: Array,
            description: 'The files objects',
        })
        @IsOptional()
        files: Express.Multer.File[];

        @ApiProperty({
            required: false,
            type: String,
            description: 'The title of the project document',
        })
        @IsString()
        @IsOptional()
        title: string;

        @ApiProperty({
            required: false,
            type: String,
            description: 'The description of the project document',
        })
        @IsString()
        @IsOptional()
        description: string;

        @ApiProperty({
            required: false,
            type: Number,
            description: 'The (optional) location this project document is linked to',
        })
        @IsNumber()
        @IsOptional()
        locationId: number;

        @ApiProperty({
            required: false,
            type: String,
            description: 'The project document author',
        })
        @IsString()
        @IsOptional()
        documentAuthor: string;

        @ApiProperty({
            required: false,
            type: Date,
            description: 'The date the project document was authored',
        })
        //@IsDate()
        @IsOptional()
        documentDate: Date;
    }
    return Body;
}
export class UpdateProjectFileParamsDto extends WithParams(class { }) { }
export class UpdateProjectFileBodyDto extends WithBody(class { }) { }
export class UpdateProjectFileDto extends WithBody(
    WithParams(Authorization),
) { }