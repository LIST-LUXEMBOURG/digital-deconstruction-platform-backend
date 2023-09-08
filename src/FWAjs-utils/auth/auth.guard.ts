/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { CanActivate, ExecutionContext, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { FwaException } from "../exceptions";
import { MISSING_PRIVILEGES, MISSING_TOKEN, SWAGGER_DECORATOR_METADATA_NAME } from "../utils/accessControl.constants";
import { API_DECORATOR_METADATA_NAME } from "./auth.constants";
import { ApiAuthService } from "./auth.service";

@Injectable()
export class ApiAuthGuard implements CanActivate {
    // @Optional() @Inject(ApiAccessControlService) private readonly accessService: ApiAccessControlService,
    constructor(
        @Inject(ApiAuthService)
        private readonly authService: ApiAuthService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        /**
         * TOKEN EVALUATION PART
         */

        // Try to get the decorator @ApiAuth()
        const hasAuth = Reflect.getMetadata(API_DECORATOR_METADATA_NAME, context.getHandler());

        // If the auth decorator is not attached to the route then return true
        if (!hasAuth) return true;

        // Get the bearer location and name in the request
        const { name, location } = this.authService.getTokenInfo();

        const headers = context.switchToHttp().getRequest()[location];
        let token = undefined;

        if (!!headers[name]) token = headers[name].split('Bearer ')[1];
        context.switchToHttp().getRequest()[location][name] = token;

        // Check if the token exists and is not empty
        // if (!token) throw new ProxyAuthRequiredException({
        //     message: 'Token is missing',
        //     messageCode: MISSING_TOKEN
        // });

        if (!token)
            throw FwaException({
                code: HttpStatus.PROXY_AUTHENTICATION_REQUIRED,
                message: 'Token is missing',
                messageCode: MISSING_TOKEN
            });

        // Perform a request to the authentication service
        const decoded = await this.authService.validate(token);

        if (decoded) return true;
        return false;

        // /**
        //  * ROLE ACCESS CONTROL PART
        //  */

        // // TODO: check
        // // If the optional access control service is not loaded
        // if (!this.accessService) return true;

        // // Check if the access control decorator exists
        // const hasAccessControl = Reflect.getMetadata('api-access-control', context.getHandler());

        // // If the access control decorator is not attached to the route,
        // // there is no route access control (success condition)
        // if (!hasAccessControl) return true;

        // // TODO: improve, if the resource is missing; request it

        // // Check if the "grants DB" has the resource & the role
        // const { action, resource } = hasAccessControl;
        // const hasResource = this.accessService.hasResource(resource);
        // const hasRole = decoded.user.roles.length && this.accessService.hasRole(decoded.user.roles);

        // // Dans un 1er temps, on retourne false si on à pas la ressource.
        // // Amélioration: on demande aux mSs la config pour cette ressource.
        // // quant à role, on throw une erreur
        // if (!hasResource) return false;

        // // If the role exist in the "grants DB" perform access control evaluation
        // const hasAccess = hasRole ? this.accessService.can(decoded.user.roles, resource, action) : { granted: false };

        // // Success case
        // if (hasAccess.granted) return true;

        // Failed case + custom error

        // Get the swagger api response decorator
        const responses = Reflect.getMetadata(SWAGGER_DECORATOR_METADATA_NAME, context.getHandler());

        let message = 'Forbidden action';

        // Get the 403 - Forbidden response decorator
        // If the forbidden decorator exist return a custom error message
        if ('403' in responses)
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
