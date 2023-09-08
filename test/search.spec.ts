/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { QueryBuilder } from "../src/utils/search/query-builder";
import { getRepository } from "../node_modules/typeorm";
import { Element } from '../src/project/inventory/entities/element.entity';
import { Clause } from "../src/utils/search/clause";
import { Condition } from "../src/utils/search/condition";
import { Expression } from "../src/utils/search/expression";
import { Operator } from "../src/utils/search/operator";
import { createDatabaseConnection } from "./utils/db-connection";
import { Join } from "../src/utils/search/join";
import { Ordering, Select } from "../src/utils/search/select";

describe('SearchQueryTests', () => {
    let connectioName = 'jest';
    let repository = null;

    beforeAll(async () => {
        let connection = await createDatabaseConnection(connectioName);
        repository = getRepository(Element, connectioName);
    });

    it('Render', () => {


        let clause = new Clause();
        clause.addSelect(new Select("elm", "uid", "elm_uid", Ordering.ASC));
        clause.addSelect(new Select("elm", "name", "elm_name", Ordering.ASC));

        clause.addJoin(new Join("elm", "properties", "prop", false));
        clause.addJoin(new Join("prop", "propertyType", "prpt", false));
        clause.addJoin(new Join("prop", "propertyUnit", "prpu", false));

        clause.addCondition(new Condition("element", "elm", "name", new Expression("%CP.3%", Operator.LIKE, true)));
        clause.addCondition(new Condition("element", "elm", "projectId", new Expression(21, Operator.EQUAL)), Operator.AND);
        clause.addCondition(new Condition("element", "elm", "reusePotential", new Expression(0.8, Operator.GREATER_THAN)), Operator.AND);
        clause.addCondition(new Condition("element", "elm", "reusePotential", new Expression(0.95, Operator.LOWER_OR_EQUAL)), Operator.AND);
        clause.addCondition(new Condition("propertyType", "prpt", "name", new Expression("Length", Operator.EQUAL)), Operator.AND);
        clause.addCondition(new Condition("propertyUnit", "prpu", "symbol", new Expression("mm", Operator.EQUAL)), Operator.AND);

        let queryBuilder = new QueryBuilder(repository, [clause]);
        let query = queryBuilder.build('elm');
        console.log(query.getQueryAndParameters())
    });
})



