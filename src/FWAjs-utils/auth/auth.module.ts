/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { Global, Module } from "@nestjs/common";
import { AUTH_GUARD } from "./auth.constants";
import { ApiAuthGuard } from "./auth.guard";
import { ApiAuthService } from "./auth.service";

@Global()
@Module({
    providers: [
        ApiAuthService,
        {
            provide: AUTH_GUARD,
            useClass: ApiAuthGuard,
        }
    ],
    exports: [ApiAuthService]
})
export class ApiAuthModule { }