/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ClassificationEntry } from '../../../core/entities/classification-entry.entity';
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
            type: () => [ClassificationEntry],
            required: false,
            description:
                'The classification entries to be associated with this element type',
        })
        @IsArray()
        @IsOptional()
        classificationEntries: ClassificationEntry[];

    }
    return Body;
}

export class CreateInventoryElementTypeParamsDto extends WithProjectId(class { }) { }
export class CreateInventoryElementTypeBodyDto extends WithBody(class { }) { }
export class CreateInventoryElementTypeDto extends WithBody(
    WithProjectId(Authorization),
) { }