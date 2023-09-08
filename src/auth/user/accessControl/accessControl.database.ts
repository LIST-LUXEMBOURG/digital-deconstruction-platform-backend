/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { AccessControl } from 'accesscontrol';
import { ACTIVE_USER, OWN_USER, USER } from './resourcesName.constants';

// grant database
const ac = new AccessControl();

const BasicUser = ac.grant('BasicUser');

// 'BasicUser' can see the most common attributes of his own user
BasicUser.read(OWN_USER, ['id', 'name', 'firstName', 'email', 'login']);
// 'BasicUser' can update relevant attributes of his own user, and the password too
BasicUser.update(OWN_USER, ['name', 'firstName', 'email', 'login', 'password']);
// 'BasicUser' can see some attributes of active users, but not the login
BasicUser.read(ACTIVE_USER, ['id', 'name', 'firstName', 'email', 'active', 'login']);

const UserAdmin = ac.grant('UserAdmin').extend('BasicUser');
const SysAdmin = ac.grant('SysAdmin').extend('BasicUser');
const ProjectAdministrator = ac.grant('ProjectAdministrator').extend('BasicUser');
const ProjectManager = ac.grant('ProjectManager').extend('BasicUser');
ac.grant('Guest').extend('BasicUser');

// 'UserAdmin' can create a user with all settable attributes
UserAdmin.create(USER, [
	'name',
	'firstName',
	'email',
	'login',
	'password',
	'active',
	'blocked',
	'blockingReason',
]);
// 'UserAdmin' can update most of a user's attributes
UserAdmin.update(USER, [
	'name',
	'firstName',
	'email',
	'login',
	'password',
	'active',
	'blocked',
	'blockingReason',
]);
// 'UserAdmin' can update most of his own attributes
UserAdmin.update(OWN_USER, [
	'name',
	'firstName',
	'email',
	'login',
	'password',
	'active',
	'blocked',
	'blockingReason',
]);
// 'UserAdmin' can see all of user's attributes except his password
UserAdmin.read(USER, [
	'id',
	'name',
	'firstName',
	'email',
	'login',
	'active',
	'blocked',
	'blockingReason',
]);

// 'SysAdmin' can see the most common attributes of his own user
SysAdmin.read(OWN_USER, ['id', 'name', 'firstName', 'email', 'login']);

// 'ProjectAdministrator' can see the most common attributes of his own user
ProjectAdministrator.read(OWN_USER, ['id', 'name', 'firstName', 'email', 'login']);
// 'ProjectAdministrator' can see some attributes of active users, but not the login
ProjectAdministrator.read(ACTIVE_USER, ['id', 'name', 'firstName', 'email', 'active']);

// 'ProjectManager' can see the most common attributes of his own user
ProjectManager.read(OWN_USER, ['id', 'name', 'firstName', 'email', 'login']);
// 'ProjectManager' can see some attributes of active users, but not the login
ProjectManager.read(ACTIVE_USER, ['id', 'name', 'firstName', 'email', 'active']);

export default ac.getGrants();
