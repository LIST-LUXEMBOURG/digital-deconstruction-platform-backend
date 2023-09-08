/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Constructor } from '../../utils/dto/mixins.dto';

export * from './project.dto';
export * from './pagination.dto';

export function WithProjectId<TBase extends Constructor>(Base: TBase) {
    class ProjectWithId extends Base {
        @ApiProperty({
            type: Number,
            required: true,
            description: 'The internal project Id',
            example: 42
        })
        @IsNumber()
        @IsNotEmpty()
        projectId: number;
    }
    return ProjectWithId;
}




