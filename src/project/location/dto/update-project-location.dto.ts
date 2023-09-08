/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
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
            description: 'The unique identifier of the project location',
        })
        @IsNumber()
        locationId: number;
    }

    return Params;
}

export function WithBody<TBase extends Constructor>(Base: TBase) {
    class Body extends Base {
        @ApiProperty({
            required: false,
            type: String,
            example: 'ground floor',
            description: 'Name of the location',
        })
        @IsString()
        @IsOptional()
        @Transform(({ value }: { value: string }) => value.trim())
        name: string;

        @ApiProperty({
            required: false,
            type: String,
            description:
                'Coordinates of the deconstruction site (format WGS 84) - only for sites',
        })
        @IsString()
        @IsOptional()
        coordinate: string;

        @ApiProperty({
            required: false,
            type: String,
            description: 'The URL of the project\'s location 3D scan point of interest'
        })
        @IsUrl()
        @IsString()
        @IsNotEmpty()
        @IsOptional()
        pointOfInterest: string;
    }
    return Body;
}
export class UpdateProjectLocationParamsDto extends WithParams(class { }) { }
export class UpdateProjectLocationBodyDto extends WithBody(class { }) { }
export class UpdateProjectLocationDto extends WithBody(
    WithParams(Authorization),
) { }