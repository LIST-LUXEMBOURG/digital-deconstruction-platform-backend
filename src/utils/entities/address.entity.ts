/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { ApiProperty } from "@nestjs/swagger";
import { Column, PrimaryGeneratedColumn } from "typeorm";

export abstract class Address {
    @ApiProperty({
        required: true,
        type: Number,
        description: "The internal Id (Primary Key) of the address",
        example: 42,
    })
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({
        required: false,
        type: String,
        description: "The first line of the street address",
        example: "5, Avenue des Hauts-Fourneaux",
    })
    @Column({ length: 255, nullable: true })
    addressLine1: string;

    @ApiProperty({
        required: false,
        type: String,
        description: "The second line of the street address",
        example: "Bâtiment B",
    })
    @Column({ length: 255, nullable: true })
    addressLine2: string;

    @ApiProperty({
        required: false,
        type: String,
        description: "The city of the street address",
        example: "Esch-sur-Alzette",
    })
    @Column({ length: 255, nullable: true })
    city: string;

    @ApiProperty({
        required: false,
        type: String,
        description: "The state or Province of the street address",
        example: "Canton Esch",
    })
    @Column({ length: 255, nullable: true })
    stateOrProvince: string;

    @ApiProperty({
        required: false,
        type: String,
        description: "The ZIP code of the street address",
        example: "L-4362",
    })
    @Column({ length: 255, nullable: true })
    zipOrPostalCode: string;

    @ApiProperty({
        required: false,
        type: String,
        description: "The country of the street address",
        example: "Luxembourg",
    })
    @Column({ length: 255, nullable: true })
    country: string;
}