/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { HttpException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

export default {
    ER_DUP_ENTRY: 'ER_DUP_ENTRY',
};
export enum constants {}

export function handler(error: any): HttpException | RpcException | boolean {
    return false;
}
