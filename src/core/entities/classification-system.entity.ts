/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { ApiProperty } from "@nestjs/swagger";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, Tree, TreeChildren, TreeParent } from "typeorm";
import { ClassificationEntry } from "./classification-entry.entity";

@Entity()
@Tree("closure-table")
export abstract class ClassificationSystem {
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({
        required: true,
        type: String,
        description: 'Given Name of the classification System',
        example: 'Omniclass-Table 21'
    })
    @Column({ length: 255, nullable: false })
    name: string;

    @ApiProperty({
        required: false,
        type: String,
        description: 'Description of the classification System',
        example: 'OmniClass™ consists of 15 hierarchical tables, each of which represents a different facet of construction information. Table 21 covers Elements, including Designed Elements.'
    }) @Column({ nullable: true })
    description: string;

    @TreeParent()
    parent: ClassificationSystem;

    @TreeChildren()
    children: ClassificationSystem[];

    // relations
    @OneToMany(() => ClassificationEntry, (entry) => entry.classificationSystem)
    @JoinColumn()
    entries: ClassificationEntry[];
}