/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { AccessControl } from 'accesscontrol';
import {
    OWN_PROJECT_LOCATION,
    PARTICIPATING_PROJECT_LOCATION,
    PROJECT_LOCATION
} from './resourcesName.constants';

const ac = new AccessControl();
const BasicUser = ac.grant('BasicUser');
const ProjectAdministrator = ac.grant('ProjectAdministrator');
const ProjectManager = ac.grant('ProjectManager');

/* Basic User */

const projectLocationAttributes = [
    'id',
    'project',
    'projectId',
    'name',
    'type',
    'parentLocation',
    'parentLocationId',
    'coordinate',
    'subdivisions'
];

BasicUser.create(OWN_PROJECT_LOCATION, projectLocationAttributes);
BasicUser.read(OWN_PROJECT_LOCATION, projectLocationAttributes);
BasicUser.update(OWN_PROJECT_LOCATION, projectLocationAttributes);
BasicUser.delete(OWN_PROJECT_LOCATION, projectLocationAttributes);

BasicUser.create(PARTICIPATING_PROJECT_LOCATION, projectLocationAttributes);
BasicUser.read(PARTICIPATING_PROJECT_LOCATION, projectLocationAttributes);
BasicUser.update(PARTICIPATING_PROJECT_LOCATION, projectLocationAttributes);
BasicUser.delete(PARTICIPATING_PROJECT_LOCATION, projectLocationAttributes);

/* Project administrator */
ProjectAdministrator.create(PROJECT_LOCATION, projectLocationAttributes);
ProjectAdministrator.read(PROJECT_LOCATION, projectLocationAttributes);
ProjectAdministrator.update(PROJECT_LOCATION, projectLocationAttributes);
ProjectAdministrator.delete(PROJECT_LOCATION, projectLocationAttributes);

export default ac.getGrants();
