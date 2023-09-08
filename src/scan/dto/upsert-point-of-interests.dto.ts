/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { Authorization } from '../../FWAjs-utils/utils/auth.interface';
import { Constructor } from '../../utils/dto/mixins.dto';
import { WithProjectId } from '../../project/dto';

export function WithBody<TBase extends Constructor>(Base: TBase) {
    class Body extends Base {
        @ApiProperty({
            required: true,
            type: Array,
            description: 'The document files to upload',
        })
        readonly files: Express.Multer.File[];
    }
    return Body;
}
export class UpsertPointOfInterestsParamsDto extends WithProjectId(class { }) { }
export class UpsertPointOfInterestsBodyDto extends WithBody(class { }) { }
export class UpsertPointOfInterestsDto extends WithBody(
    WithProjectId(Authorization),
) { }

