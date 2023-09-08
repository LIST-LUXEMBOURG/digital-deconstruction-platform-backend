/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { ENTITY_ENGINE } from '../../../utils/entities/constants';
import { Project } from '../../../project/entities';
import { User } from '../../../auth/user/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';
import { ProjectParticipantDto } from '../dto/project-participant.dto';

export enum Role {
    GUEST = 'Guest',
    CONTRIBUTOR = 'Contributor',
}

@Entity({
    engine: ENTITY_ENGINE,
})

@Unique('unique-user-project', ['user', 'project'])
export class ProjectParticipant {
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({
        required: true,
        type: User,
        description: "The participating user",
    })
    @ManyToOne(
        (type) => User, { onDelete: "CASCADE" }
    )
    @JoinColumn()
    user: User;

    @ApiProperty({
        required: true,
        type: () => Project,
        description: "The project this participant is participating in",
    })
    @ManyToOne(
        (type) => Project,
        (project) => project.participants, { onDelete: "CASCADE", }
    )
    @JoinColumn()
    project: Project;

    @ApiProperty({
        required: true,
        enum: Role,
        description: "The role the partipant has in the project",
        example: Role.CONTRIBUTOR,
        default: Role.GUEST,
    })
    @Column({
        type: 'enum',
        enum: Role,
        default: Role.GUEST,
        nullable: true,
    })
    role: Role; // enum ?

    //----------------------------------------------------------------------- 

    static toDto(participant: ProjectParticipant): ProjectParticipantDto {
        let dto = new ProjectParticipantDto();

        if (!!participant) {
            let { project, user, ...fields } = participant;

            dto = Object.assign(dto, { ...fields });

            if (!!project) {
                dto.projectId = project.id;
            }

            if (!!user) {
                dto.userId = user.id;
            }
        }
        return dto;
    }
}
