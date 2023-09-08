/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

// @Entity({ engine: ENTITY_ENGINE })
@Entity()
export class User {
    @ApiProperty({
        required: true,
        type: Number,
        description: "The internal Id (Primary Key) of the user",
        example: 27,
    })
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({
        required: true,
        type: String,
        description: "The login of the user",
        example: "johndoe",
    })
    @Index('unique-user-login', { unique: true })
    @Column({ length: 255, nullable: false })
    login: string;

    @ApiProperty({
        required: true,
        type: String,
        description: "The password of the user",
        example: "*********",
    })    // https://github.com/typeorm/typeorm/issues/535
    // todo: try if the select: false attr has breaking changes or not
    @Column({ select: false, length: 512 })
    password?: string;

    @ApiProperty({
        required: true,
        type: String,
        description: "The (family) name of the user",
        example: "Doe",
    })
    @Column({ length: 255 })
    name: string;

    @ApiProperty({
        required: true,
        type: String,
        description: "The first-name of the user",
        example: "John",
    })
    @Column({ length: 255 })
    firstName: string;

    @ApiProperty({
        required: false,
        type: String,
        description: "The email address of the user",
        example: "john.doe@list.lu",
    })
    @Column({ length: 255, nullable: true })
    email?: string;

    @ApiProperty({
        required: false,
        type: Boolean,
        description: "Specifies whether or not the user is currently allowed to login",
        example: true,
        default: true
    })
    @Column({ default: true })
    active: boolean;

    @ApiProperty({
        required: false,
        type: Boolean,
        description: "Specifies whether or not the user is currently blocked",
        example: true,
        default: false
    })
    @Column({ default: false })
    blocked: boolean;

    @ApiProperty({
        required: false,
        type: String,
        description: "Gives the reason why the user has been blocked (in case the user is blocked)",
        example: "User is no longer part of the organisation",
    })
    @Column({ length: 512, nullable: true })
    blockingReason: string;

    @Index('unique-user-salt', { unique: true })
    @Column({ length: 512, nullable: false })
    salt?: string;

    @ApiProperty({
        required: false,
        type: Boolean,
        description: "Specifies whether this user can login multiple times in parallel",
        example: true,
        default: false
    })
    @Column({ default: false })
    parallelLogins: boolean;
}
