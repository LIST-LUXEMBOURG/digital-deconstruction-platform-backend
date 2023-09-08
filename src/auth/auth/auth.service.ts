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
    Injectable,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { Timeout } from '@nestjs/schedule';
import * as argon2 from 'argon2';
import {
    JsonWebTokenError,
    NotBeforeError,
    TokenExpiredError,
} from 'jsonwebtoken';
import { createTransport, SendMailOptions } from 'nodemailer';
import * as shortid from 'shortid';
import { RoleService } from '../role/role.service';
import { USER_NOT_FOUND } from '../user/constants';
import { UserService } from '../user/user.service';
import { shortidTTL } from '../../config/cache.config';
import { dispatchACDBs, FwaException } from '../../FWAjs-utils';
import { gzipSync } from 'zlib';
import transportConfig from '../../config/mailer.conf';
import {
    AUTH_FAILED,
    CANNOT_FIND_RESET_PASSWORD_REQUEST,
    CANNOT_SEND_EMAIL,
    JWT_HAS_EXPIRED,
    JWT_HAS_INVALID_SIGNATURE,
    JWT_IS_INVALID,
    JWT_NOT_ACTIVE,
    JWT_REQUIRES_SIGNATURE,
    LIST_AUTHENTICATED_USERS_FAILED,
    LOGOUT_FAILED,
    MISSING_LOGIN,
    MISSING_PASSWORD,
    MISSING_TOKEN,
    NOT_LOGGED_IN,
    REVOKE_AUTH_FAILED,
    USER_BLOCKED,
    VALID_JWT_REQUIRED,
    VALID_TOKEN_REQUIRED,
} from './constants';
import {
    AuthCreateDto,
    AuthRevokeDto,
    PasswordRequestResetDto,
    PasswordResetConfirmationDto,
    PasswordResetDto,
} from './dto';
import { json } from 'express';
import { AuthListDto } from './dto/list.dto';

@Injectable()
export class AuthService {
    constructor(
        @Inject(CACHE_MANAGER) private readonly cacheManager: CacheStore,
        private readonly jwtService: JwtService,
        @Inject(forwardRef(() => UserService))
        private readonly userService: UserService,
        private readonly roleSevice: RoleService,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    @Timeout(2000)
    async sendACDB() {
        dispatchACDBs(
            this,
            (await import('./accessControl/accessControl.database')).default,
        );
    }

    /**
     * Checks if the credentials inside the `createAuthDto` match a specific user login and password in the database.
     *
     * If yes, adds the user in the UAL (Users Authenticated List)
     * and returns a token that the user can use to authenitcate him/herself in the application.
     *
     * Else, throws an UNAUTHORIZED exception ( code 401)
     *
     * @param createAuthDto
     * @returns An authentication token
     * @throws {BadRequestException} Password is missing
     * @throws {BadRequestException} Login is missing
     * @throws {UnauthorizedException} Failed to authenticate the user
     * @throws {ForbiddenException} The user is blocked
     */
    async createAuthentication(
        createAuthDto: AuthCreateDto,
    ): Promise<{ token }> {
        // query validation
        if (!createAuthDto.password)
            throw FwaException({
                code: HttpStatus.BAD_REQUEST,
                message: 'Password is missing',
                messageCode: MISSING_PASSWORD,
            });
        if (!createAuthDto.login)
            throw FwaException({
                code: HttpStatus.BAD_REQUEST,
                message: 'Login is missing',
                messageCode: MISSING_LOGIN,
            });

        try {
            // get the user by "login" with the "active" property to true.
            let user;
            try {
                user = await this.userService.getOneForAuth({
                    login: createAuthDto.login,
                    active: true,
                } as any);
            } catch (e) {
                throw FwaException({
                    code: HttpStatus.UNAUTHORIZED,
                    message: 'Failed to authenticate the user',
                    messageCode: AUTH_FAILED,
                });
            }

            if (user.blocked)
                throw FwaException({
                    code: HttpStatus.FORBIDDEN,
                    message: 'The user is blocked',
                    messageCode: USER_BLOCKED,
                    messageData: { blockingReason: user.blockingReason },
                });

            // set encryption options, require the user salt
            // more informations: https://www.npmjs.com/package/argon2
            const argonOptions = new Object({
                type: argon2.argon2i, // algorithm type
                salt: Buffer.from(user.salt), // user salt
                raw: true, // return a buffer
            });

            // cypher the password with the argon encryption library
            const hash = await argon2.hash(
                createAuthDto.password,
                argonOptions,
            );

            // stringify the hash (database constraint)
            const password = gzipSync(hash).toString('base64');

            // repeat the getOneUser request with the additional encrypted password in the query
            // if the password matchs return an user,
            // otherwise return an empty object and throw an error.
            let authenticatedUser;
            try {
                authenticatedUser = await this.userService.getOneForAuth({
                    login: createAuthDto.login,
                    active: true,
                    password,
                } as any);
            } catch (e) {
                throw FwaException({
                    code: HttpStatus.UNAUTHORIZED,
                    message: 'Failed to authenticate the user',
                    messageCode: AUTH_FAILED,
                });
            }

            // Get all user roles
            // @returns Array<role> (attrs: id, name, description)
            const userRoles = await this.roleSevice.getUserRolesAuth(user.id);

            // clean the authenticatedUser object and the userRoles array
            const payload = this.toTokenPayload(authenticatedUser, userRoles);

            // Get the user access list from the cache
            const UAL =
                new Map<number, any>(
                    await this.cacheManager.get<Map<number, [any]>>('UAL'),
                ) || new Map<number, any>();

            const userRecord = UAL.get(authenticatedUser.id) || {};

            // Get all the tokens from a specific user login
            const currentUserTokens = userRecord.tokens || new Array<any>();


            const nowInSeconds = Date.now() / 1000;
            const validTokens = currentUserTokens.filter(token => {
                const decodedToken = this.jwtService.decode(token.token);
                return (decodedToken['exp'] > nowInSeconds);
            });

            // Create the token
            const token = this.jwtService.sign(payload);

            // Decoded token
            // @returns {object} payload
            const decodedToken = this.jwtService.verify(token);

            // clean the authenticatedUser object and return new formated object
            // that will be saved in the cache
            const cachedUser = this.toConnectedList(
                authenticatedUser,
                token,
                decodedToken,
            );

            // add the fresh new token to the list of associated user login
            validTokens[validTokens.length] = cachedUser;

            // overwrite the connected user record (first in the Map then in the cache).
            UAL.set(authenticatedUser.id, {
                authorized: true,
                tokens: validTokens,
            });

            const UALarray = [];
            for (const [key, value] of UAL.entries())
                UALarray.push([key, value]);

            await this.cacheManager.set('UAL', UALarray);

            return { token };
        } catch (error) {
            console.error(error);
            // Specific error
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            // Unauthorized error in any case
            throw FwaException({
                //TODO: Should we really throw an Unauthorized exception as the default one?
                code: HttpStatus.UNAUTHORIZED,
                message: 'Failed to authenticate the user',
                messageCode: AUTH_FAILED,
            });
        }
    }

    /**
     * Checks if the `token` passed as parameter matches a record in the UAL (Users Authenticated List).
     *
     * If the token matches, then the user authentified by this token is logged out of the application
     * (all the user's tokens are unvalidated from the UAL) and returns true.
     *
     * @param token
     * @returns true
     * @throws {UnauthorizedException} Not logged in
     * @throws {GenericException} Cannot logout the user
     */
    async deleteAuthentication(token): Promise<boolean> {
        try {
            const UAL = new Map<number, any>(
                await this.cacheManager.get<Map<number, [any]>>('UAL'),
            );
            if (UAL.size === 0)
                throw FwaException({
                    code: HttpStatus.UNAUTHORIZED,
                    message: 'Not logged in',
                    messageCode: NOT_LOGGED_IN,
                });

            const decodedToken = await this.jwtService.verifyAsync(token);

            if (UAL.has(decodedToken.user.id)) {
                let user = await this.userService.getOneForAuth({ id: decodedToken.user.id } as any);
                if (!user.parallelLogins) {
                    UAL.delete(decodedToken.user.id);
                } else {
                    const userRecord = UAL.get(decodedToken.user.id);
                    let filtered = userRecord.tokens.filter(record => record.token !== token);
                    if (filtered.length > 0) {
                        userRecord.tokens = filtered;
                    } else {
                        UAL.delete(decodedToken.user.id);
                    }
                }

                const UALarray = [];
                for (const [key, value] of UAL.entries())
                    UALarray.push([key, value]);

                await this.cacheManager.set('UAL', UALarray);

                return true;
            }

            throw 0;
        } catch (error) {
            console.error(error);
            // Specific error
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            // Generic error
            throw FwaException({
                message: 'Cannot logout the user',
                messageCode: LOGOUT_FAILED,
            });
        }
    }

    /**
     * Checks if the `userId` passed as parameter matches a record in the UAL (Users Authenticated List).
     *
     * If the userId matches, then the user authentified by this ID is logged out of the application
     * (all the user's tokens are unvalidated from the UAL) and returns { isSuccess: true }.
     *
     * Else, returns { isSuccess: false }.
     *
     * @param param0
     * @returns {any} {isSuccess: true | false}
     * @throws {UnauthorizedException} Not logged in
     * @throws {NotFoundException} The userId {${userId}} does not identify an existing user
     * @throws {GenericException} Cannot revoke the user authentication
     */
    async revokeAuthentication({ userId }: AuthRevokeDto): Promise<any> {
        try {
            const UAL = new Map(
                await this.cacheManager.get<Map<number, [any]>>('UAL'),
            );
            if (UAL.size === 0)
                throw FwaException({
                    code: HttpStatus.UNAUTHORIZED,
                    message: 'Not logged in',
                    messageCode: NOT_LOGGED_IN,
                });

            let user;
            try {
                user = await this.userService.getOneForAuth({
                    id: userId,
                } as any);
            } catch (e) {
                throw FwaException({
                    code: HttpStatus.NOT_FOUND,
                    message: `The userId {${userId}} does not identify an existing user`,
                    messageCode: USER_NOT_FOUND,
                    messageData: { userId },
                });
            }

            if (UAL.has(user.id)) {
                UAL.delete(user.id);
                await this.cacheManager.set('UAL', Array.from(UAL));
                const res = { isSuccess: true };
                return res;
            } else {
                const res = { isFailed: false };
                return res;
            }
        } catch (error) {
            console.error(error);
            // Specific error
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            // Generic error
            throw FwaException({
                message: `Cannot revoke the user authentication`,
                messageCode: REVOKE_AUTH_FAILED,
            });
        }
    }

    /**
     * Returns the list of authorized active users in the system.
     *
     * @returns {AuthListDto[]} The list of authorized active users
     * @throws {GenericException} Failed to list the connected users
     */
    async getAuthorizedUsersList(): Promise<AuthListDto[]> {
        try {
            const UAL =
                new Map<number, any>(await this.cacheManager.get<[]>('UAL')) ||
                new Map<number, any>();
            const connectedUsers = new Array<AuthListDto>();

            for await (const [key, value] of UAL) {
                const user = await this.userService.getOneForAuth({
                    id: key,
                } as any);

                connectedUsers.push({
                    userId: key,
                    login: user.login,
                    timestamp: value.tokens[0].timestamp,
                });
            }

            return connectedUsers;
        } catch (error) {
            console.error(error);
            // Specific error
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            // Generic error
            throw FwaException({
                message: `Failed to list the connected users`,
                messageCode: LIST_AUTHENTICATED_USERS_FAILED,
            });
        }
    }

    /**
     * Check if the provided `token` is valid.
     *
     * If the token has a valid signature and is referenced in the UAL (Users Authenticated List), then returns the decoded token payload.
     *
     * Else, throws an UNAUTHORIZED Exception
     *
     * @param token
     * @returns The user's decoded authentication token payload
     * @throws {UnauthorizedException} Token is missing
     * @throws {UnauthorizedException} Not logged in
     * @throws {UnauthorizedException} User blocked
     * @throws {UnauthorizedException} The JWT has expired
     * @throws {UnauthorizedException} The JWT format is invalid
     * @throws {UnauthorizedException} The JWT requires a signature
     * @throws {UnauthorizedException} The JWT has invalid signature
     * @throws {UnauthorizedException} A valid JWT is required!
     * @throws {UnauthorizedException} The JWT is not active
     * @throws {UnauthorizedException} A valid token is required!
     */
    async checkAuthentication(token: string) {
        if (!token)
            throw FwaException({
                code: HttpStatus.UNAUTHORIZED,
                message: 'Token is missing',
                messageCode: MISSING_TOKEN,
            });

        try {
            // verify the token in the request
            // return a decoded token or an error
            const decoded = this.jwtService.verify(token);

            // get the UAL from cache
            const UAL = new Map<number, any>(
                await this.cacheManager.get<[]>('UAL'),
            );

            // if the UAL doesn't exist
            if (!UAL)
                throw FwaException({
                    code: HttpStatus.UNAUTHORIZED,
                    message: 'Not logged in',
                    messageCode: NOT_LOGGED_IN,
                });

            // get the user by "login" with the "active" property to true.
            const userLogged = await this.userService.getOneForAuth({
                id: decoded.user.id,
            } as any);
            if (userLogged.blocked)
                throw FwaException({
                    code: HttpStatus.UNAUTHORIZED,
                    message: 'User blocked',
                    messageCode: USER_BLOCKED,
                });

            const userRecord = UAL.get(decoded.user.id);

            if (!userRecord || !userRecord.authorized)
                throw FwaException({
                    code: HttpStatus.UNAUTHORIZED,
                    message: 'Not logged in',
                    messageCode: NOT_LOGGED_IN,
                });

            // get the user record from the UAL
            const userTokens = userRecord.tokens;

            // if the user record is empty throw an error
            if (userTokens.length === 0)
                throw FwaException({
                    code: HttpStatus.UNAUTHORIZED,
                    message: 'Not logged in',
                    messageCode: NOT_LOGGED_IN,
                });

            // in the user record found a token that match the token from the request
            const foundToken = userTokens.find((u) => u.token === token);
            if (!foundToken)
                throw FwaException({
                    code: HttpStatus.UNAUTHORIZED,
                    message: 'Not logged in',
                    messageCode: NOT_LOGGED_IN,
                });

            // return the entire token payload
            return decoded;
        } catch (e) {
            console.error(e);
            // JWT error
            if (e instanceof TokenExpiredError)
                throw FwaException({
                    code: HttpStatus.UNAUTHORIZED,
                    message: 'The JWT has expired',
                    messageCode: JWT_HAS_EXPIRED,
                });

            if (e instanceof JsonWebTokenError)
                switch (e.message) {
                    case 'jwt malformed':
                        throw FwaException({
                            code: HttpStatus.UNAUTHORIZED,
                            message: 'The JWT format is invalid',
                            messageCode: JWT_IS_INVALID,
                        });
                    case 'jwt signature is required':
                        throw FwaException({
                            code: HttpStatus.UNAUTHORIZED,
                            message: 'The JWT requires a signature',
                            messageCode: JWT_REQUIRES_SIGNATURE,
                        });
                    case 'invalid signature':
                        throw FwaException({
                            code: HttpStatus.UNAUTHORIZED,
                            message: 'The JWT has invalid signature',
                            messageCode: JWT_HAS_INVALID_SIGNATURE,
                        });
                    default:
                        throw FwaException({
                            code: HttpStatus.UNAUTHORIZED,
                            message: 'A valid JWT is required!',
                            messageCode: VALID_JWT_REQUIRED,
                        });
                }

            if (e instanceof NotBeforeError)
                throw FwaException({
                    code: HttpStatus.UNAUTHORIZED,
                    message: 'The JWT is not active',
                    messageCode: JWT_NOT_ACTIVE,
                });

            // Specific error
            if (e instanceof HttpException || e instanceof RpcException)
                throw e;

            // Generic error or the token is invalid
            //TODO: Should we really throw an Unauthorized exception as the default one?
            throw FwaException({
                code: HttpStatus.UNAUTHORIZED,
                message: 'A valid token is required!',
                messageCode: VALID_TOKEN_REQUIRED,
            });
        }
    }

    /**
     * Returns the user's roles from his/her token if the token has a valid signature.
     *
     * Else, throws an UNAUTHORIZED Exception
     *
     * @param token
     * @returns The user's roles from his/her token
     * @throws {UnauthorizedException} A valid token is required!
     */
    async getRolesByAuth(token: string) {
        try {
            return this.jwtService.decode(token)['user'].roles;
        } catch (error) {
            console.error(error);

            // Specific error
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;

            // Generic error or the token is invalid
            throw FwaException({
                code: HttpStatus.UNAUTHORIZED,
                message: 'A valid token is required!',
                messageCode: VALID_TOKEN_REQUIRED,
            });
        }
    }

    // Add permissions check
    /**
     * **First phase of the teset password request**
     *
     * Try to send a mail to the active user identified by the provided email in the payload in param to initiate a reset password request.
     *
     * If there is an active user with the same provided email and the reset password mail has been sent, then returns true.
     *
     * Else, returns false
     *
     * @param payload
     * @returns true | false
     * @throws {MailException} Cannot send the mail.
     * @throws {GenericException} Failed to send the request to reset the password
     */
    async requestResetPassword(payload: PasswordRequestResetDto) {
        // create an instance of mailer
        const transport = createTransport(transportConfig);
        let resetToken, user;

        // get one user by email
        try {
            user = await this.userService.getOneForAuth({
                email: payload.email,
                active: true,
            } as any);
            delete user.password;
            delete user.salt;
        } catch (error) {
            console.error(error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;

            // throw no user found with the following email...
            return false;
        }

        try {
            // generate a reset token
            resetToken = shortid.generate();

            // TODO: get the source of the request
            let url = new URL(payload.source);
            url = new URL(url.origin);
            url.pathname = `/#/reset-password/${resetToken}`;

            let sourceUrl = url.toString();
            sourceUrl = sourceUrl.replace('%23', '#');

            // create email template
            const template: SendMailOptions = {
                from: transportConfig.from,
                to: payload.email,
                subject: 'Password reset request from the Digital Deconstruction Platform',
                text: `The Digital Deconstruction Platform system has received a password reset request for the following user: \n
${user.login}: ${user.firstName}, ${user.name}\n
Click on the following link to reset your Digital Deconstruction Platform password.\n
${sourceUrl}`,
            };

            // save the token in a cache for (T secondes)
            await this.cacheManager.set(
                resetToken,
                JSON.stringify({
                    sourceUrl,
                    user,
                }),
                { ttl: shortidTTL },
            );

            // send the template by mail
            await transport.sendMail(template);

            // close the mail transport
            await transport.close();

            return true;
        } catch (error) {
            console.error(error);
            // remove the token from the cache
            await this.cacheManager.del(resetToken);
            if (error.responseCode === 554)
                throw FwaException({
                    code: 554,
                    message: error.message,
                    messageCode: CANNOT_SEND_EMAIL,
                    messageData: {
                        email: payload.email,
                    },
                });
            // throw the raw error
            throw FwaException({
                message: 'Failed to send the request to reset the password',
                messageCode: CANNOT_SEND_EMAIL,
                messageData: {
                    email: payload.email,
                },
            });
        }
    }

    /**
     * **Second phase of the reset password request**
     *
     * Check if the provided `token` for the reset password request exists in the cache and is valid.
     *
     * If yes, returns the associated user details.
     *
     * Else returns false.
     *
     * @param arg0
     * @returns The user's details or false
     * @throws {GenericException} Cannot find the reset pasword request
     */
    async checkResetPassword({ token }: PasswordResetDto) {
        let sourceUrl, user;

        try {
            // get the token
            const cachedData = await this.cacheManager.get<string>(token);

            if (!cachedData) return false;

            // parse the string
            const parsedData = JSON.parse(cachedData);

            // get sourceUrl and user from cache.
            sourceUrl = parsedData.sourceUrl;
            user = parsedData.user;
            const userToReturn = {
                login: user.login,
                name: user.name,
                firstName: user.firstName,
                email: user.email,
            };

            return userToReturn;
        } catch (error) {
            console.error(error);

            // Specific error
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;

            // Generic error or the token is invalid
            throw FwaException({
                message: 'Cannot find the reset pasword request',
                messageCode: CANNOT_FIND_RESET_PASSWORD_REQUEST,
            });
        }
    }

    /**
     * If the token is valid, then resets the user password and returns true.
     *
     * Else, return false or throws an Exception.
     * @param param0
     * @returns true | false
     */
    async resetPassword({ token, password }: PasswordResetConfirmationDto) {
        try {
            return await this.userService.resetPassword({ token, password });
        } catch (error) {
            console.error(error);
            // Specific error
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;

            return false;
        }
    }

    // Private functions

    /**
     * Function used to filter the authenticated users attributes when they are added in the UAL.
     *
     * @access private
     * @param user The user record found in the DB
     * @param token The created JWT for the authenticated user
     * @param payload The JWT payload
     *
     * @returns An object containning all the attributes to be stored in the UAL
     */
    private toConnectedList(user, token, payload) {
        const { id, login, blocked, blockingReason, ...rest } = user;
        const timestamp = new Date(payload.iat * 1000).toISOString();

        return {
            token,
            userId: id,
            login: user.login,
            timestamp,
            blockingReason,
            blocked,
        };
    }

    /**
     * Function used to create the JWT payload
     *
     * @access private
     * @param user The user record found in the DB
     * @param roles The `user` roles
     *
     * @returns An object to be used as a JWT payload to create an authentication token
     */
    private toTokenPayload(user, roles) {
        // destructuring the user object
        const {
            password,
            salt,
            blocked,
            blockingReason,
            active,
            ...userPayload
        } = user;

        // map roles [], return only role name from each role object
        roles = roles.map((r) => r.name);
        return { user: { ...userPayload, roles }, sub: userPayload.login };
    }
}
