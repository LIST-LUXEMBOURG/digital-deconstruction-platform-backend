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
        @IsOptional()
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
    class Params extends WithProjectId(Base) {
        @ApiProperty({
            type: String,
            required: true,
            description: 'The unique identifier of the element',
        })
        @IsUUID()
        @IsNotEmpty()
        elementUid: string;

        @ApiProperty({
            type: String,
            required: true,
            description: 'The unique identifier of a property',
        })
        @IsUUID()
        @IsNotEmpty()
        propertyUid: string;
    }
    return Params;
}
export class UpdateInventoryPropertyParamsDto extends WithParam(class { }) { }
export class UpdateInventoryPropertyBodyDto extends WithBody(class { }) { }
export class UpdateInventoryPropertyDto extends WithBody(
    WithParam(Authorization),
) { }
