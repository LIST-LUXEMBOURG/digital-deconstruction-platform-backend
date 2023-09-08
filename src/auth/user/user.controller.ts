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
    Post,
    Put,
    Query,
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
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
    ApiAccessControl,
    ApiAccessGuard,
    ApiAuth,
    ApiAuthGuard,
    CREATE_ACTION,
    READ_ACTION,
    UPDATE_ACTION,
} from '../../FWAjs-utils';
import {
    ACTIVE_USER,
    OWN_USER,
    USER,
} from './accessControl/resourcesName.constants';
import {
    PasswordChangeDto,
    RegistrationConfirmDto,
    RegistrationRequestDto,
    UserBlockDto,
    UserCreateDto,
    UserGetToRegisterByTokenDto,
    UsersFilterDto,
    UsersGetAllDto,
    UserUpdateDto,
} from './dto';
import { User } from './entities/user.entity';
import { UserService } from './user.service';

@ApiTags('Authentication - Users')
@Controller('users')
@UseGuards(ApiAuthGuard, ApiAccessGuard)
export class UserController {
    constructor(private readonly userService: UserService) { }

    // --- Create an user ---
    @ApiOperation({
        summary: 'Create a new user.',
        description:
            `If an ID is provided, it is simply ignored.\n\
				If other attributes than the CreateUserDto model are provided, ignore them also.\n\
				Returns the newly created user with attributes,` +
            ` including a new generated ID but not the password.`,
    })
    @ApiCreatedResponse({
        description: 'The user has been successfully created',
    })
    @ApiConflictResponse({
        description:
            'The **login** name is already used by another user.\n\
				The user could not be created, whatever the reason',
    })
    @ApiBadRequestResponse({
        description:
            'The **login** is missing from the payload.\n\
				The **password** is missing from the payload.\n\
				The **name** is missing from the payload.\n\
				The **firstName** is missing from the payload.',
    })
    @ApiForbiddenResponse({
        description: 'Not allowed to create a new user',
    })
    @Post()
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([{ action: CREATE_ACTION, resource: USER }])
    async createUser(
        @Headers() { authorization },
        @Body() createUserDto: UserCreateDto,
    ): Promise<User> {
        return await this.userService.create({
            token: authorization,
            ...createUserDto,
        });
    }

    // --- Update an user ---
    @ApiOperation({
        summary: 'Modify all attributes of the user identified by the userId.',
        description:
            'Only the filled attributes will be taken into account, all others are ignored.\n\
			Return the modified user object.',
    })
    @ApiOkResponse({ description: 'The user has been successfully updated' })
    @ApiConflictResponse({
        description:
            'The **login** provided in the payload is not unique among all user logins.',
    })
    @ApiBadRequestResponse({
        description: 'The **user ID** is missing in the payload.',
    })
    @ApiForbiddenResponse({
        description: 'Not allowed to update a user',
    })
    @Put()
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: UPDATE_ACTION, resource: USER },
        { action: UPDATE_ACTION, resource: OWN_USER },
    ])
    async updateUser(
        @Headers() { authorization },
        @Body() updateUserDto: UserUpdateDto,
    ): Promise<User> {
        return await this.userService.update({
            token: authorization,
            ...updateUserDto,
        });
    }

    // --- Get all users ---
    @ApiOperation({
        summary: 'Return the list of users that match the queryObject.',
        description:
            `The queryObject is an object with user attributes` +
            ` and values to match actual attribute values.<br><br>\
				Wildcard characters ‘*’ can be used for matching any string type attribute.\n\
				Matches of different attributes are logically connected with AND.<br><br>\
				**Login** name and **password** attributes are never included in the returned user records.\n\
				If queried explicitly in the queryObject, they are simply ignored.<br><br>\n\
				Return an empty list if no matching user was found.\n\
				Return all users if no query object was provided.`,
    })
    @ApiForbiddenResponse({
        description: 'Not allowed to list users',
    })
    @Get('/list')
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: USER },
        { action: READ_ACTION, resource: ACTIVE_USER },
        { action: READ_ACTION, resource: OWN_USER },
    ])
    async getAllUsers(
        @Headers() { authorization },
        @Query() query: UsersGetAllDto,
    ): Promise<User[]> {
        return await this.userService.getAll({
            token: authorization,
            ...query,
        });
    }

    // --- get  current user ---
    @ApiOperation({
        summary: 'Get the current User',
        description:
            'Returns the user object that corresponds to the authorization \
				token that is passed along the request.',
    })
    @ApiOkResponse({ description: 'The information of the current user.' })
    @ApiForbiddenResponse({ description: 'Not allowed to list users' })
    @Get('/currentUser')
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: USER },
        { action: READ_ACTION, resource: ACTIVE_USER },
        { action: READ_ACTION, resource: OWN_USER },
    ])
    async currentUser(@Headers() { authorization }): Promise<User> {
        return await this.userService.getCurrentUser(authorization);
    }

    // --- Block an user ---
    @ApiOperation({
        summary: 'Block the user identified by the userId.',
        description:
            'Only the filled attributes will be taken into account, all others are ignored.\n\
			Return the blocked user object.',
    })
    @ApiOkResponse({ description: 'The user has been successfully blocked' })
    @ApiForbiddenResponse({
        description: 'Cannot block other users',
    })
    @ApiNotFoundResponse({
        description: 'User not found',
    })
    @ApiUnauthorizedResponse({
        description: 'User blocked',
    })
    @Put('/block')
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([{ action: UPDATE_ACTION, resource: USER }])
    async blockUser(
        @Headers() { authorization },
        @Body() blockeUserDto: UserBlockDto,
    ): Promise<User> {
        return await this.userService.block({
            token: authorization,
            ...blockeUserDto,
        });
    }

    // --- Generate password & salt ---
    // @ApiOperation({ title: 'Return a hashed password with the associated salt', deprecated: true })
    // @Get('generatePasswordSalt')
    // async generatePasswordWithSalt(@Query() dto: GeneratePassSaltDto) {
    // 	return await this.userService.();
    // }

    @ApiOperation({
        summary: 'Filter the list of all users',
        description:
            'Return the filtered list of users based on the filter param',
    })
    @ApiOkResponse({ description: 'The users filtered list.' })
    @ApiForbiddenResponse({ description: 'Not allowed to filter users' })
    @Get('/filter')
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([
        { action: READ_ACTION, resource: USER },
        { action: READ_ACTION, resource: ACTIVE_USER },
        { action: READ_ACTION, resource: OWN_USER },
    ])
    async filterUsers(
        @Headers() { authorization },
        @Query() dto: UsersFilterDto,
    ): Promise<User[]> {
        return await this.userService.filterUsers({
            token: authorization,
            ...dto,
        });
    }

    @ApiOperation({
        summary: 'User changes own password',
        description:
            'The user with the rights privileges can change his/her password.',
    })
    @ApiOkResponse({ description: 'Your password was successfully updated.' })
    @ApiForbiddenResponse({
        description:
            'Not allowed to update own user.\nNot allowed to update your password.',
    })
    @ApiBadRequestResponse({
        description:
            'The **currentPassword** is missing in the payload.\n\
				The **newPassword** is missing in the payload.\n\
				The **currentPassword** is wrong.',
    })
    @Post('/changePassword')
    @ApiAuth()
    @ApiBearerAuth()
    @HttpCode(200)
    @ApiAccessControl([{ action: UPDATE_ACTION, resource: OWN_USER }])
    async changeOwnPassword(
        @Headers() { authorization },
        @Body() dto: PasswordChangeDto,
    ): Promise<boolean> {
        return await this.userService.changeOwnPassword({
            token: authorization,
            ...dto,
        });
    }

    @ApiOperation({
        summary: 'Request a new user account registration',
        description: `1st step in the user self-registration procedure. \n\
			When given minimal user registration information { login, firstName, name, email } it sends \n\
			further registration instructions to the provided email address and returns true, provided \n\
			that there is no other active user with the same email,\n\
			and no other user (active or not) with the same login. Otherwise it returns false.\n\
			The email contains a URI with a random token that allows to continue \n\
			the user self-registration process in two more steps \n\
			(see GET /user/registration/, POST /user/registration)” `,
    })
    @ApiOkResponse({
        description: `Return true if the user registration request was accepted, false otherwise.`,
    })
    @ApiBadRequestResponse({
        description: 'Badly formed request body. ',
    })
    @Post('/requestRegistration')
    async requestSelfRegistration(
        @Body() dto: RegistrationRequestDto,
        @Headers('origin') source,
    ): Promise<boolean> {
        return await this.userService.requestSelfRegistration(
            Object.assign({}, dto, { source }),
        );
    }

    @ApiOperation({
        summary:
            'Check the validity of the token issued by a previous user self-registration request',
        description: `2nd (optional) step in the user self-registration procedure.\n\
			If the user registration token issued by POST /user/requestRegistration is valid,return the \n\
			following information about the concerned user account: { login, firstName, name, email }. \n\
			If the token ins invalid, return false. \n\
			The actual user registration is done in the last step by POST /user/registration `,
    })
    @ApiOkResponse({
        description: `Return some of the concerned user account’s details if the token is valid.
			 			  Return false if the token is invalid. `,
    })
    @Get('/registration')
    async getUserToRegisterByToken(
        @Query() dto: UserGetToRegisterByTokenDto,
    ): Promise<any> {
        return await this.userService.getUserToRegisterByToken(dto);
    }

    @ApiOperation({
        summary:
            'Register a new user following a user self-registration request',
        description: `3rd and last step in the user self-registration procedure.\n\
			If the user registration token is valid, create a new active, unblocked user account\
			using the information provided with the previous POST /user/requestRegistration,\
			and the password provided with this request. \n\
			Invalidate the token. \n\
			If the token was already invalid, return false.`,
    })
    @ApiOkResponse({
        description: `Return true if the token was valid and a new user account has been created.
			Return false if the token was invalid.`,
    })
    @ApiBadRequestResponse({
        description: `Badly formed request body.`,
    })
    @Post('/registration')
    async confirmSelfRegistration(
        @Body() dto: RegistrationConfirmDto,
    ): Promise<boolean> {
        return await this.userService.confirmSelfRegistration(dto);
    }
}
