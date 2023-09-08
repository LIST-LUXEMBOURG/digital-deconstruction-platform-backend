/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { jwt } from '../../auth/auth/strategy/jwt.constants';
import { ProjectParticipant } from './entities/projectParticipant.entity';
import { ParticipantController } from './participant.controller';
import { ParticipantService } from './participant.service';

@Module({
    providers: [ParticipantService],
    controllers: [ParticipantController],
    imports: [
        TypeOrmModule.forFeature([ProjectParticipant]),
        JwtModule.register(jwt)
    ]
})
export class ParticipantModule { }
