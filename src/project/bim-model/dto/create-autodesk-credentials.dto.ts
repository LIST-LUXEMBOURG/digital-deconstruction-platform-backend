/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsNumber,
    IsString,
} from 'class-validator';
import { Authorization } from '../../../FWAjs-utils/utils/auth.interface';
import { Constructor } from '../../../utils/dto/mixins.dto';
import { WithProjectId } from '../../dto';

export function WithBody<TBase extends Constructor>(Base: TBase) {
    class Body extends Base {
        @ApiProperty({
            required: true,
            type: String,
            description: "The Autodesk Client Id",
            example: "Y3qwNY15fAPoqG3V"
        })
        @IsString()
        @IsNotEmpty()
        clientId: string;

        @ApiProperty({
            required: true,
            type: String,
            description: "The Autodesk Client Secret",
            example: "RMceNrPUo9Na5Xgtq3ApqCcYufeuynum"
        })
        @IsString()
        @IsNotEmpty()
        clientSecret: string;

        @ApiProperty({
            required: true,
            type: String,
            description: "URN of the BIM model",
            example: "urn:adsk.objects:os.object: gqmk7igjmllr8uatsqtdvsgsl41a9gxr/Duplex-A-ifc3-optimised.ifc",
        })
        @IsString()
        @IsNotEmpty()
        urn: string;

        @ApiProperty({
            required: false,
            type: String,
            description: 'The Autodesk data center zone',
            enum: ['US', 'EU'],
        })
        @IsString()
        @IsNotEmpty()
        zone: string;
    }
    return Body;
}
export class CreateAutodeskCredentialsParamsDto extends WithProjectId(class { }) { }
export class CreateAutodeskCredentialsBodyDto extends WithBody(class { }) { }
export class CreateAutodeskCredentialsDto extends WithBody(
    WithProjectId(Authorization),
) { }