/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { CanActivate, ExecutionContext, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { FwaException } from '../exceptions';
import { MISSING_PRIVILEGES, SWAGGER_DECORATOR_METADATA_NAME } from '../utils/accessControl.constants';
import { ACCESS_CONTROL_DECORATOR_METADATA_NAME } from './accessControl.constants';
import { ApiAccessControlService } from './accessControl.service';

@Injectable()
export class ApiAccessGuard implements CanActivate {
    constructor(
        @Inject(ApiAccessControlService)
        private readonly accessService: ApiAccessControlService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Check if the access control decorator exists
        const rules = Reflect.getMetadata(ACCESS_CONTROL_DECORATOR_METADATA_NAME, context.getHandler());

        // If the access control decorator is not attached to the route,
        // there is no route access control (success condition)
        if (!rules) return true;

        const { location, name } = this.accessService.getTokenInfo();

        const token = context.switchToHttp().getRequest()[location][name];

        const decoded = await this.accessService.validate(token);

        let access = false
        // Check if the "grants DB" has the role
        const hasRole = decoded.user.roles.length && this.accessService.hasRole(decoded.user.roles);

        // If the role exist in the "grants DB" perform access control evaluation
        if (hasRole) {
            let i = 0
            // We perform the evaluation for each rules
            while (i < rules.length && access == false) {
                const { action, resource } = rules[i]
                if (this.accessService.hasResource(resource)) {
                    access = this.accessService.can(decoded.user.roles, resource, action)._.attributes.length !== 0;
                };
                i++
            }
        }

        // If at least one permission is granted
        if (access) return true;


        // Failed case + custom error

        // Get the swagger api response decorator
        const responses = Reflect.getMetadata(SWAGGER_DECORATOR_METADATA_NAME, context.getHandler());
        let message = 'Forbidden action';

        // Get the 403 - Forbidden response decorator
        // If the forbidden decorator exist return a custom error message
        if (!!responses && '403' in responses)
            message = responses['403'].description;

        // Default error
        throw FwaException({
            code: HttpStatus.FORBIDDEN,
            message,
            messageCode: MISSING_PRIVILEGES,
            messageData: {
                actionName: context.getHandler().name,
            },
        });
    }
}
