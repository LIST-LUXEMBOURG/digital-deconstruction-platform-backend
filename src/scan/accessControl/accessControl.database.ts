/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { AccessControl } from 'accesscontrol';
import {
    PROJECT_3D_SCAN_CONFIG,
    OWN_PROJECT_3D_SCAN_CONFIG,
    PARTICIPATING_PROJECT_3D_SCAN_CONFIG,
    POINT_OF_INTEREST,
    OWN_PROJECT_POINT_OF_INTEREST,
    PARTICIPATING_PROJECT_POINT_OF_INTEREST
} from './resourcesName.constants';

const ac = new AccessControl();
const BasicUser = ac.grant('BasicUser');
const ProjectAdministrator = ac.grant('ProjectAdministrator');
const ProjectManager = ac.grant('ProjectManager');

const scan3dAttributes = [
    'id',
    'projectId',
    'scanUrl',
];

BasicUser.create(OWN_PROJECT_3D_SCAN_CONFIG, scan3dAttributes);
BasicUser.read(OWN_PROJECT_3D_SCAN_CONFIG, scan3dAttributes);
BasicUser.update(OWN_PROJECT_3D_SCAN_CONFIG, scan3dAttributes);
BasicUser.delete(OWN_PROJECT_3D_SCAN_CONFIG, scan3dAttributes);

BasicUser.read(PARTICIPATING_PROJECT_3D_SCAN_CONFIG, scan3dAttributes);

ProjectAdministrator.create(PROJECT_3D_SCAN_CONFIG, scan3dAttributes);
ProjectAdministrator.read(PROJECT_3D_SCAN_CONFIG, scan3dAttributes);
ProjectAdministrator.update(PROJECT_3D_SCAN_CONFIG, scan3dAttributes);
ProjectAdministrator.delete(PROJECT_3D_SCAN_CONFIG, scan3dAttributes);

// Point Of Interest

const pointOfInterestAttributes = [
    'uid',
    'projectId',
    'project.id',
    'locationId',
    'name',
    'description',
    'weblink',
];

BasicUser.read(POINT_OF_INTEREST, pointOfInterestAttributes);

ProjectAdministrator.read(POINT_OF_INTEREST, pointOfInterestAttributes);
ProjectAdministrator.read(OWN_PROJECT_POINT_OF_INTEREST, pointOfInterestAttributes);
ProjectAdministrator.read(PARTICIPATING_PROJECT_POINT_OF_INTEREST, pointOfInterestAttributes);


ProjectAdministrator.create(POINT_OF_INTEREST, pointOfInterestAttributes);
ProjectAdministrator.update(POINT_OF_INTEREST, pointOfInterestAttributes);
ProjectAdministrator.delete(POINT_OF_INTEREST, pointOfInterestAttributes);

export default ac.getGrants();
