/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional } from "class-validator";
import { Authorization } from "../../../FWAjs-utils/utils/auth.interface";
import { WithProjectId } from "../../../project/dto";
import { Constructor } from "../../../utils/dto/mixins.dto";

export function WithParams<TBase extends Constructor>(Base: TBase) {
    class Params extends WithProjectId(Base) {
        @ApiProperty({
            type: Number,
            required: false,
            description: 'The unique identifier of the location to delete all documents for. If not specified, all project documents will be deleted!',
        })
        @IsNumber()
        @IsOptional()
        locationId: number;
    }
    return Params;
}

export class DeleteAllProjectFilesDto extends WithParams(Authorization) { }