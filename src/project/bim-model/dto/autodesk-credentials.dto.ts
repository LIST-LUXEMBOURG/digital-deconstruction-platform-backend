/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import {
    AutodeskAccessToken,
    AutodeskAccessTokenResponse,
} from './autodesk-access-token.dto';


export class AutodeskCredentialsResponse { }

function atob(base64: string) {
    return Buffer.from(base64, 'base64').toString('ascii');
}

function btoa(str: string) {
    return Buffer.from(str).toString('base64');
}

export class AutodeskCredentials {
    client_id: string;
    client_secret: string;
    grant_type?: string;
    scope: string;
    zone: string;
    // TODO Temporary property
    urn?: string;
    formattedUrn?: string;

    constructor(object) {
        const [urn, formattedUrn] = AutodeskCredentials.getUrn(object.urn);

        this.client_id = object.client_id || object.clientId;
        this.client_secret = object.client_secret || object.clientSecret;
        this.grant_type = 'client_credentials';
        this.scope = object.scope || 'data:read viewables:read';
        this.zone = object.zone || 'US';
        this.urn = urn;
        this.formattedUrn = formattedUrn;
    }

    static fromDatabase(object) {
        return new AutodeskCredentials({
            client_id: object.clientId,
            client_secret: object.clientSecret,
            grant_type: 'client_credentials',
            scope: object.scope || 'data:read viewables:read',
            zone: object.zone,
            urn: object.urn,
            formattedUrn: object.formattedUrn,
        });
    }
    toResponse(
        accessToken: AutodeskAccessToken | string,
    ): AutodeskAccessTokenResponse {
        if (typeof accessToken === 'object')
            return {
                ...accessToken,
                zone: this.zone === 'EU' ? 'derivativeV2_EU' : 'derivativeV2',
                urn: this.urn,
                formattedUrn: this.formattedUrn,
            };
        else {
            return {
                access_token: accessToken,
                token_type: 'Bearer',
                expires_in: 3599,
                zone: this.zone === 'EU' ? 'derivativeV2_EU' : 'derivativeV2',
                urn: this.urn,
                formattedUrn: this.formattedUrn,
            };
        }
    }

    toDatabase(projectId?: number) {
        return {
            clientId: this.client_id,
            clientSecret: this.client_secret,
            scope: this.scope,
            zone: this.zone === 'derivativeV2_EU' ? 'EU' : 'US',
            urn: this.urn,
            formattedUrn: this.formattedUrn,
            project: { id: projectId },
        };
    }

    toAutodesk() {
        return {
            client_id: this.client_id,
            client_secret: this.client_secret,
            scope: this.scope,
            grant_type: 'client_credentials',
        };
    }

    static getUrn(initialUrn: string): string[] {
        let urn, formattedUrn;

        if (
            initialUrn.startsWith('urn:') &&
            !initialUrn.startsWith('urn:dXJu')
        ) {
            urn = initialUrn;
            formattedUrn = btoa(initialUrn).replace(/=/gm, '');
        } else {
            urn = atob(initialUrn);
            formattedUrn = initialUrn;
        }
        return [urn, formattedUrn];
    }
}
