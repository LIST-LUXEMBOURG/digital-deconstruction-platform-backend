/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Authorization } from '../../../FWAjs-utils/utils/auth.interface';
export class RoleUpdateDto extends Authorization {
    @ApiProperty({
        required: true,
        type: Number,
        description: 'The unique role identifier',
    })
    @IsInt()
    @IsNotEmpty()
    readonly id: number;

    @ApiProperty({
        required: false,
        type: String,
        description: 'The visible role name',
    })
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    readonly longName: string;

    @ApiProperty({
        required: false,
        type: String,
        description: 'The role description',
    })
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    readonly description: string;
}
