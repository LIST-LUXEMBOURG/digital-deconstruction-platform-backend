/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
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
  host: cfg.MAILER_HOST,
  port: parseInt(cfg.MAILER_PORT),
  from: cfg.MAILER_FROM,
};
