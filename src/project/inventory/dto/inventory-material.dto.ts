/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { Authorization } from '../../../FWAjs-utils/utils/auth.interface';
import { Constructor } from '../../../utils/dto/mixins.dto';
import { WithProjectId } from '../../dto';
import { MaterialType } from '../entities/material-type.entity';

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

function WithParams<TBase extends Constructor>(Base: TBase) {
    class Params extends WithProjectId(Base) {
        @ApiProperty({
            type: String,
            required: true,
            description: 'The unique identifier of an inventory material',
        })
        @IsUUID()
        @IsNotEmpty()
        materialUid: string;
    }
    return Params;
}

export class InventoryMaterialDto extends WithBody(
    WithProjectId(class { }),
) { }
