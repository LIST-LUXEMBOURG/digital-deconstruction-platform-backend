/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { CallHandler, ExecutionContext, HttpStatus, Inject, Injectable, NestInterceptor } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { FwaException } from '../exceptions';
import { FORBIDDEN_ACTION, MISSING_PRIVILEGES } from '../utils/accessControl.constants';
import { Rules } from '../utils/accessControl.interface';
import { ACCESS_CONTROL_DECORATOR_METADATA_NAME } from './accessControl.constants';
import { ApiAccessControlService } from './accessControl.service';

@Injectable()
export class AccessControlInterceptor implements NestInterceptor {
    constructor(
        @Inject(ApiAccessControlService)
        private readonly service: ApiAccessControlService
    ) { }

    async intercept(context: ExecutionContext, next: CallHandler<any>) {
        const rules: Rules = Reflect.getMetadata(ACCESS_CONTROL_DECORATOR_METADATA_NAME, context.getHandler());
        if (!rules) return next.handle();

        const { location, name } = this.service.getTokenInfo();
        const request = context.switchToHttp().getRequest();
        const token = request[location][name];

        const payload = await this.service.validate(token);

        if (!payload)
            throw FwaException({
                code: HttpStatus.FORBIDDEN,
                message: 'Forbidden action',
                messageCode: FORBIDDEN_ACTION
            });

        let definedRoles = [];

        // Keep the defined roles
        if ('user' in payload) definedRoles = payload.user.roles.filter((r) => this.service.hasRole(r));

        // Evaluate the permissions
        let permissions = rules.map((r) => this.service.can(definedRoles, r.resource, r.action));

        // Only keeping the granted ones
        permissions = permissions.filter((p) => p.granted === true);

        // No permissions granted
        if (permissions.length === 0)
            throw FwaException({
                code: HttpStatus.FORBIDDEN,
                message: 'Forbidden action',
                messageCode: MISSING_PRIVILEGES,
                messageData: {
                    action: context.getHandler().name,
                },
            });

        /*
            this.service.getUnionAttrs(permissions) : we're doing the union of the permissions attibutes
            the [...] : spread operator, used here to convert a Set to an Array
        */

        const attributesFilter = [...this.service.getUnionAttrs(permissions)];

        return next.handle().pipe(map(res => {
            if (typeof res !== 'object')
                return res
            else return this.service.filter(res, attributesFilter)
        }))
    }
}
