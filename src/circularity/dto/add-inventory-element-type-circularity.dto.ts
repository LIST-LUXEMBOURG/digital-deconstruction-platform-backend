/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

// TODO I think it's more appropriate to have a separated dto for updating an element and adding a material to element.
import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty, IsUUID
} from 'class-validator';

import { Authorization } from '../../FWAjs-utils/utils/auth.interface';
import { Constructor } from '../../utils/dto/mixins.dto';
import { WithProjectId } from '../../project/dto';

function WithParams<TBase extends Constructor>(Base: TBase) {
    class Params extends WithProjectId(Base) {
        @ApiProperty({
            type: String,
            required: true,
            description: 'The element type identifier',
        })
        @IsUUID()
        @IsNotEmpty()
        uid: string;

        @ApiProperty({
            type: Number,
            required: true,
            description: 'The uid of the circularity object entry to add',
        })
        @IsUUID()
        @IsNotEmpty()
        circularityUid: string;
    }
    return Params;
}

export class AddInventoryElementTypeCircularityBodyDto extends WithParams(class { }) { }
export class AddInventoryElementTypeCircularityParamsDto extends WithParams(class { }) { }
export class AddInventoryElementTypeCircularityDto extends WithParams(Authorization) { }