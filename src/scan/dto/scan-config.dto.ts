/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsUrl } from 'class-validator';
import { Constructor } from '../../utils/dto/mixins.dto';
import { WithProjectId } from '../../project/dto/index';


export function WithBody<TBase extends Constructor>(Base: TBase) {
    class Body extends Base {
        @ApiProperty({
            required: true,
            type: Number,
            description: 'The internal Id of the scan config',
            example: 42
        })
        @IsNumber()
        id: number;

        @ApiProperty({
            required: true,
            type: String,
            description: 'The URL of the project 3D scan',
            example: 'https://ddc.bim-y.com/sample-project/',
        })
        @IsUrl()
        scanUrl: string;
    }
    return Body;
}

export class ScanConfigDto extends WithBody(
    WithProjectId(class { }),
) { }
