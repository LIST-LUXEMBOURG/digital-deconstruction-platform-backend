/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { ApiProperty } from "@nestjs/swagger";
import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, Tree, TreeChildren, TreeParent } from "typeorm";
import { ColumnNumericTransformer } from "../utils/column-numeric-transformer";
import { PropertyType } from "./property-type.entity";
import { Property } from "./property.entity";

@Entity()
@Tree("closure-table")
export abstract class PropertyUnit {
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({
        required: true,
        type: String,
        description: 'Name of the property unit',
        example: 'centimeter'
    })
    @Column({ length: 1024, nullable: false })
    name: string;

    @ApiProperty({
        required: true,
        type: String,
        description: 'Symbol for the property unit',
        example: 'cm'
    })
    @Column({ length: 32, nullable: false })
    symbol: string;

    @ApiProperty({
        required: false,
        type: Number,
        description: "The multiplication factor for converting values expressed in this unit to this units' root unit",
        example: '100'
    })
    @Column('numeric', { precision: 7, scale: 3, transformer: new ColumnNumericTransformer() })
    multiplier: number;

    @TreeParent()
    parent: PropertyUnit;

    @TreeChildren()
    children: PropertyUnit[];

    @ManyToMany(() => PropertyType, (type) => type.propertyUnits, {
        eager: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn()
    propertyTypes: PropertyType[];

    @OneToMany(() => Property, (property) => property.propertyUnit)
    properties: Property[];
}