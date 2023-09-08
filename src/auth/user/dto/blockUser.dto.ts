/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Authorization } from '../../../FWAjs-utils/utils/auth.interface';

export class UserBlockDto extends Authorization {
	@ApiProperty({ required: true, type: Number, description: 'The user id' })
	@IsInt()
	@IsNotEmpty()
	readonly userId: number;

	@ApiProperty({
		required: false,
		type: String,
		description: 'Reason why the user is blocked',
	})
	@IsString()
	@IsOptional()
	readonly blockingReason: string;
}
