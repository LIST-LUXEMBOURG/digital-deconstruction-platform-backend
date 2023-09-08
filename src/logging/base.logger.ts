/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { createLogger, transports } from 'winston';

export enum LogLevel {
    CRITICAL = 'critical',
    ALERT = 'alert',
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    DEBUG = 'debug'
};

export class BaseLogger {

    private logger = createLogger({
        level: 'info',
        transports: [
            new transports.Console(),
            new transports.File({ filename: 'ddc.log' })
        ]
    })

    private static logLevelMap = new Map<LogLevel, string>([
        [LogLevel.CRITICAL, 'critical'],
        [LogLevel.ALERT, 'alert'],
        [LogLevel.ERROR, 'error'],
        [LogLevel.WARN, 'warn'],
        [LogLevel.INFO, 'info'],
        [LogLevel.DEBUG, 'debug'],
    ]);

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //-----------------------------------------------------------------------


    //-----------------------------------------------------------------------
    //***********************************************************************
    //* API
    //***********************************************************************
    //-----------------------------------------------------------------------



    //----------------------------------------------------------------------- 

    public log(logLevel: LogLevel, message: string, context: string) {
        let level = BaseLogger.logLevelMap.get(logLevel);

        this.logger.log({
            level: level,
            message: message,
            meta: { service: context }
        });
    }

}