/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */
import { ReadStream } from 'fs';
import { File } from '../../file/entities/file.entity';
export interface StreamPassportFileResponse {
    stream: ReadStream;
    metadata: File;
}
