/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { IsNotEmpty, IsString } from 'class-validator';

export class PasswordResetDto {
	@IsString()
	@IsNotEmpty()
	readonly token: string;

	@IsString()
	@IsNotEmpty()
	readonly password: string;
}
