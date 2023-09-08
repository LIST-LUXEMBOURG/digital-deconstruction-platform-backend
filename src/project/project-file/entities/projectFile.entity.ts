/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { ApiProperty } from '@nestjs/swagger';
import { Project } from '../../../project/entities';
import { File } from '../../../file/entities/file.entity';
import { ProjectLocation } from '../../../project/location/entities/projectLocation.entity';
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';
import { ProjectFileDto } from '../dto/project-file.dto';


@Entity()
@Unique('unique-title-project', ['title', 'project'])
export class ProjectFile {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(
        (type) => Project,
        { onDelete: "CASCADE", }
    )
    @JoinColumn()
    project: Project;

    @ApiProperty({
        required: false,
        type: String,
        description: 'The title of the document',
        example: 'Brave New World'
    })
    @Column({ length: 255, nullable: false })
    title: string;

    @ManyToOne(
        (type) => File,
        { onDelete: "SET NULL", }
    )
    @JoinColumn()
    file: File;

    @ApiProperty({
        required: false,
        type: String,
        description: 'The document description (exact match)',
        example: ' Dystopian novel by English author Aldous Huxley, written in 1931 and published in 1932'
    })
    @Column({ length: 1024, nullable: true })
    description: string;

    @ManyToOne(
        (type) => ProjectLocation,
        { onDelete: "CASCADE", }
    )
    @JoinColumn()
    location: ProjectLocation;

    @ApiProperty({
        required: false,
        type: String,
        description: 'The document author',
        example: 'Aldous Huxley'
    })
    @Column({ length: 255, nullable: true })
    documentAuthor: string;

    @ApiProperty({
        required: false,
        type: Date,
        description: 'The document date',
        example: '1932'
    })
    @Column({ nullable: true })
    documentDate: Date;

    //----------------------------------------------------------------------- 

    static toDto(projectFile: ProjectFile): ProjectFileDto {
        let dto = new ProjectFileDto();

        if (!!projectFile) {
            let { project, file, location, ...fields } = projectFile;

            dto = Object.assign(dto, { ...fields });

            if (!!project) {
                dto.projectId = project.id;
            }

            if (!!file) {
                let { uuid, ...fields } = file;
                dto = Object.assign(dto, { ...fields });
                dto.fileUid = uuid;
            }
            if (!!location) {
                dto.locationId = location.id;
            }
        }
        return dto;
    }

}
