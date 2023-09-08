/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class AuthCreateDto {
	@ApiProperty({ required: true, type: String })
	@IsNotEmpty()
	readonly login?: string;

	@ApiProperty({ required: false, type: String })
	@IsNotEmpty()
	readonly password: string;
}
