/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { ProjectAddress } from './projectAddress.entity';
import { ENTITY_ENGINE } from '../../utils/entities/constants';
import { ProjectLocation } from '../location/entities/projectLocation.entity';
import { ProjectParticipant } from '../participant/entities/projectParticipant.entity';
import { User } from '../../auth/user/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum ProjectType {
    DECONSTRUCTION = 'deconstruction',
    RENOVATION = 'renovation',
}

@Entity({ engine: ENTITY_ENGINE })
export class Project {
    @ApiProperty({
        required: true,
        type: Number,
        description: "The internal Id (Primary Key) of the project",
        example: 27,
    })
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({
        required: true,
        enum: ProjectType,
        description: "The type of the project",
        example: ProjectType.RENOVATION,
        default: ProjectType.DECONSTRUCTION,
    })
    @Column({
        type: 'enum',
        enum: ProjectType,
        default: ProjectType.DECONSTRUCTION,
        nullable: true,
    })
    projectType: ProjectType;

    @ApiProperty({
        required: true,
        type: String,
        description: "Short name of the project",
        example: "MIN",
    })
    @Index('unique-project-shortName', { unique: true })
    @Column({ length: 255, nullable: false })
    shortName: string;

    @ApiProperty({
        required: true,
        type: String,
        description: "Full name of the project",
        example: "Maison de l'Innovation",
    })
    @Column({ length: 255, nullable: false })
    fullName: string;

    @ApiProperty({
        required: false,
        type: String,
        description: "Description of the project",
        example: "The Maison de l’Innovation will host research activities that require high performance software with important operational potential in the fields of information, communication and health.",
    })
    @Column({ length: 1024, nullable: true })
    description: string;

    @ApiProperty({
        required: false,
        type: Date,
        description: "Start date for the deconstruction of the project",
        example: "2032-08-01",
    })
    // @Column({ type: 'datetime', nullable: true }) // mysql
    @Column({ nullable: true }) // postgres
    deconstructionStart: Date;

    @ApiProperty({
        required: false,
        type: Number,
        description: "Groundfloor Area of the deconstructed project",
        example: "1000m2",
    })
    @Column({ nullable: true })
    footprint: number;

    @ApiProperty({
        required: false,
        type: Number,
        description: "Name or email of the contact person",
        example: "Daniel Düsentrieb",
    })
    @Column({ length: 255, nullable: true })
    contactInfo: string;

    @Column({ nullable: false })
    createdBy: number;

    @ApiProperty({
        required: true,
        type: User,
        description: "User who owns the project",
    })
    @ManyToOne(
        (type) => User, { onDelete: "SET NULL" }
    )
    @JoinColumn()
    owner: User;

    @ApiProperty({
        required: false,
        type: Date,
        description: "Creation date of the project",
        example: "2022-08-09"
    })
    @CreateDateColumn()
    createdAt: Date;

    @ApiProperty({
        required: false,
        type: () => ProjectAddress,
        description: "The full street address of the project",
    })
    @OneToOne((type) => ProjectAddress, (fullAddress) => fullAddress.project, {
        eager: true,
        cascade: true,
    })
    fullAddress: ProjectAddress;

    @OneToMany((type) => ProjectLocation, (location) => location.project, {
        eager: false,
        cascade: true,
    })
    locations: ProjectLocation[];

    @OneToMany((type) => ProjectParticipant, (participant) => participant.project, {
        eager: false,
        cascade: true,
    })
    participants: ProjectParticipant[];
}
