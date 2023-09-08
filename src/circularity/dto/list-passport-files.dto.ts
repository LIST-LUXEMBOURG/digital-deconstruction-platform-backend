/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsUUID } from 'class-validator';
import { Authorization } from '../../FWAjs-utils/utils/auth.interface';
import { WithProjectId } from '../../project/dto';
import { Constructor } from '../../utils/dto/mixins.dto';

export function WithParams<TBase extends Constructor>(Base: TBase) {
    class Params extends Base {
        @ApiProperty({
            type: String,
            required: true,
            description: 'The unique identifier of the circularity object',
        })
        @IsUUID()
        @IsNotEmpty()
        circularityUid: string;
    }
    return Params;
}
export class ListPassportFilesDto extends WithParams(WithProjectId(Authorization)) { }
