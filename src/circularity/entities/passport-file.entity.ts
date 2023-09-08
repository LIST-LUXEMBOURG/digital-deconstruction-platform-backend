/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { ApiProperty } from '@nestjs/swagger';
import {
    Column, Entity,
    JoinColumn,
    ManyToOne, PrimaryGeneratedColumn,
    Unique
} from 'typeorm';
import { File } from '../../file/entities/file.entity';
import { Project } from '../../project/entities';
import { PassportFileDto } from '../dto/passport-file.dto';
import { Circularity } from './circularity.entity';

/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
@Entity()
@Unique('unique-passport-file', ['file'])
export class PassportFile {
    @PrimaryGeneratedColumn('uuid')
    uid: string; // string | generated by platform | automatic | ignored

    @ManyToOne(
        (type) => Project,
        {
            onDelete: "CASCADE",
        }
    )
    @JoinColumn()
    project: Project;

    @ApiProperty({
        required: false,
        type: String,
        description: 'The passport-file title',
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
        type: Date,
        description: 'The document date',
    })
    @Column({ nullable: true })
    documentDate: Date;

    @ManyToOne(() => Circularity, (circ) => circ.passports, {
        onDelete: 'SET NULL',
    })
    @JoinColumn()
    circularity: Circularity;

    //----------------------------------------------------------------------- 

    static toDto(passport: PassportFile): PassportFileDto {
        let dto = new PassportFileDto();

        let { project, circularity, file, ...fields } = passport;

        dto = Object.assign(dto, fields);

        if (!!project) {
            dto.projectId = project.id;
        }

        if (!!circularity) {
            dto.circularityUid = circularity.uid;
        }

        if (!!file) {
            dto.fileUid = file.uuid;
            dto.fileType = file.fileType;
        }

        return dto;
    }
}