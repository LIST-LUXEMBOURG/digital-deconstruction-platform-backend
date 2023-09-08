/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Authorization } from '../../../FWAjs-utils/utils/auth.interface';

export class PasswordChangeDto extends Authorization {
	@ApiProperty({ required: true, type: String, description: 'The user current password' })
	@IsString()
	@IsNotEmpty()
	currentPassword: string;

	@ApiProperty({
		required: true,
		type: String,
		description: 'The new password for the user',
	})
	@IsString()
	@IsNotEmpty()
	newPassword: string;
}
