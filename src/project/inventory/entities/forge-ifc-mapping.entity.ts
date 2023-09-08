/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class ForgeIfcMapping {
    @PrimaryGeneratedColumn('uuid')
    uid: string; // string | generated by platform | automatic | ignored

    @Column({ type: Number, nullable: false })
    projectId: number;

    @Column({ type: String, nullable: false })
    forgeId: string;

    @Column({ type: String, nullable: false })
    ifcId: string;
}
