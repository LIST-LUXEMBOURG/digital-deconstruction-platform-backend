/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';
import { Authorization } from '../../../FWAjs-utils/utils/auth.interface';
export class RoleRevokeDto extends Authorization {
	@ApiProperty({ required: true, type: Number, description: 'The unique role identifier' })
	@IsInt()
	@IsNotEmpty()
	readonly roleId: number;

	@ApiProperty({ required: true, type: Number, description: 'The user unique identifier' })
	@IsInt()
	@IsNotEmpty()
	readonly userId: number;
}
