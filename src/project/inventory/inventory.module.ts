/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { jwt } from '../../auth/auth/strategy/jwt.constants';

import { Material } from './entities/material.entity';
import { MaterialType } from './entities/material-type.entity';
import { Element } from './entities/element.entity';

import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryElementService } from './inventory-element.service';
import { InventoryElementTypeService } from './inventory-element-type.service';
import { InventoryMaterialService } from './inventory-material.service';

import { InventoryElementController } from './inventory-element.controller';
import { InventoryMaterialController } from './inventory-material.controller';
import { InventoryElementTypeController } from './inventory-element-type.controller';
import { PointOfInterest } from '../../scan/entities/point-of-interest.entity';
import { ForgeIfcMapping } from './entities/forge-ifc-mapping.entity';
import { Property } from '../../core/entities/property.entity';
import { PropertyType } from '../../core/entities/property-type.entity';
import { PropertyUnit } from '../../core/entities/property-unit.entity';
import { InventoryFileService } from './inventory-file.service';
import { InventoryFileController } from './inventory-file.controller';
import { InventoryFile } from './entities/inventory-file.entity';
import { InventoryMaterialTypeService } from './inventory-material-type.service';
import { InventoryMaterialTypeController } from './inventory-material-type.controller';
import { ElementType } from './entities/element-type.entity';
import { Circularity } from '../../circularity/entities/circularity.entity';
import { InventoryCircularityService } from '../../circularity/inventory-circularity.service';
import { InventoryCircularityController } from '../../circularity/inventory-circularity.controller';
import { PassportFile } from '../../circularity/entities/passport-file.entity';
import { PassportFileService } from '../../circularity/passport-file.service';
import { PassportFileController } from '../../circularity/passport-file.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Material,
            Element,
            ElementType,
            MaterialType,
            PointOfInterest,
            Property,
            PropertyType,
            PropertyUnit,
            ForgeIfcMapping,
            InventoryFile,
            Circularity,
            PassportFile
        ]),
        JwtModule.register(jwt),
    ],
    providers: [
        InventoryService,
        InventoryElementService,
        InventoryMaterialService,
        InventoryMaterialTypeService,
        InventoryElementTypeService,
        InventoryFileService,
        InventoryCircularityService,
        PassportFileService

    ],
    controllers: [
        InventoryController,
        InventoryElementController,
        InventoryMaterialController,
        InventoryMaterialTypeController,
        InventoryElementTypeController,
        InventoryFileController,
        InventoryCircularityController,
        PassportFileController

    ],
})
export class InventoryModule { }
