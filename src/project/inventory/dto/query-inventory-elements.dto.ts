/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNumber, IsOptional } from "class-validator";
import { Authorization } from "src/FWAjs-utils/utils/auth.interface";
import { WithProjectId } from "src/project/dto";
import { Constructor } from "src/utils/dto/mixins.dto";
import { Condition } from "src/utils/search/condition";
import { Select } from "src/utils/search/select";

export function WithQuery<TBase extends Constructor>(Base: TBase) {
    class Query extends Base {
        @ApiProperty({
            type: Number,
            required: false,
            description: 'The number of elements to return in a single page',
        })
        @IsNumber()
        @IsOptional()
        size: number;

        @ApiProperty({
            type: Number,
            required: false,
            description:
                'The offset in the full list of elements to start page from',
        })
        @IsNumber()
        @IsOptional()
        offset: number;

        @ApiProperty({
            type: String,
            required: false,
            isArray: true,
            description: 'The ordering rules for returning query results',
            example: '{"field": "name", "order": "ASC"}',
            default: []
        })
        @IsOptional()
        selects: string | string[];

        @ApiProperty({
            type: String,
            required: false,
            isArray: true,
            description: 'The filtering conditions for querying inventory elements',
            example: '{"field": "reusePotential", "expression": {"value": 0.95, "operator": "LOWER_OR_EQUAL"}}',
            default: []
        })
        @IsOptional()
        conditions: string | string[];
    }
    return Query;
}

export class QueryInventoryElementsParamsDto extends WithProjectId(class { }) { }
export class QueryInventoryElementsQueryDto extends WithQuery(class { }) { }
export class QueryInventoryElementsDto extends WithQuery(
    WithProjectId(Authorization),
) { }