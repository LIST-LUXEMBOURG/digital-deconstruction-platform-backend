/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { ReadStream } from 'fs';
import { Authorization } from '../../FWAjs-utils/utils/auth.interface';
import { File } from '../entities/file.entity';

export interface GetOneFileDto extends Authorization {
    uuid: string;
}

export type MetadataResponse = File;

export type StreamResponse = {
    stream: ReadStream;
    metadata: File;
};