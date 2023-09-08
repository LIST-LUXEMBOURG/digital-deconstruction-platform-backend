/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { Module } from '@nestjs/common';
import { BaseLoggerService } from './logger.service';

@Module({
    providers: [BaseLoggerService],
    exports: [BaseLoggerService]
})

export class LoggerModule { }