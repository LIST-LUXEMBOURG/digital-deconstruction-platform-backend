/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { AccessControl } from 'accesscontrol';
import {
    INVENTORY,
    OWN_PROJECT_INVENTORY,
    PARTICIPATING_PROJECT_INVENTORY,
    ELEMENT_TYPE,
    OWN_PROJECT_ELEMENT_TYPE,
    PARTICIPATING_PROJECT_ELEMENT_TYPE,
    MATERIAL_TYPE,
    OWN_PROJECT_MATERIAL_TYPE,
    PARTICIPATING_PROJECT_MATERIAL_TYPE,
    MATERIAL,
    OWN_PROJECT_MATERIAL,
    PARTICIPATING_PROJECT_MATERIAL,
    INVENTORY_FILE,
    OWN_PROJECT_INVENTORY_FILE,
    PARTICIPATING_PROJECT_INVENTORY_FILE,
    ELEMENT_PROPERTY,
    OWN_PROJECT_ELEMENT_PROPERTY,
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

const elementAttributes = [
    'uid',
    'projectId',
    'ifcId',
    'revitId',
    'name',
    'description',
    'reusePotential',
    'reuseDecision',
    'surfaceDamage',
    'elementType',
    'elementTypeUid',
    'hazardAssessment',
    'hazardAssessmentStatus',
    'properties',
    'materials',
    'pointOfInterest',
    'circularities'
];
const elementTypeAttributes = [
    'uid',
    'projectId',
    'ifcId',
    'ifcType',
    'name',
    'description',
    'category',
    'historicalValue',
    'trademark',
    'designer',
    'classificationEntries',
    'files',
];

/* Basic User */
BasicUser.read(INVENTORY, elementAttributes);

BasicUser.read(OWN_PROJECT_INVENTORY, elementAttributes);

BasicUser.create(OWN_PROJECT_INVENTORY, ['*']);
BasicUser.update(OWN_PROJECT_INVENTORY, ['*']);
BasicUser.delete(OWN_PROJECT_INVENTORY, ['*']);

BasicUser.create(PARTICIPATING_PROJECT_INVENTORY, elementAttributes);

BasicUser.update(PARTICIPATING_PROJECT_INVENTORY, [
    'uid',
    'ifcId',
    'revitId',
    'name',
    'ifcType',
    'location',
    'description',
    'classificationCode',
    'reusePotential',
    'volume',
    'projectId',
]);

ProjectAdministrator.read(INVENTORY, elementAttributes);

ProjectAdministrator.create(INVENTORY, ['*']);
ProjectAdministrator.update(INVENTORY, ['*']);
ProjectAdministrator.delete(INVENTORY, ['*']);

ProjectAdministrator.read(OWN_PROJECT_INVENTORY, elementAttributes);

// Element Types

BasicUser.read(ELEMENT_TYPE, elementTypeAttributes);

ProjectAdministrator.read(ELEMENT_TYPE, elementTypeAttributes);

ProjectAdministrator.create(ELEMENT_TYPE, ['*']);
ProjectAdministrator.update(ELEMENT_TYPE, ['*']);
ProjectAdministrator.delete(ELEMENT_TYPE, ['*']);

// Element Properties

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

BasicUser.read(ELEMENT_PROPERTY, propertyUnitAttributes);
BasicUser.read(ELEMENT_PROPERTY, elementTypeAttributes);

ProjectManager.read(ELEMENT_PROPERTY, propertyUnitAttributes);
ProjectManager.read(ELEMENT_PROPERTY, elementTypeAttributes);
ProjectManager.read(OWN_PROJECT_ELEMENT_PROPERTY, propertyUnitAttributes);
ProjectManager.read(OWN_PROJECT_ELEMENT_PROPERTY, propertyTypeAttributes);
ProjectManager.create(OWN_PROJECT_ELEMENT_PROPERTY, propertyUnitAttributes);
ProjectManager.create(OWN_PROJECT_ELEMENT_PROPERTY, propertyTypeAttributes);
ProjectManager.update(OWN_PROJECT_ELEMENT_PROPERTY, propertyUnitAttributes);
ProjectManager.update(OWN_PROJECT_ELEMENT_PROPERTY, propertyTypeAttributes);
ProjectManager.delete(OWN_PROJECT_ELEMENT_PROPERTY, propertyUnitAttributes);
ProjectManager.delete(OWN_PROJECT_ELEMENT_PROPERTY, propertyTypeAttributes);

ProjectAdministrator.read(ELEMENT_PROPERTY, propertyUnitAttributes);
ProjectAdministrator.read(ELEMENT_PROPERTY, propertyTypeAttributes);
ProjectAdministrator.create(ELEMENT_PROPERTY, propertyUnitAttributes);
ProjectAdministrator.create(ELEMENT_PROPERTY, propertyTypeAttributes);
ProjectAdministrator.update(ELEMENT_PROPERTY, propertyUnitAttributes);
ProjectAdministrator.update(ELEMENT_PROPERTY, propertyTypeAttributes);
ProjectAdministrator.delete(ELEMENT_PROPERTY, propertyUnitAttributes);
ProjectAdministrator.delete(ELEMENT_PROPERTY, propertyTypeAttributes);

// Material Types

const materialTypeAttributes = [
    'uid',
    'name',
    'description',
    'category',
    'isHazard',
    'projectId',
];

BasicUser.read(MATERIAL_TYPE, materialTypeAttributes);

ProjectAdministrator.read(MATERIAL_TYPE, materialTypeAttributes);

ProjectAdministrator.create(MATERIAL_TYPE, materialTypeAttributes);
ProjectAdministrator.update(MATERIAL_TYPE, materialTypeAttributes);
ProjectAdministrator.delete(MATERIAL_TYPE, materialTypeAttributes);




BasicUser.read(INVENTORY, elementAttributes);

ProjectAdministrator.read(INVENTORY, elementAttributes);

ProjectAdministrator.create(INVENTORY, ['*']);
ProjectAdministrator.update(INVENTORY, ['*']);
ProjectAdministrator.delete(INVENTORY, ['*']);

ProjectAdministrator.read(OWN_PROJECT_INVENTORY, elementAttributes);

// Element Types

BasicUser.read(ELEMENT_TYPE, elementTypeAttributes);

ProjectAdministrator.read(ELEMENT_TYPE, elementTypeAttributes);

ProjectAdministrator.create(ELEMENT_TYPE, ['*']);
ProjectAdministrator.update(ELEMENT_TYPE, ['*']);
ProjectAdministrator.delete(ELEMENT_TYPE, ['*']);

// Materials

BasicUser.read(MATERIAL, [
    'uid',
    'volume',
    'mass',
    'materialTypeUid'
]);

ProjectAdministrator.read(MATERIAL, [
    'uid',
    'volume',
    'mass',
    'materialTypeUid'
]);

ProjectAdministrator.create(MATERIAL, ['*']);
ProjectAdministrator.update(MATERIAL, ['*']);
ProjectAdministrator.delete(MATERIAL, ['*']);


export default ac.getGrants();

// Inventory Files

const inventoryFileAttributes = [
    'uid',
    'title',
    'projectId',
    'fileId',
    'description',
    'locationId',
    'documentAuthor',
    'documentDate',
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

BasicUser.read(INVENTORY_FILE, inventoryFileAttributes);

BasicUser.read(OWN_PROJECT_INVENTORY_FILE, inventoryFileAttributes);
BasicUser.create(OWN_PROJECT_INVENTORY_FILE, inventoryFileAttributes);
BasicUser.update(OWN_PROJECT_INVENTORY_FILE, inventoryFileAttributes);
BasicUser.delete(OWN_PROJECT_INVENTORY_FILE, inventoryFileAttributes);

BasicUser.read(PARTICIPATING_PROJECT_INVENTORY_FILE, inventoryFileAttributes);
BasicUser.create(PARTICIPATING_PROJECT_INVENTORY_FILE, inventoryFileAttributes);
BasicUser.update(PARTICIPATING_PROJECT_INVENTORY_FILE, inventoryFileAttributes);
BasicUser.delete(PARTICIPATING_PROJECT_INVENTORY_FILE, inventoryFileAttributes);

ProjectAdministrator.read(INVENTORY_FILE, [
    'uid',
    'title',
    'projectId',
    'fileId',
    'description',
    'locationId',
    'documentAuthor',
    'documentDate',
    'name',
    'originalName',
    'uploadedBy',
    'uploadedAt',
    'updatedAt',
    'size',
    'filePath',
    'fileType',
    'files'
]);

ProjectAdministrator.create(INVENTORY_FILE, ['*']);
ProjectAdministrator.update(INVENTORY_FILE, ['*']);
ProjectAdministrator.delete(INVENTORY_FILE, ['*']);