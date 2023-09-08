/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { Authorization } from '../../FWAjs-utils/utils/auth.interface';
import { Constructor } from '../../utils/dto/mixins.dto';
import { WithProjectId } from '../../project/dto';

export function WithBody<TBase extends Constructor>(Base: TBase) {
    class Body extends Base {
        @ApiProperty({
            type: Number,
            required: false,
            description: "The financial market value of the corresponding element type / material type",
            example: 2500
        })
        @IsNumber()
        @IsOptional()
        marketValue: number;

        @ApiProperty({
            type: Number,
            required: false,
            description: "The quantity of CO2 saved by re-using the corresponding element type / material type",
            example: 150
        })
        @IsNumber()
        @IsOptional()
        savingsCO2: number;

        @ApiProperty({
            type: Number,
            required: false,
            description: "The benefit of reusing the corresponding element type / material type",
            example: 2.5
        })
        @IsNumber()
        @IsOptional()
        socialBalance: number;
    }
    return Body;
}
function WithParams<TBase extends Constructor>(Base: TBase) {
    class Params extends WithProjectId(Base) {
        @ApiProperty({
            type: String,
            required: true,
            description: 'The unique identifier of the circularity object',
        })
        @IsUUID()
        @IsNotEmpty()
        circularityUid: string;
    }
    return Params;
}

export class UpdateInventoryCircularityBodyDto extends WithBody(class { }) { }
export class UpdateInventoryCircularityParamsDto extends WithParams(class { }) { }
export class UpdateInventoryCircularityDto extends WithBody(
    WithParams(Authorization),
) { }