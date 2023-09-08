/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

export enum Ordering {
    NONE = '',
    ASC = 'ASC',
    DESC = 'DESC',
}

export class Select {

    private alias: string;
    private field: string;
    private selectAlias: string;
    private order: Ordering;

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //----------------------------------------------------------------------- 


    public constructor(alias: string = undefined, field: string = undefined, selectAlias: string = undefined, order: Ordering = Ordering.NONE) {
        this.alias = alias;
        this.field = field;
        this.selectAlias = selectAlias;
        this.order = order;
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Class Body
    //***********************************************************************
    //----------------------------------------------------------------------- 

    public getAlias(): string {
        return this.alias;
    }

    //-----------------------------------------------------------------------

    public getField(): string {
        return this.field;
    }

    //----------------------------------------------------------------------- 

    public getSelectAlias(): string {
        return this.selectAlias;
    }

    //----------------------------------------------------------------------- 

    public getOrdering(): Ordering {
        return this.order;
    }

    //----------------------------------------------------------------------- 

    public setAlias(alias: string) {
        this.alias = alias;
    }

    //-----------------------------------------------------------------------

    public setField(field: string) {
        this.field = field;
    }

    //----------------------------------------------------------------------- 

    public setSelectAlias(alias: string) {
        this.selectAlias = alias;
    }

    //----------------------------------------------------------------------- 

    public setOrdering(order: Ordering) {
        this.order = order;
    }

    //-----------------------------------------------------------------------

    public render(): string {

        let asClause = (!!this.selectAlias) ? `AS ${this.selectAlias}` : '';
        let orderClause = (this.order != Ordering.NONE) ? `ORDER ${this.order}` : '';

        let rendered = `SELECT ${this.alias}.${this.field} ${asClause} ${orderClause}`;

        return rendered;
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* End of Class
    //***********************************************************************
    //----------------------------------------------------------------------- 
}