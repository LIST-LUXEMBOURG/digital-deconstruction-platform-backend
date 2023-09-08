/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { Config, Token } from './common.interface';

export interface ApiAuthConfig extends Config {
    token: Token;
}

export interface AuthConfig extends Config { }

export class Authorization {
    token?: string;
}

export interface TokenPayload {
    user: {
        id: number;
        roles: string[];
    };
}

export interface ResourceTriplet {
    global: string;
    owned: string;
    shared: string;
}
