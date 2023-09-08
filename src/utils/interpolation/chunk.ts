/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

export class Chunk {
    public content: string;

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //-----------------------------------------------------------------------

    constructor(content: string) {
        this.content = content;
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Class Body
    //***********************************************************************
    //-----------------------------------------------------------------------

    public render(context: Record<string, any>): string {
        return this.content;
    }

}