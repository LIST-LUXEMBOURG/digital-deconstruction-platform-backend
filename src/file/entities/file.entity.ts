/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { ApiProperty } from '@nestjs/swagger';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { FileDto, UploadFileDto } from '../dto/file.dto';

@Entity()
@Unique('file-name-path', ['filePath', 'name'])
export class File {
    // the file's universally unique ID, to be used as reference in the
    // file's resource locator - /files/d5303064-7a8b-468f-bb84-9a14abed95b6
    // @Column({ length: 255, nullable: false, unique: true })
    @ApiProperty({
        type: String,
        description: 'The file unique identifier',
        required: false,
    })
    @PrimaryGeneratedColumn('uuid')
    uuid: string;

    // A short name for the file, e.g. to diplay in lists.
    @ApiProperty({
        type: String,
        description:
            'The formated file name used to identify and sotre the file in the file-system',
        required: false,
    })
    @Column({ length: 255 })
    name: string;

    // The original file name with its extension
    @ApiProperty({
        type: String,
        description: 'The original file name with its extension',
        required: false,
    })
    @Column({ length: 255 })
    originalName: string;

    // The internal ID of the user who uploaded the file
    @ApiProperty({
        type: Number,
        description: 'The internal ID of the user who uploaded the file',
        required: false,
    })
    @Column()
    uploadedBy: number;

    // The date and time of object creation, in UTC (Zulu time) format
    @ApiProperty({
        type: Date,
        description:
            'The date and time of object creation, in UTC (Zulu time) format',
        required: false,
    })
    @CreateDateColumn()
    uploadedAt: Date;

    // The date and time of object modification, in UTC (Zulu time) format
    @ApiProperty({
        type: Date,
        description:
            'The date and time of object modification, in UTC (Zulu time) format',
        required: false,
    })
    @Column({ nullable: true })
    updatedAt: Date;

    // The file size in number of bytes
    @ApiProperty({
        type: Number,
        description: 'The file size in number of bytes',
        required: false,
    })
    @Column()
    size: number;

    // The file path in the file system (UNIX format)
    @ApiProperty({
        type: String,
        description: 'The file path in the file system (UNIX format)',
        required: false,
    })
    @Column({ nullable: false })
    filePath: string;

    // The file mime-type
    @ApiProperty({
        type: String,
        description: 'The file mime-type',
        required: false,
    })
    @Column({ nullable: false })
    fileType: string;

    //----------------------------------------------------------------------- 

    static toDto(file: File): FileDto {
        let dto = new FileDto();
        dto = Object.assign(dto, file);
        return dto;
    }
}