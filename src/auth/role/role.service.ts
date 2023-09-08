/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { Timeout } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { find, isEqual, isNil, remove } from 'lodash';
import { USER_NOT_FOUND } from '../user/constants';
import { UserService } from '../user/user.service';
import { dispatchACDBs, FwaException, READ_ACTION, UPDATE_ACTION } from '../../FWAjs-utils';
import { ApiAccessControlService } from '../..//FWAjs-utils/accessControl/accessControl.service';
import { Authorization } from '../..//FWAjs-utils/utils/auth.interface';
import { Repository } from 'typeorm';
import { UsersFindDto } from '../user/dto';
import { ROLE, ROLE_ASSIGNMENT } from './accessControl/resourcesName.constants';
import { CANNOT_ASSIGN_ROLE_TO_USER, CANNOT_DELETE_ROLE, CANNOT_FIND_ROLE, CANNOT_LIST_ROLES, CANNOT_LIST_USER_ROLES, CANNOT_REVOKE_USER_ROLE, CANNOT_UPDATE_ROLE, MISSING_ROLE_ID, MISSING_USER_ID, ROLE_ALREADY_EXISTS, ROLE_NOT_FOUND, ROLE_STILL_ASSOCIATED_TO_USER } from './constants';
import { RoleAssignDto, RoleAssignWithoutAuthDto, RoleDeleteDto, RoleGetDto, RoleRevokeDto, RoleUpdateDto, UserRolesGetDto } from './dto';
import { Role, UserRole } from './entities';

@Injectable()
export class RoleService {

	constructor(
		@InjectRepository(Role)
		private readonly rolesRepo: Repository<Role>,
		@InjectRepository(UserRole)
		private readonly userRoleRepo: Repository<UserRole>,
		private readonly jwtService: JwtService,
		private readonly accessControlService: ApiAccessControlService,
		// @Inject(CACHE_MANAGER) private readonly cacheManager: CacheStore,
		private readonly userService: UserService,
		private readonly eventEmitter: EventEmitter2
	) { }

	@Timeout(2000)
	async sendACDB() {
		dispatchACDBs(
			this,
			(await import('./accessControl/accessControl.database')).default
		)
	}

	/**
	 * Updates a role with the provided information in the `roleAttrs` param in the database.
	 * 
	 * If the name is not uniq, then throws a CONFLICT Exception.
	 *
	 * @param roleAttrs The payload with the information to update in the role.
	 * @returns The freshly updated role.
	 * @throws {BadRequestException} ID attribute is mandatory
	 * @throws {NotFoundException} Role not found for the provided ID
	 * @throws {ConflictException} The provided role name already exists
	 * @throws {GenericException} Cannot update role
	 */
	async update(roleAttrs: RoleUpdateDto) {
		try {
			const { token } = roleAttrs;
			delete roleAttrs.token;
			const tokenPayload = this.jwtService.verify(token);
			const sanitizedAttributes = this.sanitizeRoleOnUpdate(roleAttrs as any, tokenPayload);

			// Checking ID existence
			if (sanitizedAttributes.id === null || sanitizedAttributes.id === undefined)
				throw FwaException({
					code: HttpStatus.BAD_REQUEST,
					message: 'ID attribute is mandatory',
					messageCode: MISSING_ROLE_ID,
				});

			const roleToUpdate = await this.rolesRepo.findOne({ id: sanitizedAttributes.id });

			// Checking role existence
			if (roleToUpdate === null || roleToUpdate === undefined)
				throw FwaException({
					code: HttpStatus.NOT_FOUND,
					message: 'Role not found for ID',
					messageCode: ROLE_NOT_FOUND,
					messageData: { roleId: sanitizedAttributes.id },
				});

			// Checking name unicity
			if (sanitizedAttributes.name && (await this.rolesRepo.findOne({ name: sanitizedAttributes.name })))
				throw FwaException({
					code: HttpStatus.CONFLICT,
					message: `Role ${sanitizedAttributes.name} already exists`,
					messageCode: ROLE_ALREADY_EXISTS,
					messageData: { roleName: sanitizedAttributes.name },
				});

			Object.assign(roleToUpdate, sanitizedAttributes);

			await this.rolesRepo.update({ id: sanitizedAttributes.id }, roleToUpdate);

			return this.sanitizeResponse(await this.rolesRepo.findOne({ id: sanitizedAttributes.id }), tokenPayload);
		} catch (e) {
			console.error(e);
			if (e instanceof HttpException || e instanceof RpcException)
				throw e;

			throw FwaException({
				message: 'Cannot update role',
				messageCode: CANNOT_UPDATE_ROLE
			});
		}
	}

	/**
	 * Deletes the role identified by the `id` in the `payload` in the database.
	 * 
	 * If the role is still associated with at least one user, then a CONFLICT Exception is thrown.
	 * 
	 * @param payload Payload containing the ID of the role to delete.
	 * @returns The deleted role
	 * @throws {BadRequestException} ID attribute is mandatory.
	 * @throws {NotFoundException} The provided ID matches none of the role.
	 * @throws {ConflictException} The role is still associated with at least one user.
	 * @throws {GenericException} Cannot delete the role.
	 */
	async delete(payload: RoleDeleteDto) {
		const { id, token } = payload;
		delete payload.token;

		const tokenPayload = this.jwtService.verify(token);

		try {
			if (id == null || id === undefined)
				throw FwaException({
					code: HttpStatus.BAD_REQUEST,
					message: 'ID attribute is mandatory',
					messageCode: MISSING_ROLE_ID,
				});

			const roleToDelete = await this.rolesRepo.findOne({ id });

			if (roleToDelete == null || roleToDelete === undefined)
				throw FwaException({
					code: HttpStatus.NOT_FOUND,
					message: 'The provided ID matches none of the role',
					messageCode: ROLE_NOT_FOUND,
					messageData: { roleId: id },
				});

			const isAssigned = await this.userRoleRepo.findOne({ roleId: roleToDelete.id });

			if (Boolean(isAssigned))
				throw FwaException({
					code: HttpStatus.CONFLICT,
					message: 'The role is still associated with at least one user',
					messageCode: ROLE_STILL_ASSOCIATED_TO_USER,
					messageData: { associatedUser: isAssigned },
				});

			return this.sanitizeResponse(await this.rolesRepo.remove(roleToDelete), tokenPayload);
		} catch (e) {
			console.error(e)
			if (e instanceof HttpException || e instanceof RpcException)
				throw e;

			throw FwaException({
				message: 'Cannot delete the role',
				messageCode: CANNOT_DELETE_ROLE
			});
		}
	}

	/**
	 * Returns the first role that matches the attributes in the `roleAttrs` in the database.
	 * 
	 * @param roleAttrs The query to filter the roles with.
	 * @returns The first role that matches the attributes in the `roleAttrs`.
	 * @throws {GenericException} Cannot find the role.
	 */
	async getOne(roleAttrs: RoleGetDto): Promise<Role> {
		try {
			const { token } = roleAttrs;
			delete roleAttrs.token;

			const tokenPayload = this.jwtService.verify(token);

			const roleEntity = Object.assign(new Role(), roleAttrs);
			return this.sanitizeResponse(await this.rolesRepo.findOne(roleEntity), tokenPayload);
		} catch (e) {
			console.error(e);
			if (e instanceof HttpException || e instanceof RpcException)
				throw e;

			throw FwaException({
				message: 'Cannot find the role',
				messageCode: CANNOT_FIND_ROLE
			});
		}
	}

	/**
	 * Returns the list of all roles in the database.
	 * 
	 * @param param0 Payload containing the authorization token.
	 * @returns The list of all roles.
	 * @throws {GenericException} Cannot find the role.
	 */
	async getAll({ token }: Authorization) {
		try {
			const tokenPayload = this.jwtService.verify(token);
			return this.sanitizeResponse(await this.rolesRepo.find(), tokenPayload);
		} catch (e) {
			console.error(e)
			if (e instanceof HttpException || e instanceof RpcException)
				throw e;

			throw FwaException({
				message: 'Cannot list the roles',
				messageCode: CANNOT_LIST_ROLES
			});
		}
	}

	/**
	 * Assigns a role to a user.
	 * 
	 * @param assignRoleDto Payload containing the userIs and the roleId to associate together.
	 * @returns The new list of the user's roles.
	 * @throws {NotFoundException} User with the provided ID cannot be found
	 * @throws {NotFoundException} Cannot find role with the provided ID
	 * @throws {GenericException} Cannot assign role to user
	 */
	async assignRole(assignRoleDto: RoleAssignDto) {
		try {
			const { token } = assignRoleDto;
			delete assignRoleDto.token;
			const tokenPayload = this.jwtService.verify(token);
			try {
				// Getting the user to assign the role to or fail and throw an error
				await this.userService.getOne({ token, id: assignRoleDto.userId } as UsersFindDto);
			} catch (e) {
				throw FwaException({
					code: HttpStatus.NOT_FOUND,
					message: `User with id ${assignRoleDto.userId} cannot be found`,
					messageCode: USER_NOT_FOUND,
					messageData: { userId: assignRoleDto.userId },
				});
			}

			// Getting the role to be assign to the user
			const roleEntity = await this.rolesRepo.findOne(assignRoleDto.roleId);

			// Testing its existence
			if (roleEntity === undefined || roleEntity == null)
				throw FwaException({
					code: HttpStatus.NOT_FOUND,
					message: `Cannot find role with ID: ${assignRoleDto.roleId}`,
					messageCode: ROLE_NOT_FOUND,
					messageData: { roleId: assignRoleDto.roleId },
				});

			const query = { roleId: roleEntity.id, userId: assignRoleDto.userId };

			// Saving the new assignment
			await this.userRoleRepo.save(Object.assign(new UserRole(), query));

			// Return  the user's roles
			return this.sanitizeResponse(await this.getUserRoles({ token, userId: assignRoleDto.userId }), tokenPayload);
		} catch (e) {
			console.error(e);
			// Specific error
			if (e instanceof HttpException || e instanceof RpcException)
				throw e;
			// Generic error
			throw FwaException({
				message: 'Cannot assign role to user',
				messageCode: CANNOT_ASSIGN_ROLE_TO_USER
			});
		}
	}
	async assignRoleWithoutAuth(assignRoleDto: RoleAssignWithoutAuthDto) {
		try {
			try {
				// Getting the user to assign the role to or fail and throw an error
				await this.userService.getOneForAuth({ id: assignRoleDto.userId } as UsersFindDto);
			} catch (e) {
				throw FwaException({
					code: HttpStatus.NOT_FOUND,
					message: `User with id ${assignRoleDto.userId} cannot be found`,
					messageCode: USER_NOT_FOUND,
					messageData: { userId: assignRoleDto.userId },
				});
			}

			// Getting the role to be assign to the user
			const roleEntity = await this.rolesRepo.findOne(assignRoleDto.roleId);

			// Testing its existence
			if (roleEntity === undefined || roleEntity == null)
				throw FwaException({
					code: HttpStatus.NOT_FOUND,
					message: `Cannot find role with ID: ${assignRoleDto.roleId}`,
					messageCode: ROLE_NOT_FOUND,
					messageData: { roleId: assignRoleDto.roleId },
				});

			const query = { roleId: roleEntity.id, userId: assignRoleDto.userId };

			// Saving the new assignment
			await this.userRoleRepo.save(Object.assign(new UserRole(), query));

			// Return  the user's roles
			return await this.getUserRolesAuth(assignRoleDto.userId);
		} catch (e) {
			console.error(e);
			// Specific error
			if (e instanceof HttpException || e instanceof RpcException)
				throw e;
			// Generic error
			throw FwaException({
				message: 'Cannot assign role to user',
				messageCode: CANNOT_ASSIGN_ROLE_TO_USER
			});
		}
	}

	/**
	 * Revokes a user's role.
	 * 
	 * @param revokeRoleDto Payload containing the userId and the roleId to dissociate.
	 * @returns The new list of the user's roles.
	 * @throws {NotFoundException} User with the provided ID cannot be found
	 * @throws {NotFoundException} Cannot find role with the provided ID
	 * @throws {GenericException} Cannot assign role to user
	 */
	async revokeRole(revokeRoleDto: RoleRevokeDto) {
		try {
			const { token } = revokeRoleDto;
			delete revokeRoleDto.token;

			const tokenPayload = this.jwtService.verify(token);

			// Getting the user to assign the role to
			let userEntity;

			try {
				userEntity = await this.userService.getOne({ token, id: revokeRoleDto.userId } as any);
			} catch (e) {
				throw FwaException({
					code: HttpStatus.NOT_FOUND,
					message: `User with id ${revokeRoleDto.userId} cannot be found`,
					messageCode: USER_NOT_FOUND,
					messageData: { userId: revokeRoleDto.userId },
				});
			}

			// Getting the role to be assign to the user
			const roleEntity = await this.rolesRepo.findOne(revokeRoleDto.roleId);

			// Testing its existence
			if (roleEntity === undefined || roleEntity == null)
				throw FwaException({
					code: HttpStatus.NOT_FOUND,
					message: `Cannot find role with ID: ${revokeRoleDto.roleId}`,
					messageCode: ROLE_NOT_FOUND,
					messageData: { roleId: revokeRoleDto.roleId },
				});

			// Trying to found a user role (associative table)
			const userRoleEntity = await this.userRoleRepo.find({
				roleId: roleEntity.id,
				userId: userEntity.id,
			});

			// Removing the user role in the UserRole collection
			await this.userRoleRepo.remove(userRoleEntity);

			// Return the user's roles (internal call)
			return this.sanitizeResponse(await this.getUserRoles({ token, userId: userEntity.id }), tokenPayload);
		} catch (e) {
			console.error(e);
			// Specific error
			if (e instanceof HttpException || e instanceof RpcException)
				throw e;
			// Generic error
			throw FwaException({
				message: 'Cannot revoke role from user',
				messageCode: CANNOT_REVOKE_USER_ROLE
			});
		}
	}

	/**
	 * Returns the user's roles identified by the `userId` in the `payload` param.
	 * 
	 * @param payload Payload containing the userId of wich the roles will be returned.
	 * @returns The list of the user's roles.
	 * @throws {BadRequestException} User ID is missing
	 * @throws {GenericException} Cannot list the user roles
	 */
	async getUserRoles(payload: UserRolesGetDto) {
		try {
			const { userId, token } = payload;
			delete payload.token;
			const tokenPayload = this.jwtService.verify(token);

			if (!userId)
				throw FwaException({
					code: HttpStatus.BAD_REQUEST,
					message: 'User ID is missing',
					messageCode: MISSING_USER_ID,
				});

			await this.userService.getOne({ token, id: userId } as any);

			// Get all the user roles
			const userRoleEntity = await this.userRoleRepo.find({ userId });

			if (userRoleEntity.length === 0) return [];

			// Map id from the associative table to role id (i.e. {id: 4})
			const roleIds = userRoleEntity.map((userRoleE) => userRoleE.roleId);

			// Get all roles where id in roleIds
			return this.sanitizeResponse(await this.rolesRepo.findByIds(roleIds), tokenPayload);
		} catch (e) {
			console.error(e);
			// Specific error
			if (e instanceof HttpException || e instanceof RpcException)
				throw e;
			// Generic error
			throw FwaException({
				message: 'Cannot list the user roles',
				messageCode: CANNOT_LIST_USER_ROLES
			});
		}
	}

	/**
	 * Returns the user's roles identified by the `userId` in the param.
	 * 
	 * > Note: This function is only used to authenticate a user when he/she logs in the system and then doesn't require an authentication token.
	 * 
	 * @param userId The userId of wich the roles will be returned.
	 * @returns The list of the user's roles.
	 * @throws {BadRequestException} User ID is missing
	 * @throws {NotFoundException} User not found
	 * @throws {GenericException} Cannot list the user roles
	 */
	async getUserRolesAuth(userId: number) {
		try {
			if (!userId)
				throw FwaException({
					code: HttpStatus.BAD_REQUEST,
					message: 'User ID is missing',
					messageCode: MISSING_USER_ID,
				});

			try {
				await this.userService.getOneForAuth({ id: userId } as any);
			} catch (e) {
				console.error(e);
				throw FwaException({
					code: HttpStatus.NOT_FOUND,
					message: 'No user found',
					messageCode: USER_NOT_FOUND,
					messageData: { userId },
				});
			}

			// Get all the user roles
			const userRoleEntity = await this.userRoleRepo.find({ userId });

			if (userRoleEntity.length === 0) return [];

			// Map id from the associative table to role id (i.e. {id: 4})
			const roleIds = userRoleEntity.map((userRoleE) => userRoleE.roleId);

			// Get all roles where id in roleIds
			return this.rolesRepo.findByIds(roleIds);
		} catch (e) {
			// Specific error
			if (e instanceof HttpException || e instanceof RpcException)
				throw e;
			// Generic error
			throw FwaException({
				message: 'Cannot list the user roles',
				messageCode: CANNOT_LIST_USER_ROLES
			});
		}
	}

	/**
	 * Returns the first role that matches the attributes in the `roleAttrs` in the database.
	 * 
	 * @param roleAttrs The query to filter the roles with.
	 * @returns The first role that matches the attributes in the `roleAttrs`.
	 * @throws {GenericException} Cannot find the role.
	 */
	async getOneForAuth(roleAttrs: RoleGetDto): Promise<Role> {
		try {
			const { token } = roleAttrs;
			delete roleAttrs.token;

			const roleEntity = Object.assign(new Role(), roleAttrs);
			return await this.rolesRepo.findOne(roleEntity);
		} catch (e) {
			console.error(e);
			if (e instanceof HttpException || e instanceof RpcException)
				throw e;

			throw FwaException({
				message: 'Cannot find the role',
				messageCode: CANNOT_FIND_ROLE
			});
		}
	}

	/**
	 * Filter the `obj` attributes to leave only the ones that are specified in the `attr` param.
	 * @param attr 
	 * @param obj 
	 * @returns 
	 */
	private filterObj(attr, obj): any {
		return attr.reduce((acc, key) => (key in obj ? Object.assign(acc, { [key]: obj[key] }) : acc), {});
	}

	/**
	 * Sanitize the `response` with the `tokenPayload` roles according to their ACDB definition in read mode.
	 * 
	 * The sanitization applied here only occurs on the `Role` and `UserRole` objects, sanitizations for other objects should be done in there respective service.
	 * 
	 * @param response 
	 * @param tokenPayload 
	 * @returns 
	 */
	private sanitizeResponse(response: any, tokenPayload: any): any {
		if (isNil(response)) {
			return response;
		}

		if (typeof response !== 'object')
			return response;

		if (response instanceof Array) {
			let sanitizedArray = (response as Array<Role>).map(obj => {
				return this.sanitizeResponse(obj, tokenPayload);
			});

			remove(sanitizedArray, obj => isNil(obj) || isEqual(obj, {}));

			return sanitizedArray;
		}

		if (response.constructor === Role) {
			return this.sanitizeRoleOnRead(response, tokenPayload);
		}

		if (response.constructor === UserRole) {
			return this.sanitizeUserRoleOnRead(response, tokenPayload);
		}

		const sanitizedResponse = {};

		Object.keys(response).map(key => {
			Object.assign(sanitizedResponse, { [key]: this.sanitizeResponse(response[key], tokenPayload) })
		});

		return sanitizedResponse;
	}

	/**
	 * Sanitize the provided `role` in param with the `tokenPayload` roles according to their ACDB definition in read mode.
	 * 
	 * @param role 
	 * @param tokenPayload 
	 * @returns 
	 */
	private sanitizeRoleOnRead(role: Role, tokenPayload: any): Role {
		const permissions = this.accessControlService.getGrantedPermissions(
			tokenPayload.user.roles,
			[
				{ action: READ_ACTION, resource: ROLE },
			]
		);

		let allApplicableAttributes = find(permissions, { resource: ROLE }).attributes || [];

		return this.filterObj(allApplicableAttributes, role);
	}

	/**
	 * Sanitize the provided `userRole` in param with the `tokenPayload` roles according to their ACDB definition in read mode.
	 * 
	 * @param userRole 
	 * @param tokenPayload 
	 * @returns 
	 */
	private sanitizeUserRoleOnRead(userRole: UserRole, tokenPayload: any): UserRole {
		const permissions = this.accessControlService.getGrantedPermissions(
			tokenPayload.user.roles,
			[
				{ action: READ_ACTION, resource: ROLE_ASSIGNMENT },
			]
		);

		let allApplicableAttributes = find(permissions, { resource: ROLE_ASSIGNMENT }).attributes || [];

		return this.filterObj(allApplicableAttributes, userRole);
	}

	/**
	 * Sanitize the provided `role` in param with the `tokenPayload` roles according to their ACDB definition in update mode.
	 * 
	 * @param role 
	 * @param tokenPayload 
	 * @returns 
	 */
	private sanitizeRoleOnUpdate(role: Role, tokenPayload: any): Role {
		const permissions = this.accessControlService.getGrantedPermissions(
			tokenPayload.user.roles,
			[
				{ action: UPDATE_ACTION, resource: ROLE },
			]
		);

		let allApplicableAttributes = find(permissions, { resource: ROLE }).attributes || [];

		return this.filterObj(allApplicableAttributes, role);
	}
}
