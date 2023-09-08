/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import {
    IsEnum,
    IsIn,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator';
import { Authorization } from '../../../FWAjs-utils/utils/auth.interface';
import { Constructor } from '../../../utils/dto/mixins.dto';
import { WithProjectId } from '../../dto';
import { Role } from '../entities/projectParticipant.entity';

export function WithParams<TBase extends Constructor>(Base: TBase) {
    class Params extends WithProjectId(Base) {
        @ApiProperty({
            type: Number,
            required: true,
            description: 'The unique identifier of the participating user',
        })
        @IsNumber()
        userId: number;
    }

    return Params;
}

export function WithBody<TBase extends Constructor>(Base: TBase) {
    class Body extends Base {
        @ApiProperty({
            required: true,
            enum: Role,
            description: 'The role that the user has in the project',
        })
        @IsEnum(Role)
        @IsNotEmpty()
        role?: Role;
    }
    return Body;
}
export class UpdateProjectParticipantParamsDto extends WithParams(class { }) { }
export class UpdateProjectParticipantBodyDto extends WithBody(class { }) { }
export class UpdateProjectParticipantDto extends WithBody(
    WithParams(Authorization),
) { }