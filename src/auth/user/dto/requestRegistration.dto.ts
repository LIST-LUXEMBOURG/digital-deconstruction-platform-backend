/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RegistrationRequestDto {
	@ApiProperty({ required: true, type: String })
	@IsString()
	@IsNotEmpty()
	readonly name: string;

	@ApiProperty({ required: true, type: String })
	@IsString()
	@IsNotEmpty()
	readonly firstName: string;

	@ApiProperty({ required: true, type: String })
	@IsString()
	@IsNotEmpty()
	readonly login: string;

	@ApiProperty({ required: true, type: String })
	@IsEmail()
	@IsNotEmpty()
	readonly email: string;
}
