/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { jwt } from '../../auth/auth/strategy/jwt.constants';
import { File } from '../../file/entities/file.entity';
import { ProjectLocation } from '../location/entities/projectLocation.entity';
import { ProjectFile } from './entities/projectFile.entity';
import { ProjectFileController } from './project-file.controller';
import { ProjectFileService } from './project-file.service';

@Module({
    providers: [ProjectFileService],
    controllers: [ProjectFileController],
    imports: [
        TypeOrmModule.forFeature([ProjectFile]), //, File, ProjectLocation]),
        JwtModule.register(jwt)
    ]
})
export class ProjectFileModule { }
