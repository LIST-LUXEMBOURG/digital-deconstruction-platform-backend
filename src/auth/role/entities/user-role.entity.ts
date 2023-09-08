/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class UserRole {
    @PrimaryColumn()
    userId: number;

    @PrimaryColumn()
    roleId: number;
}
