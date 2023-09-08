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

function WithParams<TBase extends Constructor>(Base: TBase) {
    class Params extends WithProjectId(Base) {
        @ApiProperty({
            required: true,
            type: Number,
            description: 'The unique identifier of the scan configuration',
            example: 42
        })
        @IsNumber()
        @IsNotEmpty()
        readonly scanConfigId!: number;
    }
    return Params;
}

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

export class UpdateScanConfigParamsDto extends WithParams(class { }) { }
export class UpdateScanConfigBodyDto extends WithBody(class { }) { }
export class UpdateScanConfigDto extends WithBody(
    WithParams(Authorization),
) { }

