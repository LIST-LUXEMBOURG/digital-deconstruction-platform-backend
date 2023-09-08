## Description

The Backend is the server part of the DDC platform and its main purpose consists in controlling access to and processing the data stored inside the Platform through several web service methods. The backends’ architecture follows a classic 3-tier model (or layers if you prefer) and it was implemented using the Nest.js framework, a software framework specifically tailored for implementing web-based application servers.

The top tier is called the **Controller** tier, and it exposes the platforms API (Application Programming Interface) to the frontend web application and the various technical modules connected to the platform. The controller tier is divided into multiple controllers, each controller handling one specific type of data provided by the platform. We used Open API or swagger to document the API, providing details about the parameters expected by each individual API route as well as the results being returned. This greatly simplifies work for developers wishing to integrate the API in their application and allows testing the various methods simply through a web browser.

The second tier is called the **Service** tier, and it implements the actual business logic of the platform. Like the first tier, it is divided into multiple Services, each service handling the same specific type of data that its controller counterpart handles in the first tier.

Last but not least, we have the **Persistence** tier, which is in charge of reading and writing data provided or required by the service layer into the database. We’re using an ORM (Object Relational Model) abstraction layer to render the persistence layer agnostic from the database engine being used, meaning, we can easily replace the Postgres database we’re currently using with a database from other suppliers.


## Installation

> For the installation of the backend it is assumed that the frontend docker image frontend:latest has already been built. Furthermore, it's also assumed
> that [docker](https://www.docker.com/) has already been installed.

```bash
$ npm install
# Build all files
$ npm run build
```

Next we built the docker image of the backend and we create the whole DDC software stack.

```bash
$ docker build -t backend .
$ docker compose up .
```

Create an new postgres database user dedicated for ddc. Make sure the new user has permissions to login and to create new databases.
Next create a new postgres database, making sure to specify the newly created user as owner. Locate the *ormconfig.json* file and
modify the name of the database as well as the credentials of the database user.

## Seeding

```bash
# Create Schema in database
$ ./node_modules/.bin/ts-node ./node_modules/.bin/typeorm schema:sync
# Seed the database with initial (minimal) data set
$ npm run seed:run
```
## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Migration

```bash
# Generate Migration class/file
$ ./node_modules/.bin/ts-node ./node_modules/.bin/typeorm migration:generate -d /src/migration -n NameOfMigrationClass
# Make it appear in /dist/migration
$ npm run build
# Apply the migration
$ npm run typeorm migration:run
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Authors

-   Guido Bosch for LIST
-   Maxime Poncin for LIST
-   Calin Boje for LIST
-   Nico Mack for LIST

## License

DDC is [MIT licensed](LICENSE).

# Note

## NestJS router

The nest-router is an external library introduced in NestJS core in version 8.

https://github.com/nestjsx/nest-router
