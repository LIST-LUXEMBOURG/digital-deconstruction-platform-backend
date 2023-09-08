/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Authorization } from '../../../FWAjs-utils/utils/auth.interface';

export class RolePrivilegesDto extends Authorization {
    @ApiProperty({
        required: false,
        type: Number,
    })
    @IsNotEmpty()
    @IsOptional()
    @IsInt()
    readonly roleId: number;

    // @ApiProperty({
    // 	required: false,
    // 	type: String,
    // })
    // @IsNotEmpty()
    // @IsOptional()
    // @IsString()
    // readonly roleName: string;
}
