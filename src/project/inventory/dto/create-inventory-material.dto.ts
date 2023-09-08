/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { Authorization } from '../../../FWAjs-utils/utils/auth.interface';
import { Constructor } from '../../../utils/dto/mixins.dto';
import { WithProjectId } from '../../dto';

export function WithBody<TBase extends Constructor>(Base: TBase) {
    class Body extends Base {
        @ApiProperty({
            type: Number,
            required: true,
            description: "The volume of this material expressed in m3 (cubic meters)",
            example: 0.65
        })
        @IsNumber()
        @IsOptional()
        volume: number;

        @ApiProperty({
            type: Number,
            required: true,
            description: "The total mass (or weight) of this material expressed in t (metric tons)",
            example: 0.25
        })
        @IsNumber()
        @IsOptional()
        mass: number;

        @ApiProperty({
            type: String,
            required: true,
            description: 'The material type uid linked to this material',
            example: '00015fec-321c-45f7-9067-f10115c2b9c9'
        })
        @IsNotEmpty()
        @IsUUID()
        materialTypeUid: string;
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
        @IsNumber()
        @IsNotEmpty()
        elementUid: string;
    }
    return Param;
}
export class CreateInventoryMaterialParamsDto extends WithParam(class { }) { }
export class CreateInventoryMaterialBodyDto extends WithBody(class { }) { }
export class CreateInventoryMaterialDto extends WithBody(
    WithParam(Authorization),
) { }
