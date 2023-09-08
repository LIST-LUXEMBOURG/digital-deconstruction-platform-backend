/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

/**
 * Dynamically initialize the injectable class (service, controller, ...) with the specified lists of dependencies, regardless of the architecture type
 * 
 * @param that The `this` class instance from wich the module dynamic initialization is called
 * @param mandatoryServices The list of mandatory services, regardless the architecture type
 * @param monolithicServices The list of services that a monolith application can call but that a µ-services application has to call with a remote call
 */
export async function onModuleDynamicInit(that, mandatoryServices: string[], monolithicServices: string[]) {

    if (!!mandatoryServices) {
        assignServices(that, mandatoryServices);
    }

    if (process.env.ARCHITECTURE === 'MONOLITHIC' && !!monolithicServices) {
        assignServices(that, monolithicServices);
    }

    if (process.env.ARCHITECTURE === 'MICROSERVICE') {
        that.client = await that.moduleRef.get('NATS', { strict: false });
    }
}

/**
 * Add the services identified in the `services` list inside the current instance of `that`
 * 
 * @param that The `this` class instance from wich the module dynamic initialization is called
 * @param services The list of services that will be added to the current instance of `that`
 */
async function assignServices(that, services: string[]) {
    await services.forEach(async (serviceName) => {
        const capitalizedServiceName = serviceName.charAt(0).toUpperCase() + serviceName.slice(1);
        that[serviceName] = await that.moduleRef.get(capitalizedServiceName, { strict: false });
    });
}