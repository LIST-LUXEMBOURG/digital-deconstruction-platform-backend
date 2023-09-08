/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CoreController } from "./core.controller";
import { CoreService } from "./core.service";
import { ClassificationEntry } from "./entities/classification-entry.entity";
import { ClassificationSystem } from "./entities/classification-system.entity";
import { jwt } from '../auth/auth/strategy/jwt.constants';
import { PropertyUnit } from "./entities/property-unit.entity";
import { PropertyType } from "./entities/property-type.entity";

@Module({
    providers: [CoreService],
    controllers: [CoreController],
    imports: [
        TypeOrmModule.forFeature([ClassificationSystem, ClassificationEntry, PropertyUnit, PropertyType]),
        JwtModule.register(jwt),

    ],
})
export class CoreModule { }