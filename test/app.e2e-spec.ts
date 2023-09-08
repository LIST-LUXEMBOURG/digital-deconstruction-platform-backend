/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Connection, ConnectionManager, createConnection, getConnection, getConnectionManager, getConnectionOptions } from 'typeorm';
import { AppModule } from './../src/app.module';


describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {

    // let connection: Connection;
    // const manager = getConnectionManager();
    // if (manager.has('default')) {
    //   console.log("Default connection appears to exist!");
    // } else {
    //   connection = await createConnection();
    //   console.log("Default connection created!");
    //   if (!connection.isConnected) {
    //     await connection.connect();
    //     console.log("Default connection established!");
    //     console.log(connection.options);
    //   } else {
    //     console.log("Default connection already connected!");
    //     console.log(connection.options);
    //   }
    // }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    // app = moduleFixture.createNestApplication();
    // await app.init();
  });

  // afterAll(async () => {
  //   await Promise.all([
  //     app.close(),
  //   ])
  // });

  it('Test Setup', () => { })

  // it('/ (GET)', () => {
  //   return request(app.getHttpServer())
  //     .get('/')
  //     .expect(200);
  // });
});
