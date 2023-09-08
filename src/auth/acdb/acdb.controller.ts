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
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import {
    ApiAccessControl,
    ApiAccessGuard,
    ApiAuth,
    ApiAuthGuard,
    READ_ACTION,
} from '../../FWAjs-utils';
import { ApiAccessControlService } from '../../FWAjs-utils/accessControl/accessControl.service';
import {
    FilterNameDto,
    MultipleAccessControlQuery,
    ResourceNameDto,
    RolePrivilegesDto,
    SingleAccessControlQuery,
} from '../../FWAjs-utils/accessControl/dto';
import {
    ACDB,
    ACDB_RESOURCE,
    RESOURCE_PRIVILEGES,
    ROLE_PRIVILEGES,
} from './accessControl/resourceName.constants';

@ApiTags('Authentication - Access Control Database')
@Controller('acdb')
@UseGuards(ApiAuthGuard, ApiAccessGuard)
export class AcdbController {
    constructor(private readonly acdbService: ApiAccessControlService) { }

    @ApiOperation({
        summary: 'Single access control query',
        description: `Queries the access control database (ACDB) \
			if the connected user has <b>accessType</b> (one of  create, read, update, delete) \
			on a given <b>resourceName</b>. Returns an access query response object \
			with 3 or 4 attributes: { accessType, resourceName, hasAccess, [filteringAttributes] }.\
			accessType and resourceName are identical to the request arguments of the same name,\
			hasAccess is the query result (true or false)\
			and filteringAttributes  is present if hasAccess is 'true' \
			and contains the list of allowed attributes for the user according to the specified \
			pair accessTypeN / resourceNameN.`,
    })
    @ApiOkResponse({
        description: 'The acdb query has been answered',
    })
    @ApiBadRequestResponse({
        description:
            'Bad accessType request. Must be one of {create,read,update,delete}',
    })
    @ApiForbiddenResponse({
        description: 'Not allowed to perform access control queries',
    })
    @Get()
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([{ action: READ_ACTION, resource: ACDB }])
    async singleAccessControlQuery(
        @Headers() { authorization },
        @Query() singleAccessControl: SingleAccessControlQuery,
    ) {
        return this.acdbService.getAccessControlOnSingleResource({
            token: authorization,
            ...singleAccessControl,
        });
    }

    @ApiOperation({
        summary: 'Multiple access control query',
        description: `Queries the access control database (ACDB) <
			if the connected user has one or more <b>accessTypeN</b> (one of  create, read, update, delete) \
			for given <b>resourceNameN</b>. Returns a list of access query response objects, \
			one for each query accessTypeN / resourceNameN. \
			Each object has 3 or 4 attributes: \
			{ accessType, resourceName, hasAccess, [filteringAttributes] }.\
			The values of accessType and resourceName are identical to the Nth request pair accessTypeN \
			/ resourceNameN, respectively, \
			hasAccess (true or false) is the query result for that Nth request,\
			filteringAttributes is present if hasAccess is 'true' \
			and contains the list of allowed attributes for the user according to the specified \
			pair accessTypeN / resourceNameN.\
			This is equivalent of performing several GET /acdb requests sequentially, \
			and sending the result back in one list.`,
    })
    @ApiOkResponse({
        description: 'The access request has been answered',
    })
    @ApiBadRequestResponse({
        description:
            'Malformed POST request body. See “message”  for more details.',
    })
    @ApiForbiddenResponse({
        description: 'Not allowed to perform access control queries',
    })
    @Post()
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([{ action: READ_ACTION, resource: ACDB }])
    async multipleAccessControlQuery(
        @Headers() { authorization },
        @Body() multipleAccessControl: MultipleAccessControlQuery,
    ) {
        return await this.acdbService.getAccessControlOnMultipleResources({
            token: authorization,
            ...multipleAccessControl,
        });
    }

    @ApiOperation({
        summary: 'List Access Privileges for Given Role',
        description: `Return a description of the access control \
			privileges associated with a given role.\
			The role can be identified either by its %roleID (number), or by its %roleName (string).\
			The parameters are mandatory but mutually exclusive,\
			i.e. one of them must be provided, never both.`,
    })
    @ApiOkResponse({ description: 'The roles have been successfully listed.' })
    @ApiForbiddenResponse({
        description: 'Not allowed to see role privileges',
    })
    @ApiNotFoundResponse({
        description:
            'Role with ID does not exist: {%roleID} \n\
			Role with Name does not exist: {%roleName}',
    })
    @ApiBadRequestResponse({
        description:
            'Only one of roleID or roleName should be provided \n\
			Missing roleID or roleName',
    })
    @Get('/rolePrivileges/json')
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([{ action: READ_ACTION, resource: ROLE_PRIVILEGES }])
    async listRolesPrivilegesJSON(
        @Headers() { authorization },
        @Query() params: RolePrivilegesDto,
    ) {
        return await this.acdbService.listRolesPrivilegesJSON({
            token: authorization,
            ...params,
        });
    }

    @ApiOperation({
        summary: 'List Access Privileges for Given Role',
        description: `Return a description of the access control \
			privileges associated with a given role.\
			The role can be identified either by its %roleID (number), or by its %roleName (string).\
			The parameters are mandatory but mutually exclusive,\
			i.e. one of them must be provided, never both.`,
    })
    @ApiOkResponse({ description: 'The roles have been successfully listed.' })
    @ApiForbiddenResponse({
        description: 'Not allowed to see role privileges',
    })
    @ApiNotFoundResponse({
        description:
            'Role with ID does not exist: {%roleID} \n\
			Role with Name does not exist: {%roleName}',
    })
    @ApiBadRequestResponse({
        description:
            'Only one of roleID or roleName should be provided \n\
			Missing roleID or roleName',
    })
    @Get('/rolePrivileges/yaml')
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([{ action: READ_ACTION, resource: ROLE_PRIVILEGES }])
    async listRolesPrivilegesYAML(
        @Headers() { authorization },
        @Query() params: RolePrivilegesDto,
    ) {
        return await this.acdbService.listRolesPrivilegesYAML({
            token: authorization,
            ...params,
        });
    }

    @ApiOperation({
        summary: 'Listing acdb resources',
        description: `Return the filtered list of acdb resources \
			based on the 'filterName' param in the query.\n\
			If no filterName is provided, return all the acdb resources`,
    })
    @ApiOkResponse({
        description: 'The acdb query has been answered',
    })
    @ApiForbiddenResponse({
        description: 'Not allowed to perform access control queries',
    })
    @Get('/resource/list')
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([{ action: READ_ACTION, resource: ACDB_RESOURCE }])
    async listFilteredResources(@Query() params: FilterNameDto) {
        return await this.acdbService.listFilteredResources(params);
    }

    @ApiOperation({
        summary: 'Listing a resources\' privileges in JSON format',
        description: `Returns a JSON description of the privileges associated with the resource`,
    })
    @ApiOkResponse({
        description: 'The resource privileges have been returned',
    })
    @ApiNotFoundResponse({
        description: 'Resource XYZ does not exist',
    })
    @ApiForbiddenResponse({
        description: 'Not allowed to see resource privileges',
    })
    @Get('/resourcePrivileges/json')
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([{ action: READ_ACTION, resource: RESOURCE_PRIVILEGES }])
    async getResourcePrivilegesJSON(@Query() params: ResourceNameDto) {
        return await this.acdbService.listResourcePrivilegesJSON(params);
    }

    @ApiOperation({
        summary: 'Listing a resource privileges in YAML format',
        description: `Returns a YAML description of the privileges associated with the resource`,
    })
    @ApiOkResponse({
        description: 'The resource privileges have been returned',
    })
    @ApiNotFoundResponse({
        description: 'Resource XYZ does not exist',
    })
    @ApiForbiddenResponse({
        description: 'Not allowed to see resource privileges',
    })
    @Get('/resourcePrivileges/yaml')
    @ApiAuth()
    @ApiBearerAuth()
    @ApiAccessControl([{ action: READ_ACTION, resource: RESOURCE_PRIVILEGES }])
    async getResourcePrivilegesYAML(@Query() params: ResourceNameDto) {
        return await this.acdbService.listResourcePrivilegesYAML(params);
    }
}
