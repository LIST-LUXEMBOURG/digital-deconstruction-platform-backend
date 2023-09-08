/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { ENTITY_ENGINE } from "../../utils/entities/constants";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Project } from "../../project/entities";
import { ScanConfigDto } from "../dto/scan-config.dto";

@Entity({ engine: ENTITY_ENGINE })
export class ScanConfig {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(
        () => Project,
        {
            onDelete: "CASCADE",
        }
    )
    @JoinColumn()
    project: Project;


    @Column({ length: 255, nullable: false })
    scanUrl: string;

    //----------------------------------------------------------------------- 

    static toDto(scanConfig: ScanConfig): ScanConfigDto {
        let dto = new ScanConfigDto();

        if (!!scanConfig) {
            let { project, ...fields } = scanConfig;

            dto = Object.assign(dto, { ...fields });

            if (!!project) {
                dto.projectId = project.id;
            }
        }
        return dto;
    }


}