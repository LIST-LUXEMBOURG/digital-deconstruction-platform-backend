/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { jwt } from '../auth/auth/strategy/jwt.constants';
import { Element } from '../project/inventory/entities/element.entity';
import { InventoryCircularityService } from './inventory-circularity.service';
import { PassportFileService } from './passport-file.service';
import { InventoryCircularityController } from './inventory-circularity.controller';
import { PassportFileController } from './passport-file.controller';
import { PassportFile } from './entities/passport-file.entity';
import { Circularity } from './entities/circularity.entity';

@Module({
    providers: [InventoryCircularityService, PassportFileService],
    controllers: [InventoryCircularityController, PassportFileController],
    imports: [
        TypeOrmModule.forFeature([Element, Circularity, PassportFile]),
        JwtModule.register(jwt),
    ],
})
export class CircularityModule { }