/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { Chunk } from "./chunk";

export class ParameterChunk extends Chunk {
    private defaultValue: any;

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //-----------------------------------------------------------------------

    constructor(content: string, defaultValue: any) {
        super(content);
        this.defaultValue = defaultValue;
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Class Body
    //***********************************************************************
    //-----------------------------------------------------------------------

    public render(context: Record<string, any>): string {
        let rendered = "";

        let value = context[this.content];
        rendered = (value) ? value : this.defaultValue;
        return rendered;
    }
}
