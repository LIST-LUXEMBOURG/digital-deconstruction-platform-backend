/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { Controller, Get } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ApiTags } from '@nestjs/swagger';
import {
    ACCESS_CONTROL_DISPATCH_ACDB,
    ACCESS_CONTROL_MODULE_NAME,
    ACCESS_CONTROL_TAG_NAME,
} from './accessControl.constants';
import { ApiAccessControlService } from './accessControl.service';

@ApiTags(ACCESS_CONTROL_TAG_NAME)
@Controller(ACCESS_CONTROL_MODULE_NAME)
export class ApiAccessControlController {
    constructor(
        private readonly apiAccessControlService: ApiAccessControlService,
    ) { }

    @Get()
    listGlobalACDBs() {
        return this.apiAccessControlService.getGrants();
    }

    @OnEvent(ACCESS_CONTROL_DISPATCH_ACDB)
    mergeACDBs(receivedACDB) {
        this.apiAccessControlService.mergeACDBs(receivedACDB);
    }
}
