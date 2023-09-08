/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

// TODO I think it's more appropriate to have a separated dto for updating an element and adding a material to element.
import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsNumber,
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
            description: 'The element type identifier',
        })
        @IsString()
        @IsNotEmpty()
        uid: string;

        @ApiProperty({
            type: Number,
            required: true,
            description: 'The id of the classification entry to add',
        })
        @IsNumber()
        @IsNotEmpty()
        classificationEntryId: number;
    }
    return Params;
}

export class AddInventoryElementTypeClassificationEntryBodyDto extends WithParams(class { }) { }
export class AddInventoryElementTypeClassificationEntryParamsDto extends WithParams(class { }) { }
export class AddInventoryElementTypeClassificationEntryDto extends WithParams(Authorization) { }
