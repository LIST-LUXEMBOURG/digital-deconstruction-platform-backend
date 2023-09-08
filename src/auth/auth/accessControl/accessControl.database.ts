/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { AccessControl } from 'accesscontrol';
import { AUTH } from './resourcesName.constants';

// grant database
const ac = new AccessControl();
const UserAdmin = ac.grant('UserAdmin');

// 'UserAdmin' can see the connected users list
UserAdmin.readAny(AUTH);
// 'UserAdmin' can revoke the authentication of anyone
UserAdmin.deleteAny(AUTH);

export default ac.getGrants();
