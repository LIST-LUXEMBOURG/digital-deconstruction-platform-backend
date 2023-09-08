/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';
import { Authorization } from '../../../FWAjs-utils/utils/auth.interface';

export class UserRolesGetDto extends Authorization {
	@ApiProperty({ required: true, type: Number, description: 'The unique user ID' })
	@IsInt()
	@IsNotEmpty()
	userId: number;
}
