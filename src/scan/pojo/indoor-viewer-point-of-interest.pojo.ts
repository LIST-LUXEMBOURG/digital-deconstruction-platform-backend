/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */

import { Template } from "../../utils/interpolation/template";
import { PointOfInterestDto } from "../dto/point-of-interest.dto";
import { PointOfInterest } from "../entities/point-of-interest.entity";

export class IndoorViewerPointOfInterest {
    private static urlTemplate = "${url}/?poi=${id}";


    //-----------------------------------------------------------------------

    static getPointOfInterests(
        items,
        projectId,
        scan3DConfig
    ): PointOfInterestDto[] {
        if (!items) throw new Error('Param $1 is missing');
        if (!projectId) throw new Error('Param $2: projectId is missing');

        let template = new Template(IndoorViewerPointOfInterest.urlTemplate);

        let pointsOfInterest: PointOfInterestDto[] = []

        items.poi_type_groups.forEach((poi_type_group) => {
            poi_type_group.poi_types.forEach((poi_type) => {
                if ("pois" in poi_type) {
                    pointsOfInterest.push(...poi_type.pois.map((poi) => {
                        let pointOfInterest = new PointOfInterestDto();
                        pointOfInterest.projectId = projectId;
                        pointOfInterest.name = poi.titles.en;
                        pointOfInterest.description = poi.descriptions.en;
                        pointOfInterest.poiId = poi.id;

                        let context = { "url": scan3DConfig.scanUrl, "id": poi.id };
                        pointOfInterest.weblink = template.render(context);

                        let customData = poi.custom_data.replace('\"', '"');
                        const custom = JSON.parse(customData);
                        const ifc = custom.classifications.find(classification => classification[0] === 'ifcId');

                        pointOfInterest.elementIfcId = ifc[1];
                        return pointOfInterest;
                    }))
                }
            })
        });

        return pointsOfInterest;

        // return items.map((item) => {
        //     let pointOfInterests = new PointOfInterestDto();
        //     pointOfInterests.projectId = projectId;
        //     pointOfInterests.name = item.titles.en;
        //     pointOfInterests.description = item.descriptions.en;
        //     pointOfInterests.poiId = item.id;

        //     let context = { "url": scan3DConfig.scanUrl, "id": item.id };
        //     pointOfInterests.weblink = template.render(context);

        //     let customData = item.custom_data.replace('\"', '"');
        //     const custom = JSON.parse(customData);
        //     const ifc = custom.classifications.find(classification => classification[0] === 'ifcId');

        //     pointOfInterests.elementIfcId = ifc[1];

        //     return pointOfInterests;
        // });
    }
}
