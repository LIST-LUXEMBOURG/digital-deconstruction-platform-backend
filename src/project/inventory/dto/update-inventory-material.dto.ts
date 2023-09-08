/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import {
    IsBoolean,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator';
import { Authorization } from '../../../FWAjs-utils/utils/auth.interface';
import { Constructor } from '../../../utils/dto/mixins.dto';
import { WithProjectId } from '../../dto';

export function WithBody<TBase extends Constructor>(Base: TBase) {
    class Body extends Base {
        @ApiProperty({
            type: Number,
            required: true,
            description: 'Specifies the volume of the material',
        })
        @IsNumber()
        @IsOptional()
        volume: number;

        @ApiProperty({
            type: Number,
            required: true,
            description: 'Specifies the mass of the material',
        })
        @IsNumber()
        @IsOptional()
        mass: number;

        @ApiProperty({
            type: String,
            required: true,
            description: 'The material type uid linked to this material',
        })
        @IsNotEmpty()
        @IsString()
        materialTypeUid: string;
    }
    return Body;
}

function WithParams<TBase extends Constructor>(Base: TBase) {
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
            description: 'The unique identifier of the material',
        })
        @IsUUID()
        @IsNotEmpty()
        materialUid: string;
    }
    return Params;
}

export class UpdateInventoryMaterialParamsDto extends WithParams(class { }) { }
export class UpdateInventoryMaterialBodyDto extends WithBody(class { }) { }
export class UpdateInventoryMaterialDto extends WithBody(
    WithParams(Authorization),
) { }
