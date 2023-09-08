/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Authorization } from '../../../FWAjs-utils/utils/auth.interface';

export class UserCreateDto extends Authorization {
	@ApiProperty({ required: true, type: String, description: 'The user unique login' })
	@IsString()
	@IsNotEmpty()
	readonly login: string;

	@ApiProperty({ required: true, type: String, description: 'The user password' })
	@IsString()
	@IsNotEmpty()
	readonly password: string;

	@ApiProperty({ required: true, type: String, description: 'The user name' })
	@IsString()
	@IsNotEmpty()
	readonly name: string;

	@ApiProperty({ required: true, type: String, description: 'The user firstname' })
	@IsString()
	@IsNotEmpty()
	readonly firstName: string;

	@ApiProperty({
		required: false,
		type: String,
		nullable: true,
		description: 'The user mail adress',
	})
	@IsEmail()
	@IsOptional()
	readonly email: string;

	@ApiProperty({
		required: false,
		type: Boolean,
		default: true,
		description:
			"Wether the user is active or not. Active users can log in, inactive ones can't",
	})
	@IsBoolean()
	@IsOptional()
	readonly active: boolean;

	@ApiProperty({
		required: false,
		type: Boolean,
		default: false,
		description: 'Flag to indicate if the user is blocked',
	})
	@IsBoolean()
	@IsOptional()
	readonly blocked: boolean;

	@ApiProperty({
		required: false,
		type: String,
		description: 'Reason why the user is blocked',
	})
	@IsString()
	@IsOptional()
	readonly blockingReason: string;
}
export class UserCreateWithoutAuthDto {
	// @ApiProperty({ required: true, type: String, description: 'The user unique login' })
	// @IsString()
	// @IsNotEmpty()
	readonly login: string;

	// @ApiProperty({ required: true, type: String, description: 'The user password' })
	// @IsString()
	// @IsNotEmpty()
	readonly password: string;

	// @ApiProperty({ required: true, type: String, description: 'The user name' })
	// @IsString()
	// @IsNotEmpty()
	readonly name: string;

	// @ApiProperty({ required: true, type: String, description: 'The user firstname' })
	// @IsString()
	// @IsNotEmpty()
	readonly firstName: string;

	// @ApiProperty({
	// 	required: false,
	// 	type: String,
	// 	nullable: true,
	// 	description: 'The user mail adress',
	// })
	// @IsEmail()
	// @IsOptional()
	readonly email: string;

	// @ApiProperty({
	// 	required: false,
	// 	type: Boolean,
	// 	default: true,
	// 	description:
	// 		"Wether the user is active or not. Active users can log in, inactive ones can't",
	// })
	// @IsBoolean()
	// @IsOptional()
	// readonly active: boolean;

	// @ApiProperty({
	// 	required: false,
	// 	type: Boolean,
	// 	default: false,
	// 	description: 'Flag to indicate if the user is blocked',
	// })
	// @IsBoolean()
	// @IsOptional()
	// readonly blocked: boolean;

	// @ApiProperty({
	// 	required: false,
	// 	type: String,
	// 	description: 'Reason why the user is blocked',
	// })
	// @IsString()
	// @IsOptional()
	// readonly blockingReason: string;
}
