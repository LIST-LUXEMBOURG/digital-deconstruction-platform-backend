/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { Constructor } from '../../utils/dto/mixins.dto';


export function WithBody<TBase extends Constructor>(Base: TBase) {
    class Body extends Base {
        @ApiProperty({
            type: Number,
            required: true,
            description: 'The unique identifier of this classification entry',
            example: 42
        })
        @IsNumber()
        @IsNotEmpty()
        id: number;

        @ApiProperty({
            type: Number,
            required: true,
            description: 'The unique identifier of the classification system this entry is part of',
            example: 33
        })
        @IsNumber()
        @IsNotEmpty()
        classificationSystemId: number;

        @ApiProperty({
            type: Number,
            required: true,
            description: 'The unique identifier of the classification entry this entry is a child of',
            example: 32
        })
        @IsNumber()
        @IsNotEmpty()
        parentId: number;

        @ApiProperty({
            required: false,
            type: String,
            description: 'The human readable label of the classification entry',
            example: ' Suspended Plaster and Gypsum Board Ceilings'
        })
        label: string;

        @ApiProperty({
            required: false,
            type: String,
            description: 'The alphanumeric code representing the classification entry',
            example: ' 21-03 10 70 20'
        })
        code: string;
    }
    return Body;
}

export class ClassificationEntryDto extends WithBody(class { }) { }