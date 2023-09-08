/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { Operator } from "./operator";

export class Expression {
    private value: any;
    private operator: Operator;
    private ignoreCase: boolean;

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //----------------------------------------------------------------------- 

    public constructor(value: any, operator: Operator, ignoreCase: boolean = false) {
        this.value = value;
        this.operator = operator;
        this.ignoreCase = ignoreCase;
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Class Body
    //***********************************************************************
    //----------------------------------------------------------------------- 

    public getValue(): any {
        return this.value;
    }

    //----------------------------------------------------------------------- 

    public getOperator(): Operator {
        return this.operator;
    }

    //----------------------------------------------------------------------- 

    public doesIgnorCase(): boolean {
        return this.ignoreCase;
    }

    //----------------------------------------------------------------------- 

    public render(): string {
        return `${this.operator} ${this.value}`;
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* End of Class
    //***********************************************************************
    //----------------------------------------------------------------------- 

}