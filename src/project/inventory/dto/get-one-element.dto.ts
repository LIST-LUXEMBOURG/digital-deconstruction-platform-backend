/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { ApiProperty } from "@nestjs/swagger";
import { IsAlphanumeric, IsByteLength, IsNotEmpty, IsString, IsUUID } from "class-validator";
import { isLength } from "lodash";
import { Authorization } from "../../../FWAjs-utils/utils/auth.interface";
import { WithProjectId } from "../../../project/dto";
import { Constructor } from "../../../utils/dto/mixins.dto";

function WithUuid<TBase extends Constructor>(Base: TBase) {
    class Params extends WithProjectId(Base) {
        @ApiProperty({
            required: true,
            type: String,
            description: 'The unique identifier of the inventory element',
            example: '0069361f-804b-4ed2-8798-c01ead2a9672'
        })
        @IsUUID()
        @IsNotEmpty()
        readonly elementUid!: string;
    }
    return Params;
}

function WithIfcId<TBase extends Constructor>(Base: TBase) {
    class Params extends WithProjectId(Base) {
        @ApiProperty({
            required: true,
            type: String,
            description: 'The unique IFC identifier of the inventory element',
            example: '3pa1BPYWkeHvbJkg8rV68K'
        })
        @IsByteLength(22)
        @IsString()
        @IsNotEmpty()
        readonly elementIfcId!: string;
    }
    return Params;
}


export class ElementGetOneDto extends WithUuid(Authorization) { }
export class ElementGetOneByIfcIdDto extends WithIfcId(Authorization) { }