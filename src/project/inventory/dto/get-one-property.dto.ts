/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from "class-validator";
import { Authorization } from "../../../FWAjs-utils/utils/auth.interface";

export class PropertyGetOneDto extends Authorization {
    @ApiProperty({
        required: true,
        type: Number,
        description: 'The ID of the property type'
    })
    @IsNumber()
    @IsNotEmpty()
    readonly propertyTypeId!: number;

    @ApiProperty({
        required: true,
        type: Number,
        description: 'The ID of the optional property unit'
    })
    @IsNumber()
    @IsOptional()
    readonly propertyUnitId!: number;

    @ApiProperty({
        type: String,
        required: true,
        description: 'The element uid',
    })
    @IsNotEmpty()
    @IsUUID()
    elementUid: string;
}