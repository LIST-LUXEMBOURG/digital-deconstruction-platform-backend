/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Timeout } from '@nestjs/schedule';
import { dispatchACDBs } from '../../FWAjs-utils';

@Injectable()
export class AcdbService {
    constructor(
        private readonly eventEmitter: EventEmitter2
    ) { }


    @Timeout(2000)
    async sendACDB(): Promise<void> {
        dispatchACDBs(
            this,
            (await import('./accessControl/accessControl.database')).default
        )
    }
}