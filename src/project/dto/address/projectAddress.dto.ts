/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { ApiProperty } from "@nestjs/swagger";
import { AddressDto } from "../../../utils/dto/address.dto";

export class ProjectAddressDto extends AddressDto {
    @ApiProperty({
        required: true,
        type: Number,
        example: 101,
        description: 'The internal project address ID'
    })
    id!: number;
}