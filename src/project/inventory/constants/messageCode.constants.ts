/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

export const USER_DOES_NOT_HAVE_REQUIRED_PERMISSIONS = 'userDoesNotHaveRequiredPermissions';
export const ACTION_NOT_ALLOWED_ON_INVENTORY = 'actionNotAllowedOnInventory';
export const ACTION_NOT_ALLOWED_ON_INVENTORY_FILE = 'actionNotAllowedOnInventoryFile';
export const ACTION_NOT_ALLOWED_ON_ELEMENT_TYPE = 'actionNotAllowedOnElementType';


// Inventory Elements

export const INVENTORY_ELEMENT_NOT_FOUND = 'inventoryElementNotFound';
export const FAILED_TO_LOOKUP_INVENTORY_ELEMENT = 'failedToLookupInventoryElement';
export const FAILED_TO_ASSIGN_POINT_OF_INTEREST_TO_INVENTORY_ELEMENT = 'failedToAssignPointOfInterestToInventoryElement';
export const FAILED_TO_REMOVE_POINT_OF_INTEREST_FROM_INVENTORY_ELEMENT = 'failedToRemovePointOfInterestFromInventoryElement';
export const CANNOT_LIST_INVENTORY_ELEMENTS = 'cannotListInventoryElements';
export const CANNOT_COUNT_INVENTORY_ELEMENTS = 'cannotCountInventoryElements';
export const CANNOT_LIST_INVENTORY_ELEMENT_IDENTIFIERS = 'cannotListInventoryElementIdentifiers';
export const CANNOT_ANALYSE_INVENTORY_ELEMENTS = 'cannotAnalyseInventoryElements';
export const CANNOT_FETCH_INVENTORY_ELEMENT_DEPENDENCIES = 'cannotFetchInventoryElementDependencies';
export const CANNOT_CREATE_INVENTORY_ELEMENT = 'cannotCreateInventoryElement';
export const CANNOT_UPDATE_INVENTORY_ELEMENT = 'cannotUpdateInventoryElement';
export const CANNOT_ADD_MATERIAL_TO_INVENTORY_ELEMENT = 'cannotAddMaterialToInventoryElement';
export const CANNOT_ADD_PROPERTY_TO_INVENTORY_ELEMENT = 'cannotAddPropertyToInventoryElement';
export const CANNOT_DELETE_INVENTORY_ELEMENT = 'cannotDeleteInventoryElement';
export const FAILED_TO_LOOKUP_INVENTORY_ELEMENT_PROPERTY = 'failedToLookupInventoryElementProperty';
export const CANNOT_UPDATE_INVENTORY_ELEMENT_PROPERTY = 'cannotUpdateInventoryElementProperty';
export const CANNOT_DELETE_INVENTORY_ELEMENT_PROPERTY = 'cannotDeletInventoryElementProperty';

// Inventory Element Types

export const INVENTORY_ELEMENT_TYPE_NOT_FOUND = 'inventoryElementTypeNotFound';
export const FAILED_TO_LOOKUP_INVENTORY_ELEMENT_TYPE = 'failedToLookupInventoryElementType';
export const CANNOT_LIST_INVENTORY_ELEMENT_TYPES = 'cannotListInventoryElementTypes';
export const CANNOT_COUNT_INVENTORY_ELEMENT_TYPES = 'cannotCountInventoryElementTypes';
export const INVENTORY_ELEMENT_TYPE_ALREADY_EXISTS = 'inventoryElementTypeNameAlreadyExists';
export const CANNOT_CREATE_INVENTORY_ELEMENT_TYPE = 'cannotCreateInventoryElementType';
export const CANNOT_FETCH_INVENTORY_ELEMENT_TYPE = 'cannotFetchInventoryElementType';
export const CANNOT_UPDATE_INVENTORY_ELEMENT_TYPE = 'cannotUpdateInventoryElementType';
export const CANNOT_DELETE_INVENTORY_ELEMENT_TYPE = 'cannotDeleteInventoryElementType';
export const CANNOT_DELETE_INVENTORY_ELEMENT_TYPE_WITH_DOCUMENTS = 'cannotDeleteInventoryElementTypeWithDocuments';

// Inventory Materials

export const INVENTORY_MATERIAL_NOT_FOUND = 'inventoryMaterialNotFound'
export const FAILED_TO_LOOKUP_INVENTORY_MATERIAL = 'failedToLookupInventoryMaterial';
export const CANNOT_LIST_INVENTORY_MATERIALS = 'cannotListInventoryMaterials';
export const CANNOT_ANALYSE_INVENTORY_MATERIALS = 'cannotAnalyseInventoryMaterials';
export const INVENTORY_MATERIAL_ALREADY_EXISTS = 'inventoryMaterialAlreadyExists';
export const CANNOT_CREATE_INVENTORY_MATERIAL = 'cannotCreateInventoryMaterial';
export const CANNOT_UPDATE_INVENTORY_MATERIAL = 'cannotUpdateInventoryMaterial';
export const CANNOT_DELETE_INVENTORY_MATERIAL = 'cannotDeleteInventoryMaterial';

// Inventory Material Types

export const INVENTORY_MATERIAL_TYPE_NOT_FOUND = 'inventoryMaterialTypeNotFound'
export const CANNOT_LIST_INVENTORY_MATERIAL_TYPES = 'cannotListInventoryMaterialTypes';
export const CANNOT_COUNT_INVENTORY_MATERIAL_TYPES = 'cannotCountInventoryMaterialTypes';
export const FAILED_TO_LOOKUP_INVENTORY_MATERIAL_TYPE = 'failedToLookupInventoryMaterialType';
export const INVENTORY_MATERIAL_TYPE_ALREADY_EXISTS = 'inventoryMaterialTypeAlreadyExists';
export const CANNOT_CREATE_INVENTORY_MATERIAL_TYPE = 'cannotCreateInventoryMaterialType';
export const CANNOT_FETCH_INVENTORY_MATERIAL_TYPE = 'cannotFetchInventoryMaterialType';
export const CANNOT_UPDATE_INVENTORY_MATERIAL_TYPE = 'cannotUpdateInventoryMaterialType';
export const CANNOT_DELETE_INVENTORY_MATERIAL_TYPE = 'cannotDeleteInventoryMaterialType';

// Inventory File

export const INVENTORY_FILE_NOT_FOUND = 'inventoryFileNotFound';
export const FAILED_TO_LOOKUP_INVENTORY_FILE = 'failedToLookupInventoryFile';
export const INVENTORY_FILE_ALREADY_EXISTS = 'inventoryFileAlreadyExists';
export const CANNOT_CREATE_INVENTORY_FILE = 'cannotCreateInventoryFile';
export const CANNOT_FIND_INVENTORY_FILE = 'cannotFindInventoryFile';
export const CANNOT_UPDATE_INVENTORY_FILE = 'cannotUpdateInventoryFile';
export const CANNOT_DELETE_INVENTORY_FILE = 'cannotDeleteInventoryFile';
export const CANNOT_STREAM_INVENTORY_FILE = 'cannotStreamInventoryFile';

// Circularity

export const CIRCULARITY_NOT_FOUND = 'circularityObjectNotFound';
export const FAILED_TO_LOOKUP_CIRCULARITY = 'failedToLookupCircularityObject';
export const CIRCULARITY_ALREADY_EXISTS = 'circularityObjectAlreadyExists';
export const CIRCULARITY_REQUIRES_ELEMENT_TYPE_OR_MATERIAL_TYPE = 'circularityObjectRequiresElementTypeOrMaterialType';
export const CANNOT_CREATE_CIRCULARITY = 'cannotCreateCircularityObject';
export const CANNOT_DELETE_CIRCULARITY = 'cannotDeleteCircularityObject';
export const CANNOT_UPDATE_CIRCULARITY = 'cannotUpdateircularityObject';

export const READ_POINT_OF_INTEREST_NOT_ALLOWED = 'readPointOfInterestsNotAllowed';

export const POINT_OF_INTEREST_NOT_FOUND = 'pointOfInterestNotFound'
export const CANNOT_RETRIEVE_POINT_OF_INTEREST = 'cannotRetrievePointOfInterest'
export const CANNOT_UPDATE_POINT_OF_INTEREST = 'cannotUpdatePointOfInterest';
export const CANNOT_DELETE_POINT_OF_INTEREST = 'cannotDeletePointOfInterest';

export const PROPERTY_TYPE_ALREADY_EXISTS = 'propertyTypeAlreadyExists';

export const INVENTORY_PROPERTY_NOT_FOUND = 'inventoryPropertyNotFound';
export const CANNOT_UPDATE_INVENTORY_PROPERTY = 'cannotUpdateInventoryProperty';
export const CANNOT_DELETE_INVENTORY_PROPERTY = 'cannotDeleteInventoryProperty';


export const CANNOT_ADD_CLASSIFICATION_ENTRY_TO_INVENTORY_ELEMENT_TYPE = 'cannotAddClassificationEntryToInventoryElement';

// Passport File

export const PASSPORT_FILE_NOT_FOUND = 'passportFileNotFound';
export const FAILED_TO_LOOKUP_PASSPORT_FILE = 'failedToLookupPassportFile';
export const PASSPORT_FILE_ALREADY_EXISTS = 'passportFileAlreadyExists';
export const CANNOT_CREATE_PASSPORT_FILE = 'cannotCreatePassportFile';
export const CANNOT_FIND_PASSPORT_FILE = 'cannotFindPassportFile';
export const CANNOT_UPDATE_PASSPORT_FILE = 'cannotUpdatePassportFile';
export const CANNOT_DELETE_PASSPORT_FILE = 'cannotDeletePassportFile';
export const CANNOT_STREAM_PASSPORT_FILE = 'cannotStreamPassportFile';


