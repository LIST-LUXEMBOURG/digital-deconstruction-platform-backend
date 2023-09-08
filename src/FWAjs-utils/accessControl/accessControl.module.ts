/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { Global, Module } from "@nestjs/common";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ACCESS_CONTROL_GUARD, ACCESS_CONTROL_INTERCEPTOR } from "./accessControl.constants";
import { ApiAccessControlController } from "./accessControl.controller";
import { ApiAccessGuard } from "./accessControl.guard";
import { AccessControlInterceptor } from "./accessControl.interceptor";
import { ApiAccessControlService } from "./accessControl.service";

@Global()
@Module({
    imports: [
        EventEmitterModule.forRoot({
            delimiter: '.',
            global: true,
            wildcard: true
        }),
        ApiAccessControlController
    ],
    providers: [
        ApiAccessControlService,
        {
            provide: ACCESS_CONTROL_INTERCEPTOR,
            useClass: AccessControlInterceptor
        },
        {
            provide: ACCESS_CONTROL_GUARD,
            useClass: ApiAccessGuard,
        }
    ],
    controllers: [
        //        ApiAccessControlController
    ],
    exports: [
        ApiAccessControlService
    ]
})
export class ApiAccessControlModule { }