/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { Entity, JoinColumn, OneToOne } from 'typeorm';
import { Project } from './project.entity';
import { ENTITY_ENGINE } from '../../utils/entities/constants';
import { Address } from '../../utils/entities/address.entity';

@Entity({ engine: ENTITY_ENGINE })
export class ProjectAddress extends Address {
    @OneToOne(
        (type) => Project,
        (project) => project.fullAddress,
        {
            onDelete: "CASCADE",
            //     onUpdate: "CASCADE",
        }
    )
    @JoinColumn()
    project: Project;
}
