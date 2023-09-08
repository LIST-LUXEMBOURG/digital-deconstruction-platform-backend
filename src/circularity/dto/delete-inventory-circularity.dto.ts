/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';
import { Authorization } from '../../FWAjs-utils/utils/auth.interface';
import { Constructor } from '../../utils/dto/mixins.dto';
import { WithProjectId } from '../../project/dto';

export function WithParams<TBase extends Constructor>(Base: TBase) {
    class Params extends WithProjectId(Base) {
        @ApiProperty({
            type: String,
            required: true,
            description: 'The unique identifier of a circularity object',
        })
        @IsUUID()
        @IsNotEmpty()
        circularityUid: string;
    }
    return Params;
}

export class DeleteInventoryCircularityParamsDto extends WithParams(class { }) { }
export class DeleteInventoryCircularityDto extends WithParams(Authorization) { }