/*
*   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
*   All rights reserved.
*   For licensing information see the "LICENSE" file in the root directory
*/

import { CacheModule, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CoreModule } from './core/core.module';
import { FileModule } from './file/file.module';
import { ApiAuthModule, ApiAccessControlModule } from './FWAjs-utils/';
import { LoggerModule } from './logging/logger.module';
import { ProjectModule } from './project/project.module';
import { Scan3dModule } from './scan/scan.module';
import { CircularityModule } from './circularity/circularity.module';
import { getConnectionOptions } from 'typeorm';

@Module({
    imports: [
        TypeOrmModule.forRoot(),
        CacheModule.register(),
        ScheduleModule.forRoot(),
        EventEmitterModule.forRoot({
            delimiter: '.',
            global: true,
            wildcard: true,
        }),
        LoggerModule,
        ApiAuthModule,
        ApiAccessControlModule,
        AuthModule,
        ProjectModule,
        FileModule,
        Scan3dModule,
        CircularityModule,
        CoreModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }
