/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { Repository } from 'typeorm';
import { Role } from './role.entity';
import { UserRole } from './user-role.entity';

export interface IRole {
    id?: number;
    name: string;
    longName: string;
    description: string;
    users?: number;
}

// export interface Config {
//   repos: Repositories;
//   com: CommunicationService;
//   service: RoleService;
//   cache: CacheStore;
// }

export interface Repositories {
    role: Repository<Role>;
    userRole: Repository<UserRole>;
}
