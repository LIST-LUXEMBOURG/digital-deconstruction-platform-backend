/*
 *   Copyright (c) 2022 Luxembourg Institute of Science and Technology
 *   All rights reserved.
 *   For licensing information see the "LICENSE" file in the root directory
 */
import {
    Entity,
    Column,
    OneToMany,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
    JoinColumn,
    OneToOne,
    ManyToMany,
} from 'typeorm';

import { Material } from './material.entity';
import { MaterialType } from './material-type.entity';
import { PointOfInterest } from '../../../scan/entities/point-of-interest.entity';
import { uniqBy } from 'lodash';
import { Property } from '../../../core/entities/property.entity';
import { ElementType } from './element-type.entity';
import { Project } from '../../../project/entities';
import { PropertyType } from 'src/core/entities/property-type.entity';
import { Circularity } from '../../../circularity/entities/circularity.entity';
import { InventoryElementDto } from '../dto/inventory-element.dto';

export enum ReuseDecision {
    BACKFILLING = 'backfilling',
    RECYCLING = 'recycling',
    REUSE = 'reuse',
    UNDEFINED = 'undefined',
}

export enum HazardAssessmentStatus {
    REQUESTED = 'requested',
    IN_PROGRESS = 'in_progress',
    FINISHED = 'finished',
}

export enum HazardAssessment {
    NO_HAZARD = 'no_hazard',
    CONNECTION_ONLY = 'connection_only',
    SURFACE_ONLY = 'surface_only',
    OVERALL = 'overall'
}

export enum SurfaceDamage {
    NONE = 'none',
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high'
}

@Entity()
@Unique('unique_element_ifcid_project', ['ifcId', 'project'])

export class Element {
    @PrimaryGeneratedColumn('uuid')
    uid: string;

    @ManyToOne(
        (type) => Project,
        {
            onDelete: "CASCADE",
        }
    )
    @JoinColumn()
    project: Project;

    @Column({ nullable: true })
    revitId: string;

    @Column({ nullable: true })
    ifcId: string;

    @Column({ nullable: false })
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column({ type: 'numeric', nullable: true })
    reusePotential: number;

    @Column({
        type: 'enum',
        enum: SurfaceDamage,
        nullable: true,
    })
    surfaceDamage: SurfaceDamage; // enum ?

    @Column({
        type: 'enum',
        enum: ReuseDecision,
        default: ReuseDecision.UNDEFINED,
        nullable: true,
    })
    reuseDecision: ReuseDecision;

    @Column({
        type: 'enum',
        enum: HazardAssessment,
        default: HazardAssessment.NO_HAZARD,
        nullable: true,
    })
    hazardAssessment: HazardAssessment; // enum ?

    @Column({
        type: 'enum',
        enum: HazardAssessmentStatus,
        default: HazardAssessmentStatus.REQUESTED,
        nullable: true,
    })
    hazardAssessmentStatus: HazardAssessmentStatus; // enum ?    

    // relations

    @ManyToOne(() => ElementType, { //(elementType) => elementType.elements, {
        cascade: true,
        onDelete: 'SET NULL',
    })
    elementType: ElementType;

    @OneToMany(() => Material, (material) => material.element, {
        cascade: true,
        onDelete: 'CASCADE',
    })
    materials: Material[];

    @OneToMany(() => Property, (property) => property.element, {
        cascade: true,
        onDelete: 'CASCADE',
    })
    properties: Property[];

    @ManyToOne(() => PointOfInterest, {
        cascade: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn()
    pointOfInterest: PointOfInterest;

    @ManyToMany(() => Circularity, (circ) => circ.elements, {
        eager: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn()
    circularities: Circularity[];

    //-----------------------------------------------------------------------
    //***********************************************************************
    //* Parsing Helper 
    //***********************************************************************
    //-----------------------------------------------------------------------

    static toDto(inventoryElement: Element): InventoryElementDto {
        let dto = new InventoryElementDto();

        let { project, elementType, materials, properties, pointOfInterest, circularities, ...fields } = inventoryElement;

        dto = Object.assign(dto, fields);

        if (!!project) {
            dto.projectId = project.id;
        }

        return dto;
    }

    //----------------------------------------------------------------------- 

    static toNumeric(value: string): number {
        if (typeof value === 'number') return value;

        if (value === '' || value === null || value === undefined) return 0;
        value = value.replace(/,/g, '.');
        const regex = /^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$/;
        if (regex.test(value)) return parseFloat(value);
        throw new Error(`Invalid string format: impossible to cast "${value}" to number!`);
    }

    //-----------------------------------------------------------------------

    static getElementTypes(items, projectId): ElementType[] {
        const elementTypes = items.reduce((acc, curr) => {
            if (!curr.elementType) return acc;

            const found = acc.find(
                (item) => item.name === curr.elementType.name,
            );
            if (!found)
                acc.push({ ...curr.elementType, uid: undefined, project: { id: projectId } });

            return acc;
        }, []);

        return uniqBy<ElementType>(elementTypes, 'name');
    }

    //-----------------------------------------------------------------------

    static getMaterialTypes(items, projectId): MaterialType[] {
        const materialTypes = items.reduce((acc, item) => {
            if (
                item.materials &&
                Array.isArray(item.materials) &&
                item.materials.length > 0
            )
                acc = acc.concat(
                    item.materials.map((material) => ({
                        ...material.materialType,
                        uid: undefined,
                        project: { id: projectId },
                    })),
                );
            return acc;
        }, []);

        return uniqBy<MaterialType>(materialTypes, 'name');
    }

    //-----------------------------------------------------------------------   

    static mapMaterials(project: Project, item: any, materialTypes: MaterialType[], ignoreMaterialTypesRelation: boolean): Material[] {
        let materials: Material[];

        return item.materials.map((itemMaterial) => {
            let material: Material;

            function getMaterialType() {
                if (!ignoreMaterialTypesRelation && itemMaterial.materialType !== null) {
                    let materialType = materialTypes.find(
                        (type) => type.name === itemMaterial.materialType.name,
                    );
                    if (!!materialType) {
                        return materialType;
                    } else {
                        console.log(`Couldn't find material type with name ${itemMaterial.materialType.name}`);
                        return null;
                    }
                }
            }

            material = {
                uid: undefined,
                project: project,
                mass: this.toNumeric(itemMaterial.mass),
                volume: this.toNumeric(itemMaterial.volume),
                materialType: getMaterialType(),
                element: undefined,
            };

            return material;
        });
    }

    //-----------------------------------------------------------------------   

    static mapProperties(project: Project, item: any, propertyTypes: PropertyType[]): Property[] {
        let materials: Material[];

        return item.properties.map((itemProperty) => {
            let property: Property;

            function getPropertyType() {
                let propertyType = propertyTypes.find(
                    (type) => type.name === itemProperty.name,
                );
                if (!!propertyType) {
                    return propertyType;
                }
            }

            function getPropertyUnit(propertyType: PropertyType) {
                let propertyUnit = propertyType.propertyUnits.find(
                    (unit) => unit.symbol === itemProperty.unit,
                );
                if (!!propertyUnit) {
                    return propertyUnit;
                }
            }

            let propertyType = getPropertyType();

            if (!!propertyType) {
                let propertyUnit = getPropertyUnit(propertyType);
                property = {
                    uid: undefined,
                    propertyType: propertyType,
                    propertyUnit: propertyUnit,
                    value: itemProperty.value,
                    element: undefined,
                };
            }

            return property;
        });
    }


    //-----------------------------------------------------------------------

    static getElements(
        items,
        project,
        { elementTypes, materialTypes, propertyTypes },
    ): Element[] {
        if (!items) throw new Error('Param $1 is missing');
        if (!project) throw new Error('Param $2: project is missing');

        const ignoreElementTypesRelation =
            !elementTypes || elementTypes.length <= 0;
        const ignoreMaterialTypesRelation =
            !materialTypes || materialTypes.length <= 0;

        if (!Array.isArray(items)) items = [items];

        return items.map((item) => {
            let element: Element;
            let materials: Material[];
            let properties: Property[];

            materials = Element.mapMaterials(project, item, materialTypes, ignoreElementTypesRelation);
            properties = Element.mapProperties(project, item, propertyTypes);

            function getElementType() {
                if (!ignoreElementTypesRelation && item.elementType !== null) {
                    let elementType = elementTypes.find(
                        (type) => type.name === item.elementType.name,
                    );
                    if (!!elementType) {
                        return elementType.uid;
                    } else {
                        console.log(`Couldn't find element type with name ${item.elementType.name}`);
                        return null;
                    }
                }
            }

            element = {
                ...item,
                uid: undefined,
                reusePotential: this.toNumeric(item.reusePotential),
                volume: this.toNumeric(item.volume),
                materials,
                properties,
                project: project,
                elementType: getElementType(),
            };


            return element;
        });
    }

    //-----------------------------------------------------------------------

    static uniqueConstraints(elements: Element[]): Element[] {
        return elements.filter((element, index, self) => {
            /* Returns true if index matches the result of findIndex, else as soon as a duplicate entry shows up throw an error */
            if (
                index ===
                /* Iterates over elements and found an element with the same ifcId */
                self.findIndex((selfItem) => selfItem.ifcId === element.ifcId)
            )
                return true;
            else
                throw new Error(
                    `Unique constraint: an element with the IFC identifier: "${element.ifcId}" is duplicated`,
                );
        });
    }
}
