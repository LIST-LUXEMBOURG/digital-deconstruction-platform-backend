
/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';

import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ApiLoggerMiddleware implements NestMiddleware {
    private logger = new Logger('API');

    use(request: Request, response: Response, next: NextFunction): void {
        const { ip, method, baseUrl } = request;
        const userAgent = request.get('user-agent') || '';
        const startAt = process.hrtime();

        response.on('finish', () => {
            const { statusCode } = response;
            const contentLength = (statusCode != 304) ? response.get('content-length') : "n/a";
            const diff = process.hrtime(startAt);
            const responseTime = diff[0] * 1e3 + diff[1] * 1e-6;

            this.logger.log(
                `${method} ${baseUrl} [${statusCode}] <${contentLength}> [${responseTime} ms] - ${ip}`
            );
        });

        next();
    }
}