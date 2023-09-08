/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { ApiBody } from '@nestjs/swagger';
import {
    ReferenceObject,
    SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

export const ApiFile =
    (
        filename: string = 'file',
        extraProperties?: Record<string, SchemaObject | ReferenceObject>,
        required?: string[],
    ): MethodDecorator =>
    (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        ApiBody({
            schema: {
                type: 'object',
                properties: {
                    [filename]: {
                        type: 'string',
                        format: 'binary',
                        description: `This upload field will automatically fill the following file fields:\n\
- **fieldname:** 'file'\n\
- **originalname:** 'dart.txt'\n\
- **encoding:** '7bit'\n\
- **mimetype:** 'text/plain'\n\
- **buffer:** <Buffer 20 0a 69 6d  ... 401 more bytes>\n\
- **size:** 451`,
                    },
                    ...extraProperties,
                },
                required,
                // required: ['name', 'filePath'],
            },
        })(target, propertyKey, descriptor);
    };
