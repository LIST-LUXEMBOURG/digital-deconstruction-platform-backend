/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { jwt } from '../../auth/auth/strategy/jwt.constants';
import { BimModelController } from './bim-model.controller';
import { BimModel } from './entity/bim-model.entity';
import { BimModelService } from './bim-model.service';

@Module({
    imports: [TypeOrmModule.forFeature([BimModel]), JwtModule.register(jwt)],
    providers: [BimModelService],
    controllers: [BimModelController],
})
export class BimModelModule { }
