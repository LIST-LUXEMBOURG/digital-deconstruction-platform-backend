/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { ACCESS_CONTROL_DISPATCH_ACDB } from "./accessControl.constants";

/**
 * Dispatch the ACDB in the `accessControlDB` within the whole application, regardless the type of architecture
 * 
 * @param that The `this` class instance from wich the module dynamic initialization is called
 * @param accessControlDB The definition of ACDB for a particular module
 */
export function dispatchACDBs(that, accessControlDB) {
    that.eventEmitter.emit(
        ACCESS_CONTROL_DISPATCH_ACDB,
        accessControlDB
    );
}