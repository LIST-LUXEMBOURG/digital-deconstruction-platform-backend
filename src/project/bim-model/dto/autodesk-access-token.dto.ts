/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { ApiProperty } from '@nestjs/swagger';
import { Authorization } from '../../../FWAjs-utils/utils/auth.interface';

export class AutodeskAccessTokenRequest extends Authorization {
    @ApiProperty({
        required: true,
        type: Number,
        description: 'The project internal ID',
    })
    projectId: number;
}

export class AutodeskAccessToken {
    // Default values in comment:

    @ApiProperty({
        required: true,
        type: String,
        description: 'The type of token (bearer)',
    })
    token_type: string; // Bearer

    @ApiProperty({
        required: true,
        type: Number,
        description: 'The expiration time of the token (3600s -> 1h)',
    })
    expires_in: number; // 3600 (secondes)
    @ApiProperty({
        required: true,
        type: String,
        description: 'The actual access token (jwt)',
    })
    access_token: string; // JWT format
}

export class AutodeskAccessTokenResponse extends AutodeskAccessToken {
    // Default values in comment:

    @ApiProperty({
        required: true,
        type: String,
        description: 'The Autodesk data center zone (US or EU)',
    })
    zone: string;

    @ApiProperty({
        required: true,
        type: String,
        description:
            'The Autodesk 3D model URN to visualize in the Forge viewer',
    })
    urn: string;

    @ApiProperty({
        required: true,
        type: String,
        description:
            'The Autodesk 3D model URN formatted to Base64 to visualize in the Forge viewer',
    })
    formattedUrn: string;
}
