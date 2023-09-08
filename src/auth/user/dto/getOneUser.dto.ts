/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class UserGetOneDto {
	@IsInt()
	@IsOptional()
	readonly id: number;

	@IsString()
	@IsOptional()
	readonly login: string;

	@IsString()
	@IsOptional()
	readonly password: string;

	@IsString()
	@IsOptional()
	readonly name: string;

	@IsString()
	@IsOptional()
	readonly firstName: string;

	@IsString()
	@IsOptional()
	readonly email: string;

	@IsBoolean()
	@IsOptional()
	readonly active: boolean;

	@IsBoolean()
	@IsOptional()
	readonly blocked: boolean;
}
