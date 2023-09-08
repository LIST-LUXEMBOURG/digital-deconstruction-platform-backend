/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { jwt } from '../auth/auth/strategy/jwt.constants';
import { Element } from '../project/inventory/entities/element.entity';
import { PointOfInterest } from '../scan/entities/point-of-interest.entity';
import { ScanConfig } from '../scan/entities/scan-config.entity';
import { PointOfInterestService } from '../scan/point-of-interest.service';
import { PointOfInterestController } from '../scan/point-of-interest.controller';
import { Scan3dConfigController } from '../scan/scan-config.controller';
import { Scan3dConfigService } from '../scan/scan-config.service';

@Module({
    providers: [PointOfInterestService, Scan3dConfigService],
    controllers: [PointOfInterestController, Scan3dConfigController],
    imports: [
        TypeOrmModule.forFeature([Element, PointOfInterest, ScanConfig]),
        JwtModule.register(jwt),
    ],
})
export class Scan3dModule { }
