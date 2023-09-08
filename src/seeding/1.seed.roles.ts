/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { Factory, Seeder } from 'typeorm-seeding'
import { Connection } from 'typeorm'
import { Role } from '../auth/role/entities'

export default class CreateRoles implements Seeder {
    public async run(factory: Factory, connection: Connection): Promise<any> {
        await connection
            .createQueryBuilder()
            .insert()
            .into(Role)
            .values([
                { name: 'UserAdmin', longName: 'User administrator', description: 'An administrator who can create and update users as well as block, unblock and disconnect them. He can also assign roles to users.' },
                { name: 'BasicUser', longName: 'Basic User', description: 'The default user role who can access DDC projects in which he is involve - as an owner, contributor or guest.' },
                { name: 'Guest', longName: 'Guest', description: 'Obsolete Role' },
                { name: 'SysAdmin', longName: 'System administrator', description: 'A system administrator has access to system critical resources, such as roles and access rights. He manages system preferences and can, in general, perform system critical operations.' },
                { name: 'ProjectAdministrator', longName: 'Project administrator', description: 'Creates and initializes DDC projects, and in general can do whatever a project owner does, but for all projects. He can also delete projects and assign a new owner to any project.' },
                { name: 'ProjectManager', longName: 'Project manager', description: 'Creates new deconstruction projects. By doing so, he becomes the new project’s initial owner. As project owner he can do all kind of project management activities, which are nevertheless limited to his own projects.' },
            ])
            .execute()
    }
}