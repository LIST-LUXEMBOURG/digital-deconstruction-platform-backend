/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import {
    HttpException,
    HttpStatus,
    Injectable,
    OnModuleInit,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';

// node-fetch @2.6 is the latest version available in "require" mode, version >2 use ESM imports and generate an error in NestJS.
import fetch from 'node-fetch';
import { Repository } from 'typeorm';

import { URLSearchParams } from 'url';
import { FwaException, onModuleDynamicInit } from '../../FWAjs-utils';
import {
    AUTODESK_AUTHENTICATION_FAILED,
    AUTODESK_CANNOT_SAVE_CREDENTIALS,
    AUTODESK_CREDENTIALS_NOT_FOUND,
} from './constants/messageCode.constants';
import {
    AutodeskAccessTokenRequest,
    AutodeskAccessTokenResponse,
} from './dto/autodesk-access-token.dto';
import {
    AutodeskCredentials,
} from './dto/autodesk-credentials.dto';
import { CreateAutodeskCredentialsDto } from './dto/create-autodesk-credentials.dto';
import { BimModel } from './entity/bim-model.entity';
var ProxyAgent = require('proxy-agent');

@Injectable()
export class BimModelService implements OnModuleInit {
    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //----------------------------------------------------------------------- 

    constructor(
        @InjectRepository(BimModel)
        private readonly bimModelRepo: Repository<BimModel>,
        private readonly moduleRef: ModuleRef,
    ) { }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Primitive(s)
    //***********************************************************************
    //-----------------------------------------------------------------------    

    async onModuleInit() {
        await onModuleDynamicInit(this, null, ['projectService']);
    }

    //-----------------------------------------------------------------------

    private async authenticate(payload: AutodeskCredentials): Promise<AutodeskAccessTokenResponse> {
        const params = new URLSearchParams(payload.toAutodesk()).toString();
        const autodeskURL = `https://developer.api.autodesk.com/authentication/v1/authenticate`;
        var proxy = undefined;

        if (process.env.HTTPS_PROXY) {
            proxy = new ProxyAgent(process.env.HTTPS_PROXY);
        }

        const response = await fetch(autodeskURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
            agent: proxy
        });

        return await response.json();
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Service API
    //***********************************************************************
    //----------------------------------------------------------------------- 

    public async getAutodeskAccessToken({
        token,
        projectId,
    }: AutodeskAccessTokenRequest): Promise<AutodeskAccessTokenResponse> {
        try {
            // Check if token is valid (the usual bla bla thing)
            // TODO check if project exists before going further.

            const record: Partial<BimModel> = await this.bimModelRepo.findOne({
                project: { id: projectId },
            });

            if (!record)
                throw FwaException({
                    code: HttpStatus.NOT_FOUND,
                    message: 'Autodesk credentials not found',
                    messageCode: AUTODESK_CREDENTIALS_NOT_FOUND,
                });

            const autodeskCredentials =
                AutodeskCredentials.fromDatabase(record);

            const response = await this.authenticate(autodeskCredentials);

            if ('errorCode' in response) {
                throw FwaException({
                    code: HttpStatus.NOT_FOUND,
                    message: 'Autodesk credentials not found',
                    messageCode: AUTODESK_CREDENTIALS_NOT_FOUND,
                    messageData: {},
                });
            }

            let res = autodeskCredentials.toResponse(response);
            return res;
        } catch (error) {
            console.log(error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            throw FwaException({
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Get Autodesk access_token failed',
                messageCode: AUTODESK_AUTHENTICATION_FAILED,
                messageData: {},
            });
        }
    }

    //----------------------------------------------------------------------- 

    public async saveAutodeskCredentials({
        token,
        ...dto
    }: CreateAutodeskCredentialsDto): Promise<AutodeskAccessTokenResponse> {
        // TODO check token and get the current user.

        try {
            // Check if the bim model record exists in the database
            const record: Partial<BimModel> = await this.bimModelRepo.findOne({
                project: { id: dto.projectId },
            });

            // Create an Autodesk credentials object based on the given params.
            const autodeskCredentials = new AutodeskCredentials(dto);

            // Try to get an access_token from the Autodesk API
            let response = await this.authenticate(autodeskCredentials);

            if ('errorCode' in response) {
                throw FwaException({
                    code: HttpStatus.NOT_FOUND,
                    message: 'Autodesk credentials not found',
                    messageCode: AUTODESK_CREDENTIALS_NOT_FOUND,
                    messageData: {},
                });
            }

            // if response ok then continue and save in the database
            let newRecord = autodeskCredentials.toDatabase(dto.projectId);
            let updatedRecord;
            if (record) updatedRecord = { ...newRecord, id: record.id };
            else updatedRecord = newRecord;

            await this.bimModelRepo.save(updatedRecord);

            return autodeskCredentials.toResponse(response);
            // else throw an error
        } catch (error) {
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;
            throw FwaException({
                code: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Save Autodesk credentials failed',
                messageCode: AUTODESK_CANNOT_SAVE_CREDENTIALS,
                messageData: {},
            });
        }
    }

    public async removeAutodeskCredentials() { }

    // private


}
