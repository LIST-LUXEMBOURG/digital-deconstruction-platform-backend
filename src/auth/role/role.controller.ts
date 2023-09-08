/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import {
    Body,
    Controller, Get,
    Headers,
    Param, Put,
    UseGuards
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiConflictResponse, ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags
} from '@nestjs/swagger';
import {
    ApiAccessControl,
    ApiAccessGuard,
    ApiAuth,
    ApiAuthGuard,
    CREATE_ACTION,
    DELETE_ACTION,
    READ_ACTION,
    UPDATE_ACTION
} from '../../FWAjs-utils';
import { ROLE, ROLE_ASSIGNMENT } from './accessControl/resourcesName.constants';
import {
    RoleAssignDto, RoleDto, RoleRevokeDto,
    RoleUpdateDto,
    UserRolesGetDto
} from './dto';
// import { Role } from './entities';
import { RoleService } from './role.service';

@ApiTags('Authentication - Roles')
@Controller('roles')
@UseGuards(ApiAuthGuard, ApiAccessGuard)
export class RoleController {
    constructor(private readonly roleService: RoleService) { }

    // --- Assign a role ---
    @ApiOperation({
        summary:
            'Assign the role identified by roleID to the user identified by userId.',
        description:
            'A user can have any number of roles, but each role only once.\n\
				If the user already had that role assigned to him, return the (unaltered) role list.\n\
				Return the new list of roles assigned to the user.',
    })
    @ApiOkResponse({
        description: 'The role has been successfully assigned to the user.',
        type: RoleDto,
        isArray: true,
    })
    @ApiNotFoundResponse({
        description:
            'The **role ID** does not identify an existing role.\n\
			The **user ID** does not identify an existing user.',
    })
    @ApiBadRequestResponse({
        description:
            'The **role ID** is missing in the payload.\n\
			The **user ID** is missing in the payload.',
    })
    @ApiForbiddenResponse({ description: 'Not allowed to assign a role' })
    @Put('/assignRole')
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([{ action: CREATE_ACTION, resource: ROLE_ASSIGNMENT }])
    async assignRole(
        @Headers() { authorization },
        @Body() assignRoleDto: RoleAssignDto,
    ): Promise<RoleDto[]> {
        return await this.roleService.assignRole({
            token: authorization,
            ...assignRoleDto,
        });
    }

    // --- Revoke a role ---
    @ApiOperation({
        summary:
            'Revoke the role identified by roleID from the user identified by userId.',
        description:
            "i.e. remove it from the user's list of assigned roles.\n\
				After removing the user's last role, his role list is empty.\n\
				Return the new list of roles assigned to the user.",
    })
    @ApiOkResponse({
        description: 'The role has been successfully revoked from the user.',
        type: RoleDto,
        isArray: true,
    })
    @ApiNotFoundResponse({
        description:
            'The **role ID** does not identify an existing role.\n\
				The **user ID** does not identify an existing user.',
    })
    @ApiBadRequestResponse({
        description:
            'The **role ID** is missing in the payload.\n\
				The **user ID** is missing in the payload.',
    })
    @ApiForbiddenResponse({ description: 'Not allowed to revoke a role' })
    @Put('/revokeRole')
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([{ action: DELETE_ACTION, resource: ROLE_ASSIGNMENT }])
    async revokeRole(
        @Headers() { authorization },
        @Body() revokeRoleDto: RoleRevokeDto,
    ): Promise<RoleDto[]> {
        return await this.roleService.revokeRole({
            token: authorization,
            ...revokeRoleDto,
        });
    }

    // --- Update a role ---
    @ApiOperation({
        summary: 'Update the role identified by roleID.',
        description:
            'Modify all attributes of the role identified by the roleID.\n\
				Only the filled attributes are taken into account, all others are ignored.\n\
				The name must be unique in respect with all other role names.\n\
				Return the modified role object.',
    })
    @ApiOkResponse({
        description: 'The role has been successfully updated.',
        type: RoleDto,
    })
    @ApiNotFoundResponse({
        description: 'The **role ID** does not identify an existing role.',
    })
    @ApiBadRequestResponse({
        description: 'The **role ID** is missing in the payload.',
    })
    @ApiConflictResponse({
        description:
            'The **name** provided in the payload is not unique among all role names.',
    })
    @ApiForbiddenResponse({ description: 'Not allowed to update role' })
    @Put()
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([{ action: UPDATE_ACTION, resource: ROLE }])
    async updateRole(
        @Headers() { authorization },
        @Body() updateRoleDto: RoleUpdateDto,
    ): Promise<RoleDto> {
        return await this.roleService.update({
            token: authorization,
            ...updateRoleDto,
        });
    }

    // --- Delete a role ---
    // @ApiOperation({
    //     summary: 'Delete the role identified by roleID.',
    //     description:
    //         'Only roles that are not assigned to any user can be deleted. <br>\
    // 			Return the deleted role object.',
    // })
    // @ApiOkResponse({ description: 'The role has been successfully deleted.' })
    // @ApiNotFoundResponse({
    //     description: 'The **role ID** does not identify an existing role.',
    // })
    // @ApiBadRequestResponse({
    //     description: 'The **role ID** is missing in the payload.',
    // })
    // @ApiConflictResponse({
    //     description: 'The role is still associated with at least one user.',
    // })
    // @ApiForbiddenResponse({ description: 'Not allowed to delete a role' })
    // @Delete(':id')
    // @ApiAuth()
    // @ApiBearerAuth()
    // @ApiAccessControl([{ action: DELETE_ACTION, resource: ROLE }])
    // async deleteRole(
    //     @Headers() { authorization },
    //     @Param() id: RoleDeleteDto,
    // ): Promise<RoleDto> {
    //     return await this.roleService.delete({ token: authorization, ...id });
    // }

    // --- List the roles ---
    @ApiOperation({
        summary: 'Return a list containing all existing role objects.',
        description: 'If there is no role defined, return the empty list [].',
    })
    @ApiOkResponse({
        description: 'The roles have been successfully listed.',
        type: RoleDto,
        isArray: true
    })
    @ApiForbiddenResponse({ description: 'Not allowed to list roles' })
    @Get('/list')
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([{ action: READ_ACTION, resource: ROLE }])
    async getAllRoles(@Headers() { authorization }): Promise<RoleDto[]> {
        return await this.roleService.getAll({ token: authorization });
    }

    // --- Get a user roles ---
    @ApiOperation({
        summary:
            'Return the list of roles that are currently assigned to the user identified by userId.',
        description: `Return the empty list [] if the user hasn't any roles assigned to him.`,
    })
    @ApiOkResponse({
        description: 'The roles have been successfully listed for the user.',
        type: RoleDto,
        isArray: true,
    })
    @ApiNotFoundResponse({
        description: 'The **user ID** does not identify an existing user.',
    })
    @ApiForbiddenResponse({ description: `Not allowed to list a user's roles` })
    @Get('/userRoles/:userId')
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([{ action: READ_ACTION, resource: ROLE_ASSIGNMENT }])
    async getUserRoles(
        @Headers() { authorization },
        @Param() payload: UserRolesGetDto,
    ): Promise<RoleDto[]> {
        return await this.roleService.getUserRoles({
            token: authorization,
            ...payload,
        });
    }

    // TODO: /currentUserRole ??
}
