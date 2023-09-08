/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Authorization } from '../../..//FWAjs-utils/utils/auth.interface';

export class UserUpdateDto extends Authorization {
	@ApiProperty({ required: true, description: 'The user unique id' })
	@IsInt()
	@IsNotEmpty()
	readonly id: number;

	@ApiProperty({ required: false, description: 'The user unique login' })
	@IsString()
	@IsNotEmpty()
	@IsOptional()
	readonly login: string;

	@ApiProperty({ required: false, description: 'The user password' })
	@IsString()
	@IsNotEmpty()
	@IsOptional()
	readonly password: string;

	@ApiProperty({ required: false, description: 'The user name' })
	@IsString()
	@IsNotEmpty()
	@IsOptional()
	readonly name: string;

	@ApiProperty({ required: false, description: 'The user firstname' })
	@IsString()
	@IsNotEmpty()
	@IsOptional()
	readonly firstName: string;

	@ApiProperty({ required: false, description: 'The user email adress' })
	@IsEmail()
	@IsOptional()
	readonly email: string;

	@ApiProperty({
		required: false,
		description: 'Flag to indicate if the user is active or not',
	})
	@IsBoolean()
	@IsOptional()
	readonly active: boolean;

	@ApiProperty({
		required: false,
		description: 'Flag to indicate if the user is blocked or not',
	})
	@IsBoolean()
	@IsOptional()
	readonly blocked: boolean;

	@ApiProperty({ required: false, description: 'Reason why the user is blocked' })
	@IsString()
	@IsOptional()
	readonly blockingReason: string;
}
