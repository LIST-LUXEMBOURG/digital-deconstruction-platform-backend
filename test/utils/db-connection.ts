import { createConnection } from "typeorm"


export async function createDatabaseConnection(name: string = 'default') {
    return await createConnection("jest");
}