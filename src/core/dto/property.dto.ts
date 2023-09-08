/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { WithProjectId } from '../../project/dto/';
import { Constructor } from '../../utils/dto/mixins.dto';


export function WithBody<TBase extends Constructor>(Base: TBase) {
    class Body extends Base {
        @ApiProperty({
            type: String,
            required: true,
            description: 'The unique identifier of a property',
            example: '00015fec-321c-45f7-9067-f10115c2b9c9'
        })
        @IsUUID()
        @IsNotEmpty()
        uid: string;

        @ApiProperty({
            type: String,
            required: true,
            description: 'The unique identifier of the element this property belongs to',
            example: '00361efd-f64d-4d46-8eaa-c539af71d998'
        })
        @IsUUID()
        @IsNotEmpty()
        elementUid: string;

        @ApiProperty({
            type: Number,
            required: true,
            description: "The unique identifier of this property' property type",
            example: 12
        })
        @IsNumber()
        @IsNotEmpty()
        propertyTypeId: number;

        @ApiProperty({
            type: Number,
            required: true,
            description: "The unique identifier of this property' property unit",
            example: 12
        })
        @IsNumber()
        @IsNotEmpty()
        propertyUnitId: number;

        @ApiProperty({
            type: String,
            required: true,
            description: 'The value of the property',
            example: '3.1416'
        })
        @IsNumber()
        @IsOptional()
        value: string;
    }
    return Body;
}


export class PropertyDto extends WithBody(
    WithProjectId(class { }),
) { }
