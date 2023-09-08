/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

import {
    IsBoolean,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator';
import { Authorization } from '../../../FWAjs-utils/utils/auth.interface';
import { Constructor } from '../../../utils/dto/mixins.dto';
import { WithProjectId } from '../../dto';
import {
    HazardAssessment,
    HazardAssessmentStatus,
    SurfaceDamage,
    ReuseDecision,
} from '../entities/element.entity';

export enum Direction {
    ASCENDING = 'ascending',
    DESCENDING = 'descending',
}

export enum OrderBy {
    UID = 'uid',
    NAME = 'name',
    IFC_ID = 'ifcId',
    REVIT_ID = 'revitId',
    ELEMENT_TYPE = 'elementType',
    REUSE_POTENTIAL = 'reusePotential',
    REUSE_DECISION = 'reuseDecision',
    QUALITY = 'quality',
}

export class OrderCriterium {
    @ApiProperty({ example: 'name' })
    @IsString()
    @IsNotEmpty()
    property: string;
    @ApiProperty({ enum: ['ASCENDING', 'DESCENDING'], example: 'DESCENDING' })
    direction: Direction;
}

export function WithQuery<TBase extends Constructor>(Base: TBase) {
    class Query extends Base {
        @ApiProperty({
            type: Number,
            required: false,
            description: 'The number of elements to return in a single page',
        })
        @IsNumber()
        @IsOptional()
        size: number;

        @ApiProperty({
            type: Number,
            required: false,
            description:
                'The offset in the full list of elements to start page from',
        })
        @IsNumber()
        @IsOptional()
        offset: number;

        @ApiProperty({
            type: String,
            required: false,
            description: 'The unique identifier of a inventory element',
        })
        @IsString()
        @IsOptional()
        uid: string;

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

        //
        @ApiProperty({
            type: String,
            required: false,
            description: "The unique identifier of an elements' element type",
        })
        @IsUUID()
        @IsOptional()
        elementTypeUid: string;

        @ApiProperty({
            type: Number,
            required: false,
            description: 'The reusability value (between 0 and 1)',
        })
        @IsNumber()
        @IsOptional()
        reusePotential: number;

        @ApiProperty({
            required: false,
            enum: ReuseDecision,
            description: 'The reusability decision',
        })
        @IsString()
        @IsOptional()
        reuseDecision: ReuseDecision;

        @ApiProperty({
            enum: SurfaceDamage,
            required: false,
            description: 'Potential surface damage of the element (none, low, medium or high)',
        })
        @IsString()
        @IsOptional()
        surfaceDamage: SurfaceDamage;

        @ApiProperty({
            enum: HazardAssessment,
            required: false,
            description:
                'Inform whether the element as a whole or part of it represent a hazard (no, connect, surface, overall',
        })
        @IsString()
        @IsOptional()
        hazardAssessment: HazardAssessment;

        @ApiProperty({
            enum: HazardAssessmentStatus,
            required: false,
            description:
                'The status of the hazard assessment(requested, in progress, finished)',
        })
        @IsString()
        @IsOptional()
        hazardAssessmentStatus: HazardAssessmentStatus;

        @ApiProperty({
            enum: OrderBy,
            required: false,
            description: 'Name of the property to order by',
            example: 'name',
        })
        @IsString()
        @IsOptional()
        property: OrderBy;

        @ApiProperty({
            enum: Direction,
            required: false,
            description: 'The direction of the ordering',
            example: Direction.ASCENDING,
        })
        @IsString()
        @IsOptional()
        direction: Direction;
    }
    return Query;
}

export class ListInventoryElementsParamsDto extends WithProjectId(class { }) { }
export class ListInventoryElementsQueryDto extends WithQuery(class { }) { }
export class ListInventoryElementsDto extends WithQuery(
    WithProjectId(Authorization),
) { }
