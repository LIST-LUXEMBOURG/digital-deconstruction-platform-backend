/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { jwt } from '../../auth/auth/strategy/jwt.constants';
import { ProjectLocation } from './entities/projectLocation.entity';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';

@Module({
    providers: [LocationService],
    controllers: [LocationController],
    imports: [
        TypeOrmModule.forFeature([
            ProjectLocation
        ]),
        JwtModule.register(jwt),
    ]
})
export class LocationModule { }
