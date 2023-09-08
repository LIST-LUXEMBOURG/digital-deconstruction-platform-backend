/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { Authorization } from "../../../FWAjs-utils/utils/auth.interface";
import { WithProjectId } from "../../../project/dto";

export class ListProjectLocationsDto extends WithProjectId(Authorization) { }
