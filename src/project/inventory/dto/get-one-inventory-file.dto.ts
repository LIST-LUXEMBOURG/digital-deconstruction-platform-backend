/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from "class-validator";
import { Authorization } from "../../../FWAjs-utils/utils/auth.interface";
import { WithProjectId } from "../../../project/dto";
import { Constructor } from "../../../utils/dto/mixins.dto";

function WithParams<TBase extends Constructor>(Base: TBase) {
    class Params extends WithProjectId(Base) {
        @ApiProperty({
            required: false,
            type: String,
            description: 'The unique identifier of the element type'
        })
        @IsUUID()
        @IsOptional()
        readonly elementTypeUid: string;

        @ApiProperty({
            required: true,
            type: String,
            description: 'The unique identifier of the inventory document'
        })
        @IsUUID()
        @IsNotEmpty()
        readonly inventoryFileUid!: string;
    }
    return Params;
}

export class InventoryFileGetOneDto extends WithParams(Authorization) { }

