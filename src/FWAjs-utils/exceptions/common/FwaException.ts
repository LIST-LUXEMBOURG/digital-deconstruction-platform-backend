/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { HttpException, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

export interface BasicExceptionInfo {
    readonly code?: HttpStatus | number;
    readonly message: string;
    readonly messageCode: string;
    readonly messageData?: any;
    readonly thrownOn?: Date;
}

export function FwaException({
    code = 520,
    message,
    messageCode,
    messageData = null,
}: BasicExceptionInfo): HttpException | RpcException {
    if (process.env.ARCHITECTURE === 'MONOLITHIC')
        return new HttpException(
            {
                message,
                messageCode,
                messageData,
                thrownOn: new Date(),
            },
            code,
        );

    if (process.env.ARCHITECTURE === 'MICROSERVICE')
        return new RpcException({
            status: code,
            message,
            messageData,
            messageCode,
            thrownOn: new Date(),
        });

    throw new Error(
        '`ARCHITECTURE` is not defined in the environment variables',
    );
}
