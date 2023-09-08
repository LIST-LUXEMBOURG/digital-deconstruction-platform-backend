/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

export class TreeNode<T> {
    value: T;
    parent: TreeNode<T>;
    children?: TreeNode<T>[];

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //-----------------------------------------------------------------------

    constructor(value: T) {
        this.value = value;
        this.children = [];
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Class Body
    //***********************************************************************
    //-----------------------------------------------------------------------

    public setParent(parent: TreeNode<T>) {
        this.parent = parent;
    }

    //----------------------------------------------------------------------- 

    public addChild(child: TreeNode<T>) {
        child.setParent(this);
        this.children.push(child);
    }

    //----------------------------------------------------------------------- 

    public find(value: T): TreeNode<T> {
        if (this.value === value) { return this }
        for (let child of this.children) {
            let found = child.find(value);
            if (!!found) return found;
        }
        return undefined;
    }

    //----------------------------------------------------------------------- 

    public retracePath(path: TreeNode<T>[] = []): TreeNode<T>[] {

        path.push(this);
        if (!!this.parent) {
            this.parent.retracePath(path);
        }
        return path;
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* End of Class
    //***********************************************************************
    //----------------------------------------------------------------------- 
}