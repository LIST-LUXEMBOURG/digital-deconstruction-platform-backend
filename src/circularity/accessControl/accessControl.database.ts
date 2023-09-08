/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { AccessControl } from 'accesscontrol';
import {
    CIRCULARITY,
    OWN_PROJECT_CIRCULARITY,
    PARTICIPATING_PROJECT_CIRCULARITY,
    PASSPORT_FILE,
    OWN_PROJECT_PASSPORT_FILE,
    PARTICIPATING_PROJECT_PASSPORT_FILE
} from './resourcesName.constants';

const ac = new AccessControl();
const BasicUser = ac.grant('BasicUser');
const ProjectAdministrator = ac.grant('ProjectAdministrator');
const ProjectManager = ac.grant('ProjectManager');

const circularityAttributes = [
    'uid',
    'marketValue',
    'socialBalance',
    'savingsCO2',
    'projectId',
    'elementUids',
    'elementTypeUid',
    'materialTypeUid',
];

BasicUser.read(CIRCULARITY, circularityAttributes);

BasicUser.read(OWN_PROJECT_CIRCULARITY, circularityAttributes);
BasicUser.create(OWN_PROJECT_CIRCULARITY, circularityAttributes);
BasicUser.update(OWN_PROJECT_CIRCULARITY, circularityAttributes);
BasicUser.delete(OWN_PROJECT_CIRCULARITY, circularityAttributes);

BasicUser.read(PARTICIPATING_PROJECT_CIRCULARITY, circularityAttributes);
BasicUser.create(PARTICIPATING_PROJECT_CIRCULARITY, circularityAttributes);
BasicUser.update(PARTICIPATING_PROJECT_CIRCULARITY, circularityAttributes);
BasicUser.delete(PARTICIPATING_PROJECT_CIRCULARITY, circularityAttributes);

ProjectAdministrator.read(CIRCULARITY, circularityAttributes);
ProjectAdministrator.create(CIRCULARITY, circularityAttributes);
ProjectAdministrator.update(CIRCULARITY, circularityAttributes);
ProjectAdministrator.delete(CIRCULARITY, circularityAttributes);

ProjectAdministrator.read(OWN_PROJECT_CIRCULARITY, circularityAttributes);
ProjectAdministrator.create(OWN_PROJECT_CIRCULARITY, circularityAttributes);
ProjectAdministrator.update(OWN_PROJECT_CIRCULARITY, circularityAttributes);
ProjectAdministrator.delete(OWN_PROJECT_CIRCULARITY, circularityAttributes);

ProjectAdministrator.read(PARTICIPATING_PROJECT_CIRCULARITY, circularityAttributes);
ProjectAdministrator.create(PARTICIPATING_PROJECT_CIRCULARITY, circularityAttributes);
ProjectAdministrator.update(PARTICIPATING_PROJECT_CIRCULARITY, circularityAttributes);
ProjectAdministrator.delete(PARTICIPATING_PROJECT_CIRCULARITY, circularityAttributes);

const passportFileAttributes = [
    'uid',
    'title',
    'documentDate',
    'projectId',
    'fileId',
    'circularityUid',
    'name',
    'originalName',
    'uploadedBy',
    'uploadedAt',
    'updatedAt',
    'size',
    'filePath',
    'fileType',
    'files'
];

BasicUser.read(PASSPORT_FILE, passportFileAttributes);

BasicUser.read(OWN_PROJECT_PASSPORT_FILE, passportFileAttributes);
BasicUser.create(OWN_PROJECT_PASSPORT_FILE, passportFileAttributes);
BasicUser.update(OWN_PROJECT_PASSPORT_FILE, passportFileAttributes);
BasicUser.delete(OWN_PROJECT_PASSPORT_FILE, passportFileAttributes);

BasicUser.read(PARTICIPATING_PROJECT_PASSPORT_FILE, passportFileAttributes);
BasicUser.create(PARTICIPATING_PROJECT_PASSPORT_FILE, passportFileAttributes);
BasicUser.update(PARTICIPATING_PROJECT_PASSPORT_FILE, passportFileAttributes);
BasicUser.delete(PARTICIPATING_PROJECT_PASSPORT_FILE, passportFileAttributes);

ProjectAdministrator.read(PASSPORT_FILE, ['*']);
ProjectAdministrator.create(PASSPORT_FILE, ['*']);
ProjectAdministrator.update(PASSPORT_FILE, ['*']);
ProjectAdministrator.delete(PASSPORT_FILE, ['*']);

ProjectAdministrator.read(OWN_PROJECT_PASSPORT_FILE, ['*']);
ProjectAdministrator.create(OWN_PROJECT_PASSPORT_FILE, ['*']);
ProjectAdministrator.update(OWN_PROJECT_PASSPORT_FILE, ['*']);
ProjectAdministrator.delete(OWN_PROJECT_PASSPORT_FILE, ['*']);

ProjectAdministrator.read(PARTICIPATING_PROJECT_PASSPORT_FILE, ['*']);
ProjectAdministrator.create(PARTICIPATING_PROJECT_PASSPORT_FILE, ['*']);
ProjectAdministrator.update(PARTICIPATING_PROJECT_PASSPORT_FILE, ['*']);
ProjectAdministrator.delete(PARTICIPATING_PROJECT_PASSPORT_FILE, ['*']);

export default ac.getGrants();