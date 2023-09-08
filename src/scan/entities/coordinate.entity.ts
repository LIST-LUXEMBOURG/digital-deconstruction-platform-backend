/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { Column, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { PointOfInterest } from "./point-of-interest.entity";

export abstract class Coordinate {
    @PrimaryGeneratedColumn('uuid')
    uid: string;

    @Column({ default: 0 })
    x: number;

    @Column({ default: 0 })
    y: number;

    @Column({ default: 0 })
    z: number;

    // relations
    //     @OneToMany(() => PointOfInterest, (pointOfInterest) => pointOfInterest.position)
    //     pointOfInterests: PointOfInterest[];
}