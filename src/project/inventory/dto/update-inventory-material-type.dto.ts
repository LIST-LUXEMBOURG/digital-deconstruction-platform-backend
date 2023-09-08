/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { Authorization } from '../../../FWAjs-utils/utils/auth.interface';
import { Constructor } from '../../../utils/dto/mixins.dto';
import { WithProjectId } from '../../dto';

export function WithBody<TBase extends Constructor>(Base: TBase) {
    class Body extends Base {
        @ApiProperty({
            type: String,
            required: true,
            description: "The given name of the material type",
            example: "Steel Beam (I Type)"
        })
        @IsString()
        @IsNotEmpty()
        name: string;

        @ApiProperty({
            type: String,
            required: false,
            description: "The description of the material type",
            example: "Structural steel beam designed to play a key role as a support member in structures."
        })

        @IsString()
        @IsOptional()
        description: string;

        @ApiProperty({
            type: String,
            required: true,
            description: "The category of the material type",
            example: "Structural Element"
        })

        @IsString()
        @IsNotEmpty()
        category: string;

        @ApiProperty({
            type: Boolean,
            required: false,
            default: false,
            description: "Specifies whether this material represents a hazard (health and/or environmental)",
            example: true
        })
        @IsBoolean()
        @IsOptional()
        isHazard: boolean;
    }
    return Body;
}

function WithParams<TBase extends Constructor>(Base: TBase) {
    class Params extends WithProjectId(Base) {
        @ApiProperty({
            type: String,
            required: true,
            description: 'The unique identifier of the material type',
        })
        @IsUUID()
        @IsNotEmpty()
        materialTypeUid: string;
    }
    return Params;
}

export class UpdateInventoryMaterialTypeBodyDto extends WithBody(class { }) { }
export class UpdateInventoryMaterialTypeParamsDto extends WithParams(class { }) { }
export class UpdateInventoryMaterialTypeDto extends WithBody(
    WithParams(Authorization),
) { }