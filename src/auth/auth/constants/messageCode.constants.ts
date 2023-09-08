/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

// Exceptions message code consts

// Token - JWT
export const MISSING_TOKEN = 'missingToken';
export const NOT_LOGGED_IN = 'notLoggedIn';
export const USER_BLOCKED = 'userBlocked';
export const JWT_HAS_EXPIRED = 'JWTHasExpired';
export const JWT_IS_INVALID = 'JWTIsInvalid';
export const JWT_REQUIRES_SIGNATURE = 'JWTRequiresSignature';
export const JWT_HAS_INVALID_SIGNATURE = 'JWTHasIncalidSignature';
export const VALID_JWT_REQUIRED = 'validJWTRequired';
export const JWT_NOT_ACTIVE = 'JWTNotActive';
export const VALID_TOKEN_REQUIRED = 'validTokenRequired';

// Auth
export const MISSING_PASSWORD = 'missingPassword';
export const MISSING_LOGIN = 'missingLogin';
export const AUTH_FAILED = 'authFailed';
export const LOGOUT_FAILED = 'logoutFailed';
export const REVOKE_AUTH_FAILED = 'revokeAuthFailed';
export const LIST_AUTHENTICATED_USERS_FAILED = 'listAuthenticatedUsersFailed';

// Email
export const CANNOT_SEND_EMAIL = 'cannotSendEmail';

// Reset password
export const CANNOT_FIND_RESET_PASSWORD_REQUEST = 'cannotFindTheResetPasswordRequest';
