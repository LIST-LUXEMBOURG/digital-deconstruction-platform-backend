/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { WithProjectId } from '../dto';
import { Authorization } from '../../FWAjs-utils/utils/auth.interface';

export class DeleteProjectDto extends WithProjectId(Authorization) { }