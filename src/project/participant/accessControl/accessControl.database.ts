/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { AccessControl } from 'accesscontrol';
import {
    OWN_PROJECT_PARTICIPANT,
    PROJECT_PARTICIPANT
} from './resourcesName.constants';

const ac = new AccessControl();
const BasicUser = ac.grant('BasicUser');
const ProjectAdministrator = ac.grant('ProjectAdministrator');
const ProjectManager = ac.grant('ProjectManager');

const projectParticipantAttributes = [
    'id',
    'project.id',
    'user.id',
    'userId',
    'role',
];

/* Basic User */

BasicUser.read(PROJECT_PARTICIPANT, projectParticipantAttributes);

BasicUser.create(OWN_PROJECT_PARTICIPANT, projectParticipantAttributes);
BasicUser.read(OWN_PROJECT_PARTICIPANT, projectParticipantAttributes);
BasicUser.update(OWN_PROJECT_PARTICIPANT, projectParticipantAttributes);
BasicUser.delete(OWN_PROJECT_PARTICIPANT, projectParticipantAttributes);

// Project Administrator
ProjectAdministrator.create(PROJECT_PARTICIPANT, projectParticipantAttributes);
ProjectAdministrator.read(PROJECT_PARTICIPANT, projectParticipantAttributes);
ProjectAdministrator.update(PROJECT_PARTICIPANT, projectParticipantAttributes);
ProjectAdministrator.delete(PROJECT_PARTICIPANT, projectParticipantAttributes);

export default ac.getGrants();