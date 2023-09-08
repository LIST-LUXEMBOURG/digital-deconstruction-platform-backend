/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { Constructor } from '../../../utils/dto/mixins.dto';
import { WithProjectId } from '../../dto';
import { Authorization } from '../../../FWAjs-utils/utils/auth.interface';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export function WithParams<TBase extends Constructor>(Base: TBase) {
    class Params extends WithProjectId(Base) {
        @ApiProperty({
            type: String,
            required: true,
            description: 'The unique identifier of an element type',
        })
        @IsUUID()
        @IsNotEmpty()
        elementTypeUid: string;
    }

    return Params;
}

export class DeleteInventoryElementTypeParamsDto extends WithParams(class { }) { }
export class DeleteInventoryElementTypeDto extends WithParams(Authorization) { }