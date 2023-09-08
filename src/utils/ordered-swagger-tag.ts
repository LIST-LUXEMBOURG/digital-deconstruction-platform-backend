/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

/** In micro-services, this file should be placed in the API side */
enum Tags {
    Core = 1,
    Projects,
    Participants,
    Locations,
    Documents,
    Files,
    BimModel,
    Scan3dConfig,
    Inventory,
    Acdb,
    Roles, // 2,
    Users, // 3,
    Auth, // ...
    // 'Access Control',
}

export function getTag(str: string | number | Tags) {
    let tagName, tagValue;

    if (typeof str === 'number') {
        tagName = Tags[str];
        tagValue = Tags[tagName]; // same as tagValue 'equals' str
    } else {
        tagValue = Tags[str];
        tagName = Tags[tagValue]; // same as tagName 'equals' str
    }
    return `${tagValue}) ${tagName}`;
}
