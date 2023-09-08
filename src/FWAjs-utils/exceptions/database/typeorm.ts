/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { HttpException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { QueryFailedError } from 'typeorm';
import { FwaException } from '..';

export enum constants {
    ER_DUP_ENTRY,
}

export function handler(error: any): HttpException | RpcException | boolean {
    if (!(error instanceof QueryFailedError)) return false;

    error = error as QueryFailedError;
    switch (error.code) {
        case constants[constants.ER_DUP_ENTRY]:
            let values: string[] = error.sqlMessage.match(/'(.*?)'/g);
            values = values.map((v) => v.replace(/'/gm, ''));
            let messageData = { value: values[0], key: values[1] };
            return FwaException({
                message: error.sqlMessage,
                messageCode: constants[constants.ER_DUP_ENTRY],
                code: 409,
                messageData,
                thrownOn: new Date(),
            });
        default:
            return false;
    }
}
