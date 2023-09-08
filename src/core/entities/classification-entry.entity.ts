/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { ClassificationSystem } from "./classification-system.entity";
import { ApiProperty } from "@nestjs/swagger";
import { ElementType } from "../../project/inventory/entities/element-type.entity";
import { ClassificationEntryDto } from "../dto/classification-entry.dto";

@Entity()
export abstract class ClassificationEntry {
    @PrimaryGeneratedColumn()
    id: number;

    // relations
    @ManyToOne(() => ClassificationSystem, (classificationSystem) => classificationSystem.entries, {
        cascade: true,
        onUpdate: 'CASCADE',
        onDelete: "CASCADE",
    })
    classificationSystem: ClassificationSystem;

    @ManyToOne((type) => ClassificationEntry, (parent) => parent.id, {
        eager: false,
        cascade: true, //['insert', 'update', 'remove'],
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        //orphanedRowAction: 'delete',
    })
    @JoinColumn()
    parent: ClassificationEntry;

    @ApiProperty({
        required: false,
        type: String,
        description: 'The human readable label of the classification entry',
        example: ' Suspended Plaster and Gypsum Board Ceilings'
    })
    @Column({ length: 1024, nullable: false })
    label: string;

    @ApiProperty({
        required: false,
        type: String,
        description: 'The alphanumeric code representing the classification entry',
        example: ' 21-03 10 70 20'
    })
    @Column({ length: 128, nullable: false })
    code: string;

    @ManyToMany(() => ElementType, (type) => type.classificationEntries, {
        eager: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn()
    elementTypes: ElementType[];

    //----------------------------------------------------------------------- 

    static toDto(classificationEntry: ClassificationEntry): ClassificationEntryDto {
        let dto = new ClassificationEntryDto();

        if (!!classificationEntry) {
            let { parent, classificationSystem, elementTypes, ...fields } = classificationEntry;

            dto = Object.assign(dto, { ...fields });

            if (!!classificationSystem) {
                dto.classificationSystemId = classificationSystem.id;
            }

            if (!!parent) {
                dto.parentId = parent.id;
            }

            return dto;
        }
    }
}