/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { IsInt, IsOptional, IsString } from 'class-validator';
import { Authorization } from '../../../FWAjs-utils/utils/auth.interface';

export class RoleGetDto extends Authorization {
    @IsInt()
    @IsOptional()
    readonly id: number;

    @IsString()
    @IsOptional()
    readonly longName: string;

    @IsString()
    @IsOptional()
    readonly description: string;

    /** 
     * This property is used to get a role based on its name rather than its ID.
     * Thus we can us a straight forward query that doesn't rley on the role's ID
     * It is not exposed through the API documentation because it's exclusively an internal attribute!
     * */
    readonly name: string;
}
