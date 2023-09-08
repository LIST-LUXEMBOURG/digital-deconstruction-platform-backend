/*
*   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
*   All rights reserved.
*   For licensing information see the "LICENSE" file in the root directory
*/

import { CacheModule, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth/auth/auth.controller';
import { AuthService } from './auth/auth/auth.service';
import { jwt } from './auth/auth/strategy/jwt.constants';
import { ParticipantService } from './project/participant/participant.service';

import { File } from './file/entities/file.entity';
import { Project, ProjectAddress } from './project/entities';
import { ProjectParticipant } from './project/participant/entities/projectParticipant.entity';
import { ProjectFile } from './project/project-file/entities/projectFile.entity';

import { AuthModule } from './auth/auth.module';
import { CoreModule } from './core/core.module';
import { FileService } from './file/file.service';
import { ApiAccessControlModule, ApiAuthModule } from './FWAjs-utils';
import { LoggerModule } from './logging/logger.module';
import { InventoryModule } from './project/inventory/inventory.module';
import { LocationModule } from './project/location/location.module';
import { ProjectFileService } from './project/project-file/project-file.service';
import { ProjectController } from './project/project.controller';
import { ProjectService } from './project/project.service';
import cacheConfig from './config/cache.config';
import { CircularityModule } from './circularity/circularity.module';
import { BambController } from './bamb.controller';
import { BambService } from './bamb.service';
import { ApiLoggerMiddleware } from './utils/api-logger-middleware';


@Module({
    imports: [
        TypeOrmModule.forRoot(),
        TypeOrmModule.forFeature([Project, ProjectAddress, ProjectParticipant, File, ProjectFile]),
        CacheModule.register(cacheConfig),
        ScheduleModule.forRoot(),
        EventEmitterModule.forRoot({
            delimiter: '.',
            global: true,
            wildcard: true,
        }),
        JwtModule.register(jwt),
        LoggerModule,
        ApiAuthModule,
        ApiAccessControlModule,
        AuthModule,
        CoreModule,
        LocationModule,
        InventoryModule,
        CircularityModule,
    ],

    controllers: [AuthController,
        ProjectController,
        BambController],

    providers: [AuthService,
        ParticipantService,
        ProjectService,
        ProjectFileService,
        FileService,
        BambService,],
})
export class BambModule implements NestModule {
    configure(consumer: MiddlewareConsumer): void {
        consumer.apply(ApiLoggerMiddleware).forRoutes('*');
    }
}
