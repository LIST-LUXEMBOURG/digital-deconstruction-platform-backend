/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { ApiProperty } from "@nestjs/swagger";
import { IsDate, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { Authorization } from "../../../FWAjs-utils/utils/auth.interface";
import { WithProjectId } from "../../../project/dto";
import { Constructor } from "../../../utils/dto/mixins.dto";

export enum Direction {
    ASCENDING = 'ascending',
    DESCENDING = 'descending',
}

export enum OrderBy {
    ID = 'id',
    TITLE = 'title',
    DESCRIPTION = 'description',
    LOCATION_ID = 'locationId',
    ELEMENT_TYPE = 'elementType',
    DOCUMENT_AUTHOR = 'documentAuthor',
    DOCUMENT_DATE = 'documentDate',
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
            description: 'The number of documents to return in a single page',
            example: 10
        })
        @IsNumber()
        @IsOptional()
        size?: number;

        @ApiProperty({
            type: Number,
            required: false,
            description: 'The offset in the full list of documents to start page from',
            example: 0

        })
        @IsNumber()
        @IsOptional()
        offset?: number;

        @ApiProperty({
            type: Number,
            required: false,
            description: 'The unique identifier of the project document',
            example: 42
        })
        @IsNumber()
        @IsOptional()
        id?: number;

        @ApiProperty({
            required: false,
            type: String,
            description: 'The title of the project document',
            example: 'cover'
        })
        @IsString()
        @IsOptional()
        readonly title?: string;

        @ApiProperty({
            required: false,
            type: String,
            description: 'The description of the project document',
            example: 'The cover of the project'
        })
        @IsString()
        @IsOptional()
        readonly description?: string;

        @ApiProperty({
            required: false,
            type: Number,
            description: 'The (optional) location this project document is linked to',
            example: 42
        })
        @IsNumber()
        @IsOptional()
        readonly locationId?: number;

        @ApiProperty({
            required: false,
            type: String,
            description: 'The porject document author',
            example: 'Aldous Huxley'
        })
        @IsString()
        @IsOptional()
        readonly documentAuthor?: string;

        @ApiProperty({
            required: false,
            type: Date,
            description: 'The date the project document was authored',
            example: '1932'
        })
        @IsDate()
        @IsOptional()
        readonly documentDate?: Date;

        @ApiProperty({
            enum: OrderBy,
            required: false,
            description: 'Name of the property to order by',
            example: 'title',
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

export class ListProjectFilesParamsDto extends WithProjectId(class { }) { }
export class ListProjectFilesQueryDto extends WithQuery(class { }) { }
export class ListProjectFilesDto extends WithQuery(
    WithProjectId(Authorization),
) { }