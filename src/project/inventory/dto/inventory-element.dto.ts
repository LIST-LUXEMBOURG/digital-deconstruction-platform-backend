/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import {
    IsArray,
    IsNotEmpty,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
    IsUUID,
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
import { Property } from '../../../core/entities/property.entity';
import { PointOfInterest } from '../../../scan/entities/point-of-interest.entity';
import { ElementType } from '../entities/element-type.entity';
import { InventoryElementTypeDto } from './inventory-element-type.dto';
import { InventoryMaterialDto } from './inventory-material.dto';

export function WithBody<TBase extends Constructor>(Base: TBase) {
    class Body extends Base {
        @ApiProperty({
            type: String,
            required: true,
            description: 'The unique identifier of the element',
            example: '00015fec-321c-45f7-9067-f10115c2b9c9'
        })
        @IsUUID()
        @IsNotEmpty()
        uid: string;

        @ApiProperty({
            type: String,
            required: false,
            description: 'The given name of the inventory element',
            example: 'External Door'
        })
        @IsString()
        @IsOptional()
        name: string;

        @ApiProperty({
            type: String,
            required: false,
            description: 'The description of the inventory element',
            example: 'Door leading to the outside of the building. Must be weatherproof.'
        })
        @IsString()
        @IsOptional()
        description: string;

        @ApiProperty({
            type: String,
            required: false,
            description: 'The IFC Identifier of the corresponding IfcElement in the BIM model',
            example: '1M56pI66nB6xHPUIQn3HuR'
        })
        @IsString()
        @IsOptional()
        ifcId: string;

        @ApiProperty({
            type: String,
            required: false,
            description: 'The Revit Identifier from the corresponding element in the Autodesk 3D Revit model',
            example: 2310545
        })
        @IsString()
        @IsOptional()
        revitId: string;

        @ApiProperty({
            type: () => InventoryElementTypeDto,
            required: false,
            description:
                'The element type of this element',
        })
        @IsObject()
        @IsOptional()
        elementType: ElementType;

        @ApiProperty({
            type: Number,
            required: false,
            description: 'The reusability value (between 0 and 1) for this element',
            example: 0.8
        })
        @IsNumber()
        @IsOptional()
        reusePotential: number;

        @ApiProperty({
            enum: ReuseDecision,
            required: false,
            description: 'The reusability decision',
            example: 'recycling'
        })
        @IsString()
        @IsOptional()
        reuseDecision: ReuseDecision;

        @ApiProperty({
            enum: SurfaceDamage,
            required: false,
            description: 'Potential surface damage of the element',
            example: 'medium'
        })
        @IsString()
        @IsOptional()
        surfaceDamage: SurfaceDamage;

        @ApiProperty({
            enum: HazardAssessment,
            required: false,
            description: 'Inform whether the element as a whole or part of it represent a hazard',
            example: 'surface_only'
        })
        @IsString()
        @IsOptional()
        hazardAssessment: HazardAssessment;

        @ApiProperty({
            enum: HazardAssessmentStatus,
            required: false,
            description: 'The status of the hazard assessment',
            default: 'requested',
        })
        @IsString()
        @IsOptional()
        hazardAssessmentStatus: HazardAssessmentStatus;

        @ApiProperty({
            type: () => [InventoryMaterialDto],
            required: false,
            description:
                'The materials associated with this element',
        })
        @IsArray()
        @IsOptional()
        materials: InventoryMaterialDto[];

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

export class InventoryElementDto extends WithBody(
    WithProjectId(Authorization),
) { }