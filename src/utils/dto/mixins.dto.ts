/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

export type Constructor<T = {}> = new (...args: any[]) => T;

// Use the above "Constructor" type in a class that requires multiple extends.
// Like so: class A extends B, C, D {}

// The pattern is the following

/**
 * 1) Create the classes that you want to inherit from
 * 2) Wrap the classes with a function (see example below)
 *
 * * export function WithUserId<TBase extends Constructor>(Base: TBase) {
 * *   class UserId extends Base { id: string }
 * *   return UserId
 * * }
 *
 * 3) Create the class that will extends several classes.
 * The last function in the chain must have an empty class as parameter.
 *
 * * class User extends WithUserId(WithUserName(class {}));
 */

// Inspired by https://www.typescriptlang.org/docs/handbook/mixins.html
