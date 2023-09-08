/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

// @Entity({ engine: ENTITY_ENGINE })
@Entity()
export class Role {
    @PrimaryGeneratedColumn()
    id: number;

    @Index('unique-role-name', { unique: true })
    @Column({ length: 255, nullable: false })
    name: string;

    @Column({ length: 255 })
    longName: string;

    @Column({ length: 255 })
    description: string;
}
