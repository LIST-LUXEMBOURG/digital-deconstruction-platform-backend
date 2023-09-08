/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { ClassificationEntryDto } from '../../../core/dto/classification-entry.dto';
import { Constructor } from '../../../utils/dto/mixins.dto';
import { WithProjectId } from '../../dto';
import { InventoryCircularityDto } from '../../../circularity/dto/inventory-circularity.dto';
import { InventoryFileDto } from './inventory-file.dto';

export function WithBody<TBase extends Constructor>(Base: TBase) {
    class Body extends Base {
        @ApiProperty({
            type: String,
            required: true,
            description: 'The unique identifier of the element type',
            example: '00015fec-321c-45f7-9067-f10115c2b9c9'
        })
        @IsUUID()
        @IsNotEmpty()
        uid: string;

        @ApiProperty({
            type: String,
            required: false,
            description: "The IFC Id of the corresponding IfcElementType in the BIM Model",
            example: "1ySupqAs98WvAZtswhclGE"
        })
        @IsString()
        @IsOptional()
        ifcId: string;

        @ApiProperty({
            type: String,
            required: false,
            description: "The IFC type of the corresponding IfcElementType in the BIM Model",
            example: "IfcWall"
        })
        @IsString()
        @IsOptional()
        ifcType: string;

        @ApiProperty({
            type: String,
            required: true,
            description: "Given name of the element type",
            example: "Partition - Wall Int. 150 Gypsum"
        })

        @IsString()
        @IsNotEmpty()
        name: string;

        @ApiProperty({
            type: String,
            required: false,
            description: "The description of the element type",
            example: "Interior Separation Wall made from Gypsum Boards"
        })

        @IsString()
        @IsOptional()
        description: string;

        @ApiProperty({
            type: String,
            required: false,
            description: "The category of the element type",
            example: "Interior Wall"
        })

        @IsString()
        @IsOptional()
        category: string;

        @ApiProperty({
            type: String,
            required: false,
            description: "The historical value of the element type",
            example: "High"
        })

        @IsString()
        @IsOptional()
        historicalValue: string;

        @ApiProperty({
            type: String,
            required: false,
            description: "The trademark of the element type",
            example: "Knauf Rigips 150"
        })

        @IsString()
        @IsOptional()
        trademark: string;

        @ApiProperty({
            type: String,
            required: false,
            description: "The designer of the element type",
            example: "Philippe Starck"
        })

        @IsString()
        @IsOptional()
        designer: string;

        @ApiProperty({
            type: InventoryCircularityDto,
            required: false,
            description: "The circularity properties of the element type",
        })

        @IsObject()
        @IsOptional()
        circularity: InventoryCircularityDto;

        @ApiProperty({
            type: [InventoryFileDto],
            required: false,
            description: "The list of inventory documents attached to this element type",
        })

        @IsArray()
        @IsOptional()
        files: InventoryFileDto[];

        @ApiProperty({
            type: [ClassificationEntryDto],
            required: false,
            description: "The list of classification entries assigned to this element type",
        })

        @IsArray()
        @IsOptional()
        classificationEntries: ClassificationEntryDto[];


    }
    return Body;
}

export class InventoryElementTypeDto extends WithBody(
    WithProjectId(class { }),
) { }
