/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { Rules } from '../utils/accessControl.interface';
import { ACCESS_CONTROL_DECORATOR_METADATA_NAME } from './accessControl.constants';

/**
 * Sets the rules that the current user has to fulfill, based on his/her role(s), to access the route.
 * 
 * The predicate used on the rules is a OR predicate. I.e. that the current user needs to fulfill one or more rules to access the route.
 * 
 * @param rules The rules to fulfill by the current user
 */
export function ApiAccessControl(rules: Rules) {
    return function ApiAccessControlDecorator(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        Reflect.defineMetadata(ACCESS_CONTROL_DECORATOR_METADATA_NAME, rules, descriptor.value);
    };
}
