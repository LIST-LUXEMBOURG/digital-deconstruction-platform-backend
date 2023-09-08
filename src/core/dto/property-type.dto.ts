/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import { Authorization } from '../../FWAjs-utils/utils/auth.interface';
import { Constructor } from '../../utils/dto/mixins.dto';

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
            type: () => [Number],
            required: true,
            description:
                'The possible property units for this property type',
        })
        @IsArray()
        propertyUnitIds: number[];
    }
    return Body;
}

export class PropertyTypeBodyDto extends WithBody(class { }) { }
export class PropertyTypeDto extends WithBody(Authorization) { }