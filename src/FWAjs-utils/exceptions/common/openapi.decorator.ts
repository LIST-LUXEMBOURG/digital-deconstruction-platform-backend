/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

const errorDescription = {
    code: 'The HTTP status code',
    message: 'A human readable error message',
    messageCode:
        'A custom error code to identify and localize the message in our frontend framework (FWAjs)',
    messageData: 'Additional data to enhance "messageCode"',
    thrownOn: 'The date of the error',
};

class FwaExceptionResponse {
    @ApiProperty({
        type: Number,
        description: errorDescription.code,
        example: 404,
    })
    code: HttpStatus | number;
    @ApiProperty({
        type: String,
        description: errorDescription.message,
    })
    message: string;
    @ApiProperty({
        type: String,
        description: errorDescription.messageCode,
    })
    messageCode: string;
    @ApiProperty({
        type: Object,
        description: errorDescription.messageData,
    })
    messageData?: any;
    @ApiProperty({
        type: Date,
        description: errorDescription.thrownOn,
    })
    thrownOn?: string;
}

export const ApiFwaException =
    (
        decorator: Function,
        description: string,
        error: FwaExceptionResponse,
    ): MethodDecorator =>
    (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        decorator({
            schema: {
                type: 'object',
                description,
                properties: {
                    code: {
                        type: 'number',
                        description: errorDescription.code,
                        example: error.code,
                    },
                    message: {
                        type: 'string',
                        description: errorDescription.message,
                        example: error.message,
                    },
                    messageCode: {
                        type: 'string',
                        description: errorDescription.messageCode,
                        example: error.messageCode,
                    },
                    messageData: {
                        type: 'Object',
                        description: errorDescription.messageData,
                        example: error.messageData,
                    },
                    thrownOn: {
                        type: 'string',
                        description: errorDescription.thrownOn,
                        example: error.thrownOn,
                    },
                },
            },
        })(target, propertyKey, descriptor);
    };
