/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, IsUUID } from 'class-validator';
import { WithProjectId } from '../../project/dto';
import { Authorization } from '../../FWAjs-utils/utils/auth.interface';
import { Constructor } from '../../utils/dto/mixins.dto';

// export function WithParams<TBase extends Constructor>(Base: TBase) {
//     class Params extends WithProjectId(Base) {
//         @ApiProperty({
//             type: String,
//             required: true,
//             description: 'The unique identifier of the element to attached the view point to',
//             example: '9b61247f-f32f-4128-84e9-723afc6e2820'
//         })
//         @IsUUID()
//         @IsNotEmpty()
//         elementUid: string;
//     }
//     return Params;
// }

export function WithBody<TBase extends Constructor>(Base: TBase) {
    class Body extends Base {

        @ApiProperty({
            type: Number,
            required: false,
            description: 'The Id of the location to attached the point of interest to',
            example: 42
        })
        @IsNumber()
        @IsOptional()
        locationId: number;

        @ApiProperty({
            type: String,
            required: false,
            description: 'The unique identifier of the element to attached the point of interest to',
            example: '9b61247f-f32f-4128-84e9-723afc6e2820'
        })
        @IsUUID()
        @IsOptional()
        elementUid: string;

        @ApiProperty({
            type: String,
            required: true,
            description: 'The given name for this point of interest',
            example: 'Frontal View of Door'
        })
        @IsString()
        @IsNotEmpty()
        name: string;

        @ApiProperty({
            type: String,
            required: false,
            description: 'The description for this point of interest',
            example: 'Shows the door as seen from inside the space'
        })
        @IsString()
        @IsOptional()
        description: string;

        @ApiProperty({
            type: String,
            required: true,
            description: 'The external Id of this point of interest',
            example: '3824188110670335'
        })
        @IsString()
        @IsNotEmpty()
        poiId: string;

        @ApiProperty({
            type: String,
            required: true,
            description: 'The URL for this point of interest',
            example: 'https://ddc.bim-y.com/sample-project/?id=3824188110670335'
        })
        @IsUrl()
        @IsNotEmpty()
        weblink: string;
    }
    return Body;
}

export class CreatePointOfInterestParamsDto extends WithProjectId(class { }) { }
export class CreatePointOfInterestBodyDto extends WithBody(class { }) { }
export class CreatePointOfInterestDto extends WithBody(
    WithProjectId(Authorization),
) { }