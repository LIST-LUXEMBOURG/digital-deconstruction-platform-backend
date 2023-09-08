/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { ApiProperty } from '@nestjs/swagger';

export class RoleDto {
    @ApiProperty({ type: Number, description: 'The unique role identifier' })
    id: number;

    @ApiProperty({ type: String, description: 'The role name' })
    longName: string;

    @ApiProperty({ type: String, description: 'The description of the role' })
    description: string;
}
