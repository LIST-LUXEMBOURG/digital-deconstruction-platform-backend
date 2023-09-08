/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber } from "class-validator";
import { Authorization } from "../../FWAjs-utils/utils/auth.interface";
import { WithProjectId } from "../../project/dto";
import { Constructor } from "../../utils/dto/mixins.dto";

function WithParams<TBase extends Constructor>(Base: TBase) {
    class Params extends WithProjectId(Base) {
        @ApiProperty({
            required: true,
            type: Number,
            description: 'The unique identifier of the scan configuration'
        })
        @IsNumber()
        @IsNotEmpty()
        readonly scanConfigId!: number;
    }
    return Params;
}

export class DeleteScanConfigDto extends WithParams(Authorization) { }