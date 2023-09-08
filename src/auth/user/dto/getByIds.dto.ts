/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { IsArray } from 'class-validator';
import { Authorization } from '../../../FWAjs-utils/utils/auth.interface';

export class UsersGetByIdsDto extends Authorization {
	@IsArray()
	readonly userIds: number[];

}
