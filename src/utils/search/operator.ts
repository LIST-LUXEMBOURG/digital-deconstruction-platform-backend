
/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

export enum Operator {
    NONE = '',
    EQUAL = '=',
    NOT_EQUAL = '!=',
    LIKE = 'like',
    NOT_LIKE = 'not like',
    AND = 'and',
    AND_NOT = 'and not',
    OR = 'or',
    OR_NOT = 'or not',
    GREATER_THAN = '>',
    GREATER_OR_EQUAL = '>=',
    LOWER_THAN = '<',
    LOWER_OR_EQUAL = '<=',
    IN = 'in',
    NOT_IN = 'not in',
    IS_NULL = 'is null',
    IS_NOT_NULL = 'is not null'
}