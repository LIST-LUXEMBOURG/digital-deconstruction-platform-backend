/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { Authorization } from '../../../FWAjs-utils/utils/auth.interface';
import { WithProjectId } from '../../../project/dto';

export class AnalyseInventoryMaterialsDto extends WithProjectId(Authorization) { }