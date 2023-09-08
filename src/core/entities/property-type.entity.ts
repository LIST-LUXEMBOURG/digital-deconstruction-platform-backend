/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { ApiProperty } from "@nestjs/swagger";
import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, TreeChildren, TreeParent } from "typeorm";
import { PropertyUnit } from "./property-unit.entity";
import { Property } from "./property.entity";

@Entity()
export abstract class PropertyType {
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({
        required: false,
        type: String,
        description: "Name of the property type",
        example: 'Thickness'
    })
    @Column({ length: 1024, nullable: false })
    name: string;

    @ApiProperty({
        required: false,
        type: Boolean,
        description: "Specifies whether this property type is numeric or not",
        example: 'true',
        default: 'false'
    })
    @Column({ default: false })
    isNumeric: boolean;

    @ApiProperty({
        required: false,
        type: [PropertyUnit],
        description: "List of acceptable units",
    })
    @ManyToMany(() => PropertyUnit, (unit) => unit.propertyTypes, {
        cascade: true,
        onUpdate: 'CASCADE',
    })
    @JoinTable({ name: "property_type_unit_rel" })
    propertyUnits: PropertyUnit[];

    @OneToMany(() => Property, (property) => property.propertyType)
    properties: Property[];
}