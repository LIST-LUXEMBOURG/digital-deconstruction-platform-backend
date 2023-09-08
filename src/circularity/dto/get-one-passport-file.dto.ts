/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsUUID } from "class-validator";
import { Authorization } from "../../FWAjs-utils/utils/auth.interface";
import { WithProjectId } from "../../project/dto";
import { Constructor } from "../../utils/dto/mixins.dto";

function WithParams<TBase extends Constructor>(Base: TBase) {
    class Params extends WithProjectId(Base) {
        @ApiProperty({
            required: false,
            type: String,
            description: 'The unique identifier of the circularity object'
        })
        @IsUUID()
        @IsOptional()
        readonly circularityUid: string;

        @ApiProperty({
            required: true,
            type: String,
            description: 'The unique identifier of the passport document'
        })
        @IsUUID()
        @IsNotEmpty()
        readonly passportFileUid!: string;
    }
    return Params;
}

export class PassportFileGetOneDto extends WithParams(Authorization) { }