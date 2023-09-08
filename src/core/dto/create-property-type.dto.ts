/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Authorization } from '../../FWAjs-utils/utils/auth.interface';
import { Constructor } from '../../utils/dto/mixins.dto';
import { PropertyUnit } from '../entities/property-unit.entity';

export function WithBody<TBase extends Constructor>(Base: TBase) {
    class Body extends Base {

        @ApiProperty({
            type: String,
            required: true,
            description: 'The name of the property type',
        })
        @IsString()
        @IsNotEmpty()
        name: string;

        @ApiProperty({
            type: Boolean,
            required: true,
            description: 'Specifies whether the property type is numeric or not',
        })

        @IsBoolean()
        @IsNotEmpty()
        isNumeric: boolean;

        @ApiProperty({
            type: () => [PropertyUnit],
            required: true,
            description:
                'The possible property units for this property type',
        })
        @IsArray()
        propertyUnits: PropertyUnit[];
    }
    return Body;
}

export class CreatePropertyTypeBodyDto extends WithBody(class { }) { }
export class CreatePropertyTypeDto extends WithBody(Authorization) { }