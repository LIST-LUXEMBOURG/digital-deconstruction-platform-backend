/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { ApiProperty } from '@nestjs/swagger';
import { Project } from '../../../project/entities';
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';

@Entity({ name: 'bim_model' })
@Unique('unique-project', ['project'])
export class BimModel {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(
        (type) => Project,
        { onDelete: "CASCADE", }
    )
    @JoinColumn()
    project: Project;

    // Autodesk metadata
    @ApiProperty({
        required: true,
        type: String,
        description: "The Autodesk Client Id",
        example: "Y3qwNY15fAPoqG3V"
    })
    @Column({ nullable: false })
    clientId: string;

    @ApiProperty({
        required: true,
        type: String,
        description: "The Autodesk Client Secret",
        example: "RMceNrPUo9Na5Xgtq3ApqCcYufeuynum"
    })
    @Column({ nullable: false })
    clientSecret: string;

    @ApiProperty({
        required: true,
        type: String,
        description: "List of permissions",
        example: "data:read viewables:read",
    })
    @Column({ nullable: true })
    scope: string;

    @ApiProperty({
        required: true,
        type: String,
        description: "URN of the BIM model",
        example: "urn:adsk.objects:os.object: gqmk7igjmllr8uatsqtdvsgsl41a9gxr/Duplex-A-ifc3-optimised.ifc",
    })
    @Column({ nullable: false })
    urn: string;

    @ApiProperty({
        required: true,
        type: String,
        description: "Formatted URN of the BIM model",
        example: "dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Z3FtazdpZ2ptbGxyOHVhdHNxdGR2c2dzbDQxYTlneHIvRHVwbGV4LUEtaWZjMy1vcHRpbWlzZWQuaWZj",
    })
    @Column({ nullable: false })
    formattedUrn: string;

    @ApiProperty({
        required: true,
        type: String,
        description: "The Autodesk Client Zone",
        example: "US",
        default: "US"
    })
    @Column({ nullable: true, default: 'US' })
    zone: string;
}
