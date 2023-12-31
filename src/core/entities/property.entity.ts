/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Element } from '../../project/inventory/entities/element.entity';
import { PropertyType } from "./property-type.entity";
import { PropertyUnit } from "./property-unit.entity";
import { ApiProperty } from "@nestjs/swagger";
import { PropertyDto } from "../dto/property.dto";

@Entity()
export abstract class Property {
    @PrimaryGeneratedColumn('uuid')
    uid: string; // string | generated by platform | automatic | ignored

    @ManyToOne(() => Element, (element) => element.properties, {
        onDelete: 'CASCADE',
    })
    @JoinColumn()
    element: Element;

    @ApiProperty({
        required: false,
        type: () => PropertyType,
        description: "The type this propertys' value represents",
    })
    @ManyToOne(() => PropertyType, (type) => type.properties, {
        cascade: true,
        onDelete: "NO ACTION",
    })
    propertyType: PropertyType;

    @ApiProperty({
        required: false,
        type: () => PropertyUnit,
        description: "The unit this propertys' value is expressed in",
    })
    @ManyToOne(() => PropertyUnit, (unit) => unit.properties, {
        cascade: true,
        onDelete: "NO ACTION",
    })
    propertyUnit: PropertyUnit;

    @ApiProperty({
        required: false,
        type: String,
        description: "The value of this property",
    }) @Column({ length: 64, nullable: false })
    value: string;

    //-----------------------------------------------------------------------

    // public asDto(): PropertyDto {
    //     let dto: PropertyDto;

    //     Object.assign(dto, this);
    //     if (!!this.element) dto.elementUid = this.element.uid;
    //     if (!!this.propertyType) dto.propertyTypeId = this.propertyType.id;
    //     if (!!this.propertyUnit) dto.propertyUnitId = this.propertyUnit.id;
    //     return dto;
    // }

    //-----------------------------------------------------------------------

    static toDto(property: Property): PropertyDto {
        let dto: PropertyDto;

        Object.assign(dto, property);
        if (!!property.element) dto.elementUid = property.element.uid;
        if (!!property.propertyType) dto.propertyTypeId = property.propertyType.id;
        if (!!property.propertyUnit) dto.propertyUnitId = property.propertyUnit.id;
        return dto;
    }

    //-----------------------------------------------------------------------

    static toNumeric(value: string): number {
        if (typeof value === 'number') return value;

        if (value === '' || value === null || value === undefined) return 0;
        value = value.replace(/,/g, '.');
        const regex = /^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$/;
        if (regex.test(value)) return parseFloat(value);
        throw new Error(`Invalid string format: impossible to cast "${value}" to number!`);
    }




}

