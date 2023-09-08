/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { AccessControl } from 'accesscontrol';
import {
    OWN_PROJECT_DOCUMENT,
    PARTICIPATING_PROJECT_DOCUMENT,
    PROJECT_DOCUMENT
} from './resourcesName.constants';

const ac = new AccessControl();
const BasicUser = ac.grant('BasicUser');
const ProjectManager = ac.grant('ProjectManager');
const ProjectAdministrator = ac.grant('ProjectAdministrator');

/* Basic User */

const projectDocumentAttributesFullSet = [
    'id',
    'title',
    'projectId',
    'locationId',
    'fileUid',
    'project.id',
    'file.uuid',
    'file.name',
    'file.originalName',
    'file.uploadedBy',
    'file.uploadedAt',
    'file.updatedAt',
    'file.size',
    'file.filePath',
    'file.fileType',
    'description',
    'location.id',
    'documentAuthor',
    'documentDate',
    'files'
];

const projectDocumentAttributesBasicSet = [
    'id',
    'title',
    'project.id',
    'file.name',
    'file.originalName',
    'file.size',
    'file.filePath',
    'file.fileType',
    'description',
    'documentAuthor',
    'documentDate',
];

BasicUser.read(OWN_PROJECT_DOCUMENT, projectDocumentAttributesFullSet);
BasicUser.create(OWN_PROJECT_DOCUMENT, projectDocumentAttributesFullSet);
BasicUser.update(OWN_PROJECT_DOCUMENT, projectDocumentAttributesFullSet);
BasicUser.delete(OWN_PROJECT_DOCUMENT, projectDocumentAttributesFullSet);

BasicUser.read(PARTICIPATING_PROJECT_DOCUMENT, projectDocumentAttributesFullSet);
BasicUser.create(PARTICIPATING_PROJECT_DOCUMENT, projectDocumentAttributesFullSet);
BasicUser.update(PARTICIPATING_PROJECT_DOCUMENT, projectDocumentAttributesFullSet);
BasicUser.delete(PARTICIPATING_PROJECT_DOCUMENT, projectDocumentAttributesFullSet);

/* Project Manager */
ProjectManager.read(PROJECT_DOCUMENT, projectDocumentAttributesFullSet);
ProjectManager.create(PROJECT_DOCUMENT, projectDocumentAttributesFullSet);
ProjectManager.update(PROJECT_DOCUMENT, projectDocumentAttributesFullSet);
ProjectManager.delete(PROJECT_DOCUMENT, projectDocumentAttributesFullSet);

/* Project Administrator */
ProjectAdministrator.read(PROJECT_DOCUMENT, projectDocumentAttributesFullSet);
ProjectAdministrator.create(PROJECT_DOCUMENT, projectDocumentAttributesFullSet);
ProjectAdministrator.update(PROJECT_DOCUMENT, projectDocumentAttributesFullSet);
ProjectAdministrator.delete(PROJECT_DOCUMENT, projectDocumentAttributesFullSet);

export default ac.getGrants();
