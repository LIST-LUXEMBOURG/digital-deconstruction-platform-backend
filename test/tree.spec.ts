/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   See License in the LICENSE file
 */

import { TreeNode } from "../src/utils/tree/tree";

describe('TreeNodeTests', () => {

    class Entity {
        entity: Record<string, string>;
        relations: Entity[];
    }

    let RELATIONS: Entity[] = [
        {
            entity: { elementType: 'etyp' },
            relations: [{
                entity: { properties: 'prop' },
                relations: [
                    {
                        entity: { propertyType: 'prpt' },
                        relations: []
                    },
                    {
                        entity: { propertyUnit: 'prpu' },
                        relations: []
                    }]
            }, {
                entity: { materials: 'mtrl' },
                relations: []
            }, {
                entity: { pointOfInterest: 'poit' },
                relations: []
            }, {
                entity: { circularities: 'circ' },
                relations: []
            }]
        }]

    let dependencies: TreeNode<Record<string, string>>;

    function setupRelations(entity: Entity): TreeNode<Record<string, string>> {
        let dependency = new TreeNode<Record<string, string>>(entity.entity);
        entity.relations.forEach((relation) => {
            dependency.addChild(setupRelations(relation));
        })
        return dependency;
    }

    beforeAll(() => {
        dependencies = setupRelations(RELATIONS[0]);
        console.log(dependencies);
    });

    it('Render', () => {
        let candidate = dependencies.find({ propertyType: 'prpt' });
        let path = candidate.retracePath();
        console.log(path);

    });
})