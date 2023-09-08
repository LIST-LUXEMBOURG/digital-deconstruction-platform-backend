/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { Constructor } from '../../../utils/dto/mixins.dto';
import { WithProjectId } from '../../dto';
import { InventoryCircularityDto } from '../../../circularity/dto/inventory-circularity.dto';

export function WithBody<TBase extends Constructor>(Base: TBase) {
    class Body extends Base {
        @ApiProperty({
            type: String,
            required: true,
            description: 'The unique identifier of the material type',
            example: '00015fec-321c-45f7-9067-f10115c2b9c9'
        })
        @IsUUID()
        @IsNotEmpty()
        uid: string;

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
            type: InventoryCircularityDto,
            required: false,
            description: "The circularity properties of the material type",
        })

        @IsObject()
        @IsOptional()
        circularity: InventoryCircularityDto;
    }
    return Body;
}

export class InventoryMaterialTypeDto extends WithBody(
    WithProjectId(class { }),
) { }
