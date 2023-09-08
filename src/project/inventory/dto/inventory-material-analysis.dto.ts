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

        @ApiProperty({
            type: Number,
            required: true,
            description: "The number of materials of the given given material type",
            example: 250
        })
        @IsNumber()
        @IsNotEmpty()
        count: number;

        @ApiProperty({
            type: Number,
            required: true,
            description: "The total volume of all materials of the given material type expressed in m3 (cubic meters)",
            example: 5000
        })
        @IsNumber()
        @IsNotEmpty()
        totalVolume: number;
    }
    return Body;
}

export class InventoryMaterialAnalysisDto extends WithBody(
    WithProjectId(Authorization),
) { }