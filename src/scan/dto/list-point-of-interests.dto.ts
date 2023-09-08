/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, IsUUID } from 'class-validator';
import { Authorization } from '../../FWAjs-utils/utils/auth.interface';
import { Constructor } from '../../utils/dto/mixins.dto';
import { WithProjectId, Direction } from '../../project/dto';

export enum OrderBy {
    UID = 'uid',
    NAME = 'name',
    DESCRIPTION = 'description',
    LOCATION_ID = 'locationId',
    WEBLINK = 'weblink',
}

export function WithParams<TBase extends Constructor>(Base: TBase) {
    class ElementWithUid extends Base {
        @ApiProperty({
            type: Number,
            required: true,
            description: 'The related project ID',
        })
        @IsNumber()
        @IsNotEmpty()
        projectId: number;

        @ApiProperty({
            type: String,
            required: true,
            description: 'The related element UID',
        })
        @IsString()
        @IsNotEmpty()
        elementUid: string;
    }
    return ElementWithUid;
}

export function WithBody<TBase extends Constructor>(Base: TBase) {
    class Body extends Base {

        @ApiProperty({
            type: Number,
            required: false,
            description:
                'The Id of the location this point of interest is part of',
        })
        @IsNumber()
        @IsOptional()
        locationId: number;

        @ApiProperty({
            type: String,
            required: true,
            description:
                'The given name for this point of interest',
        })
        @IsString()
        @IsNotEmpty()
        name: string;

        @ApiProperty({
            type: String,
            required: false,
            description:
                'The description for this point of interest',
        })
        @IsString()
        @IsOptional()
        description: string;

        @ApiProperty({
            type: String,
            required: true,
            description: 'The external Id of this point of interest',
            example: '3824188110670335'
        })
        @IsString()
        @IsNotEmpty()
        poiId: string;

        @ApiProperty({
            type: String,
            required: true,
            description:
                'The URL for this point of interest',
        })
        @IsString()
        @IsUrl()
        weblink: string;
    }
    return Body;
}

export function WithQuery<TBase extends Constructor>(Base: TBase) {
    class Query extends Base {
        @ApiProperty({
            type: Number,
            required: false,
            description: 'The number of elements to return in a single page',
        })
        @IsNumber()
        @IsOptional()
        size: number;

        @ApiProperty({
            type: Number,
            required: false,
            description:
                'The offset in the full list of elements to start page from',
        })
        @IsNumber()
        @IsOptional()
        offset: number;

        @ApiProperty({
            type: Number,
            required: false,
            description:
                'The Id of the location this point of interest is part of',
        })
        @IsNumber()
        @IsOptional()
        locationId: number;

        @ApiProperty({
            type: String,
            required: false,
            description: 'The unique identifier of the element to attached the point of interest to',
            example: '9b61247f-f32f-4128-84e9-723afc6e2820'
        })
        @IsUUID()
        @IsOptional()
        elementUid: string;

        @ApiProperty({
            type: String,
            required: false,
            description:
                'The given name for this point of interest',
        })
        @IsString()
        @IsOptional()
        name: string;

        @ApiProperty({
            type: String,
            required: false,
            description:
                'The description for this point of interest',
        })
        @IsString()
        @IsOptional()
        description: string;

        @ApiProperty({
            type: String,
            required: false,
            description:
                'The URL for this point of interest',
        })
        @IsOptional()
        @IsString()
        weblink: string;

        @ApiProperty({
            enum: OrderBy,
            required: false,
            description: 'Name of the property to order by',
            example: 'name',
        })
        @IsString()
        @IsOptional()
        property: OrderBy;

        @ApiProperty({
            enum: Direction,
            required: false,
            description: 'The direction of the ordering',
            example: Direction.ASCENDING,
        })
        @IsString()
        @IsOptional()
        direction: Direction;
    }
    return Query;
}

export class ListPointOfInterestsParamsDto extends WithProjectId(Authorization) { }
export class ListPointOfInterestsQueryDto extends WithQuery(class { }) { }
export class ListPointOfInterestsDto extends WithQuery(
    WithProjectId(Authorization),
) { }