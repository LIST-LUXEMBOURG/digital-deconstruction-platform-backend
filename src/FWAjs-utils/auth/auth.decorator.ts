/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { API_DECORATOR_METADATA_NAME } from "./auth.constants";

/**
 * Protects the route by authenticating the user that wants to access it.
 * @returns 
 */
export function ApiAuth() {
    return function ApiAuthDecorator(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        Reflect.defineMetadata(API_DECORATOR_METADATA_NAME, [], descriptor.value);
    };
}
