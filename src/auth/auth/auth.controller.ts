/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import {
    Body,
    Controller,
    Get,
    Headers,
    HttpCode,
    Param,
    Post,
    Put,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiConflictResponse,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
    ApiAccessControl,
    ApiAccessGuard,
    ApiAuth,
    ApiAuthGuard,
    DELETE_ACTION,
    READ_ACTION,
} from '../../FWAjs-utils';
import { getTag } from '../../utils/ordered-swagger-tag';
import { AUTH } from './accessControl/resourcesName.constants';
import { AuthService } from './auth.service';
import {
    AuthCreateDto,
    AuthRevokeDto,
    PasswordRequestResetDto,
    PasswordResetConfirmationDto,
    PasswordResetDto,
} from './dto';
import { AuthListDto } from './dto/list.dto';

@ApiTags('Authentication')
@Controller('auth')
@UseGuards(ApiAuthGuard, ApiAccessGuard)
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    // --- create authentication ---
    @ApiOperation({
        summary: 'AKA "user login" or "user connection"',
        description:
            `Generates and returns a JWT access token that contains the user information in its payload,` +
            ` including his roles, but without the password.`,
    })
    @ApiCreatedResponse({ description: 'The user is authenticated' })
    @ApiUnauthorizedResponse({ description: 'Failed to authenticate the user' })
    @ApiBadRequestResponse({
        description:
            'The login is missing in payload.\nThe password is missing in payload.',
    })
    @Post('/login')
    async createAuthentication(@Body() createAuthDto: AuthCreateDto) {
        return await this.authService.createAuthentication(createAuthDto);
    }

    // --- delete authentication ---
    @ApiOperation({
        summary: 'Check the validity of a user\'s authorization',
        description:
            `If the token has a valid signature and is referenced in the UAL (Users Authenticated List), then returns **true**, otherwise **false**.`,
    })
    @ApiOkResponse({
        description: 'Successfully checked the validity of the user\’s authorization',
    })
    @ApiConflictResponse({ description: 'Failed to check the validity of the user\’s authorization' })
    @Get('/check')
    @ApiAuth()
    @ApiBearerAuth()
    // @UseGuards(JwtAuthGuard)
    @HttpCode(200)
    async check(@Headers() { authorization }) {
        let jwtToken = await this.authService.checkAuthentication(authorization);
        let now = Math.floor(Date.now() / 1000);
        return (jwtToken.exp > now);

    }

    // --- delete authentication ---
    @ApiOperation({
        summary: 'AKA "user logout" or "user disconnection".',
        description:
            `Remove the requesting user\'s authorization to use the backend application.\n\
			 This is done by deleting the user\'s UAL entry. \n\
			 Any further attempt to use services in the backend,` +
            ` even with a valid token, will be rejected with a "User not connected" exception.`,
    })
    @ApiOkResponse({
        description: 'The user is no more authenticated by any token.',
    })
    @ApiConflictResponse({ description: 'Cannot disconnect the user' })
    @Post('/logout')
    @ApiAuth()
    @ApiBearerAuth()


    // @UseGuards(JwtAuthGuard)
    @HttpCode(200)
    async logout(@Headers() { authorization }) {
        return await this.authService.deleteAuthentication(authorization);
    }
    // --- revoke authentication ---
    @ApiOperation({
        summary: 'AKA "forced logout" or "forced disconnection".',
        description:
            `Remove the requesting user\'s authorization to use the backend application.\n\
			 This is done by deleting the user\'s UAL entry. \n\
			 Any further attempt to use services in the backend,` +
            ` even with a valid token, will be rejected with a "User not connected" exception.`,
    })
    @ApiOkResponse({ description: 'the user was successfully disconnected' })
    @ApiNotFoundResponse({
        description: 'The userId does not identify an existing user',
    })
    @ApiBadRequestResponse({ description: 'Missing userId' })
    @ApiForbiddenResponse({ description: 'Not allowed to disconnect a user' })
    @Put('/forcedLogout')
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([{ action: DELETE_ACTION, resource: AUTH }])
    async revoke(@Body() userId: AuthRevokeDto) {
        return await this.authService.revokeAuthentication(userId);
    }

    // --- get all connected users ---
    @ApiOperation({
        summary:
            'Returns a list with information on all currently connected users.',
        description:
            'connectionInformation:\n\
				* user ID\n\
				* user login name\n\
				* login timestamp: human readable UTC timestamp string.',
    })
    @ApiOkResponse({
        description:
            'The list with the information on all currently connected users.',
        type: AuthListDto,
        isArray: true
    })
    @ApiConflictResponse({
        description: 'Cannot get the connected user information list',
    })
    @ApiForbiddenResponse({
        description: 'Not allowed to list connected users',
    })
    @Get('/allConnectedUsers')
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([{ action: READ_ACTION, resource: AUTH }])
    async listAllConnectedUsers() {
        return await this.authService.getAuthorizedUsersList();
    }

    // --- Reset password request ---
    @ApiOperation({
        summary: 'Request a password reset for a registered user',
        description: `1st step in the password reset procedure.\n\
			 Sends password reset instructions to the provided email address if at least one active \n\
			 registered user has that email address. \n\
			The email contains a URI with a random token that allows to continue the password reset \n\
			process in two more steps (see GET /auth/resetPassword, POST /auth/resetPassword)`,
    })
    @ApiOkResponse({
        description:
            'Return true if the password reset request was accepted, false otherwise.',
    })
    @ApiResponse({
        status: 500,
        description: 'Failed to send the email',
    })
    @ApiBadRequestResponse({ description: 'Badly formed request body.' })
    @Post('/requestResetPassword')
    async requestResetPassword(
        @Body() payload: PasswordRequestResetDto,
        @Headers('origin') source,
    ) {
        return await this.authService.requestResetPassword({
            source,
            ...payload,
        });
        // return await this.client.send(pattern.REQUEST_RESET_PASSWORD, {
        // 	...payload,
        // 	source,
        // });
    }

    // --- Reset password ---
    @ApiOperation({
        summary:
            'Check the validity of the token issued by a previous password reset request',
        description: `2nd (optional) step in the password reset procedure: \n\
			If the password reset token issued by POST /auth/passwordResetRequest is valid,\n\
			return the following information about the concerned user account: \n\
			{ login, firstName, name, email }.\n\
			If the token is invalid, return false.
			The actual reset is done in a last step by POST /auth/resetPassword`,
    })
    @ApiOkResponse({
        description: `Return some of the concerned user account’s details if the token is valid. \n\
				 Return false if the token is invalid`,
    })
    @Get('/resetPassword/:token')
    async resetPassword(@Param() token: PasswordResetDto) {
        return await this.authService.checkResetPassword(token);
    }

    @ApiOperation({
        summary: 'Reset a user’s password following a password reset request',
        description: `3rd and last step in the password reset procedure: \n\
			If the password reset token issued by a previous POST /auth/passwordResetRequest is valid,\n\
			set the password of the concerned user account to the new password and invalidate the token. \n\
			If the token is invalid, return false.`,
    })
    @ApiOkResponse({
        description: `Return true if the token was valid and the password of the concerned user\n\
			 account has been reset. \n\
			 Return false if the token was invalid`,
    })
    @ApiBadRequestResponse({
        description: 'Badly formed request body. ',
    })
    @Post('/resetPassword')
    @HttpCode(200)
    async resetPasswordConfirmation(
        @Body() payload: PasswordResetConfirmationDto,
    ) {
        return await this.authService.resetPassword(payload);
    }
}
