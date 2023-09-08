/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */


import { Clause } from "./clause";
import { Operator } from "./operator";

export class MockQueryBuilder {
    private clauses: Clause[] = [];
    private parameterIndex: number = 0;

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //----------------------------------------------------------------------- 

    public constructor(clauses: Clause[]) {
        this.clauses = clauses;
        this.parameterIndex = 0;
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Primitive(s)
    //***********************************************************************
    //-----------------------------------------------------------------------

    private renderClause(clause: Clause, rootEntity: string) {
        let conditions = clause.getConditions();
        let operators = clause.getOperators();
        let entity = rootEntity;

        for (let i = 0; i < conditions.length; i++) {
            let condition = conditions[i];
            let operator = operators[i];

            entity = condition.getEntity();
            if (entity != rootEntity) {
                console.log(`inner join ${entity}`);
            }

            let field = condition.getField();
            let whereClause = "";
            let assignment = "";

            let expression = condition.getExpression();
            field = (expression.doesIgnorCase()) ? `LOWER(${entity}.${field})` : `${entity}.${field}`;
            if (expression.getValue() == undefined) {
                whereClause = `${field} ${expression.getOperator()}`;
            } else {
                let parameter = `p_${this.parameterIndex++}`;
                whereClause = `${field} ${expression.getOperator()} :${parameter}`;
                assignment = `${parameter} = > ${expression.getValue()}`;
            }

            switch (operator) {
                case Operator.NONE:
                    console.log(`where ${whereClause} | ${assignment}`);
                    break;
                case Operator.AND:
                    console.log(`AND where ${whereClause} | ${assignment}`);
                    break;
                case Operator.OR:
                    console.log(`OR where ${whereClause} | ${assignment}`);
                    break;
            }

            let subClauses = condition.getSubClauses();
            let subOperators = condition.getOperators();
            if (subClauses.length > 0) {

                for (let j = 0; j < subClauses.length; j++) {
                    let subClause = subClauses[j];
                    let subOperator = subOperators[j];
                    switch (subOperator) {
                        case Operator.NONE:
                            console.log("(");
                            break;
                        case Operator.AND:
                            console.log("AND (");
                            break;
                        case Operator.OR:
                            console.log("OR (");
                            break;
                    }
                    this.renderClause(subClause, entity);
                    console.log(")");
                }

            }
        }
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Class Body
    //***********************************************************************
    //-----------------------------------------------------------------------

    public build(alias: string) {

        let parameterIndex = 0;

        this.clauses.forEach((clause) => {
            this.renderClause(clause, 'element');
        });
    }
}