/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { Authorization } from '../../../FWAjs-utils/utils/auth.interface';
import { WithProjectId } from '../../dto';

export class ListInventoryElementIdentifiersDto extends WithProjectId(Authorization) { }
