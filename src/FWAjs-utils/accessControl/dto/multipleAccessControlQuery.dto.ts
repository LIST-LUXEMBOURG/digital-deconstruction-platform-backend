/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { SingleAccessControlQuery } from './singleAccessControlQuery.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Authorization } from '../../../FWAjs-utils/utils/auth.interface';
import { ArrayNotEmpty, IsArray, ValidateNested } from 'class-validator';

export class MultipleAccessControlQuery extends Authorization {
	@ApiProperty({
		required: true,
		type: [SingleAccessControlQuery],
	})
	// @(Joiful.array({ elementClass: SingleAccessControlQuery }).required())
	@IsArray()
	@ArrayNotEmpty()
	@ValidateNested({
		each: true
	})
	readonly requests: SingleAccessControlQuery[];
}
