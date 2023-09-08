/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { User } from "../auth/user/entities/user.entity";
import { Connection } from "typeorm";
import { Factory, Seeder } from "typeorm-seeding";

export default class CreateUsers implements Seeder {
    public async run(factory: Factory, connection: Connection): Promise<any> {
        await connection
            .createQueryBuilder()
            .insert()
            .into(User)
            .values([
                {
                    login: 'sysAdmin',
                    password: 'H4sIAAAAAAAAAwEgAN//lZbW57UoDd4pd1HQTVXOcCOuothGmCr2eZVNi6qzUUZK8riMIAAAAA==',
                    salt: 'a4664d12926402b0',
                    name: 'Manager',
                    firstName: 'System',
                    email: 'sysadmin@list.lu',
                    active: true,
                    blocked: false,
                    blockingReason: null
                },
                {
                    login: 'userAdmin',
                    password: 'H4sIAAAAAAAAAxOPqbX833/olrncU2/D6nIJ36YZMxrX/MyRUFm6Z3uhkycApr05pyAAAAA=',
                    salt: 'b6e31b7e30fa07b9',
                    name: 'Administrator',
                    firstName: 'User',
                    email: 'user.admin@list.lu',
                    active: true,
                    blocked: false,
                    blockingReason: null
                },
                {
                    login: 'projectAdmin',
                    password: 'H4sIAAAAAAAAAwEgAN//XfPRyCKUaEcHPAbIU7D71rGKg34H1gl0NuLKWqKZmLpgoCEoIAAAAA==',
                    salt: '8c5b01df6ce51d48',
                    name: 'Administrator',
                    firstName: 'Project',
                    email: 'project.admininstrator@list.lu',
                    active: true,
                    blocked: false,
                    blockingReason: null
                }
            ])
            .execute()
    }
}