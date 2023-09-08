/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Authorization } from '../../../FWAjs-utils/utils/auth.interface';
import { Constructor } from '../../../utils/dto/mixins.dto';
import { WithProjectId } from '../../dto';
import { ReuseDecision } from '../entities/element.entity';

export function WithBody<TBase extends Constructor>(Base: TBase) {
    class Body extends Base {
        @ApiProperty({
            enum: ReuseDecision,
            required: false,
            description: 'The reusability decision',
            example: ReuseDecision.RECYCLING
        })
        @IsString()
        @IsOptional()
        reuseDecision: ReuseDecision;

        @ApiProperty({
            type: Number,
            required: true,
            description: "The number of elements having the given reuse decision",
            example: 250
        })
        @IsNumber()
        @IsNotEmpty()
        count: number;

        @ApiProperty({
            type: Number,
            required: true,
            description: "The total volume of all elements with the given reuse decision expressed in m3 (cubic meters)",
            example: 5000
        })
        @IsNumber()
        @IsNotEmpty()
        totalVolume: number;

        @ApiProperty({
            type: Number,
            required: true,
            description: "The total mass of all elements with the given reuse decision expressed in t (tons)",
            example: 5000
        })
        @IsNumber()
        @IsNotEmpty()
        totalMass: number;
    }
    return Body;
}

export class InventoryElementSummaryDto extends WithBody(
    WithProjectId(Authorization),
) { }