/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { config } from 'dotenv';
import { resolve } from 'path';

const envPath = resolve(
    process.env.NODE_ENV === 'production' ? '.env' : (process.env.NODE_ENV === 'test' ? '.env.test' : '.env.dev'),
);

const cfg = config({
    path: envPath,
}).parsed;

export default {
    ...cfg,
    NODE_ENV: process.env.NODE_ENV,
};
