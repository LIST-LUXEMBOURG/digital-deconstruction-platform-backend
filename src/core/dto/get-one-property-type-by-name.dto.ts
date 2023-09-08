/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { Authorization } from "../../FWAjs-utils/utils/auth.interface";

export class PropertyTypeGetOneByNameDto extends Authorization {
    @ApiProperty({
        required: true,
        type: String,
        description: 'The name of the property type'
    })
    @IsString()
    @IsNotEmpty()
    readonly typeName: string;

    @ApiProperty({
        required: false,
        type: String,
        description: 'The optional name of the property unit'
    })
    @IsString()
    @IsOptional()
    readonly unitName!: string;

    @ApiProperty({
        required: false,
        type: String,
        description: 'The optional symbol of the property unit'
    })
    @IsString()
    @IsOptional()
    readonly unitSymbol!: string;
}