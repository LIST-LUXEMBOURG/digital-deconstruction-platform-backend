/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology (LIST)
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

/**
 * Abstract call within the FwaJS framework: 
 * 
 * Performs a call locally in a monolithic application or a remote call in a µ-services application
 * 
 * @param that The `this` class instance from wich the FWACallFct is called
 * @param param1 An object containing the service name and the function name that will be called
 * @param args An object containing the parameter(s) that will be passed to the abstract call 
 * @returns 
 */
export async function FWACallFct(
  that,
  { srv, cmd }: any,
  args?: any,
): Promise<any> {
  try {
    if (process.env.ARCHITECTURE === 'MONOLITHIC') {
      return that[srv][cmd](args);
    }

    if (process.env.ARCHITECTURE === 'MICROSERVICE') {
      return that.client.send({ srv, cmd }, args || {});
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
}
