/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { CacheModule, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { jwt } from './auth/strategy/jwt.constants';
import { JwtStrategy } from './auth/strategy/jwt.strategy';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { RoleController } from './role/role.controller';
import { RoleService } from './role/role.service';
import cacheConfig from '../config/cache.config';
import { User } from './user/entities/user.entity';
import { Role, UserRole } from './role/entities';
import { AcdbController } from './acdb/acdb.controller';
import { AcdbService } from './acdb/acdb.service';

@Module({
    imports: [
        PassportModule,
        JwtModule.register(jwt),
        CacheModule.register(cacheConfig),
        TypeOrmModule.forFeature([User, Role, UserRole]),
    ],
    controllers: [
        AuthController,
        AcdbController,
        UserController,
        RoleController,
    ],
    providers: [
        JwtStrategy,
        AuthService,
        AcdbService,
        UserService,
        RoleService,
    ],
    exports: [AuthService, UserService, RoleService],
})
export class AuthModule { }
