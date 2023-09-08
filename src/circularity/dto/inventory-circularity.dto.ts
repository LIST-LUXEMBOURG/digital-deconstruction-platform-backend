/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { Constructor } from '../../utils/dto/mixins.dto';
import { WithProjectId } from '../../project/dto';

export function WithBody<TBase extends Constructor>(Base: TBase) {
    class Body extends Base {
        @ApiProperty({
            type: String,
            required: true,
            description: 'The unique identifier of this circularity object',
            example: '00015fec-321c-45f7-9067-f10115c2b9c9'
        })
        @IsUUID()
        @IsNotEmpty()
        uid: string;

        @ApiProperty({
            type: Number,
            required: false,
            description: "The financial market value of the element type / material type",
            example: 2500
        })
        @IsNumber()
        @IsOptional()
        marketValue: number;

        @ApiProperty({
            type: Number,
            required: false,
            description: "The quantity of CO2 saved by re-using this element type / material type",
            example: 150
        })
        @IsNumber()
        @IsOptional()
        savingsCO2: number;

        @ApiProperty({
            type: Number,
            required: false,
            description: "The benefit of reusing this element type / material type",
            example: 2.5
        })
        @IsNumber()
        @IsOptional()
        socialBalance: number;

    }
    return Body;
}

export class InventoryCircularityDto extends WithBody(
    WithProjectId(class { }),
) { }
