/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

import {
    IsBoolean,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator';
import { Authorization } from '../../FWAjs-utils/utils/auth.interface';
import { Constructor } from '../../utils/dto/mixins.dto';

export enum Direction {
    ASCENDING = 'ascending',
    DESCENDING = 'descending',
}

export enum OrderBy {
    ID = 'id',
    CODE = 'code',
    LABEL = 'label',
    CLASSIFICATION_SYSTEM = 'classificationSystem'
}

export class OrderCriterium {
    @ApiProperty({ example: 'name' })
    @IsString()
    @IsNotEmpty()
    property: string;
    @ApiProperty({ enum: ['ASCENDING', 'DESCENDING'], example: 'DESCENDING' })
    direction: Direction;
}

export function WithQuery<TBase extends Constructor>(Base: TBase) {
    class Query extends Base {
        @ApiProperty({
            type: Number,
            required: false,
            description: 'The number of classification entries to return in a single page',
        })
        @IsNumber()
        @IsOptional()
        size: number;

        @ApiProperty({
            type: Number,
            required: false,
            description:
                'The offset in the full list of classification entries to start page from',
        })
        @IsNumber()
        @IsOptional()
        offset: number;

        @ApiProperty({
            type: Number,
            required: false,
            description: 'The unique identifier of a classification system',
        })
        @IsNumber()
        @IsOptional()
        classificationSystemId: number;

        @ApiProperty({
            type: String,
            required: false,
            description: 'The code of the classification entry',
        })
        @IsString()
        @IsOptional()
        code: string;

        @ApiProperty({
            type: String,
            required: false,
            description: 'The human readable label of the classification entry',
        })
        @IsString()
        @IsOptional()
        label: string;

        @ApiProperty({
            enum: OrderBy,
            required: false,
            description: 'Name of the property to order by',
            example: 'code',
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

export class ClassificationEntryQueryDto extends WithQuery(class { }) { }
export class ClassificationEntriesDto extends WithQuery(Authorization) { }