/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { jwt } from '../auth/auth/strategy/jwt.constants';
import { Project, ProjectAddress } from './entities';
import { LocationModule } from './location/location.module';
import { ParticipantModule } from './participant/participant.module';
import { BimModelModule } from './bim-model/bim-model.module';
import { ProjectFileModule } from './project-file/project-file.module';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { InventoryModule } from './inventory/inventory.module';

@Module({
    providers: [ProjectService],
    controllers: [ProjectController],
    imports: [
        TypeOrmModule.forFeature([Project, ProjectAddress]),
        JwtModule.register(jwt),
        LocationModule,
        ParticipantModule,
        ProjectFileModule,
        BimModelModule,
        InventoryModule,
    ],
})
export class ProjectModule { }
