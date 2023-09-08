/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import {
    IsDate,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUrl,
} from 'class-validator';
import { Authorization } from '../../FWAjs-utils/utils/auth.interface';
import { Constructor } from '../../utils/dto/mixins.dto';
import { WithProjectId } from '../../project/dto/index';

export function WithBody<TBase extends Constructor>(Base: TBase) {
    class Body extends Base {
        @ApiProperty({
            required: true,
            type: String,
            description: 'The URL of the project 3D scan',
            example: 'https://ddc.bim-y.com/sample-project/',
        })
        @IsUrl()
        @IsNotEmpty()
        scanUrl: string;
    }
    return Body;
}
export class CreateScanConfigParamsDto extends WithProjectId(class { }) { }
export class CreateScanConfigBodyDto extends WithBody(class { }) { }
export class CreateScanConfigDto extends WithBody(
    WithProjectId(Authorization),
) { }

