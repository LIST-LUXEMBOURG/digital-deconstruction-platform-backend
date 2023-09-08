/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsInt, IsOptional, IsString } from 'class-validator';
import { Authorization } from '../../../FWAjs-utils/utils/auth.interface';

export class UsersGetAllDto extends Authorization {
	@ApiProperty({
		required: false,
		type: Number,
		description: 'The user unique id',
	})
	@IsInt()
	@IsOptional()
	readonly id: number;

	@ApiProperty({
		required: false,
		type: String,
		description: 'The users\' name',
	})
	@IsString()
	@IsOptional()
	readonly name: string;

	@ApiProperty({
		required: false,
		type: String,
		description: 'The users\' first name',
	})
	@IsString()
	@IsOptional()
	readonly firstName: string;

	@ApiProperty({
		required: false,
		type: String,
		description: 'The users\' email address',
	})
	@IsEmail()
	@IsOptional()
	readonly email: string;

	@ApiProperty({
		required: false,
		type: Boolean,
		description: 'Flag showing whether the user is active or not',
	})
	@IsBoolean()
	@IsOptional()
	@Transform(({ obj: { active } }) => {
		switch (active) {
			case 'true':
				return true;
			case 'false':
				return false;
			default:
				return active;
		}
	})
	readonly active: boolean;

	@ApiProperty({
		required: false,
		type: Boolean,
		description: 'Flag showing whether the user is blocked or not',
	})
	@IsBoolean()
	@IsOptional()
	@Transform(({ obj: { blocked } }) => {
		switch (blocked) {
			case 'true':
				return true;
			case 'false':
				return false;
			default:
				return blocked;
		}
	})
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
