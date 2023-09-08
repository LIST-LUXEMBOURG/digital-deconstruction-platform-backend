/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { Injectable, LoggerService, Scope } from "@nestjs/common";
import { BaseLogger, LogLevel } from "./base.logger";

@Injectable({ scope: Scope.TRANSIENT })
export class BaseLoggerService implements LoggerService {

    private logger: BaseLogger;
    private context: string;

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor(s)
    //***********************************************************************
    //-----------------------------------------------------------------------

    constructor() {
        this.logger = new BaseLogger();
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Primitive(s)
    //***********************************************************************
    //-----------------------------------------------------------------------

    setContext(context: string) {
        this.context = context;
    }

    //-----------------------------------------------------------------------

    log(message: any, context?: string) {

        this.logger.log(LogLevel.INFO, message, (context !== undefined) ? context : this.context);
    }
    //-----------------------------------------------------------------------
    error(message: any, trace?: string, context?: string) {
        this.logger.log(LogLevel.ERROR, trace, (context !== undefined) ? context : this.context);
    }
    //-----------------------------------------------------------------------
    warn(message: any, context?: string) {
        this.logger.log(LogLevel.WARN, message, (context !== undefined) ? context : this.context);
    }
    //-----------------------------------------------------------------------
    debug?(message: any, context?: string) {
        this.logger.log(LogLevel.DEBUG, message, (context !== undefined) ? context : this.context);
    }
    //-----------------------------------------------------------------------
    verbose?(message: any, context?: string) {
        throw new Error("Method not implemented.");
    }

}