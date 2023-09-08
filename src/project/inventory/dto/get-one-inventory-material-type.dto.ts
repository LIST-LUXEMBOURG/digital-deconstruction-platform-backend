/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsUUID } from "class-validator";
import { Authorization } from "../../../FWAjs-utils/utils/auth.interface";
import { WithProjectId } from "../../../project/dto";
import { Constructor } from "../../../utils/dto/mixins.dto";

function WithParams<TBase extends Constructor>(Base: TBase) {
    class Params extends WithProjectId(Base) {
        @ApiProperty({
            type: String,
            required: true,
            description: 'The unique identifier of a material type',
            example: '00015fec-321c-45f7-9067-f10115c2b9c9'
        })
        @IsUUID()
        @IsNotEmpty()
        materialTypeUid: string;
    }
    return Params;
}

export class InventoryMaterialTypeGetOneDto extends WithParams(Authorization) { }