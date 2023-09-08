/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { HttpException, HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { Timeout } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from '../core/base.service';
import { CREATE_ACTION, DELETE_ACTION, dispatchACDBs, FwaException, onModuleDynamicInit, READ_ACTION, UPDATE_ACTION } from '../FWAjs-utils';
import { ApiAccessControlService } from '../FWAjs-utils/accessControl/accessControl.service';
import { ResourceTriplet } from '../FWAjs-utils/utils/auth.interface';
import { Repository } from 'typeorm';
import { OWN_PROJECT_3D_SCAN_CONFIG, PARTICIPATING_PROJECT_3D_SCAN_CONFIG, PROJECT_3D_SCAN_CONFIG } from './accessControl/resourcesName.constants';
import { CANNOT_CREATE_PROJECT_SCAN_CONFIG, CANNOT_DELETE_PROJECT_SCAN_CONFIG, CANNOT_LIST_PROJECT_SCAN_CONFIG, CANNOT_READ_PROJECT_SCAN_CONFIG, CANNOT_UPDATE_PROJECT_SCAN_CONFIG, PROJECT_SCAN_CONFIG_NOT_FOUND } from './constants/messageCode.constants';
import { CreateScanConfigDto } from './dto/create-scan-config.dto';
import { DeleteScanConfigDto } from './dto/delete-scan-config.dto';
import { ScanConfigGetOneDto } from './dto/get-one-scan-config.dto';
import { ListScanConfigDto } from './dto/list-scan-config.dto';
import { ScanConfigDto } from './dto/scan-config.dto';
import { UpdateScanConfigDto } from './dto/update-scan-config.dto';
import { ScanConfig } from './entities/scan-config.entity';

@Injectable()
export class Scan3dConfigService extends BaseService implements OnModuleInit {

    private readonly RESOURCES = <ResourceTriplet>{
        global: PROJECT_3D_SCAN_CONFIG,
        owned: OWN_PROJECT_3D_SCAN_CONFIG,
        shared: PARTICIPATING_PROJECT_3D_SCAN_CONFIG
    };

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //----------------------------------------------------------------------- 

    constructor(
        @InjectRepository(ScanConfig)
        protected readonly Scan3dConfigRepo: Repository<ScanConfig>,
        protected readonly accessControlService: ApiAccessControlService,
        protected readonly jwtService: JwtService,
        protected readonly moduleRef: ModuleRef,
        protected readonly eventEmitter: EventEmitter2,
    ) { super(jwtService, accessControlService, moduleRef, eventEmitter); }

    //----------------------------------------------------------------------- 

    async onModuleInit() {
        await onModuleDynamicInit(this, null, [
            'projectService',
            'participantService'
        ]);
    }

    //----------------------------------------------------------------------- 

    @Timeout(2000)
    async sendACDB() {
        dispatchACDBs(
            this,
            (await import('./accessControl/accessControl.database')).default,
        );
    }
    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Primitives
    //***********************************************************************
    //-----------------------------------------------------------------------

    private sanitizeResponse(entity: any, attributes: any): ScanConfigDto {

        return ScanConfig.toDto(entity);
    }

    //----------------------------------------------------------------------- 

    public async getScanConfigRaw({ id }: { id: number }): Promise<ScanConfig> {
        try {
            return await this.Scan3dConfigRepo.findOneOrFail({
                where: { id },
                relations: ['project']
            });
        } catch (error) {
            throw FwaException({
                code: HttpStatus.NOT_FOUND,
                message: 'The project scan config was not found',
                messageCode: PROJECT_SCAN_CONFIG_NOT_FOUND,
                messageData: {
                    id: id,
                },
            });
        }
    }

    //----------------------------------------------------------------------- 

    public async getScanConfigByProject({ projectId }: { projectId: number }): Promise<ScanConfig> {
        try {
            return await this.Scan3dConfigRepo.findOneOrFail({
                where: { project: { id: projectId } },
                relations: ['project']
            });
        } catch (error) {
            throw FwaException({
                code: HttpStatus.NOT_FOUND,
                message: 'The project scan config was not found',
                messageCode: PROJECT_SCAN_CONFIG_NOT_FOUND,
                messageData: {
                    projectId: projectId,
                },
            });
        }
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Service API
    //***********************************************************************
    //-----------------------------------------------------------------------

    async createScanConfig({ token, ...dto }: CreateScanConfigDto): Promise<ScanConfigDto> {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, CREATE_ACTION, this.RESOURCES);

            let sanitizedDto = this.accessControlService.filter(dto, attributesFilter);

            let scanConfig = this.Scan3dConfigRepo.create();
            Object.assign(scanConfig, { ...sanitizedDto });
            scanConfig.project = await this.getProject(dto.projectId);

            // Delete previously existing scan config => replace mode
            await this.Scan3dConfigRepo.delete({ project: { id: dto.projectId } });

            const { id } = await this.Scan3dConfigRepo.save(scanConfig);

            scanConfig = await this.getScanConfigRaw({ id });
            return this.sanitizeResponse(scanConfig, attributesFilter);
        } catch (error) {

            console.error(error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;

            throw FwaException({
                message: 'Cannot create project scan configuration',
                messageCode: CANNOT_CREATE_PROJECT_SCAN_CONFIG,
            });
        }
    }

    //-----------------------------------------------------------------------

    async listScanConfig({ token, ...dto }: ListScanConfigDto): Promise<ScanConfigDto[]> {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, READ_ACTION, this.RESOURCES);

            let scanConfigs = await this.Scan3dConfigRepo.find({ where: { project: { id: dto.projectId } } });
            let results: ScanConfigDto[] = [];
            if (!!scanConfigs) {
                scanConfigs.forEach(config => {
                    results.push(this.sanitizeResponse(config, attributesFilter))
                })
            }
            return results;
        } catch (error) {

            console.error(error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;

            throw FwaException({
                message: 'Cannot list project scan configuration',
                messageCode: CANNOT_LIST_PROJECT_SCAN_CONFIG,
            });
        }
    }

    //-----------------------------------------------------------------------

    async getScanConfig({ token, ...dto }: ScanConfigGetOneDto): Promise<ScanConfigDto> {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, READ_ACTION, this.RESOURCES);

            let scanConfig = await this.getScanConfigRaw({ id: dto.scanConfigId });
            return this.sanitizeResponse(scanConfig, attributesFilter);
        } catch (error) {

            console.error(error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;

            throw FwaException({
                message: 'Cannot read project scan configuration',
                messageCode: CANNOT_READ_PROJECT_SCAN_CONFIG,
            });
        }
    }

    //-----------------------------------------------------------------------

    async updateScanConfig({ token, ...dto }: UpdateScanConfigDto): Promise<ScanConfigDto> {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, UPDATE_ACTION, this.RESOURCES);

            let sanitizedDto = this.accessControlService.filter(dto, attributesFilter);

            let scanConfig = await this.getScanConfigRaw({ id: dto.scanConfigId });
            Object.assign(scanConfig, { ...sanitizedDto });
            const { id } = await this.Scan3dConfigRepo.save(scanConfig);

            scanConfig = await this.getScanConfigRaw({ id });
            return this.sanitizeResponse(scanConfig, attributesFilter);
        } catch (error) {

            console.error(error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;

            throw FwaException({
                message: 'Cannot update the project scan configuration',
                messageCode: CANNOT_UPDATE_PROJECT_SCAN_CONFIG,
            });
        }
    }

    //-----------------------------------------------------------------------

    async deleteScanConfig({ token, ...dto }: DeleteScanConfigDto): Promise<ScanConfigDto> {
        try {
            const attributesFilter = await this.filterGrantedAttributesForAction(token, dto.projectId, DELETE_ACTION, this.RESOURCES);

            let scanConfig = await this.getScanConfigRaw({ id: dto.scanConfigId });
            await this.Scan3dConfigRepo.delete(scanConfig);
            return this.sanitizeResponse(scanConfig, attributesFilter);
        } catch (error) {

            console.error(error);
            if (error instanceof HttpException || error instanceof RpcException)
                throw error;

            throw FwaException({
                message: 'Cannot delete the project scan configuration',
                messageCode: CANNOT_DELETE_PROJECT_SCAN_CONFIG,
            });
        }
    }

    //-----------------------------------------------------------------------
}
