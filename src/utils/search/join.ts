/*
 *   Copyright (c) 2023 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

export class Join {

    private entity: string;
    private alias: string;
    private field: string;
    private select: boolean;

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //----------------------------------------------------------------------- 

    public constructor(entity: string, field: string, alias: string, select: boolean) {
        this.entity = entity;
        this.alias = alias;
        this.field = field;
        this.select = select;
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

    public doesSelect(): boolean {
        return this.select;
    }

    //----------------------------------------------------------------------- 

    public render(): string {
        let join = (this.select) ? 'join and select' : 'join';

        let rendered = `${join} ${this.entity}.${this.field} ${this.alias} `;

        return rendered;
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* End of Class
    //***********************************************************************
    //----------------------------------------------------------------------- 
}