/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsInt, IsNotEmpty, IsString } from 'class-validator';

export class AuthListDto {
    @ApiProperty({
        required: true,
        type: Number,
        description: 'The user id',
        example: 42
    })
    @IsInt()
    @IsNotEmpty()
    readonly userId: number;

    @ApiProperty({
        required: true,
        type: String,
        description: 'The username of the user',
        example: 'johndoe'
    })
    @IsNotEmpty()
    @IsString()
    readonly login: string;

    @ApiProperty({
        required: true,
        type: Date,
        description: 'The date and time the users token expires',
        example: '2023- 02- 07 12:53:02'
    })
    @IsNotEmpty()
    @IsDate()
    readonly timestamp: Date;
}
