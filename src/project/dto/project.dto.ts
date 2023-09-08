/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { ApiProperty } from "@nestjs/swagger";
import { ProjectAddressDto } from "./address/projectAddress.dto";

export const PROJECT_TYPES_ENUM = ['deconstruction', 'renovation'];

export class ProjectDto {
    @ApiProperty({
        required: true,
        type: Number,
        example: 101,
        description: 'The internal project ID'
    })
    id!: string;

    @ApiProperty({
        required: true,
        enum: PROJECT_TYPES_ENUM,
        example: 'deconstruction',
        description: 'The type of project'
    })
    projectType!: string;

    @ApiProperty({
        required: true,
        type: String,
        example: 'Stadskantoor Heerlen',
        description: 'The project\'s short name'
    })
    shortName!: string;

    @ApiProperty({
        required: true,
        type: String,
        example: 'Stadskantoor Gemeente Heerlen',
        description: 'The project full (long) name'
    })
    fullName!: string;

    @ApiProperty({
        required: false,
        type: String,
        example: 'Office Building constructed in 1980-1982; to be decommissioned in August 2022',
        description: 'Describe the project in a few words'
    })
    description?: string;

    @ApiProperty({
        required: false,
        type: String,
        description: 'The date when the deconstruction process is planned to start'
    })
    deconstructionStart?: string;

    @ApiProperty({
        required: false,
        type: Number,
        example: '7698',
        description: 'The number of square meters affected by deconstruction'
    })
    footprint?: number;

    @ApiProperty({
        required: false,
        type: String,
        example: 'Burg. van Grunsvenplein 145, Heerlen tel.: 045-5605040 email: gemeente@heerlen.nl',
        description: 'Name and contact info for the deconstruction site owner / manager'
    })
    contactInfo?: string;

    @ApiProperty({
        required: false,
        type: Number,
        example: 7,
        description: 'The internal ID of the user who created the project'
    })
    createdBy?: number;

    @ApiProperty({
        required: false,
        type: Number,
        example: 7,
        description: 'The project owner'
    })
    owner?: number;

    @ApiProperty({
        required: false,
        type: String,
        example: '2021-10-05T16:36:42Z',
        description: 'The data and time when the project was created'
    })
    createdAt?: string;

    @ApiProperty({
        required: false,
        type: ProjectAddressDto,
        description: 'The project structured address'
    })
    fullAddress?: ProjectAddressDto
}