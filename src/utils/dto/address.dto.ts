/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddressDto {
    // @ApiProperty({
    //     required: true,
    //     type: Number,
    //     description: "The internal Id (Primary Key) of the address",
    //     example: 42,
    // })
    // @IsOptional()
    // id?: number;

    @ApiProperty({
        required: false,
        type: String,
        description: "The first line of the street address",
        example: "5, Avenue des Hauts-Fourneaux",
    })
    @IsString()
    @IsOptional()
    addressLine1?: string;

    @ApiProperty({
        required: false,
        type: String,
        description: "The second line of the street address",
        example: "Bâtiment B",
    })
    @IsString()
    @IsOptional()
    addressLine2?: string;

    @ApiProperty({
        required: false,
        type: String,
        description: "The city of the street address",
        example: "Esch-sur-Alzette",
    })
    @IsString()
    @IsOptional()
    city?: string;

    @ApiProperty({
        required: false,
        type: String,
        description: "The state or Province of the street address",
        example: "Canton Esch",
    })
    @IsString()
    @IsOptional()
    stateOrProvince?: string;

    @ApiProperty({
        required: false,
        type: String,
        description: "The ZIP code of the street address",
        example: "L-4362",
    })
    @IsString()
    @IsOptional()
    zipOrPostalCode?: string;

    @ApiProperty({
        required: false,
        type: String,
        description: "The country of the street address",
        example: "Luxembourg",
    })
    @IsString()
    @IsOptional()
    country?: string;
}
