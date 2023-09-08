/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import {
    CacheStore,
    CACHE_MANAGER,
    forwardRef,
    HttpException,
    HttpStatus,
    Inject,
    Injectable
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { Timeout } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import {
    compact,
    concat,
    filter as filterBy,
    find,
    forEach,
    includes,
    isEqual,
    isNil,
    remove,
    uniq,
    uniqBy
} from 'lodash';
import { createTransport, SendMailOptions } from 'nodemailer';
import * as shortid from 'shortid';
import { AuthService } from '../auth/auth.service';
import { shortidTTL } from '../../config/cache.config';
import {
    CREATE_ACTION,
    dispatchACDBs,
    FwaException,
    READ_ACTION,
    UPDATE_ACTION
} from '../../FWAjs-utils';
import { ApiAccessControlService } from '../../FWAjs-utils/accessControl/accessControl.service';
import { In, Like, Repository } from 'typeorm';
import { gzipSync } from 'zlib';
import mailerConfig from '../../config/mailer.conf';
import { RoleGetDto } from '../role/dto';
import { RoleService } from '../role/role.service';
import {
    ACTIVE_USER,
    OWN_USER,
    USER
} from './accessControl/resourcesName.constants';
import {
    CANNOT_BLOCK_USER,
    CANNOT_CREATE_USER,
    CANNOT_GET_USER_TO_REGISTER_BY_TOKEN,
    CANNOT_LIST_USERS,
    CANNOT_SEND_EMAIL,
    CANNOT_UPDATE_USER,
    CURRENT_PASSWORD_WRONG,
    FAILED_TO_GET_CURRENT_USER,
    MISSING_ATTRIBUTE,
    MISSING_USER_ID,
    MORE_THAN_ONE_USER_FOUND,
    NOT_ALLOWED,
    USERS_NOT_FOUND,
    USER_LOGIN_ALREADY_USED,
    USER_NOT_FOUND
} from './constants';
import {
    PasswordChangeDto,
    PasswordResetDto,
    RegistrationConfirmDto,
    SelfRegistrationRequestDto,
    UserBlockDto,
    UserCreateDto,
    UserCreateWithoutAuthDto,
    UserGetToRegisterByTokenDto,
    UsersFilterDto,
    UsersFindDto,
    UsersGetAllDto,
    UsersGetByIdsDto,
    UserUpdateDto
} from './dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
    constructor(
        @Inject(CACHE_MANAGER) private readonly cacheManager: CacheStore,
        @InjectRepository(User) private readonly usersRepo: Repository<User>,
        @Inject(forwardRef(() => AuthService))
        private readonly authService: AuthService,
        @Inject(forwardRef(() => RoleService))
        private readonly roleService: RoleService,
        private jwtService: JwtService,
        private accessControlService: ApiAccessControlService,
        private readonly eventEmitter: EventEmitter2,
    ) {
        this.genAdminUser();
    }

    @Timeout(2000)
    async sendACDB(): Promise<void> {
        dispatchACDBs(
            this,
            (await import('./accessControl/accessControl.database')).default,
        );
    }

    /**
     * Creates a new user, with a uniq login within the application, in the database.
     *
     * The `createDto` is sanitized according to the current user's roles in create mode.
     *
     * If the login is not uniq, then throws a CONFLICT Exception.
     *
     * @param createDto
     * @returns The newly created user.
     * @throws {ConflictException} The login name is already used by an other user
     * @throws {GenericException} Cannot create the user
     */
    async create(createDto: UserCreateDto): Promise<User> {
        try {
            const { token } = createDto;
            delete createDto.token;
            const tokenPayload = this.jwtService.verify(token);

            const sanitizedCreateDto = this.sanitizeUserOnCreate(
                createDto,
                tokenPayload,
            );
            let userEntity;

            if (!!sanitizedCreateDto.password) {
                // generate the unique user salt
                const salt = Buffer.from(this.genRandomString(16));

                /**
                 * argon2 options
                 * @param type the type of encryption algorithm used by argon2
                 * @param salt the user salt
                 * @param raw the result of the encryption as a string or a buffer
                 */
                const argonOptions = new Object({
                    type: argon2.argon2i,
                    salt,
                    raw: true,
                });

                // the hashed password
                const hash = await argon2.hash(
                    sanitizedCreateDto.password,
                    argonOptions,
                );

                // convert the buffer to string (database constraint - base 64)
                const password = gzipSync(hash).toString('base64');

                // prepare the user object to save in the database
                userEntity = Object.assign(new User(), sanitizedCreateDto, {
                    salt,
                    password,
                });
            } else {
                userEntity = Object.assign(new User(), sanitizedCreateDto);
            }

            // save the user object
            const user = await this.usersRepo.save(userEntity);

            // Assigning the guest role by default to newly created user
            const guestRole = await this.roleService.getOne({
                token,
                name: 'Everyone',
            } as RoleGetDto);
            await this.roleService.assignRole({
                token,
                roleId: guestRole.id,
                userId: user.id,
            });

            // return the user object without sensitive data
            return this.sanitizeResponse(
                await this.usersRepo.findOne(user.id),
                tokenPayload,
            );
        } catch (e) {
            console.error(e);
            if (e instanceof HttpException || e instanceof RpcException)
                throw e;
            // TODO: Perform a check in the code instead of catching an error
            if (e.code === 'ER_DUP_ENTRY')
                throw FwaException({
                    code: HttpStatus.CONFLICT,
                    message: 'The login name is already used by an other user',
                    messageCode: USER_LOGIN_ALREADY_USED,
                    messageData: { userPayload: createDto },
                });

            throw FwaException({
                message: 'Cannot create the user',
                messageCode: CANNOT_CREATE_USER,
            });
        }
    }

    async createWithoutAuth(createDto: UserCreateWithoutAuthDto): Promise<any> {
        try {
            let userEntity;

            if (!!createDto.password) {
                // generate the unique user salt
                const salt = Buffer.from(this.genRandomString(16));

                /**
                 * argon2 options
                 * @param type the type of encryption algorithm used by argon2
                 * @param salt the user salt
                 * @param raw the result of the encryption as a string or a buffer
                 */
                const argonOptions = new Object({
                    type: argon2.argon2i,
                    salt,
                    raw: true,
                });

                // the hashed password
                const hash = await argon2.hash(
                    createDto.password,
                    argonOptions,
                );

                // convert the buffer to string (database constraint - base 64)
                const password = gzipSync(hash).toString('base64');

                // prepare the user object to save in the database
                userEntity = Object.assign({}, createDto, {
                    salt,
                    password,
                });
            } else {
                userEntity = Object.assign({}, createDto);
            }

            delete userEntity.source;
            userEntity.id = undefined;

            // save the user object
            const user = await this.usersRepo.save(userEntity);

            // Assigning the guest role by default to newly created user
            const basicUserRole = await this.roleService.getOneForAuth({
                name: 'BasicUser',
            } as RoleGetDto);
            await this.roleService.assignRoleWithoutAuth({
                roleId: basicUserRole.id,
                userId: user.id,
            });

            const createdUser = await this.usersRepo.findOne(user.id);

            // return the user object without sensitive data
            // return this.sanitizeResponse(
            //     await this.usersRepo.findOne(user.id),
            //     tokenPayload,
            // );
            return {
                firstName: createdUser.firstName,
                name: createdUser.name,
                login: createdUser.login,
                email: createdUser.email
            };
        } catch (e) {
            console.error(e);
            if (e instanceof HttpException || e instanceof RpcException)
                throw e;
            // TODO: Perform a check in the code instead of catching an error
            if (e.code === 'ER_DUP_ENTRY')
                throw FwaException({
                    code: HttpStatus.CONFLICT,
                    message: 'The login name is already used by an other user',
                    messageCode: USER_LOGIN_ALREADY_USED,
                    messageData: { userPayload: createDto },
                });

            throw FwaException({
                message: 'Cannot create the user',
                messageCode: CANNOT_CREATE_USER,
            });
        }
    }

    /**
     * Updates a user with the provided information in the `userAttrs` param in the database.
     *
     * The `userAttrs` is sanitized according to the current user's roles in update mode.
     *
     * If the login is not uniq, then throws a CONFLICT Exception.
     *
     * @param userAttrs
     * @returns The freshly updated user.
     * @throws {BadRequestException} The user ID is missing in the payload
     * @throws {NotFoundException} The provided ID matches none of the users
     * @throws {ConflictException} The login provided in the payload is not unique among all user logins
     * @throws {GenericException} Cannot update user
     */
    async update(userAttrs: UserUpdateDto): Promise<User> {
        const { token } = userAttrs;
        const tokenPayload = await this.jwtService.verifyAsync(token);
        delete userAttrs.token;
        const userId = tokenPayload.user.id;
        if (!userAttrs.id)
            throw FwaException({
                code: HttpStatus.BAD_REQUEST,
                message: 'The user ID is missing in the payload',
                messageCode: MISSING_USER_ID,
            });

        try {
            const userToUpdate = await this.usersRepo.findOne({
                id: userAttrs.id,
            });

            if (!userToUpdate)
                throw FwaException({
                    code: HttpStatus.NOT_FOUND,
                    message: 'The provided ID matches none of the users',
                    messageCode: 'userIdNotFound',
                    messageData: { id: userAttrs.id },
                });

            let user = new User();
            Object.assign(user, userAttrs);

            const sanitizedUserPayload = this.sanitizeUserOnUpdate(
                user,
                tokenPayload,
            );

            if ('password' in sanitizedUserPayload) {
                // argon options
                const argonOptions = new Object({
                    type: argon2.argon2i,
                    salt: Buffer.from(userToUpdate.salt),
                    raw: true,
                });

                const hash = await argon2.hash(
                    sanitizedUserPayload.password,
                    argonOptions,
                );
                const password = gzipSync(hash).toString('base64');
                Object.assign(sanitizedUserPayload, { password });
            }

            if (!isEqual(sanitizedUserPayload, {}))
                await this.usersRepo.update(
                    { id: userAttrs.id },
                    sanitizedUserPayload,
                );

            return this.sanitizeResponse(
                await this.usersRepo.findOne({ id: userAttrs.id }),
                tokenPayload,
            );
        } catch (e) {
            console.error(e);
            if (e instanceof HttpException || e instanceof RpcException)
                throw e;

            if (e.code === 'ER_DUP_ENTRY')
                throw FwaException({
                    code: HttpStatus.CONFLICT,
                    message:
                        'The login provided in the payload is not unique among all user logins.',
                    messageCode: USER_LOGIN_ALREADY_USED,
                    messageData: { userAttrs },
                });

            throw FwaException({
                message: 'Cannot update user',
                messageCode: CANNOT_UPDATE_USER,
            });
        }
    }

    /**
     * Returns the list of all users in the database according to the `baseQuery` in param.
     *
     * The `baseQuery` is sanitized according to the current user's roles in read mode.
     *
     * @param baseQuery
     * @returns The list of all users that matche the query.
     * @throws {GenericException} Cannot list the users
     */
    async getAll(baseQuery: UsersGetAllDto): Promise<User[]> {
        const { ...rawUsersFindDto } = baseQuery;

        try {
            const tokenPayload = await this.jwtService.verifyAsync(
                rawUsersFindDto.token,
            );
            delete rawUsersFindDto.token;

            // Getting permissions for each type of user for the read action
            const permissions = this.accessControlService.getGrantedPermissions(
                tokenPayload.user.roles,
                [
                    { action: READ_ACTION, resource: USER },
                    { action: READ_ACTION, resource: ACTIVE_USER },
                    { action: READ_ACTION, resource: OWN_USER },
                ],
            );

            const allowedUserAttributes =
                find(permissions, { resource: USER }).attributes || [];
            const usersQuery = this.filterObj(
                allowedUserAttributes,
                rawUsersFindDto,
            );

            // Sanitizing the usersQuery based on the allowed attributes for USER resource
            Object.keys(usersQuery).forEach((key) => {
                if (typeof usersQuery[key] !== 'string')
                    Object.assign(usersQuery, { [key]: usersQuery[key] });
                else if (usersQuery[key] === 'null')
                    Object.assign(usersQuery, { [key]: null });
                else {
                    const hasLike = usersQuery[key].match(/\*/);
                    if (hasLike !== null && hasLike.length > 0)
                        Object.assign(usersQuery, {
                            [key]: Like(usersQuery[key].replace(/\*/g, '%')),
                        });
                    else Object.assign(usersQuery, { [key]: usersQuery[key] });
                }
            });

            const allowedActiveUserAttributes =
                find(permissions, { resource: ACTIVE_USER }).attributes || [];
            const activeUsersQuery = this.filterObj(
                allowedActiveUserAttributes,
                rawUsersFindDto,
            );

            // Sanitizing the activeUsersQuery based on the allowed attributes for ACTIVE_USER resource
            Object.keys(activeUsersQuery).forEach((key) => {
                if (typeof activeUsersQuery[key] !== 'string')
                    Object.assign(activeUsersQuery, {
                        [key]: activeUsersQuery[key],
                    });
                else if (activeUsersQuery[key] === 'null')
                    Object.assign(activeUsersQuery, { [key]: null });
                else {
                    const hasLike = activeUsersQuery[key].match(/\*/);
                    if (hasLike !== null && hasLike.length > 0)
                        Object.assign(activeUsersQuery, {
                            [key]: Like(
                                activeUsersQuery[key].replace(/\*/g, '%'),
                            ),
                        });
                    else
                        Object.assign(activeUsersQuery, {
                            [key]: activeUsersQuery[key],
                        });
                }
            });

            const allowedOwnUserAttributes =
                find(permissions, { resource: OWN_USER }).attributes || [];
            const ownUsersQuery = this.filterObj(
                allowedOwnUserAttributes,
                rawUsersFindDto,
            );

            // Sanitizing the ownUsersQuery based on the allowed attributes for OWN_USER resource
            Object.keys(ownUsersQuery).forEach((key) => {
                if (typeof ownUsersQuery[key] !== 'string')
                    Object.assign(ownUsersQuery, { [key]: ownUsersQuery[key] });
                else if (ownUsersQuery[key] === 'null')
                    Object.assign(ownUsersQuery, { [key]: null });
                else {
                    const hasLike = ownUsersQuery[key].match(/\*/);
                    if (hasLike !== null && hasLike.length > 0)
                        Object.assign(ownUsersQuery, {
                            [key]: Like(ownUsersQuery[key].replace(/\*/g, '%')),
                        });
                    else
                        Object.assign(ownUsersQuery, {
                            [key]: ownUsersQuery[key],
                        });
                }
            });

            let allUsers: User[] = [];

            // If the current user has the right to read USER resources
            if (allowedUserAttributes.length !== 0) {
                // Get them from the DB and add them to the allUsers array
                allUsers = concat(
                    allUsers,
                    await this.usersRepo.find({
                        where: usersQuery,
                    }),
                );
            }

            // If the current user has the right to read ACTIVE_USER resources
            if (allowedActiveUserAttributes.length !== 0) {
                // Get them from the DB and add them to the allUsers array
                allUsers = concat(
                    allUsers,
                    await this.usersRepo.find({
                        where: {
                            active: true,
                            ...activeUsersQuery,
                        },
                    }),
                );
            }

            // If the current user has the right to read OWN_USER resource
            if (allowedOwnUserAttributes.length !== 0) {
                // Get it from the DB and add it to the allUsers array
                allUsers = concat(
                    allUsers,
                    await this.usersRepo.find({
                        where: {
                            id: tokenPayload.user.id,
                            ...ownUsersQuery,
                        },
                    }),
                );
            }

            // Make the users array unique by id to avoid duplicate
            allUsers = uniqBy(allUsers, 'id');

            return this.sanitizeResponse(allUsers, tokenPayload);
        } catch (e) {
            console.error(e);
            if (e instanceof HttpException || e instanceof RpcException)
                throw e;

            throw FwaException({
                message: 'Cannot list the users',
                messageCode: CANNOT_LIST_USERS,
            });
        }
    }

    /**
     * Returns the first user that matches the `query` in the database.
     *
     * > Note: This function is only used to authenticate a user when he/she logs in the system and then doesn't require an authentication token.
     * @param query
     * @returns The first user that matches the `query`
     * @throws {GenericException} Cannot find the requested user for authentication
     */
    async getOneForAuth(query: UsersFindDto): Promise<User> {
        try {
            return await this.usersRepo.findOneOrFail(query);
        } catch (e) {
            throw FwaException({
                code: HttpStatus.NOT_FOUND,
                message: 'Cannot find the requested user for authentication',
                messageCode: USERS_NOT_FOUND,
                messageData: query,
            });
        }
    }

    /**
     * Returns the user that matches the `rawQuery` in the database.
     *
     * The `rawQuery` is sanitized according to the current user's roles in read mode.
     *
     * @param rawQuery
     * @returns The user that matches the `rawQuery`
     * @throws {NotFoundException} More than one user were found with the provided query
     * @throws {NotFoundException} Cannot find the requested user
     * @throws {GenericException} Cannot find the requested user
     */
    async getOne(rawQuery: UsersFindDto): Promise<User> {
        try {
            const { token } = rawQuery;
            delete rawQuery.token;
            const tokenPayload = this.jwtService.verify(token);

            // Getting permissions for each type of user for the read action
            const permissions = this.accessControlService.getGrantedPermissions(
                tokenPayload.user.roles,
                [
                    { action: READ_ACTION, resource: USER },
                    { action: READ_ACTION, resource: ACTIVE_USER },
                    { action: READ_ACTION, resource: OWN_USER },
                ],
            );

            const allowedUserAttributes =
                find(permissions, { resource: USER }).attributes || [];
            const allowedActiveUserAttributes =
                find(permissions, { resource: ACTIVE_USER }).attributes || [];
            const allowedOwnUserAttributes =
                find(permissions, { resource: OWN_USER }).attributes || [];

            let foundUser: User[] = [];

            if (allowedUserAttributes.length !== 0) {
                const userQuery = this.filterObj(
                    allowedUserAttributes,
                    rawQuery,
                );
                foundUser = concat(
                    foundUser,
                    await this.usersRepo.findOne(userQuery),
                );
            }

            if (allowedActiveUserAttributes.length !== 0) {
                const activeUserQuery = this.filterObj(
                    allowedActiveUserAttributes,
                    rawQuery,
                );
                foundUser = concat(
                    foundUser,
                    await this.usersRepo.findOne({
                        active: true,
                        ...activeUserQuery,
                    }),
                );
            }

            if (allowedOwnUserAttributes.length !== 0) {
                const ownUserQuery = this.filterObj(
                    allowedOwnUserAttributes,
                    rawQuery,
                );
                foundUser = concat(
                    foundUser,
                    await this.usersRepo.findOne({
                        id: tokenPayload.user.id,
                        ...ownUserQuery,
                    }),
                );
            }

            foundUser = uniqBy(compact(foundUser), 'id');

            if (foundUser.length > 1) {
                throw FwaException({
                    code: HttpStatus.NOT_FOUND,
                    message:
                        'More than one user were found with the provided query',
                    messageCode: MORE_THAN_ONE_USER_FOUND,
                    messageData: rawQuery,
                });
            }

            if (foundUser.length === 0) {
                throw FwaException({
                    code: HttpStatus.NOT_FOUND,
                    message: 'Cannot find the requested user',
                    messageCode: USER_NOT_FOUND,
                    messageData: rawQuery,
                });
            }

            return this.sanitizeResponse(foundUser[0], tokenPayload);
        } catch (e) {
            console.error(e);

            if (e instanceof HttpException || e instanceof RpcException)
                throw e;

            throw FwaException({
                message: 'Cannot find the requested user',
                messageCode: USER_NOT_FOUND,
                messageData: { rawQuery },
            });
        }
    }

    /**
     * Returns the list of users identified by the `userIds` in the `query`.
     *
     * @param query
     * @returns The list of users who's id is in the `userIds` list.
     * @throws {GenericException} Cannot find the requested users
     */
    async getByIds(query: UsersGetByIdsDto): Promise<User[]> {
        const { userIds, token } = query;
        delete query.token;
        const tokenPayload = await this.jwtService.verifyAsync(token);

        try {
            // Getting permissions for each type of user for the read action
            const permissions = this.accessControlService.getGrantedPermissions(
                tokenPayload.user.roles,
                [
                    { action: READ_ACTION, resource: USER },
                    { action: READ_ACTION, resource: ACTIVE_USER },
                    { action: READ_ACTION, resource: OWN_USER },
                ],
            );

            const allowedUserAttributes =
                find(permissions, { resource: USER }).attributes || [];
            const allowedActiveUserAttributes =
                find(permissions, { resource: ACTIVE_USER }).attributes || [];
            const allowedOwnUserAttributes =
                find(permissions, { resource: OWN_USER }).attributes || [];

            let foundUser: User[] = [];

            if (allowedUserAttributes.length !== 0) {
                foundUser = concat(
                    foundUser,
                    await this.usersRepo.find({ id: In(userIds) }),
                );
            }

            if (allowedActiveUserAttributes.length !== 0) {
                foundUser = concat(
                    foundUser,
                    await this.usersRepo.find({
                        id: In(userIds),
                        active: true,
                    }),
                );
            }

            if (
                allowedOwnUserAttributes.length !== 0 &&
                userIds.length === 1 &&
                userIds.includes(tokenPayload.user.id)
            ) {
                foundUser = concat(
                    foundUser,
                    await this.usersRepo.find({
                        id: tokenPayload.user.id,
                    }),
                );
            }

            return this.sanitizeResponse(uniqBy(foundUser, 'id'), tokenPayload);
        } catch (e) {
            if (e instanceof HttpException || e instanceof RpcException)
                throw e;

            throw FwaException({
                code: HttpStatus.NOT_FOUND,
                message: 'Cannot find the requested users',
                messageCode: USER_NOT_FOUND,
                messageData: { userIds },
            });
        }
    }

    /**
     * Blocks the user identified by the `userId` in `userAttrs` and assign it the `blockingReason` in the `userAttrs` if there is any.
     *
     * @param userAttrs
     * @returns The blocked user.
     * @throws {BadRequestException} The user ID is missing in the payload
     * @throws {NotFoundException} User not found
     * @throws {GenericException} Cannot block user
     */
    async block(userAttrs: UserBlockDto): Promise<User> {
        const { userId, blockingReason, token } = userAttrs;
        delete userAttrs.token;

        if (!userId)
            throw FwaException({
                code: HttpStatus.BAD_REQUEST,
                message: 'The user ID is missing in the payload',
                messageCode: MISSING_USER_ID,
            });

        try {
            const userToBlock = await this.getOne({
                token,
                id: userId,
            } as UsersFindDto);

            if (!userToBlock)
                throw FwaException({
                    code: HttpStatus.NOT_FOUND,
                    message: 'User not found',
                    messageCode: USER_NOT_FOUND,
                    messageData: { userId },
                });

            let reason;
            !isNil(blockingReason) && blockingReason !== 'string'
                ? (reason = blockingReason)
                : (reason = 'blocked by user administrator');

            Object.assign(userToBlock, {
                blocked: true,
                blockingReason: reason,
            });

            await this.authService.revokeAuthentication({ userId });

            const tokenPayload = this.jwtService.verify(token);

            return this.sanitizeResponse(
                await this.update({ token, ...userToBlock } as UserUpdateDto),
                tokenPayload,
            );
        } catch (e) {
            console.error(e);
            if (e instanceof HttpException || e instanceof RpcException)
                throw e;

            throw FwaException({
                message: 'Cannot block user',
                messageCode: CANNOT_BLOCK_USER,
            });
        }
    }

    /**
     * Returns the user's information about the user identified by the provided `token`.
     *
     * @param token
     * @returns The current user's information
     * @throws {GenericException} Failed to get the current user
     */
    async getCurrentUser(token: string): Promise<User> {
        try {
            const tokenPayload = await this.jwtService.verify(token);

            return this.sanitizeResponse(
                await this.getOne({
                    token,
                    id: tokenPayload.user.id,
                } as UsersFindDto),
                tokenPayload,
            );
        } catch (error) {
            console.error(error);

            // Specific error
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            // Generic error
            throw FwaException({
                message: 'Failed to get the current user',
                messageCode: FAILED_TO_GET_CURRENT_USER,
            });
        }
    }

    /**
     * Check if all words in the `filter` are found in the `user`'s `allowedAttributes` value.
     *
     * If so, returns true.
     *
     * Else return false.
     *
     * @param user
     * @param allowedAttributes
     * @param filter
     * @returns true | false
     */
    private filterOnAttributes(
        user: User,
        allowedAttributes: string[],
        filter: string,
    ): boolean {
        // Using toLowerCase to make the search case insensitiv
        let keyWords: string[] = filter.toLowerCase().split(' ');

        // Creating a Map with 'false' has a value for each key
        const foundKeyWords = new Map(keyWords.map((word) => [word, false]));

        for (const word of keyWords) {
            // If one of the string records attributes contains the current key word
            if (
                allowedAttributes.reduce(
                    (acc: boolean, curr: string) =>
                        acc ||
                        (typeof user[curr] === 'string' &&
                            !isNil(user[curr]) &&
                            user[curr] !== '' &&
                            includes(user[curr].toLowerCase(), word)),
                    false,
                )
            ) {
                // It's value is set to 'true' in the truth table
                foundKeyWords.set(word, true);
            }

            let areAllKeysFound = true;

            // Checking if all jey words were in the user record
            for (const value of foundKeyWords.values())
                if (value === false) areAllKeysFound = false;

            // If all key words are found in the user record, add it to the array of users to return
            if (areAllKeysFound) return true;

            return false;
        }
    }

    /**
     * Returns the list of users that matches the `filter`, `active` and `blocked` attributes in the `payload`.
     *
     * @param payload
     * @returns The list of users that matches the attributes in the `payload`
     * @throws {GenericException} Cannot list the users
     */
    async filterUsers(payload: UsersFilterDto): Promise<User[]> {
        try {
            const { filter, token, ...filterableAttributes } = payload;
            const tokenPayload = this.jwtService.verify(token);
            delete payload.token;

            // Getting permissions for each resource on a read action
            const permissions = this.accessControlService.getGrantedPermissions(
                tokenPayload.user.roles,
                [
                    { action: READ_ACTION, resource: USER },
                    { action: READ_ACTION, resource: ACTIVE_USER },
                    { action: READ_ACTION, resource: OWN_USER },
                ],
            );

            // Getting the list of allowed attributes for each resource
            const allowedUserAttributes =
                find(permissions, { resource: USER }).attributes || [];
            const allowedActiveUserAttributes =
                find(permissions, { resource: ACTIVE_USER }).attributes || [];
            const allowedOwnUserAttributes =
                find(permissions, { resource: OWN_USER }).attributes || [];

            let usersList: User[] = [];

            if (allowedUserAttributes.length !== 0) {
                // Sanitize filter according to allowed attributes for USER
                const usersFilters = this.filterObj(
                    allowedUserAttributes,
                    filterableAttributes,
                );

                // Get all users according to sanitized filter
                const allUsers = await this.usersRepo.find(usersFilters);

                if (!!filter) {
                    forEach(allUsers, (currentUser) => {
                        if (
                            this.filterOnAttributes(
                                currentUser,
                                allowedUserAttributes,
                                filter,
                            )
                        ) {
                            usersList.push(currentUser);
                        }
                    });
                } else {
                    usersList = concat(usersList, allUsers);
                }
            }

            if (
                allowedActiveUserAttributes.length !== 0 &&
                filterableAttributes.active !== false
            ) {
                // Sanitize filter according to allowed attributes for USER
                const activeUsersFilters = this.filterObj(
                    allowedActiveUserAttributes,
                    filterableAttributes,
                );
                delete activeUsersFilters.active;

                // Get all active users according to sanitized filter
                const allActiveUsers = await this.usersRepo.find({
                    active: true,
                    ...activeUsersFilters,
                });

                if (!!filter) {
                    forEach(allActiveUsers, (currentUser) => {
                        if (
                            this.filterOnAttributes(
                                currentUser,
                                allowedActiveUserAttributes,
                                filter,
                            )
                        ) {
                            usersList.push(currentUser);
                        }
                    });
                } else {
                    usersList = concat(usersList, allActiveUsers);
                }
            }

            if (allowedOwnUserAttributes.length !== 0) {
                // Sanitize filter according to allowed attributes for USER
                const ownUserFilters = this.filterObj(
                    allowedOwnUserAttributes,
                    filterableAttributes,
                );

                // Get own user according to sanitized filter
                const ownUser = (
                    await this.usersRepo.findOne({
                        id: tokenPayload.user.id,
                        ...ownUserFilters,
                    })
                );

                if (
                    !!filter &&
                    this.filterOnAttributes(
                        ownUser,
                        allowedOwnUserAttributes,
                        filter
                    )
                ) {
                    usersList.push(ownUser);
                } else if (!filter) {
                    usersList.push(ownUser);
                }
            }

            return this.sanitizeResponse(filterBy(uniqBy(usersList, 'id'), { ...filterableAttributes }), tokenPayload);
        } catch (e) {
            console.error(e);

            if (e instanceof HttpException || e instanceof RpcException)
                throw e;

            throw FwaException({
                code: HttpStatus.NOT_FOUND,
                message: 'Cannot list the users',
                messageCode: USERS_NOT_FOUND,
            });
        }
    }

    /**
     * Changes the current user's password and return true if the operation is successful.
     *
     * Otherwise, returns false.
     *
     * @param query
     * @returns true | false
     * @throws {BadRequestException} "currentPassword" is missing
     * @throws {BadRequestException} "newPassword" is missing
     * @throws {ForbiddenException} Not allowed to update your password
     * @throws {BadRequestException} "currentPassword" is wrong!
     * @throws {GenericException} Failed to get the current user
     */
    async changeOwnPassword(query: PasswordChangeDto): Promise<boolean> {
        const { currentPassword, newPassword, token } = query;
        delete query.token;
        const tokenPayload = await this.jwtService.verifyAsync(token);

        try {
            if (currentPassword === null || currentPassword === '')
                throw FwaException({
                    code: HttpStatus.BAD_REQUEST,
                    message: '"currentPassword" is missing',
                    messageCode: MISSING_ATTRIBUTE,
                });

            if (newPassword === null || newPassword === '')
                throw FwaException({
                    code: HttpStatus.BAD_REQUEST,
                    message: '"newPassword" is missing',
                    messageCode: MISSING_ATTRIBUTE,
                });

            // User can update his/her password?
            const permission = this.accessControlService.can(
                tokenPayload.user.roles,
                'ownUser',
                'update',
            );

            if (!permission._.attributes.includes('password'))
                throw FwaException({
                    code: HttpStatus.FORBIDDEN,
                    message: 'Not allowed to update your password',
                    messageCode: NOT_ALLOWED,
                });

            // Find the used identified by the userId from the token
            const user = await this.usersRepo.findOne({ select: ['id', 'salt', 'password'], where: { id: tokenPayload.user.id } });

            /**
             * argon2 options
             * @param type the type of encryption algorithm used by argon2
             * @param salt the user salt
             * @param raw the result of the encryption as a string or a buffer
             */
            const argonOptions = new Object({
                type: argon2.argon2i,
                salt: Buffer.from(user.salt),
                raw: true,
            });

            // the current hashed password
            const hash = await argon2.hash(currentPassword, argonOptions);
            // convert the buffer to string (database constraint - base64)
            const password = gzipSync(hash).toString('base64');

            // compare the password (current) from the payload and the database password
            if (user.password !== password)
                throw FwaException({
                    code: HttpStatus.BAD_REQUEST,
                    message: '"currentPassword" is wrong!',
                    messageCode: CURRENT_PASSWORD_WRONG,
                });

            const updateQuery = new UserUpdateDto();

            Object.assign(updateQuery, {
                token,
                id: user.id,
                password: newPassword,
            });

            // if passwords are equal update the user password.
            await this.update(updateQuery);

            return true;
        } catch (error) {
            console.error(error);
            // Specific error
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            // Generic error
            throw FwaException({
                message: 'Failed to get the current user',
                messageCode: FAILED_TO_GET_CURRENT_USER,
            });
        }
    }

    // TODO:Check for permissions and use the service methods to get and update the user entity
    /**
     * **Third phase of the reset password request**
     *
     * Changes the password of the user who perform a reset password request and return true if the procedure is successful.
     *
     * Otherwise, returns false.
     *
     * @param payload
     * @returns true | false
     */
    async resetPassword(payload: PasswordResetDto): Promise<boolean> {
        const { token, password } = payload;

        try {
            const cachedUserString = await this.cacheManager.get<string>(token);
            if (!cachedUserString) return false;

            const cachedUserRecord = JSON.parse(cachedUserString);

            // This method is here to throw an erro if the user is not found
            const foundUser = await this.getOneForAuth({
                id: cachedUserRecord.user.id,
                active: true,
            } as UsersFindDto);

            /**
             * argon2 options
             * @param type the type of encryption algorithm used by argon2
             * @param salt the user salt
             * @param raw the result of the encryption as a string or a buffer
             */
            const argonOptions = new Object({
                type: argon2.argon2i,
                salt: Buffer.from(foundUser.salt),
                raw: true,
            });

            const hash = await argon2.hash(password, argonOptions);
            // convert the buffer to string (database constraint - base64)
            const zippedHashedPassword = gzipSync(hash).toString('base64');
            await this.usersRepo.update(
                { id: cachedUserRecord.user.id },
                { password: zippedHashedPassword },
            );

            await this.cacheManager.del(token);

            return true;
        } catch (error) {
            console.error(error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;

            // throw new GenericRpcException('Cannot reset user password');
            return false;
        }
    }

    // TODO:Check for permissions and use the service methods to get the user entity
    /**
     * **First phase of the self registration request**
     *
     * Try to send a mail the provided email in the payload in param to initiate a self registration request.
     *
     * If the self registration mail has been sent, then returns true.
     *
     * Else, returns false.
     *
     * @param newUserRequested
     * @returns true | false
     * @throws {MailException} Cannot send the mail.
     */
    async requestSelfRegistration(
        newUserRequested: SelfRegistrationRequestDto,
    ): Promise<boolean> {
        try {
            await this.usersRepo.findOneOrFail({
                where: [
                    { active: true, email: newUserRequested.email },
                    { login: newUserRequested.login },
                ],
            });
            return false;
        } catch (error) { }

        try {
            const tempToken = shortid.generate();

            let url = new URL(newUserRequested.source);
            url = new URL(url.origin);
            url.pathname = `/#/self-registration/${tempToken}`;

            const sourceUrl = url.toString().replace('%23', '#');

            // create email template
            const template: SendMailOptions = {
                from: mailerConfig.from,
                to: newUserRequested.email,
                subject: 'Registration request from the vFESK system',
                text: `The vFESK system has received a user registration request for the following user:  \n\n
\t Login: ${newUserRequested.login}\n
\t First name: ${newUserRequested.firstName}\n
\t Name: ${newUserRequested.name}\n
\t Email: ${newUserRequested.email}\n\n
Click on the following link to confirm the user registration.\n
${sourceUrl}\n\n
Ignore this message if you have not made a user registration request for vFESK.`,
            };

            // create an instance of mailer
            const transport = createTransport(mailerConfig);
            // send the template by mail
            await transport.sendMail(template);
            transport.close();

            // save the token in a cache for (T secondes)
            await this.cacheManager.set(
                tempToken,
                JSON.stringify({
                    sourceUrl,
                    newUserRequested,
                }),
                { ttl: shortidTTL },
            );

            return true;
        } catch (error) {
            console.error(error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;

            if (error.responseCode === 554)
                throw FwaException({
                    code: 554,
                    message: error.message,
                    messageCode: CANNOT_SEND_EMAIL,
                    messageData: {
                        email: newUserRequested.email,
                    },
                });

            throw FwaException({
                message: error.message,
                messageCode: CANNOT_SEND_EMAIL,
            });
        }
    }

    /**
     * **Second phase of the self registration request**
     *
     * Check if the provided token in the `payload` for the self registration request exists in the cache and is valid.
     *
     * If yes, returns the associated user details.
     *
     * Else returns false.
     *
     * @param payload
     * @returns The user's details or false
     * @throws {GenericException} Cannot get the user to register by token
     */
    async getUserToRegisterByToken(
        payload: UserGetToRegisterByTokenDto,
    ): Promise<any> {
        const { token } = payload;
        try {
            const userToRegister = await this.cacheManager.get<string>(token);

            if (!userToRegister) return false;

            return JSON.parse(userToRegister).newUserRequested;
        } catch (error) {
            console.error(error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            // TODO: Perform a check in the code instead of catching an error
            throw FwaException({
                message: 'Cannot get the user to register by token',
                messageCode: CANNOT_GET_USER_TO_REGISTER_BY_TOKEN,
            });
        }
    }

    /**
     * **Third phase of the self registration request**
     *
     * Creates a new user from the information stored in the cache, then returns true.
     *
     * @param payload
     * @returns true
     * @throws {GenericException} Cannot create new user
     */
    async confirmSelfRegistration(
        payload: RegistrationConfirmDto,
    ): Promise<boolean> {
        const { token, password } = payload;

        try {
            let userToRegister: any = await this.cacheManager.get<string>(
                token,
            );

            if (!userToRegister) return false;

            userToRegister = JSON.parse(userToRegister).newUserRequested;

            userToRegister.password = password;

            await this.cacheManager.del(token);

            await this.createWithoutAuth(userToRegister);

            return true;
        } catch (error) {
            console.error(error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            throw FwaException({
                message: 'Cannot create new user',
                messageCode: CANNOT_CREATE_USER,
            });
        }
    }

    // Private function

    /**
     * Generates and returns a random string with the provided `length`.
     *
     * @param length default: 16
     * @returns A random string
     */
    private genRandomString(length = 16): string {
        return crypto
            .randomBytes(Math.ceil(length / 2))
            .toString('hex')
            .slice(0, length);
    }

    /**
     * Generates a user with admin as login.
     *
     * This user hasn't the admin role, don't forget to assign it the roles you need.
     *
     * @returns true
     */
    private async genAdminUser(): Promise<boolean> {
        try {
            await this.getOneForAuth({ login: 'admin' } as any);
        } catch (e) {
            await this.createWithoutAuth({
                // active: true,
                // blocked: false,
                // blockingReason: '',
                email: 'admin@list.lu',
                firstName: 'admin',
                login: 'admin',
                name: 'admin',
                password: 'admin',
            });
        }
        return true;
    }

    /**
     * Filter the `obj` attributes to leave only the ones that are specified in the `attr` param.
     * @param attr
     * @param obj
     * @returns The filtered object.
     */
    private filterObj(attr, obj): any {
        return attr.reduce(
            (acc, key) =>
                key in obj ? Object.assign(acc, { [key]: obj[key] }) : acc,
            {},
        );
    }

    /**
     * Sanitize the `response` with the `tokenPayload` roles according to their ACDB definition in read mode.
     *
     * The sanitization applied here only occurs on the `User` objects, sanitizations for other objects should be done in there respective service.
     *
     * @param response
     * @param tokenPayload
     * @returns
     */
    private sanitizeResponse(response: any, tokenPayload: any): any {
        if (isNil(response)) {
            return response;
        }

        if (typeof response !== 'object') return response;

        if (response instanceof Array) {
            let sanitizedArray = (response as Array<User>).map((obj) => {
                return this.sanitizeResponse(obj, tokenPayload);
            });

            remove(sanitizedArray, (obj) => isNil(obj) || isEqual(obj, {}));

            return sanitizedArray;
        }

        if (response.constructor === User) {
            return this.sanitizeUserOnRead(response, tokenPayload);
        }

        const sanitizedResponse = {};

        Object.keys(response).map((key) => {
            Object.assign(sanitizedResponse, {
                [key]: this.sanitizeResponse(response[key], tokenPayload),
            });
        });

        return sanitizedResponse;
    }

    /**
     * Sanitize the provided `user` in param with the `tokenPayload` roles according to their ACDB definition in read mode.
     *
     * @param user
     * @param tokenPayload
     * @returns
     */
    private sanitizeUserOnRead(user: User, tokenPayload: any): User {
        const permissions = this.accessControlService.getGrantedPermissions(
            tokenPayload.user.roles,
            [
                { action: READ_ACTION, resource: USER },
                { action: READ_ACTION, resource: ACTIVE_USER },
                { action: READ_ACTION, resource: OWN_USER },
            ],
        );

        let allApplicableAttributes =
            find(permissions, { resource: USER }).attributes || [];

        if (user.id === tokenPayload.user.id) {
            allApplicableAttributes = concat(
                allApplicableAttributes,
                find(permissions, { resource: OWN_USER }).attributes || [],
            );
            allApplicableAttributes = uniq(allApplicableAttributes);
        }

        if (user.active === true) {
            allApplicableAttributes = concat(
                allApplicableAttributes,
                find(permissions, { resource: ACTIVE_USER }).attributes || [],
            );
            allApplicableAttributes = uniq(allApplicableAttributes);
        }

        return this.filterObj(allApplicableAttributes, user);
    }

    /**
     * Sanitize the provided `user` in param with the `tokenPayload` roles according to their ACDB definition in create mode.
     *
     * @param user
     * @param tokenPayload
     * @returns
     */
    private sanitizeUserOnCreate(user: UserCreateDto, tokenPayload: any): any {
        const permissions = this.accessControlService.getGrantedPermissions(
            tokenPayload.user.roles,
            [{ action: CREATE_ACTION, resource: USER }],
        );

        let allApplicableAttributes =
            find(permissions, { resource: USER }).attributes || [];

        return this.filterObj(allApplicableAttributes, user);
    }

    /**
     * Sanitize the provided `user` in param with the `tokenPayload` roles according to their ACDB definition in update mode.
     * @param user
     * @param tokenPayload
     * @returns
     */
    private sanitizeUserOnUpdate(user: User, tokenPayload: any): User {
        const permissions = this.accessControlService.getGrantedPermissions(
            tokenPayload.user.roles,
            [
                { action: UPDATE_ACTION, resource: USER },
                { action: UPDATE_ACTION, resource: OWN_USER },
            ],
        );

        let allApplicableAttributes =
            find(permissions, { resource: USER }).attributes || [];

        if (user.id === tokenPayload.user.id) {
            allApplicableAttributes = concat(
                allApplicableAttributes,
                find(permissions, { resource: OWN_USER }).attributes || [],
            );
            allApplicableAttributes = uniq(allApplicableAttributes);
        }

        return this.filterObj(allApplicableAttributes, user);
    }
}
