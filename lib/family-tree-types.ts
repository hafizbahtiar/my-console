import { Data as FamilyChartData, Datum } from 'family-chart';

// Database entity types
export interface Person {
    $id: string;
    name: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    maidenName?: string;
    nickname?: string;
    title?: string;
    gender: 'M' | 'F' | 'O' | 'U';
    birthDate?: string;
    birthPlace?: string;
    birthCountry?: string;
    deathDate?: string;
    deathPlace?: string;
    deathCountry?: string;
    photo?: string;
    photoThumbnail?: string;
    bio?: string;
    wikiId?: string;
    occupation?: string;
    education?: string;
    nationality?: string;
    ethnicity?: string;
    religion?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
    notes?: string;
    metadata?: string;
    status: 'active' | 'inactive';
    isPublic: boolean;
    displayOrder: number;
    isDeceased: boolean;
    createdBy?: string;
    updatedBy?: string;
    $createdAt: string;
    $updatedAt: string;
}

export interface Family {
    $id: string;
    familyName?: string;
    husband?: string;
    wife?: string;
    partners: string[];
    children: string[];
    marriageDate?: string;
    marriagePlace?: string;
    divorceDate?: string;
    isDivorced: boolean;
    isHistoric: boolean;
    notes?: string;
    metadata?: string;
    status: 'active' | 'inactive';
    displayOrder: number;
    createdBy?: string;
    updatedBy?: string;
    $createdAt: string;
    $updatedAt: string;
}

export interface Relationship {
    $id: string;
    personA: string;
    personB: string;
    type: 'parent' | 'child' | 'spouse' | 'sibling' | 'grandparent' | 'grandchild' | 'aunt_uncle' | 'niece_nephew' | 'cousin' | 'in_law' | 'guardian' | 'ward' | 'adoptive_parent' | 'adopted_child' | 'step_parent' | 'step_child' | 'foster_parent' | 'foster_child' | 'godparent' | 'godchild' | 'married';
    isBidirectional: boolean;
    date?: string;
    place?: string;
    note?: string;
    metadata?: string;
    status: 'active' | 'inactive';
    createdBy?: string;
    updatedBy?: string;
    $createdAt: string;
    $updatedAt: string;
}

// Internal relationship map type
export interface RelationshipMap {
    [personId: string]: {
        parents: string[];
        spouses: string[];
        children: string[];
        siblings: string[];
        grandparents: string[];
        grandchildren: string[];
        aunts_uncles: string[];
        nieces_nephews: string[];
        cousins: string[];
        in_laws: string[];
    };
}

// Family Chart data transformation types
export interface FamilyChartPersonData {
    // Core family chart fields (required by library)
    gender: 'M' | 'F'; // Library only supports M/F, not O/U

    // Optional core fields
    birthday?: string;
    avatar?: string;

    // Name field (required by our data structure)
    name: string;

    // Additional fields for family chart
    'first name'?: string;
    'last name'?: string;
    'middle name'?: string;
    'maiden name'?: string;
    nickname?: string;
    title?: string;

    // Extended person fields
    birthPlace?: string;
    birthCountry?: string;
    deathDate?: string;
    deathPlace?: string;
    deathCountry?: string;
    photoThumbnail?: string;
    bio?: string;
    wikiId?: string;
    occupation?: string;
    education?: string;
    nationality?: string;
    ethnicity?: string;
    religion?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
    notes?: string;
    metadata?: string;
    status?: string;
    isPublic?: boolean;
    displayOrder?: number;
    isDeceased?: boolean;

    // Allow any additional fields
    [key: string]: any;
}

export interface FamilyChartDatum {
    id: string;
    data: FamilyChartPersonData;
    rels: {
        parents: string[];
        spouses: string[];
        children: string[];
    };
}

export type FamilyChartDataArray = FamilyChartDatum[];

// Utility types for data transformation
export interface TransformationOptions {
    includePrivate?: boolean;
    maxDepth?: {
        ancestry?: number;
        progeny?: number;
    };
    filterByDateRange?: {
        startDate?: string;
        endDate?: string;
    };
}

export interface TransformationResult {
    data: FamilyChartDataArray;
    metadata: {
        personCount: number;
        familyCount: number;
        relationshipCount: number;
        transformationTime: number;
        errors: string[];
    };
}
