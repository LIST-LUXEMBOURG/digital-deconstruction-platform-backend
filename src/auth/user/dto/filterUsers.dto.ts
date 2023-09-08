/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Authorization } from '../../../FWAjs-utils/utils/auth.interface';

export class UsersFilterDto extends Authorization {
	@ApiProperty({
		required: false,
		type: String,
		description: 'The string containning the key words to filter the users by',
	})
	@IsString()
	@IsOptional()
	readonly filter: string;

	@ApiProperty({
		required: false,
		type: Boolean,
		description: 'Are the users active or no',
	})
	@IsBoolean()
	@IsOptional()
	@Transform(({ obj: { active } }) => {
		switch (active) {
			case 'true':
				return true;
			case 'false':
				return false;
			default:
				return active;
		}
	})
	readonly active: boolean;

	@ApiProperty({
		required: false,
		type: Boolean,
		description: 'are the users blocked or no',
	})
	@IsBoolean()
	@IsOptional()
	@Transform(({ obj: { blocked } }) => {
		switch (blocked) {
			case 'true':
				return true;
			case 'false':
				return false;
			default:
				return blocked;
		}
	})
	readonly blocked: boolean;
}
