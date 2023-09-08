/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { AccessControl } from 'accesscontrol';
import {
    CLASSIFICATION_SYSTEM,
    CLASSIFICATION_ENTRY,
    PROPERTY_UNIT,
    PROPERTY_TYPE,
} from './resourcesName.constants';

const ac = new AccessControl();
const BasicUser = ac.grant('BasicUser');
const ProjectAdministrator = ac.grant('ProjectAdministrator');
const ProjectManager = ac.grant('ProjectManager');

/**
 * Inventory Columns
 * uid
 * ifcId
 * revitId
 * name
 * ifcType
 * location
 * description
 * classificationCode
 * reusePotential
 * volume
 * projectId
 */

const classificationSystemAttributes = [
    'id',
    'name',
    'description',
    'parent',
    'children'
];

const classificationEntryAttributes = [
    'id',
    'classificationSystemId',
    'code',
    'label',
    'parent',
];

const propertyUnitAttributes = [
    'id',
    'name',
    'symbol',
    'multiplier',
    'children'
];

const propertyTypeAttributes = [
    'id',
    'name',
    'isNumeric',
    'propertyUnits',
];

/* Basic User */
BasicUser.read(CLASSIFICATION_SYSTEM, classificationSystemAttributes);
BasicUser.read(CLASSIFICATION_ENTRY, classificationEntryAttributes);
BasicUser.read(PROPERTY_UNIT, propertyUnitAttributes);
BasicUser.read(PROPERTY_TYPE, propertyTypeAttributes);

ProjectAdministrator.read(CLASSIFICATION_SYSTEM, classificationSystemAttributes);
ProjectAdministrator.read(CLASSIFICATION_ENTRY, classificationEntryAttributes);
ProjectAdministrator.read(PROPERTY_UNIT, propertyUnitAttributes);
ProjectAdministrator.read(PROPERTY_TYPE, propertyTypeAttributes);

ProjectManager.read(CLASSIFICATION_SYSTEM, classificationSystemAttributes);
ProjectManager.read(CLASSIFICATION_ENTRY, classificationEntryAttributes);
ProjectManager.read(PROPERTY_UNIT, propertyUnitAttributes);
ProjectManager.read(PROPERTY_TYPE, propertyTypeAttributes);

export default ac.getGrants();