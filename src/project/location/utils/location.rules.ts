/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { LocationType } from "../entities/projectLocation.entity";

class LocationRule {
    parent: LocationType;
    children: LocationType[];
    message: string;
}

export class LocationRules {
    public static readonly RULES: LocationRule[] = [{
        parent: LocationType.SITE,
        children: [LocationType.BUILDING, LocationType.SPACE],
        message: `Cannot append a location type different from ${LocationType.BUILDING} or ${LocationType.SPACE} to a ${LocationType.SITE} location.`
    }, {
        parent: LocationType.BUILDING,
        children: [LocationType.STOREY, LocationType.SPACE],
        message: `Cannot append a location type different from ${LocationType.STOREY} or ${LocationType.SPACE} to a ${LocationType.BUILDING} location.`
    }, {
        parent: LocationType.STOREY,
        children: [LocationType.SPACE],
        message: `Cannot append a location type different from ${LocationType.SPACE} to a ${LocationType.BUILDING} location.`
    }, {
        parent: LocationType.SPACE,
        children: [LocationType.SPACE],
        message: `Cannot append a location type different from ${LocationType.SPACE} to a ${LocationType.SPACE} location.`
    }
    ];
}



