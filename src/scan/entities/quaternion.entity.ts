/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { Column, PrimaryGeneratedColumn } from "typeorm";

export abstract class Quaternion {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ default: 0 })
    w: number;

    @Column({ default: 0 })
    x: number;

    @Column({ default: 0 })
    y: number;

    @Column({ default: 0 })
    z: number;
}