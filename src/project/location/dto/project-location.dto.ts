/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, IsUUID } from 'class-validator';
import { Constructor } from '../../../utils/dto/mixins.dto';
import { WithProjectId } from '../../dto';
import { LocationType } from '../entities/projectLocation.entity';

export function WithBody<TBase extends Constructor>(Base: TBase) {
    class Body extends Base {
        @ApiProperty({
            type: Number,
            required: true,
            description: 'The unique identifier of the project location',
            example: 42
        })
        @IsNumber()
        @IsNotEmpty()
        id: number;

        @ApiProperty({
            required: true,
            type: String,
            example: 'ground floor',
            description: 'Name of the location'
        })
        @IsString()
        @IsNotEmpty()
        @Transform(({ value }: { value: string }) => value.trim())
        name: string;

        @ApiProperty({
            required: true,
            enum: LocationType,
            description: 'The type of the location',
        })
        @IsEnum(LocationType)
        @IsNotEmpty()
        type?: LocationType;

        @ApiProperty({
            required: false,
            type: Number,
            example: 42,
            description: 'The id of the parent location. None if type = site.'
        })
        @IsNumber()
        @IsOptional()
        parentLocationId: number;

        @ApiProperty({
            required: false,
            type: String,
            description: 'Coordinates of the deconstruction site (format WGS 85) - only for sites',
            example: "49.501873, 5.9467846"
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
        @IsOptional()
        pointOfInterest: string;
    }
    return Body;
}

export class ProjectLocationDto extends WithBody(
    WithProjectId(class { }),
) {
    @ApiProperty({
        required: false,
        type: [ProjectLocationDto],
        description: 'All subdivisions (sub-locations) for this location'
    })
    @IsArray()
    @IsOptional()
    subdivisions: ProjectLocationDto[];
}
