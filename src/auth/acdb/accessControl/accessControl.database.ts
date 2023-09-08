/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { AccessControl } from 'accesscontrol';
import { ACDB, ACDB_RESOURCE, PRIVILEGES_MANAGEMENT, PROJECTS_MANAGEMENT, RESOURCE_PRIVILEGES, ROLE_PRIVILEGES, SESSION_MANAGEMENT, USER_MANAGEMENT } from './resourceName.constants';

const ac = new AccessControl();

// Basic role that all others should inherit from
const BasicUser = ac.grant('BasicUser');

// A BasicUser can read the ACDB resource
BasicUser.read(ACDB, ['*']);
// A BasicUser has the right to access the project management page in the front-end
BasicUser.read(PROJECTS_MANAGEMENT, ['*']);

// Giving specific roles the BasicUser's rights by inheritance
const UserAdmin = ac.grant('UserAdmin').extend('BasicUser');
const SysAdmin = ac.grant('SysAdmin').extend('BasicUser');
const Everyone = ac.grant('Everyone').extend('BasicUser');
const ProjectAdministrator = ac.grant('ProjectAdministrator').extend('BasicUser');
const ProjectManager = ac.grant('ProjectManager').extend('BasicUser');
ac.grant('Guest').extend('BasicUser');

// UserAdmin has the right to access to the users management page in the front-end
UserAdmin.read(USER_MANAGEMENT, ['*']);
// UserAdmin has the right to access to the users's sessions management page in the front-end
UserAdmin.read(SESSION_MANAGEMENT, ['*']);

// SysAdmin has the right to access to the ACDB resources page in the front-end
SysAdmin.read(ACDB_RESOURCE, ['*']);
// SysAdmin has the right to access to the privileges by role page in the front-end
SysAdmin.read(ROLE_PRIVILEGES, ['*']);
// SysAdmin has the right to access to the privileges by resource page in the front-end
SysAdmin.read(RESOURCE_PRIVILEGES, ['*']);
// SysAdmin has the right to access to the privileges management page in the front-end
SysAdmin.read(PRIVILEGES_MANAGEMENT, ['*']);

// Everyone has the right to access to the users management page in the front-end
Everyone.read(USER_MANAGEMENT, ['*']);

export default ac.getGrants();