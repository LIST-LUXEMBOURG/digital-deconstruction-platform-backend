/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { Injectable } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { FWACallFct } from "../fwacall";
import { onModuleDynamicInit } from "../onModuleDynamicInit";
import { Token } from "../utils/common.interface";

@Injectable()
export class ApiAuthService {
    constructor(
        private readonly moduleRef: ModuleRef
    ) { }

    async onModuleInit() {
        await onModuleDynamicInit(
            this,
            null,
            ['authService']
        );
    }

    async validate(token: string): Promise<any> {
        return await FWACallFct(this, { srv: 'authService', cmd: 'checkAuthentication' }, token);
    }

    public getTokenInfo(): Token {
        return { location: 'headers', name: 'authorization' };
    }
}
