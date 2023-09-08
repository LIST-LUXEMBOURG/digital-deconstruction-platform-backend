/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { Controller, Get } from '@nestjs/common';
import { ScanService } from './scan.service';

@Controller()
export class ScanController {
  constructor(private readonly scanService: ScanService) { }

}
