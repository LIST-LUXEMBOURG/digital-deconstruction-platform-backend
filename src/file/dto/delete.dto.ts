/*
 *   Copyright (c) 2021 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { Authorization } from '../../FWAjs-utils/utils/auth.interface';
import { File } from '../entities/file.entity';

export interface DeleteDto extends Authorization {
    uuid: string;
}

export type DeleteResponse = File;

export interface DeleteRepositoryDto extends Authorization {
    path: string;
}

export interface DeleteRepositoryResponse {}
