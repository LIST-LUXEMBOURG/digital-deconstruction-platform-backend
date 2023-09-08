/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

export class AuthRevokeDto {
	@ApiProperty({ required: true, type: Number, description: 'The user id' })
	@IsInt()
	@IsNotEmpty()
	readonly userId: number;
}
