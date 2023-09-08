/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsDate,
    IsEnum,
    IsIn,
    IsNotEmpty,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
    IsUrl,
    ValidateNested,
} from 'class-validator';
import { User } from '../../auth/user/entities/user.entity';
import { Authorization } from '../../FWAjs-utils/utils/auth.interface';
import { Constructor } from '../../utils/dto/mixins.dto';
import { PROJECT_TYPES_ENUM, WithProjectId } from '../dto';
import { ProjectType } from '../entities';
import { ProjectAddressCreateDto } from './address/createProjectAddress.dto';

export function WithBody<TBase extends Constructor>(Base: TBase) {
    class Body extends Base {
        @ApiProperty({
            required: true,
            enum: ProjectType,
            description: "The type of the project",
            example: ProjectType.RENOVATION,
            default: ProjectType.DECONSTRUCTION,
        })
        @IsEnum(ProjectType)
        @IsNotEmpty()
        projectType!: ProjectType;

        @ApiProperty({
            required: true,
            type: String,
            description: "Short name of the project",
            example: "MIN",
        })
        @IsString()
        @IsNotEmpty()
        @Transform(({ value }: { value: string }) => value.trim())
        shortName!: string;

        @ApiProperty({
            required: true,
            type: String,
            description: "Full name of the project",
            example: "Maison de l'Innovation",
        })
        @IsString()
        @IsNotEmpty()
        fullName!: string;

        @ApiProperty({
            required: false,
            type: String,
            description: "Description of the project",
            example: "The Maison de l’Innovation will host research activities that require high performance software with important operational potential in the fields of information, communication and health.",
        })
        @IsString()
        @IsOptional()
        description?: string;

        @ApiProperty({
            required: false,
            type: Date,
            description: "Start date for the deconstruction of the project",
            example: "2032-08-01",
        })
        @IsDate()
        @IsOptional()
        deconstructionStart?: Date;

        @ApiProperty({
            required: false,
            type: Number,
            description: "Groundfloor Area of the deconstructed project",
            example: "1000",
        })
        @IsNumber()
        @IsOptional()
        footprint?: number;

        @ApiProperty({
            required: false,
            type: String,
            description: "Name or email of the contact person",
            example: "Daniel Düsentrieb",
        })
        @IsString()
        @IsOptional()
        contactInfo?: string;

        @ApiProperty({
            type: () => User,
            required: false,
            description: "User who owns the project",
        })
        @IsObject()
        @IsOptional()
        owner?: User;

        @ApiProperty({
            required: false,
            type: ProjectAddressCreateDto,
            description: "The full street address of the project",
        })
        @ValidateNested()
        fullAddress?: ProjectAddressCreateDto;

    }
    return Body;
}

export class CreateProjectBodyDto extends WithBody(class { }) { }
export class CreateProjectDto extends WithBody(Authorization)
{ }