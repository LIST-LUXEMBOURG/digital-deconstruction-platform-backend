/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { Authorization } from '../../../FWAjs-utils/utils/auth.interface';
import { Constructor } from '../../../utils/dto/mixins.dto';
import { WithProjectId } from '../../dto';

export function WithBody<TBase extends Constructor>(Base: TBase) {
    class Body extends Base {
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
            type: Number,
            required: true,
            description: "The number of materials of the given given material type",
            example: 250
        })
        @IsNumber()
        @IsNotEmpty()
        count: number;

        @ApiProperty({
            type: Number,
            required: true,
            description: "The total volume of all materials of the given material type expressed in m3 (cubic meters)",
            example: 5000
        })
        @IsNumber()
        @IsNotEmpty()
        totalVolume: number;
    }
    return Body;
}

export class InventoryElementAnalysisDto extends WithBody(
    WithProjectId(Authorization),
) { }