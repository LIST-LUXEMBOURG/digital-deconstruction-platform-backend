/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

export function pick(array: string[], included: any[]) {
    return included;
}

export function omit(array: string[], excluded: string | string[]): string[] {
    if (!Array.isArray(excluded)) excluded = [excluded];
    return array.filter((item) => !excluded.includes(item));
}
