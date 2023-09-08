/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { Factory, Seeder } from 'typeorm-seeding'
import { Connection } from 'typeorm'
import { Role, UserRole } from '../auth/role/entities'
import { User } from '../auth/user/entities/user.entity';


export default class AssignRoles implements Seeder {

    private async lookupUserId(connection: Connection, userName: string): Promise<any> {
        let user = await connection.createQueryBuilder()
            .select("user.id")
            .from(User, "user")
            .where("user.login = :userName")
            .setParameter("userName", userName)
            .getOne();
        return user.id;
    }

    private async lookupRoleId(connection: Connection, roleName: string): Promise<any> {
        let role = await connection.createQueryBuilder()
            .select("role.id")
            .from(Role, "role")
            .where("role.name = :roleName")
            .setParameter("roleName", roleName)
            .getOne();
        return role.id;
    }

    public async run(factory: Factory, connection: Connection): Promise<any> {

        await connection
            .createQueryBuilder()
            .insert()
            .into(UserRole)
            .values([
                {
                    userId: await this.lookupUserId(connection, 'sysAdmin'),
                    roleId: await this.lookupRoleId(connection, 'SysAdmin'),
                },
                {
                    userId: await this.lookupUserId(connection, 'userAdmin'),
                    roleId: await this.lookupRoleId(connection, 'UserAdmin'),
                },
                {
                    userId: await this.lookupUserId(connection, 'projectAdmin'),
                    roleId: await this.lookupRoleId(connection, 'ProjectAdministrator'),
                },
            ])
            .execute()
    }
}