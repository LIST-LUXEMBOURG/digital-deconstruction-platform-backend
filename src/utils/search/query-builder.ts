/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { Repository, SelectQueryBuilder } from "typeorm";
import { Clause } from "./clause";
import { Operator } from "./operator";
import { Ordering } from "./select";

export class QueryBuilder<E> {
    private clauses: Clause[] = [];
    private repository: Repository<E>;

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //----------------------------------------------------------------------- 

    public constructor(repository: Repository<E>, clauses: Clause[]) {
        this.repository = repository;
        this.clauses = clauses;
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Primitive(s)
    //***********************************************************************
    //-----------------------------------------------------------------------

    private renderClause(query: SelectQueryBuilder<E>, clause: Clause, rootEntity: string, rootAlias: string): SelectQueryBuilder<E> {
        let parameterIndex = 0;

        let selects = clause.getSelects();
        let joins = clause.getJoins();
        let conditions = clause.getConditions();
        let operators = clause.getOperators();
        let entity = rootEntity;
        let alias = rootAlias;
        let first = true;

        selects.forEach((select) => {
            let column = `${select.getAlias()}.${select.getField()}`;
            query = (first) ? query.select(column) : query.addSelect(column);
            switch (select.getOrdering()) {
                case Ordering.ASC: query.addOrderBy(column, 'ASC');
                    break;
                case Ordering.DESC: query.addOrderBy(column, 'DESC');
                    break;
            }
            console.log(select.render());
            first = false;
        })

        joins.forEach((join) => {
            query = (join.doesSelect)
                ? query.innerJoinAndSelect(`${join.getEntity()}.${join.getField()}`, join.getAlias())
                : query.innerJoin(`${join.getEntity()}.${join.getField()}`, join.getAlias())
        })

        for (let i = 0; i < conditions.length; i++) {
            let condition = conditions[i];
            let operator = operators[i];

            entity = condition.getEntity();
            alias = condition.getAlias();
            let field = condition.getField();

            let whereClause = "";
            let assignment = "";
            let parameter = undefined;

            let expression = condition.getExpression();
            field = (expression.doesIgnorCase()) ? `LOWER(${alias}.${field})` : `${alias}.${field}`;
            if (expression.getValue() == undefined) {
                whereClause = `${field} ${expression.getOperator()}`;
            } else {
                parameter = `p_${parameterIndex++}`;
                whereClause = `${field} ${expression.getOperator()} :${parameter}`;
            }

            let value = expression.getValue();
            if (!!value) {
                value = (expression.doesIgnorCase()) ? value.toString().toLowerCase() : value;
            }

            switch (operator) {
                case Operator.NONE:
                    query = query.where(whereClause);
                    if (!!parameter) { query = query.setParameter(parameter, value); }
                    console.log(`where ${whereClause} | ${assignment}`);
                    break;
                case Operator.AND:
                    query = query.andWhere(whereClause);
                    if (!!parameter) { query = query.setParameter(parameter, value); }
                    console.log(`AND where ${whereClause} | ${assignment}`);
                    break;
                case Operator.OR:
                    query = query.orWhere(whereClause);
                    if (!!parameter) { query = query.setParameter(parameter, value); }
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
                    query = this.renderClause(query, subClause, entity, alias);
                    console.log(")");
                }
            }
        }
        return query;
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Class Body
    //***********************************************************************
    //-----------------------------------------------------------------------


    public build(alias: string): SelectQueryBuilder<E> {

        let query = this.repository.createQueryBuilder(alias);
        let parameterIndex = 0;

        this.clauses.forEach((clause) => {
            query = this.renderClause(query, clause, 'element', alias);
        });

        return query;
    }




}