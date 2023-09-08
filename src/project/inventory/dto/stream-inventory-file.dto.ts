/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { ReadStream } from 'fs';
import { File } from '../../../file/entities/file.entity';
export interface StreamInventoryFileResponse {
    stream: ReadStream;
    metadata: File;
}
