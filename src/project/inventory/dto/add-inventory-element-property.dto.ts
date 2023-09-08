/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { Authorization } from '../../../FWAjs-utils/utils/auth.interface';
import { Constructor } from '../../../utils/dto/mixins.dto';
import { WithProjectId } from '../../dto';

export function WithBody<TBase extends Constructor>(Base: TBase) {
    class Body extends Base {

        @ApiProperty({
            type: Number,
            required: true,
            description: 'The id of the property type for this property',
        })
        @IsNotEmpty()
        @IsNumber()
        propertyTypeId: number;

        @ApiProperty({
            type: Number,
            required: true,
            description: 'The id of the property unit for this property',
        })
        @IsOptional()
        @IsNumber()
        propertyUnitId: number;

        @ApiProperty({
            type: String,
            required: true,
            description: 'Specifies the value of the property',
        })
        @IsNotEmpty()
        @IsString()
        value: string;
    }
    return Body;
}

export function WithParam<TBase extends Constructor>(Base: TBase) {
    class Param extends WithProjectId(Base) {
        @ApiProperty({
            type: String,
            required: true,
            description: 'The element uid',
        })
        @IsNotEmpty()
        @IsUUID()
        elementUid: string;
    }
    return Param;
}
export class AddInventoryElementPropertyParamsDto extends WithParam(class { }) { }
export class AddInventoryElementPropertyBodyDto extends WithBody(class { }) { }
export class AddInventoryElementPropertyDto extends WithBody(
    WithParam(Authorization),
) { }

