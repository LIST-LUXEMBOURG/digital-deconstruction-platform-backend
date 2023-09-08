/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import * as path from 'path';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { config } from 'dotenv';
import { resolve } from 'path';

const envPath = resolve(
  process.env.NODE_ENV === 'production' ? '.env' : (process.env.NODE_ENV === 'test' ? '.env.test' : '.env.dev'),
);
const cfg = config({
  path: envPath,
}).parsed;

export const postgres: TypeOrmModuleOptions = {
  type: 'postgres',
  host: cfg.DB_HOST,
  port: parseInt(cfg.DB_PORT),
  username: cfg.DB_USERNAME,
  password: cfg.DB_PASSWORD,
  database: cfg.DB_DATABASE,
  entities: ['../dist/**/*.entity.js'],
  synchronize: false,
  migrationsRun: false
};

export default {
  postgres,
};
