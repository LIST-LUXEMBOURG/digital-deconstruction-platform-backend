/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Constructor } from 'src/utils/dto/mixins.dto';
import { Authorization } from '../../FWAjs-utils/utils/auth.interface';
import { WithProjectId } from '../../project/dto';

export enum CircularityFirstOrder {
    MARKET_VALUE = 'marketValue',
    SAVINGS_CO2 = 'savingsCO2',
    SOCIAL_BALANCE = 'socialBalance'
}

export function WithQuery<TBase extends Constructor>(Base: TBase) {
    class Query extends Base {
        @ApiProperty({
            type: Number,
            required: true,
            description: 'The number of top results to return',
            default: 10
        })
        @IsNumber()
        limit: number;

        @ApiProperty({
            required: false,
            enum: CircularityFirstOrder,
            description: 'The property to order by first',
            default: CircularityFirstOrder.MARKET_VALUE
        })
        @IsString()
        @IsOptional()
        ordering: CircularityFirstOrder;
    }
    return Query;
}

export class AnalyseInventoryCircularityParamsDto extends WithProjectId(class { }) { }
export class AnalyseInventoryCircularityQueryDto extends WithQuery(class { }) { }
export class AnalyseInventoryCircularityDto extends WithQuery(WithProjectId(Authorization)) { }