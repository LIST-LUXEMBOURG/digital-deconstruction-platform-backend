/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { HttpStatus, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { AccessControl, Permission } from 'accesscontrol';
import { flatten, merge, uniq } from 'lodash';
import {
    FilterNameDto,
    MultipleAccessControlQuery,
    ResourceNameDto,
    RolePrivilegesDto,
    SingleAccessControlQuery,
} from '../../FWAjs-utils/accessControl/dto';
import * as jsonToYaml from 'yamljs';
import { FwaException } from '../exceptions';
import { FWACallFct } from '../fwacall';
import { onModuleDynamicInit } from '../onModuleDynamicInit';
import { Grant } from '../utils/accessControl.interface';
import { Token } from '../utils/common.interface';
import {
    GET_ACCESS_CONTROL_RESOURCE_FAILED,
    RESOURCE_NOT_FOUND,
} from './accessControl.constants';
import { Rule } from './accessControl.rule';

@Injectable()
export class ApiAccessControlService {
    // Consolidated ACDB for the current server (µS or monolith)
    private rules: AccessControl;

    constructor(private readonly moduleRef: ModuleRef) {
        this.rules = new AccessControl();
    }

    async onModuleInit() {
        await onModuleDynamicInit(this, null, ['authService', 'roleService']);
    }

    /**
     * Returns an object with the location of the authentication token in the request and its name.
     * @returns {} { location: 'headers', name: 'authorization' }
     */
    public getTokenInfo(): Token {
        return { location: 'headers', name: 'authorization' };
    }

    /**
     * Gets the current grants Map from the ApiAccessControlService
     * @returns Hash Map of the grants
     */
    public getGrants() {
        return this.rules.getGrants();
    }

    /**
     * Sets the grants within the ApiAccessControlService
     * @param data The new grants
     */
    public setGrants(data: Grant): void {
        this.rules = new AccessControl(data);
    }

    /**
     * Gets all the unique resources that are granted access for at least one role.
     * @returns
     */
    public getResources(): string[] {
        return this.rules.getResources();
    }

    /**
     * Checks whether grants include the given resource or resources.
     * @param resource Resource to be checked. You can also pass an array of strings to check multiple resources at once.
     * @returns
     */
    public hasResource(resource: string): boolean {
        return this.rules.hasResource(resource);
    }

    /**
     * Checks whether the grants include the given role or roles.
     * @param role Role to be checked. You can also pass an array of strings to check multiple roles at once.
     * @returns
     */
    public hasRole(role: string): boolean {
        return this.rules.hasRole(role);
    }

    public can(roles: string | string[], resource: string, action: string) {
        return this.rules.can(roles)[action](resource);
    }

    /**
     * Filters the `data` object based on the provided `attributes`.
     * @param data A single or array of data objects to be filtered.
     * @param attributes
     * @returns Returns the filtered data object or array of data objects.
     */
    public filter(data: any, attributes: string[]): any {
        return AccessControl.filter(data, attributes);
    }

    // duplicate code in access-control and auth

    public async validate(token: string): Promise<any> {
        return await FWACallFct(
            this,
            { srv: 'authService', cmd: 'checkAuthentication' },
            token,
        );
    }

    public getUnionAttrs(permissions): Set<any> {
        const count = permissions.length; // the number of access
        if (count == 1) return permissions[0].attributes;

        const counts = {};

        // return the concatenation of each permission attributes list
        let attrs = permissions
            .map((p) => p.attributes)
            .reduce((prev, curr) => prev.concat(curr));
        let res = new Set();
        // check if there is at least one asterisk
        const hasAsterisk = attrs.find((e) => e === '*');

        // if hasAsterisk the attribute list equals = { '*', ...!negations }
        if (hasAsterisk) {
            attrs = attrs.filter((a) => a.match(/^!/));
            attrs = attrs.sort(); // no need

            res.add('*');

            for (const a of attrs) {
                counts[a] = counts[a] ? counts[a] + 1 : 1;
                if (counts[a] === count) res.add(a);
            }
        } else {
            // otherwise the list =  { named 'attrs' without '!negation' }
            attrs = attrs.filter((a) => a.match(/^[^!]/));
            res = new Set(attrs);
        }

        return res;
    }

    public getUnionAttrsByResources(permissions): Map<string, string[]> {
        const unionAttrs = this.getResources().map((resource) => {
            return {
                resource,
                attrs: this.getUnionAttrsFor(permissions, resource),
            };
        });
        const map = new Map();
        unionAttrs.forEach(({ resource, attrs }) => {
            map.set(resource, attrs);
        });

        return map;
    }

    public getUnionAttrsFor(permissions, askedResource): string[] {
        if (askedResource[0] !== '!')
            return uniq(
                flatten(
                    permissions
                        .filter(({ resource }) => resource === askedResource)
                        .map(({ attributes }) => attributes),
                ),
            );
        else
            return uniq(
                flatten(
                    permissions
                        .filter(({ resource }) => resource !== askedResource)
                        .map(({ attributes }) => attributes),
                ),
            );
    }

    /**
     * Gets all the unique roles that have at least one access information.
     * @returns
     */
    public getRoles(): string[] {
        return this.rules.getRoles();
    }

    /**
     * Returns true if the `roles` have at least one attribute for the asked `resource` on the asked `action`.
     *
     * Else returns false
     *
     * @param roles A list of roles defined in the access control database
     * @param resource A resource defined in the acces control database
     * @param action `read`, `create`, `update` or `delete`
     * @returns
     */
    public hasRightTo(
        roles: string | string[],
        resource: string,
        action: string,
    ): boolean {
        return this.can(roles, resource, action)._.attributes.length > 0;
    }

    /**
     * Merge the `receivedACDB` with the current access control database in the `ApiAccessControlService`
     *
     * @param receivedACDB The ACDB definition to be merged with the current one in the `ApiAccessControlService`
     */
    public mergeACDBs(receivedACDB): void {
        try {
            this.setGrants(merge(receivedACDB, this.rules.getGrants()));
        } catch (e) {
            console.error(e);
        }
    }

    /**
     * Returns the list of `Permission`s for the provided roles for the provided rules according to the current access control database in the `ApiAccessControlService`
     *
     * @param roles A list of roles defined in the access control
     * @param rules A list of rules defined as in the `ApiAccessControl` decorator
     * @returns
     */
    public getGrantedPermissions(roles: string[], rules: Rule[]): Permission[] {
        return rules
            .map((r) => this.can(roles, r.resource, r.action))
            .map((r) => r._);
    }

    /**
     * returns an object containing the accessType, resourceName and hasAccess attributes for the asked `resource` on the provided `accessType` for the current user's roles contained in his/her `token`
     *
     * @param param0 An object containing the `accessType`, the `resourceName` and the current user's `token`
     * @returns
     */
    async getAccessControlOnSingleResource({
        accessType,
        resourceName,
        token,
    }: SingleAccessControlQuery) {
        const userRoles = (await this.validate(token)).user.roles;
        return this.hasAccess(accessType, resourceName, userRoles);
    }

    /**
     * returns an array of objects containing the accessType, resourceName and hasAccess attributes for the asked resources on the provided accessTypes for the current user's roles contained in his/her `token`
     *
     * @param param0 An array of objects containing the `accessType`, the `resourceName` in `requests` and the current user's `token`
     * @returns
     */
    async getAccessControlOnMultipleResources({
        requests,
        token,
    }: MultipleAccessControlQuery) {
        if (requests === undefined || !Array.isArray(requests))
            throw FwaException({
                code: HttpStatus.BAD_REQUEST,
                message:
                    'Bad multiple access control query object. Should be { requests: [ … ] }',
                messageCode: GET_ACCESS_CONTROL_RESOURCE_FAILED,
            });

        requests.map((request, index) => {
            if (!('accessType' in request)) {
                throw FwaException({
                    code: HttpStatus.BAD_REQUEST,
                    message: `accessType at index ${index} of requests is mandatory`,
                    messageCode: GET_ACCESS_CONTROL_RESOURCE_FAILED,
                });
            } else if (!('resourceName' in request)) {
                throw FwaException({
                    code: HttpStatus.BAD_REQUEST,
                    message: `resourceName at index ${index} of requests is mandatory`,
                    messageCode: GET_ACCESS_CONTROL_RESOURCE_FAILED,
                });
            } else if (
                !['create', 'read', 'update', 'delete'].includes(
                    request.accessType,
                )
            ) {
                throw FwaException({
                    code: HttpStatus.BAD_REQUEST,
                    message: `accessType at index ${index} must be one of create, read, update or delete`,
                    messageCode: GET_ACCESS_CONTROL_RESOURCE_FAILED,
                });
            }
        });

        const userRoles = (await this.validate(token)).user.roles;
        return requests.map(({ accessType, resourceName }) =>
            this.hasAccess(accessType, resourceName, userRoles),
        );
    }

    /**
     * Returns the list of privileges for the role identified by `roleId` or `roleName` in the JSON format
     *
     * @param param0 An object containing the `roleId` and/or the `roleName` and the current user's `token`
     * @returns
     * @throws {BadRequestException} roleName and roleID are mutually exclusive
     * @throws {BadRequestException} Missing roleId or roleName
     */
    async listRolesPrivilegesJSON({ token, roleId }: RolePrivilegesDto) {
        const grants = this.getGrants();
        // if (roleId && roleName)
        //     throw FwaException({
        //         code: HttpStatus.BAD_REQUEST,
        //         message: `roleName and roleID are mutually exclusive`,
        //         messageCode: 'wrongRoleAttribute',
        //     });
        if (!roleId)
            throw FwaException({
                code: HttpStatus.BAD_REQUEST,
                message: `Missing roleId`,
                messageCode: 'missingRoleId',
            });

        let payload = {};
        let role;
        if (roleId) {
            payload = { id: roleId, token };
            role = await FWACallFct(
                this,
                { srv: 'roleService', cmd: 'getOneForAuth' },
                payload,
            );
            if (role === undefined)
                throw FwaException({
                    code: HttpStatus.NOT_FOUND,
                    message: `role not found for roleId: ${roleId}`,
                    messageCode: 'roleNotFound',
                    messageData: { id: roleId },
                });
        }
        // else if (roleName) {
        //     payload = { longName: roleName, token };
        //     role = await FWACallFct(this, { srv: 'roleService', cmd: 'getOneForAuth' }, payload);
        //     if (role === undefined)
        //         throw FwaException({
        //             code: HttpStatus.NOT_FOUND,
        //             message: `role not found for roleName: ${roleName}`,
        //             messageCode: 'roleNotFound',
        //             messageData: { longName: roleName },
        //         });
        // }
        return this.filterByRole(grants, role.name);
    }

    /**
     * Returns the list of privileges for the role identified by `roleId` or `roleName` in the YAML format
     * @param param0 An object containing the `roleId` and/or the `roleName` and the current user's `token`
     * @returns
     */
    async listRolesPrivilegesYAML({ token, roleId }: RolePrivilegesDto) {
        const resultJSON = await this.listRolesPrivilegesJSON({
            token,
            roleId,
        });
        return jsonToYaml.stringify(resultJSON, 4);
    }

    /**
     * Returns the list of resources that matches the filter `filterName`
     *
     * @param param0 An object containing the `filterName` attribute
     * @returns
     */
    async listFilteredResources({ filterName }: FilterNameDto) {
        const resources = this.getResources();

        if (filterName) {
            let keyWords: string[] = [];

            // toLowerCase to make the search case insensitiv
            keyWords = filterName.toLowerCase().split(' ');
            // Creating a Map with 'false' has a value for each resource
            const foundResources = new Map(resources.map((r) => [r, false]));

            resources.forEach((resource) => {
                // If the current reource contains all keywords
                if (
                    keyWords.reduce(
                        (acc: boolean, curr: string) =>
                            acc && resource.toLowerCase().includes(curr),
                        true,
                    )
                )
                    // It's value is set to 'true' in the truth table
                    foundResources.set(resource, true);
            });

            const resourcesToReturn: string[] = [];

            foundResources.forEach((value, key, _map) => {
                if (value) resourcesToReturn.push(key);
            });

            return resourcesToReturn;
        }

        return resources;
    }

    /**
     * Returns the list of privileges for the resource identified by the `resourceName` in the JSON format
     *
     * @param payload An object containing the `resourceName` attribute
     * @returns
     */
    async listResourcePrivilegesJSON(payload: ResourceNameDto) {
        const { resourceName } = payload;

        if (!this.hasResource(resourceName))
            throw FwaException({
                code: HttpStatus.NOT_FOUND,
                message:
                    'The provided resource name was not found in the resources list',
                messageCode: RESOURCE_NOT_FOUND,
                messageData: {
                    resource: resourceName,
                },
            });

        const grants = this.getGrants();
        const privileges = {};

        for (const [roleName, _index] of Object.entries(grants)) {
            privileges[roleName] = grants[roleName][resourceName];
        }

        const privilegesSortedByRole = {};
        const roles = Object.keys(privileges).sort();

        for (const role of roles) {
            if (privileges[role] !== undefined)
                privilegesSortedByRole[role] = privileges[role];
        }

        return { [resourceName]: privilegesSortedByRole };
    }

    /**
     * Returns the list of privileges for the resource identified by the `resourceName` in the YAML format
     *
     * @param payload An object containing the `resourceName` attribute
     * @returns
     */
    async listResourcePrivilegesYAML(payload: ResourceNameDto) {
        const jsonPrivileges = await this.listResourcePrivilegesJSON(payload);

        return jsonToYaml.stringify(jsonPrivileges, 4);
    }

    /**
     * returns an object containing the accessType, resourceName and hasAccess attributes for the asked `resource` on the provided `accessType` for the provided `roles`
     *
     * @param accessType `read`, `create`, `update` or `delete`
     * @param resourceName A resource defined in the acces control
     * @param userRoles A list of roles defined in the access control database
     * @returns
     */
    private hasAccess(accessType, resourceName, userRoles) {
        const accessObject = {
            accessType,
            resourceName,
            hasAccess: this.can(userRoles, resourceName, accessType).granted,
        };

        if (accessObject.hasAccess === true)
            Object.assign(accessObject, {
                filteringAttributes: this.can(
                    userRoles,
                    resourceName,
                    accessType,
                ).attributes,
            });

        return accessObject;
    }

    private filterByRole(grants: {}, roleName: string) {
        const ressources = Object.keys(grants[roleName]).sort();
        const privileges = {};

        for (const ressource of ressources) {
            privileges[ressource] = grants[roleName][ressource];
        }

        return { [roleName]: privileges };
    }
}
