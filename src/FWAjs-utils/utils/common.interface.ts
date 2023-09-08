/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

export interface Token {
    location: 'headers';
    name: string;
}

export interface Config {
    messagePattern: string | MessagePattern;
    transport: string;
    // cache: CacheConfig;
}

export interface MessagePattern {
    srv: string;
    cmd: string;
}