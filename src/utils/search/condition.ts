/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { Clause } from "./clause";
import { Expression } from "./expression";
import { Operator } from "./operator";

export class Condition {

    private entity: string;
    private alias: string;
    private field: string;
    private expression: Expression;
    private subClauses: Clause[] = [];
    private operators: Operator[] = [];

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //----------------------------------------------------------------------- 

    public constructor(entity: string, alias: string, field: string, expression: Expression) {
        this.entity = entity;
        this.alias = alias;
        this.field = field;
        this.expression = expression;
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Class Body
    //***********************************************************************
    //----------------------------------------------------------------------- 

    public getEntity(): string {
        return this.entity;
    }

    //----------------------------------------------------------------------- 

    public getAlias(): string {
        return this.alias;
    }

    //-----------------------------------------------------------------------

    public getField(): string {
        return this.field;
    }

    //----------------------------------------------------------------------- 

    public getExpression(): Expression {
        return this.expression;
    }

    //-----------------------------------------------------------------------

    public addSubClause(clause: Clause, operator: Operator = Operator.NONE) {
        this.subClauses.push(clause);
        this.operators.push(operator);
    }

    //-----------------------------------------------------------------------

    public getSubClauses(): Clause[] {
        return this.subClauses;
    }

    //-----------------------------------------------------------------------

    public getOperators(): Operator[] {
        return this.operators;
    }

    //----------------------------------------------------------------------- 

    public render(): string {
        let rendered = `${this.alias}.${this.field} ${this.expression.render()} `;

        if (this.subClauses.length > 0) {
            for (let i = 0; i < this.subClauses.length; i++) {
                rendered += `${this.operators[i]} (${this.subClauses[i].render()}) `;
            }
        }

        return rendered;
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* End of Class
    //***********************************************************************
    //----------------------------------------------------------------------- 
}