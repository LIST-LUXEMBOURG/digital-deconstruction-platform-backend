/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { ApiProperty } from '@nestjs/swagger';
import { PointOfInterest } from '../../../scan/entities/point-of-interest.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    Tree,
    TreeChildren,
    TreeParent,
} from 'typeorm';
import { Project } from '../../entities';
import { ProjectLocationDto } from '../dto/project-location.dto';

export enum LocationType {
    SITE = 'site',
    BUILDING = 'building',
    STOREY = 'storey',
    SPACE = 'space',
}

@Entity()
@Tree("closure-table")
export class ProjectLocation {
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({
        required: true,
        type: () => Project,
        description: "The project this location is part of",
    })
    @ManyToOne(
        (type) => Project,
        (project) => project.locations,
        {
            onDelete: "CASCADE",
        }
    )
    @JoinColumn()
    project: Project;

    @ApiProperty({
        required: true,
        type: String,
        description: "Name of the location",
        example: "Maison de l'Innovation",
    })
    @Column({ length: 255, nullable: false })
    name: string;

    @ApiProperty({
        required: true,
        enum: LocationType,
        description: "The type of the location",
        example: LocationType.BUILDING,
        default: LocationType.SITE,
    })
    @Column({
        type: 'enum',
        enum: LocationType,
        default: LocationType.SITE,
        nullable: false,
    })
    type: LocationType; // enum ?

    @ApiProperty({
        required: false,
        type: ProjectLocation,
        description: "The parent location if not root location",
    })
    @TreeParent()
    parentLocation: ProjectLocation;

    @ApiProperty({
        required: false,
        type: [ProjectLocation],
        description: "The sub locations for this location",
    })
    @TreeChildren()
    subdivisions: ProjectLocation[];

    @ApiProperty({
        required: false,
        type: String,
        description: "The street address of the location",
        example: "5, Avenue des Hauts-Fourneaux",
    })
    @Column({ length: 255, nullable: true })
    address: string;

    @ApiProperty({
        required: false,
        type: String,
        description: "The GPS coordinates of the location",
        example: "49.501873, 5.9467846",
    }) @Column({ length: 255, nullable: true })
    coordinate: string;

    // @OneToMany(() => PointOfInterest, (pointOfInterest) => pointOfInterest.location)
    // pointOfInterests: PointOfInterest[];

    @Column({ nullable: false })
    createdBy: number;

    @CreateDateColumn()
    createdAt: Date;

    //----------------------------------------------------------------------- 

    static toDto(projectLocation: ProjectLocation): ProjectLocationDto {
        let dto = new ProjectLocationDto();

        if (!!projectLocation) {
            let { project, parentLocation, ...fields } = projectLocation;

            dto = Object.assign(dto, { ...fields });

            if (!!project) {
                dto.projectId = project.id;
            }

            if (!!parentLocation) {
                dto.parentLocationId = parentLocation.id;
            }
        }
        return dto;
    }
}


