/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { Authorization } from "../../FWAjs-utils/utils/auth.interface";

export class ClassificationEntryGetOneDto extends Authorization {
    @ApiProperty({
        required: true,
        type: Number,
        description: 'The classification entry id'
    })
    @IsNumber()
    @IsNotEmpty()
    readonly id!: number;
}