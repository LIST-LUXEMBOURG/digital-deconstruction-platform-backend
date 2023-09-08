/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { AccessControl } from 'accesscontrol';
import { ROLE, ROLE_ASSIGNMENT } from './resourcesName.constants';

// grant database
const ac = new AccessControl();
const UserAdmin = ac.grant('UserAdmin');
const SysAdmin = ac.grant('SysAdmin');
const BasicUser = ac.grant('BasicUser');
const ProjectAdministrator = ac.grant('ProjectAdministrator');
const ProjectManager = ac.grant('ProjectManager');

const roleAttributes = [
    'id',
    'longName',
    'description'
];

const roleAssignmentAttributes = [
    'userId',
    'roleId'
];


// Required for client application to query logged in user role
BasicUser.readAny(ROLE, roleAttributes);
ProjectManager.readAny(ROLE, roleAttributes);
ProjectAdministrator.readAny(ROLE, roleAttributes);

BasicUser.readAny(ROLE_ASSIGNMENT, roleAssignmentAttributes);
ProjectManager.readAny(ROLE_ASSIGNMENT, roleAssignmentAttributes);
ProjectAdministrator.readAny(ROLE_ASSIGNMENT, roleAssignmentAttributes);


// 'UserAdmin' can update each created roles
UserAdmin.updateAny(ROLE, roleAttributes);
// 'UserAdmin' can see the created roles list
UserAdmin.readAny(ROLE, roleAttributes);
// 'UserAdmin' can delete any roles.
UserAdmin.deleteAny(ROLE, roleAttributes);

// 'UserAdmin' can assign a role to anyone.
UserAdmin.createAny(ROLE_ASSIGNMENT, roleAssignmentAttributes);
// 'UserAdmin' can see which roles are assigned to which user.
UserAdmin.readAny(ROLE_ASSIGNMENT, roleAssignmentAttributes);
// 'UserAdmin' can revoke any role assignements.
UserAdmin.deleteAny(ROLE_ASSIGNMENT, roleAssignmentAttributes);

// 'UserAdmin' can update each created roles
SysAdmin.updateAny(ROLE, roleAttributes);
// 'UserAdmin' can see the created roles list
SysAdmin.readAny(ROLE, roleAttributes);

export default ac.getGrants();
