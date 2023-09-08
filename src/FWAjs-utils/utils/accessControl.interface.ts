/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { Config, Token } from './common.interface';

export interface Grant {
    [role: string]: Role;
}

export interface Role {
    [resource: string]: Resource;
}

export interface Resource {
    'create:any'?: string[];
    'read:any'?: string[];
    'update:any'?: string[];
    'delete:any'?: string[];
    'create:own'?: string[];
    'read:own'?: string[];
    'update:own'?: string[];
    'delete:own'?: string[];
}

export type Action = 'create' | 'read' | 'update' | 'delete';
export type OwnerAction = 'createOwn' | 'readOwn' | 'updateOwn' | 'deleteOwn';

export interface BaseRule {
    resource: string;
}

export interface RuleAny extends BaseRule {
    action: Action;
}

export interface RuleOwn extends BaseRule {
    action: OwnerAction;
}

export type Rule = RuleAny | RuleOwn;
export type Rules = Rule[];

export interface ApiAccessControlConfig extends Config {
    token: Token;
}

export interface AccessControlConfig extends Config {
    controller: any;
    db: Grant;
}
