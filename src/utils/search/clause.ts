/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { Condition } from "./condition";
import { Join } from "./join";
import { Operator } from "./operator";
import { Select } from "./select";

export class Clause {

    private selects: Select[] = [];
    private joins: Join[] = [];
    private conditions: Condition[] = [];
    private operators: Operator[] = [];

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //----------------------------------------------------------------------- 

    public constructor() {
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Class Body
    //***********************************************************************
    //-----------------------------------------------------------------------

    public addSelect(select: Select) {
        this.selects.push(select);
    }

    //-----------------------------------------------------------------------

    public addJoin(join: Join) {
        this.joins.push(join);
    }

    //-----------------------------------------------------------------------

    public addCondition(condition: Condition, operator: Operator = Operator.NONE) {
        this.conditions.push(condition);
        this.operators.push(operator);
    }

    //----------------------------------------------------------------------- 

    public getSelects(): Select[] {
        return this.selects;
    }

    //----------------------------------------------------------------------- 

    public getJoins(): Join[] {
        return this.joins;
    }

    //-----------------------------------------------------------------------

    public getConditions(): Condition[] {
        return this.conditions;
    }

    //----------------------------------------------------------------------- 

    public getOperators(): Operator[] {
        return this.operators;
    }
    //----------------------------------------------------------------------- 

    public render(): string {
        let rendered = "";

        this.selects.forEach((select) => {
            rendered += select.render();
        })

        this.joins.forEach((join) => {
            rendered += join.render();
        })

        for (let i = 0; i < this.conditions.length; i++) {
            rendered += `${this.operators[i]} ${this.conditions[i].render()} `;
        }

        return rendered;
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* End of Class
    //***********************************************************************
    //----------------------------------------------------------------------- 

}