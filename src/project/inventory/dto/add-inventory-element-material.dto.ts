/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

// TODO I think it's more appropriate to have a separated dto for updating an element and adding a material to element.
import { ApiProperty } from '@nestjs/swagger';
import {
    IsBoolean,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator';

import { Constructor } from '../../../utils/dto/mixins.dto';
import { WithProjectId } from '../../dto';
import { Authorization } from '../../../FWAjs-utils/utils/auth.interface';

function WithParams<TBase extends Constructor>(Base: TBase) {
    class Params extends WithProjectId(Base) {
        @ApiProperty({
            type: String,
            required: true,
            description: 'The element identifier',
        })
        @IsString()
        @IsNotEmpty()
        elementUid: string;
    }
    return Params;
}

export function WithBody<TBase extends Constructor>(Base: TBase) {
    class Body extends Base {
        @ApiProperty({
            type: [String],
            required: true,
            description: 'The name of the inventory element',
        })
        @IsString()
        @IsNotEmpty()
        materials: [String];
    }
    return Body;
}

export class AddInventoryElementMaterialBodyDto extends WithBody(class { }) { }
export class AddInventoryElementMaterialParamsDto extends WithParams(class { }) { }
export class AddInventoryElementMaterialDto extends WithBody(
    WithParams(Authorization),
) { }
