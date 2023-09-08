/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { Chunk } from "./chunk";
import { LiteralChunk } from "./literal-chunk";
import { ParameterChunk } from "./parameter-chunk";

export class Template {
    private static parameterPattern = /\$\{(?<identifier>[a-z0-9\-_]+)\}/i;

    private chunks: Chunk[] = [];

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //-----------------------------------------------------------------------

    constructor(template: string) {

        let intake = template;
        let match;

        while (match = intake.match(Template.parameterPattern)) {
            let matchBegin = match.index;
            let matchEnd = matchBegin + match[0].length;
            let preamble = intake.substring(0, matchBegin);
            this.addLiteral(preamble);
            let identifier = match[1];
            this.addParameter(identifier, "");
            intake = intake.substring(matchEnd);
        }
        if (intake.length > 0) {
            this.addLiteral(intake);
        }
    }

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Constructor
    //***********************************************************************
    //-----------------------------------------------------------------------

    public addLiteral(literal: string) {
        this.chunks.push(new LiteralChunk(literal));
    }

    //-----------------------------------------------------------------------

    public addParameter(identifier: string, defaultValue) {
        this.chunks.push(new ParameterChunk(identifier, defaultValue));
    }

    //-----------------------------------------------------------------------

    public render(context: Record<string, any>): string {
        let rendered = "";
        this.chunks.forEach((chunk) => {
            rendered += chunk.render(context);
        });
        return rendered;
    }

}