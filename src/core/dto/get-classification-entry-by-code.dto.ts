/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { Authorization } from "../../FWAjs-utils/utils/auth.interface";
import { Constructor } from "../../utils/dto/mixins.dto";

function WithParams<TBase extends Constructor>(Base: TBase) {
    class Params extends Base {
        @ApiProperty({
            required: true,
            type: String,
            description: 'The name of the classification system the entry belongs to'
        })
        @IsString()
        @IsNotEmpty()
        readonly systemName!: string;

        @ApiProperty({
            required: true,
            type: String,
            description: 'The codeof the sought classification entry'
        })
        @IsString()
        @IsNotEmpty()
        readonly entryCode!: string;
    }
    return Params;
}

export class ClassificationEntryByCodeParamsDto extends WithParams(Authorization) { }