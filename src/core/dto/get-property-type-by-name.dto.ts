/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { Authorization } from "../../FWAjs-utils/utils/auth.interface";
import { Constructor } from "../../utils/dto/mixins.dto";

function WithParams<TBase extends Constructor>(Base: TBase) {
    class Params extends Base {
        @ApiProperty({
            required: true,
            type: String,
            description: 'The name of the property type'
        })
        @IsString()
        @IsNotEmpty()
        readonly propertyTypeName!: string;

        @ApiProperty({
            required: true,
            type: String,
            description: 'The unit name'
        })
        @IsString()
        @IsOptional()
        readonly unitName!: string;

        @ApiProperty({
            required: true,
            type: String,
            description: 'The unit symbol'
        })
        @IsString()
        @IsOptional()
        readonly unitSymbol!: string;
    }
    return Params;
}

export class PropertyTypeByNameParamsDto extends WithParams(Authorization) { }