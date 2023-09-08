/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import * as redisStore from 'cache-manager-redis-store';
import { config } from 'dotenv';
import { resolve } from 'path';

const envPath = resolve(
  process.env.NODE_ENV === 'production' ? '.env' : (process.env.NODE_ENV === 'test' ? '.env.test' : '.env.dev'),
);
const cfg = config({
  path: envPath,
}).parsed;

const cacheConf = {
  store: redisStore,
  isGlobal: true,
  host: cfg.CACHE_HOST,
  port: parseInt(cfg.CACHE_PORT),
  ttl: parseInt(cfg.CACHE_TTL),
};

export const shortidTTL = parseInt(cfg.CACHE_SHORTID_TTL);

export default cacheConf;
