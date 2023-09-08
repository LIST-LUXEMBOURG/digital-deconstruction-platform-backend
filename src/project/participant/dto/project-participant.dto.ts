/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */
import { Constructor } from '../../../utils/dto/mixins.dto';
import { WithProjectId } from '../../dto';
import { Authorization } from '../../../FWAjs-utils/utils/auth.interface';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { Role } from '../entities/projectParticipant.entity';

export function WithBody<TBase extends Constructor>(Base: TBase) {
    class Body extends WithProjectId(Base) {
        @ApiProperty({
            required: true,
            type: Number,
            description: 'The Id of the user participating in the project'
        })
        @IsNumber()
        @IsNotEmpty()
        userId!: number;

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

export class ProjectParticipantDto extends WithBody(class { }) { }

