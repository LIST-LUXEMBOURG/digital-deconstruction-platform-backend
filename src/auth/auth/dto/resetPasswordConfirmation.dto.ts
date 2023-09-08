/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class PasswordResetCheckDto {
	@ApiProperty({ required: true, type: String })
	@IsNotEmpty()
	readonly login: string;

	@ApiProperty({ required: true, type: String })
	@IsNotEmpty()
	readonly firstName: string;

	@ApiProperty({ required: true, type: String })
	@IsNotEmpty()
	readonly name: string;

	@ApiProperty({ required: true, type: String })
	@IsEmail()
	readonly email: string;
}


export class PasswordResetConfirmationDto {
	@ApiProperty({ required: true, type: String })
	@IsNotEmpty()
	readonly token: string;

	@ApiProperty({ required: true, type: String })
	@IsNotEmpty()
	readonly password: string;
}
