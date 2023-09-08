/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { NestApplicationOptions, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as helmet from 'helmet';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { ScanModule } from './scan.module'
import { BambModule } from './bamb.module';
import { HttpsOptions } from '@nestjs/common/interfaces/external/https-options.interface';
import 'reflect-metadata';


function getHttpsOptions(): HttpsOptions {
    const privateKey = fs.readFileSync(process.env.SSL_KEY_PATH, 'utf8');
    const certificate = fs.readFileSync(process.env.SSL_CERT_PATH, 'utf8');
    const httpsOptions = { key: privateKey, cert: certificate };
    return httpsOptions;
}

async function bootstrapAppModule(useHttps: boolean) {

    const app = (useHttps) ? await NestFactory.create(AppModule, { httpsOptions: getHttpsOptions() }) : await NestFactory.create(AppModule);

    // swagger
    const options = new DocumentBuilder()
        .setTitle('DDC Platform Web API')
        .setDescription(
            `All protected routes are using a bearer token authentication scheme.\n\ ` +
            `In case of problems with the token or the user's connection state, one of the following ` +
            `messages may occur on any of the protected routes : \n\n\ ` +
            `* 407 Proxy Authentication Required \n\ ` +
            `Possible causes : token missing, invalid token, token expired \n\ ` +
            `* 401 Unauthorized \n\ ` +
            `Possible causes : User not logged in, user disconnected, or deactivated \n\n\ ` +
            `In those cases, see the specific error messages for more details.`,
        )
        .setVersion(process.env.VERSION)
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('api', app, document, {
        swaggerOptions: {
            tagsSorter: 'alpha',
            operationsSorter: 'alpha',
        },
    });

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: false,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    //app.useLogger(app.get(BaseLoggerService));

    // app.useGlobalPipes(
    // 	new JoifulValidationPipe({
    // 		whitelist: true, // Allows unknown attributes in DTOs
    // 		// Casts the controller function payload into a DTO instance (instead of a simple JS object)
    // 		transform: true,
    // 		transformOptions: {
    // 			enableImplicitConversion: true,
    // 		},
    // 	}),
    // );

    app.enableCors({ origin: '*' });
    app.use(helmet());

    await app.listen(3000);
}

async function bootstrapScanModule(useHttps: boolean) {

    const scanModule = (useHttps) ? await NestFactory.create(ScanModule, { httpsOptions: getHttpsOptions() }) : await NestFactory.create(ScanModule);

    // swagger
    const options = new DocumentBuilder()
        .setTitle('DDC Platform - 3DScan Module')
        .setDescription(
            `All protected routes are using a bearer token authentication scheme.\n\ ` +
            `In case of problems with the token or the user's connection state, one of the following ` +
            `messages may occur on any of the protected routes : \n\n\ ` +
            `* 407 Proxy Authentication Required \n\ ` +
            `Possible causes : token missing, invalid token, token expired \n\ ` +
            `* 401 Unauthorized \n\ ` +
            `Possible causes : User not logged in, user disconnected, or deactivated \n\n\ ` +
            `In those cases, see the specific error messages for more details.`,
        )
        .setVersion(process.env.VERSION)
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(scanModule, options);
    SwaggerModule.setup('api', scanModule, document, {
        swaggerOptions: {
            tagsSorter: 'alpha',
            operationsSorter: 'alpha',
        },
    });

    scanModule.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    scanModule.enableCors({ origin: '*' });
    scanModule.use(helmet());

    await scanModule.listen(4000);
}

async function bootstrapBambModule(useHttps: boolean) {

    const bambModule = (useHttps) ? await NestFactory.create(BambModule, { httpsOptions: getHttpsOptions() }) : await NestFactory.create(BambModule);

    // swagger
    const options = new DocumentBuilder()
        .setTitle('DDC Platform - Bamb Module')
        .setDescription(
            `**Building as Material Bank Module** \n\n\ ` +
            `All protected routes are using a bearer token authentication scheme.\n\ ` +
            `In case of problems with the token or the user's connection state, one of the following ` +
            `messages may occur on any of the protected routes : \n\n\ ` +
            `* 407 Proxy Authentication Required \n\ ` +
            `Possible causes : token missing, invalid token, token expired \n\ ` +
            `* 401 Unauthorized \n\ ` +
            `Possible causes : User not logged in, user disconnected, or deactivated \n\n\ ` +
            `In those cases, see the specific error messages for more details.`,
        )
        .setVersion(process.env.VERSION)
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(bambModule, options);
    SwaggerModule.setup('api', bambModule, document, {
        swaggerOptions: {
            tagsSorter: 'alpha',
            operationsSorter: 'alpha',
        },
    });

    bambModule.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    bambModule.enableCors({ origin: '*' });
    bambModule.use(helmet());

    await bambModule.listen(4100);
}

if (!!process.env.MAIN_MODULE) {
    bootstrapAppModule(process.env.MAIN_MODULE === 'https');
}

if (!!process.env.SCAN_MODULE) {
    bootstrapScanModule(process.env.SCAN_MODULE === 'https');
}

if (!!process.env.BAMB_MODULE) {
    bootstrapBambModule(process.env.BAMB_MODULE === 'https');
}