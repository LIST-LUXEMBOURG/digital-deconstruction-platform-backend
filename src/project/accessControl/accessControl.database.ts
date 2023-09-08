/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { AccessControl } from 'accesscontrol';
import {
    OWN_PROJECT,
    PARTICIPATING_PROJECT,
    PROJECT
} from './resourcesName.constants';

const ac = new AccessControl();
const BasicUser = ac.grant('BasicUser');
const ProjectAdministrator = ac.grant('ProjectAdministrator');
const ProjectManager = ac.grant('ProjectManager');

const projectAttributes = [
    'id',
    'project.id',
    'shortName',
    'fullName',
    'description',
    'owner.id',
    'projectType',
    'footprint',
    'deconstructionStart',
    'contactInfo',
    'createdBy',
    'createdAt',
    'fullAddress.id',
    'fullAddress.addressLine1',
    'fullAddress.addressLine2',
    'fullAddress.city',
    'fullAddress.stateOrProvince',
    'fullAddress.zipOrPostalCode',
    'fullAddress.country',
];

/* Basic User */
BasicUser.read(PROJECT, projectAttributes);

BasicUser.read(OWN_PROJECT, projectAttributes);
BasicUser.create(OWN_PROJECT, projectAttributes);
BasicUser.update(OWN_PROJECT, projectAttributes);
BasicUser.delete(OWN_PROJECT, ['picture']);

/* Project administrator */
ProjectAdministrator.create(PROJECT, projectAttributes);
ProjectAdministrator.read(PROJECT, projectAttributes);
ProjectAdministrator.update(PROJECT, projectAttributes);
ProjectAdministrator.delete(PROJECT, projectAttributes);

/* Project manager */
ProjectManager.create(PROJECT, projectAttributes);
ProjectManager.read(PROJECT, projectAttributes);
ProjectManager.update(PROJECT, projectAttributes);
ProjectManager.delete(PROJECT, projectAttributes);

export default ac.getGrants();
