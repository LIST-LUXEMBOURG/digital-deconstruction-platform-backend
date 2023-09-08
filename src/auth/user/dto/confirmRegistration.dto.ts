/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RegistrationConfirmDto {
	@ApiProperty({ required: true, type: String })
	@IsString()
	@IsNotEmpty()
	readonly token: string;

	@ApiProperty({ required: true, type: String })
	@IsString()
	@IsNotEmpty()
	readonly password: string;
}
