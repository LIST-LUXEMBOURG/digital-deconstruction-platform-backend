/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */
import { ApiProperty } from '@nestjs/swagger';
import { Project } from '../../project/entities';
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    OneToOne,
    JoinTable,
    ManyToMany,
    OneToMany,
} from 'typeorm';
import { InventoryCircularityDto } from '../dto/inventory-circularity.dto';
import { Element } from '../../project/inventory/entities/element.entity';
import { ElementType } from '../../project/inventory/entities/element-type.entity';
import { MaterialType } from '../../project/inventory/entities/material-type.entity';
import { PassportFile } from './passport-file.entity';

@Entity()
export class Circularity {
    @PrimaryGeneratedColumn('uuid')
    uid: string; // string | generated by platform | automatic | ignored

    @ApiProperty({
        required: true,
        type: () => Project,
        description: "The project this circularity object is part of",
    })
    @ManyToOne(
        (type) => Project,
        {
            onDelete: "CASCADE",
        }
    )
    @JoinColumn()
    project: Project;

    @OneToOne(() => ElementType, (elmt) => elmt.circularity, {
        onDelete: 'SET NULL',
    })
    @JoinColumn()
    elementType: ElementType;

    @OneToOne(() => MaterialType, (matt) => matt.circularity, {
        onDelete: 'SET NULL',
    })
    @JoinColumn()
    materialType: MaterialType;

    // @OneToOne(() => Element, (elm) => elm.circularity, {
    //     onDelete: 'SET NULL',
    // })
    // @JoinColumn()
    // element: Element;

    @ManyToMany(() => Element, (elm) => elm.circularities, {
        cascade: true,
        onUpdate: 'CASCADE',
    })
    @JoinTable({ name: "circularity_element_rel" })
    elements: Element[];

    @OneToMany(() => PassportFile, (pass) => pass.circularity, {
        cascade: true,
        onUpdate: 'CASCADE',
    })
    passports: PassportFile[];

    @Column({ type: 'numeric', nullable: true })
    marketValue: number;

    @Column({ type: 'numeric', nullable: true })
    savingsCO2: number;

    @Column({ type: 'numeric', nullable: true })
    socialBalance: number;

    //----------------------------------------------------------------------- 

    static toDto(circularity: Circularity): InventoryCircularityDto {
        let dto = new InventoryCircularityDto();

        if (!!circularity) {
            let { project, ...fields } = circularity;

            dto = Object.assign(dto, { ...fields });

            if (!!project) {
                dto.projectId = project.id;
            }
            return dto;
        }
    }
}