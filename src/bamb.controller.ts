/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { Controller } from '@nestjs/common';
import { BambService } from './bamb.service';

@Controller()
export class BambController {
    constructor(private readonly bambService: BambService) { }

}