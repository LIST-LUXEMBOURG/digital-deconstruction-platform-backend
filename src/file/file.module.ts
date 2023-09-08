/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Services
import { FileService } from './file.service';
import { FileController } from './file.controller';
// Entities
import { File } from './entities/file.entity';
import { JwtModule } from '@nestjs/jwt';
import { jwt } from '../auth/auth/strategy/jwt.constants';

import cfg from '../config/env.config';
const controllers = cfg.NODE_ENV === 'production' ? [] : [FileController];

@Module({
    imports: [TypeOrmModule.forFeature([File]), JwtModule.register(jwt)],
    providers: [FileService],
    controllers,
})
export class FileModule {}
