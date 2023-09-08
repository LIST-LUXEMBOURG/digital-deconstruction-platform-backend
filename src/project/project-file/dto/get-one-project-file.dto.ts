/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */
import { Constructor } from '../../../utils/dto/mixins.dto';
import { WithProjectId } from '../../dto';
import { Authorization } from '../../../FWAjs-utils/utils/auth.interface';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export function WithParams<TBase extends Constructor>(Base: TBase) {
    class Params extends WithProjectId(Base) {
        @ApiProperty({
            required: true,
            type: Number,
            description: 'The Id of the project file'
        })
        @IsNumber()
        @IsNotEmpty()
        readonly projectFileId!: number;
    }
    return Params;
}

export class ProjectFileGetOneDto extends WithParams(Authorization) { }