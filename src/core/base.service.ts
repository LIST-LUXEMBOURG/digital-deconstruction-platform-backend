/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { ClassTransformOptions, plainToClass } from 'class-transformer';
import { isArray } from 'lodash';
import { Clause } from 'src/utils/search/clause';
import { Condition } from 'src/utils/search/condition';
import { Expression } from 'src/utils/search/expression';
import { Join } from 'src/utils/search/join';
import { Operator } from 'src/utils/search/operator';
import { Ordering, Select } from 'src/utils/search/select';
import { UploadFileDto } from '../file/dto/file.dto';
import { GetOneFileDto, MetadataResponse, StreamResponse } from '../file/dto/get-one-file.dto';
import { File } from '../file/entities/file.entity';
import {
    FWACallFct,
    FwaException
} from '../FWAjs-utils';
import { ApiAccessControlService } from '../FWAjs-utils/accessControl/accessControl.service';
import { Rule } from '../FWAjs-utils/utils/accessControl.interface';
import { ResourceTriplet } from '../FWAjs-utils/utils/auth.interface';
import { Project } from '../project/entities';
import { ProjectParticipant, Role } from '../project/participant/entities/projectParticipant.entity';
import { ACTION_NOT_ALLOWED_ON_RESOURCE } from './constants/messageCode.constants';

@Injectable()
export class BaseService {

    protected logger: Logger;

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //----------------------------------------------------------------------- 

    constructor(
        protected readonly jwtService: JwtService,
        protected readonly accessControlService: ApiAccessControlService,
        protected readonly moduleRef: ModuleRef,
        protected readonly eventEmitter: EventEmitter2,
    ) { }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Primitive(s)
    //***********************************************************************
    //-----------------------------------------------------------------------

    protected async getProject(projectId: number): Promise<Project> {
        return await FWACallFct(
            this,
            { srv: 'projectService', cmd: 'getProjectRaw' },
            {
                id: projectId,
            }
        );
    }

    //-----------------------------------------------------------------------

    protected async getParticipant(projectId, userId): Promise<ProjectParticipant> {
        return await FWACallFct(
            this,
            { srv: 'participantService', cmd: 'getParticipantRaw' },
            {
                projectId,
                userId
            }
        );
    }

    //-----------------------------------------------------------------------

    private hasPermissions(permissions, resource) {
        return permissions.find((permission) => permission.resource === resource,).attributes.length > 0;
    }

    //-----------------------------------------------------------------------

    private getPermissionAttributes(permissions, resource) {
        return permissions.find((permission) => permission.resource === resource,).attributes;
    }

    //-----------------------------------------------------------------------

    protected async filterGrantedAttributesForAction(token, projectId, action, resources: ResourceTriplet) {
        const tokenPayload = await this.jwtService.verifyAsync(token);

        let rules: Rule[] = [];
        Object.values(resources).forEach(resource => {
            if (!!resource)
                rules.push({ action: action, resource: resource });
        });

        const permissions = this.accessControlService.getGrantedPermissions(
            tokenPayload.user.roles, rules);

        let isProjectOwner = false;

        if (projectId) {
            let project = await this.getProject(projectId);
            let participant = await this.getParticipant(projectId, tokenPayload.user.id);

            let isProjectOwner = (resources.owned !== undefined) && (project.owner.id === tokenPayload.user.id);
            let isProjectContributor = (resources.shared !== undefined) && (!!participant && participant.role === Role.CONTRIBUTOR);

            if (
                !(this.hasPermissions(permissions, resources.global) ||
                    (this.hasPermissions(permissions, resources.owned) && isProjectOwner) ||
                    (this.hasPermissions(permissions, resources.shared) && isProjectContributor)
                )
            ) {
                {
                    throw FwaException({
                        code: HttpStatus.UNAUTHORIZED,
                        message: `Users with role(s): [${tokenPayload.user.roles}] are not allowed to ${action} ${resources.global}s in project with Id ${projectId}!`,
                        messageCode: ACTION_NOT_ALLOWED_ON_RESOURCE,
                        messageData: {
                            projectId: project.id,
                            action: action,
                            resources: resources
                        },
                    });
                }
            }

            let allApplicableAttributes = this.getPermissionAttributes(permissions, resources.global) || [];

            if (isProjectOwner) {
                allApplicableAttributes = [].concat(allApplicableAttributes, this.getPermissionAttributes(permissions, resources.owned) || []);
            }
            if (isProjectContributor) {
                allApplicableAttributes = [].concat(allApplicableAttributes, this.getPermissionAttributes(permissions, resources.shared) || []);
            }

            return allApplicableAttributes;
        }
    }

    //-----------------------------------------------------------------------

    protected filterQueryProperties(query: any, attributesFilter: any): [string, any][] {
        return Object.entries(query).filter(
            ([prop, value]) => {
                if (
                    attributesFilter.indexOf(prop) >= 0 &&
                    value !== undefined
                ) {
                    return [prop, value];
                }
            },
        );
    }

    //-----------------------------------------------------------------------

    protected buildFilterClause(entity: string, alias: string, query: any, attributesFilter: any, properties: string[], joins: Record<string, string>): Clause {

        let clause = new Clause();

        let options: ClassTransformOptions = {
            enableImplicitConversion: true
        };

        if (!isArray(query.selects)) {
            query.selects = (!!query.selects && query.selects.length > 0) ? [query.selects] : [];
        }

        if (!isArray(query.conditions)) {
            query.conditions = (!!query.conditions && query.conditions.length > 0) ? [query.conditions] : [];
        }

        attributesFilter.forEach((attribute) => {
            if (properties.indexOf(attribute) >= 0) {
                let match = query.selects.find(function (select) {
                    let candidate = plainToClass(Select, JSON.parse(select.toString()));
                    return (candidate.getField() === attribute);
                });

                let selectAlias = alias + '_' + attribute;

                if (!!match) {
                    let select = plainToClass(Select, JSON.parse(match.toString()));
                    select.setAlias(alias);
                    select.setSelectAlias(selectAlias);
                    clause.addSelect(select);
                } else {
                    let select = new Select(alias, attribute, selectAlias, Ordering.NONE);
                    clause.addSelect(select);
                }
            }
        })

        clause.addCondition(new Condition(entity, alias, 'projectId', new Expression(query.projectId, Operator.EQUAL)), Operator.AND);

        let dependencies: string[] = [];

        query.conditions.forEach((pojo) => {
            let condition = plainToClass(Condition, JSON.parse(pojo.toString()));
            let expression = plainToClass(Expression, condition.getExpression());
            let index = Object.keys(Operator).indexOf(expression.getOperator());
            let operator = Object.values(Operator)[index];

            if (operator === Operator.LIKE) {
                let value = expression.getValue();
                expression = new Expression(`%${value}%`, Operator.LIKE, true);
            } else {
                expression = new Expression(expression.getValue(), operator, false);
            }

            let field = condition.getField();
            if (properties.indexOf(field) < 0) {
                if (joins.keys.indexOf(field) >= 0) {
                    if (!dependencies.includes(field)) {
                        dependencies.push(field);
                    }
                }
            }
            clause.addCondition(new Condition(condition.getEntity(), alias, condition.getField(), expression), Operator.AND);
        })

        dependencies.forEach((dependency) => {
            let join = new Join(alias, dependency, joins[dependency], false);
            clause.addJoin(join);
        })

        return clause;
    }

    //-----------------------------------------------------------------------

    protected async uploadFile(dto: UploadFileDto): Promise<File> {

        const file = await FWACallFct(
            this,
            {
                srv: 'fileService',
                cmd: 'upload',
            },
            dto,
        );
        return file;
    }

    //-----------------------------------------------------------------------

    protected async updateFile(dto: UploadFileDto): Promise<File> {

        const file = await FWACallFct(
            this,
            {
                srv: 'fileService',
                cmd: 'update',
            },
            dto,
        );
        return file;
    }

    //-----------------------------------------------------------------------

    protected async streamFile(dto: GetOneFileDto): Promise<StreamResponse> {
        return await FWACallFct(
            this,
            {
                srv: 'fileService',
                cmd: 'stream',
            },
            { uuid: dto.uuid, token: dto.token },
        );
    }

    //-----------------------------------------------------------------------

    protected async getFileMetadata(dto: GetOneFileDto): Promise<MetadataResponse> {
        const metadata = await FWACallFct(
            this,
            {
                srv: 'fileService',
                cmd: 'metadata',
            },
            { uuid: dto.uuid, token: dto.token },
        );

        return metadata;
    }

    //-----------------------------------------------------------------------

    protected async deleteFile(dto: GetOneFileDto) {

        const result = await FWACallFct(
            this,
            {
                srv: 'fileService',
                cmd: 'delete',
            },
            { uuid: dto.uuid, token: dto.token },
        );

        if ('error' in result) throw result;
    }
}