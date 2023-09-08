/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Authorization } from '../../../FWAjs-utils/utils/auth.interface';

export class FilterNameDto extends Authorization {
	@ApiProperty({
		required: false,
		type: String,
	})
	@IsOptional()
	@IsNotEmpty()
	@IsString()
	readonly filterName: string;
}
