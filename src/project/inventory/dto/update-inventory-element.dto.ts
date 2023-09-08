/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import {
    IsArray,
    IsBoolean,
    IsNotEmpty,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
} from 'class-validator';

import { Constructor } from '../../../utils/dto/mixins.dto';
import { WithProjectId } from '../../dto';
import { Authorization } from '../../../FWAjs-utils/utils/auth.interface';
import {
    HazardAssessment,
    HazardAssessmentStatus,
    SurfaceDamage,
    ReuseDecision,
} from '../entities/element.entity';
import { Material } from '../entities/material.entity';
import { Property } from '../../../core/entities/property.entity';
import { PointOfInterest } from '../../../scan/entities/point-of-interest.entity';
import { ElementType } from '../entities/element-type.entity';

function WithParams<TBase extends Constructor>(Base: TBase) {
    class Params extends WithProjectId(Base) {
        @ApiProperty({
            type: String,
            required: true,
            description: 'The element identifier',
        })
        @IsString()
        @IsNotEmpty()
        elementUid: string;
    }
    return Params;
}

export function WithBody<TBase extends Constructor>(Base: TBase) {
    class Body extends Base {
        @ApiProperty({
            type: String,
            required: false,
            description: 'The name of the inventory element',
        })
        @IsString()
        @IsOptional()
        name: string;

        @ApiProperty({
            type: String,
            required: false,
            description: 'The inventory element description',
        })
        @IsString()
        @IsOptional()
        description: string;

        @ApiProperty({
            type: String,
            required: false,
            description:
                'An identifier of an element from an Autodesk 3D model (IFC format)',
        })
        @IsString()
        @IsOptional()
        ifcId: string;

        @ApiProperty({
            type: String,
            required: false,
            description:
                'An identifier of an element from an Autodesk 3D model (Revit format)',
        })
        @IsString()
        @IsOptional()
        revitId: string;

        @ApiProperty({
            type: () => ElementType,
            required: false,
            description:
                'The element type associated with this element',
        })
        @IsObject()
        @IsOptional()
        elementType: ElementType;

        @ApiProperty({
            type: Number,
            required: false,
            description: 'The reusability value (between 0 and 1)',
        })
        @IsNumber()
        @IsOptional()
        reusePotential: number;

        @ApiProperty({
            type: String,
            required: false,
            description: 'The reusability decision',
        })
        @IsString()
        @IsOptional()
        reuseDecision: ReuseDecision;

        @ApiProperty({
            type: String,
            required: false,
            description: 'Potential surface damage of the element (none, low, medium or high)',
        })
        @IsString()
        @IsOptional()
        surfaceDamage: SurfaceDamage;

        @ApiProperty({
            type: String,
            required: false,
            description:
                'Inform whether the element as a whole or part of it represent a hazard (no, connect, surface, overall',
        })
        @IsString()
        @IsOptional()
        hazardAssessment: HazardAssessment;

        @ApiProperty({
            type: String,
            required: false,
            description:
                'The status of the hazard assessment (requested, in progress, finished)',
            default: false,
        })
        @IsString()
        @IsOptional()
        hazardAssessmentStatus: HazardAssessmentStatus;

        @ApiProperty({
            type: () => [Material],
            required: false,
            description:
                'The materials associated with this element',
        })
        @IsArray()
        @IsOptional()
        materials: Material[];

        @ApiProperty({
            type: () => [Property],
            required: false,
            description:
                'The properties associated with this element',
        })
        @IsArray()
        @IsOptional()
        properties: Property[];

        @ApiProperty({
            type: PointOfInterest,
            required: false,
            description:
                'The point of interest associated with this element',
        })
        @IsObject()
        @IsOptional()
        pointOfInterest: PointOfInterest;
    }
    return Body;
}
export class UpdateInventoryElementBodyDto extends WithBody(class { }) { }
export class UpdateInventoryElementParamsDto extends WithParams(class { }) { }
export class UpdateInventoryElementDto extends WithBody(
    WithParams(Authorization),
) { }
