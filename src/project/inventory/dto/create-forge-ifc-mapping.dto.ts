/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Authorization } from '../../../FWAjs-utils/utils/auth.interface';
import { Constructor } from '../../../utils/dto/mixins.dto';
import { WithProjectId } from '../../dto';

export function WithBody<TBase extends Constructor>(Base: TBase) {
    class Body extends Base {
        projectId: number;

        @ApiProperty({
            type: String,
            required: false,
            description:
                'An identifier of an element from an Autodesk 3D model (IFC format)',
        })
        @IsString()
        @IsNotEmpty()
        ifcId: string;

        @ApiProperty({
            type: String,
            required: false,
            description:
                'An identifier of an element from an Autodesk Forge model',
        })
        @IsString()
        @IsNotEmpty()
        forgeId: string;
    }
    return Body;
}

export class CreateForgeIfcMappingParamsDto extends WithProjectId(class { }) { }
export class CreateForgeIfcMappingBodyDto extends WithBody(class { }) { }
export class CreateForgeIfcMappingDto extends WithBody(
    WithProjectId(Authorization),
) { }