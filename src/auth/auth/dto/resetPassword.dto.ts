/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class PasswordRequestResetDto {
    @ApiProperty({ required: true, type: String })
    @IsString()
    @IsEmail()
    @IsNotEmpty()
    readonly email: string;

    readonly source: string;
}

export class PasswordResetDto {
    @ApiProperty({ required: true, type: String })
    @IsString()
    @IsNotEmpty()
    readonly token: string;
}

export class PasswordResetActionDto {
    @ApiProperty({ required: true, type: String })
    @IsString()
    @IsNotEmpty()
    readonly token: string;

    @ApiProperty({ required: true, type: String })
    @IsString()
    @IsNotEmpty()
    readonly password: string;
}
