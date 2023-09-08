/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Constructor } from '../../utils/dto/mixins.dto';

export enum Direction {
    ASCENDING = 'ascending',
    DESCENDING = 'descending',
}

export class OrderCriterium {
    @ApiProperty({ example: 'name' })
    @IsString()
    @IsNotEmpty()
    property: string;
    @ApiProperty({ enum: ['ASCENDING', 'DESCENDING'], example: 'DESCENDING' })
    direction: Direction;
}

export function WithPagination<TBase extends Constructor>(Base: TBase) {
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
    }
}