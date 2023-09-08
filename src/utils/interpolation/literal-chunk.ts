/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { Chunk } from "./chunk";

export class LiteralChunk extends Chunk {

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //-----------------------------------------------------------------------

    constructor(content: string) {
        super(content);
    }
}