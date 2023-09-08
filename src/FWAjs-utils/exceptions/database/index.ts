/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { handler as mysqlHandler } from './mysql';
import { handler as mariadbHandler } from './mariadb';
import { handler as typeormHandler } from './typeorm';

export enum DatabaseQueryDriver {
    mariadb,
    mysql,
    typeorm,
    // postgres,
    // mssql,
    // oracle
}

export default function DatabaseQueryError(
    driver: string | DatabaseQueryDriver,
) {
    switch (driver) {
        case DatabaseQueryDriver.mariadb:
            return mariadbHandler;

        case DatabaseQueryDriver.mysql:
            return mysqlHandler;

        case DatabaseQueryDriver.typeorm:
            return typeormHandler;
        default:
            throw new Error('Database engine not found!');
    }
}
