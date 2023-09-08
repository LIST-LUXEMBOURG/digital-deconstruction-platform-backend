/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber } from "class-validator";
import { AddressDto } from "../../../utils/dto/address.dto";

export class ProjectAddressUpdateDto extends AddressDto {
    @ApiProperty({
        required: true,
        type: Number,
        example: 101,
        description: 'The internal project address Id (primary key)'
    })
    @IsNumber()
    @IsNotEmpty()
    id!: number;
}