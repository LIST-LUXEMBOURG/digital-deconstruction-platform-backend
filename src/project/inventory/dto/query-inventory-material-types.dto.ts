/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional } from "class-validator";
import { Authorization } from "src/FWAjs-utils/utils/auth.interface";
import { WithProjectId } from "src/project/dto";
import { Constructor } from "src/utils/dto/mixins.dto";

export function WithQuery<TBase extends Constructor>(Base: TBase) {
    class Query extends Base {
        @ApiProperty({
            type: Number,
            required: false,
            description: 'The number of material types to return in a single page',
        })
        @IsNumber()
        @IsOptional()
        size: number;

        @ApiProperty({
            type: Number,
            required: false,
            description:
                'The offset in the full list of material types to start page from',
        })
        @IsNumber()
        @IsOptional()
        offset: number;

        @ApiProperty({
            type: String,
            required: false,
            isArray: true,
            description: 'The ordering rules for returning query results',
            example: '{"field": "name", "ordering": "ASC"}',
            default: []
        })
        @IsOptional()
        selects: string | string[];

        @ApiProperty({
            type: String,
            required: false,
            isArray: true,
            description: 'The filtering conditions for querying inventory material types',
            example: '{"field": "reusePotential", "expression": {"value": 0.95, "operator": "LOWER_OR_EQUAL"}}',
            default: []
        })
        @IsOptional()
        conditions: string | string[];
    }
    return Query;
}

export class QueryInventoryMaterialTypesParamsDto extends WithProjectId(class { }) { }
export class QueryInventoryMaterialTypesQueryDto extends WithQuery(class { }) { }
export class QueryInventoryMaterialTypesDto extends WithQuery(
    WithProjectId(Authorization),
) { }