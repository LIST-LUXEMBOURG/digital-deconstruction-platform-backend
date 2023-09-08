/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { Authorization } from '../../FWAjs-utils/utils/auth.interface';
import { Constructor } from '../../utils/dto/mixins.dto';
import { WithProjectId } from '../../project/dto';

export function WithMaterialType<TBase extends Constructor>(Base: TBase) {
    class Params extends WithProjectId(Base) {
        @ApiProperty({
            type: String,
            required: false,
            description: 'The unique identifier of a material type',
        })
        @IsUUID()
        @IsOptional()
        materialTypeUid: string;
    }
    return Params;
}

export function WithElementType<TBase extends Constructor>(Base: TBase) {
    class Params extends WithProjectId(Base) {
        @ApiProperty({
            type: String,
            required: false,
            description: 'The unique identifier of an element type',
        })
        @IsUUID()
        @IsOptional()
        elementTypeUid: string;
    }
    return Params;
}

export function WithParams<TBase extends Constructor>(Base: TBase) {
    class Params extends WithProjectId(Base) {
        @ApiProperty({
            type: String,
            required: false,
            description: 'The unique identifier of a material type',
        })
        @IsUUID()
        @IsOptional()
        materialTypeUid: string;

        @ApiProperty({
            type: String,
            required: false,
            description: 'The unique identifier of an element type',
        })
        @IsUUID()
        @IsOptional()
        elementTypeUid: string;
    }
    return Params;
}


export function WithQuery<TBase extends Constructor>(Base: TBase) {
    class Query extends Base {
        @ApiProperty({
            type: String,
            required: false,
            isArray: true,
            description: 'The unique identifiers of the elements',
        })
        @IsOptional()
        elementUids: string | string[];
    }

    return Query;
}

export function WithBody<TBase extends Constructor>(Base: TBase) {
    class Body extends Base {
        @ApiProperty({
            type: Number,
            required: false,
            description: "The financial market value of the corresponding element type / material type",
            example: 2500
        })
        @IsNumber()
        @IsOptional()
        marketValue: number;

        @ApiProperty({
            type: Number,
            required: false,
            description: "The quantity of CO2 saved by re-using the corresponding element type / material type",
            example: 150
        })
        @IsNumber()
        @IsOptional()
        savingsCO2: number;

        @ApiProperty({
            type: Number,
            required: false,
            description: "The benefit of reusing the corresponding element type / material type",
            example: 2.5
        })
        @IsNumber()
        @IsOptional()
        socialBalance: number;
    }
    return Body;
}

export class CreateInventoryCircularityParamsDto extends WithProjectId(class { }) { }
export class CreateInventoryMaterialTypeCircularityParamsDto extends WithMaterialType(class { }) { }
export class CreateInventoryElementTypeCircularityParamsDto extends WithElementType(class { }) { }
export class CreateInventoryCircularityQueryDto extends WithQuery(class { }) { }
export class CreateInventoryCircularityBodyDto extends WithBody(class { }) { }
export class CreateInventoryCircularityDto extends WithBody(
    WithQuery(WithParams(Authorization)),
) { }
