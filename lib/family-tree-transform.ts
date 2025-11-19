import { Person, Family, Relationship, RelationshipMap, FamilyChartDatum, FamilyChartDataArray, TransformationOptions, TransformationResult } from './family-tree-types';

/**
 * Family Tree Data Transformation Utilities
 *
 * This module provides clean, maintainable utilities for transforming
 * Appwrite database entities into family-chart library format.
 */

export class FamilyTreeTransformer {
    private personMap: Map<string, Person>;
    private familyMap: Map<string, Family>;
    private relationshipMap: Map<string, Relationship[]>;
    private relationshipIndex: RelationshipMap;

    constructor() {
        this.personMap = new Map();
        this.familyMap = new Map();
        this.relationshipMap = new Map();
        this.relationshipIndex = {};
    }

    /**
     * Main transformation method - converts Appwrite data to family-chart format
     */
    transformToFamilyChartData(
        persons: Person[],
        families: Family[],
        relationships: Relationship[],
        options: TransformationOptions = {}
    ): TransformationResult {
        const startTime = Date.now();
        const errors: string[] = [];

        try {
            // Initialize data structures
            this.initializeData(persons, families, relationships);

            // Build relationship index from relationships collection
            this.buildRelationshipIndex(relationships);

            // Apply filters if specified
            const filteredPersons = this.applyFilters(persons, options);

            // Transform to family-chart format
            const data = this.transformPersonsToFamilyChart(filteredPersons);

            const transformationTime = Date.now() - startTime;

            return {
                data,
                metadata: {
                    personCount: filteredPersons.length,
                    familyCount: families.length,
                    relationshipCount: relationships.length,
                    transformationTime,
                    errors
                }
            };
        } catch (error) {
            errors.push(`Transformation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return {
                data: [],
                metadata: {
                    personCount: 0,
                    familyCount: 0,
                    relationshipCount: 0,
                    transformationTime: Date.now() - startTime,
                    errors
                }
            };
        }
    }

    /**
     * Initialize internal data structures
     */
    private initializeData(persons: Person[], families: Family[], relationships: Relationship[]): void {
        // Index persons
        this.personMap.clear();
        persons.forEach(person => {
            this.personMap.set(person.$id, person);
        });

        // Index families
        this.familyMap.clear();
        families.forEach(family => {
            this.familyMap.set(family.$id, family);
        });

        // Index relationships by person
        this.relationshipMap.clear();
        relationships.forEach(rel => {
            if (!this.relationshipMap.has(rel.personA)) {
                this.relationshipMap.set(rel.personA, []);
            }
            if (!this.relationshipMap.has(rel.personB)) {
                this.relationshipMap.set(rel.personB, []);
            }
            this.relationshipMap.get(rel.personA)!.push(rel);
            if (rel.isBidirectional) {
                this.relationshipMap.get(rel.personB)!.push(rel);
            }
        });
    }

    /**
     * Build relationship index from relationships collection
     */
    private buildRelationshipIndex(relationships: Relationship[]): void {
        this.relationshipIndex = {} as RelationshipMap;

        // Initialize empty arrays for all relationship types
        const relationshipTypes: (keyof RelationshipMap)[] = [
            'parents', 'spouses', 'children', 'siblings', 'grandparents', 'grandchildren',
            'aunts_uncles', 'nieces_nephews', 'cousins', 'in_laws'
        ];

        // Initialize relationship index for all persons
        this.personMap.forEach((_, personId) => {
            this.relationshipIndex[personId] = {
                parents: [],
                spouses: [],
                children: [],
                siblings: [],
                grandparents: [],
                grandchildren: [],
                aunts_uncles: [],
                nieces_nephews: [],
                cousins: [],
                in_laws: []
            };
        });

        // Process relationships collection first (primary source)
        relationships.forEach(rel => {
            if (rel.status !== 'active') return;

            const personA = this.personMap.get(rel.personA);
            const personB = this.personMap.get(rel.personB);

            if (!personA || !personB) {
                console.warn(`Relationship references non-existent persons: ${rel.personA} -> ${rel.personB}`);
                return;
            }

            this.addRelationshipFromRelationships(rel.personA, rel.personB, rel.type, rel.isBidirectional);
        });

        // Supplement with relationships from families collection
        // This ensures backward compatibility and handles cases where relationships weren't created
        this.buildRelationshipsFromFamilies();
    }

    /**
     * Add a relationship from the relationships collection
     */
    private addRelationshipFromRelationships(personA: string, personB: string, type: Relationship['type'], isBidirectional: boolean): void {
        const addToIndex = (personId: string, relatedId: string, relType: keyof RelationshipMap[string]) => {
            if (!this.relationshipIndex[personId]) {
                this.relationshipIndex[personId] = {
                    parents: [], spouses: [], children: [], siblings: [],
                    grandparents: [], grandchildren: [], aunts_uncles: [],
                    nieces_nephews: [], cousins: [], in_laws: []
                };
            }
            if (!this.relationshipIndex[personId][relType].includes(relatedId)) {
                this.relationshipIndex[personId][relType].push(relatedId);
            }
        };

        // Handle all relationship types from the relationships collection
        switch (type) {
            case 'parent':
                addToIndex(personB, personA, 'parents');
                addToIndex(personA, personB, 'children');
                break;
            case 'child':
                addToIndex(personA, personB, 'parents');
                addToIndex(personB, personA, 'children');
                break;
            case 'spouse':
                addToIndex(personA, personB, 'spouses');
                if (isBidirectional) {
                    addToIndex(personB, personA, 'spouses');
                }
                break;
            case 'sibling':
                addToIndex(personA, personB, 'siblings');
                if (isBidirectional) {
                    addToIndex(personB, personA, 'siblings');
                }
                break;
            case 'grandparent':
                addToIndex(personB, personA, 'grandparents');
                addToIndex(personA, personB, 'grandchildren');
                break;
            case 'grandchild':
                addToIndex(personA, personB, 'grandparents');
                addToIndex(personB, personA, 'grandchildren');
                break;
            case 'aunt_uncle':
                addToIndex(personB, personA, 'aunts_uncles');
                addToIndex(personA, personB, 'nieces_nephews');
                break;
            case 'niece_nephew':
                addToIndex(personA, personB, 'aunts_uncles');
                addToIndex(personB, personA, 'nieces_nephews');
                break;
            case 'cousin':
                addToIndex(personA, personB, 'cousins');
                if (isBidirectional) {
                    addToIndex(personB, personA, 'cousins');
                }
                break;
            case 'in_law':
                addToIndex(personA, personB, 'in_laws');
                if (isBidirectional) {
                    addToIndex(personB, personA, 'in_laws');
                }
                break;
            case 'guardian':
                // Guardian can be treated as a parent-like relationship
                addToIndex(personB, personA, 'parents');
                break;
            case 'ward':
                // Ward can be treated as a child-like relationship
                addToIndex(personA, personB, 'parents');
                break;
            case 'adoptive_parent':
                addToIndex(personB, personA, 'parents');
                addToIndex(personA, personB, 'children');
                break;
            case 'adopted_child':
                addToIndex(personA, personB, 'parents');
                addToIndex(personB, personA, 'children');
                break;
            case 'step_parent':
                addToIndex(personB, personA, 'parents');
                addToIndex(personA, personB, 'children');
                break;
            case 'step_child':
                addToIndex(personA, personB, 'parents');
                addToIndex(personB, personA, 'children');
                break;
            case 'foster_parent':
                addToIndex(personB, personA, 'parents');
                addToIndex(personA, personB, 'children');
                break;
            case 'foster_child':
                addToIndex(personA, personB, 'parents');
                addToIndex(personB, personA, 'children');
                break;
            case 'godparent':
                // Godparent relationships can be stored as extended family
                addToIndex(personA, personB, 'in_laws'); // Using in_laws as catch-all for extended family
                break;
            case 'godchild':
                addToIndex(personB, personA, 'in_laws');
                break;
            case 'married':
                // Handle "married" as spouse relationship
                addToIndex(personA, personB, 'spouses');
                if (isBidirectional) {
                    addToIndex(personB, personA, 'spouses');
                }
                break;
            default:
                // For unknown relationship types, log a warning but don't crash
                console.warn(`Unknown relationship type: ${type}`);
                break;
        }
    }

    /**
     * Build relationships from families collection (fallback/supplement)
     * Only adds relationships that don't already exist from the relationships collection
     */
    private buildRelationshipsFromFamilies(): void {
        this.familyMap.forEach(family => {
            if (family.status !== 'active') return;

            const allPartners = this.getAllPartners(family);

            // Create spouse relationships between partners (only if not already established)
            for (let i = 0; i < allPartners.length; i++) {
                for (let j = i + 1; j < allPartners.length; j++) {
                    const partner1 = allPartners[i];
                    const partner2 = allPartners[j];

                    // Only add if neither partner already has this spouse relationship
                    if (!this.relationshipIndex[partner1]?.spouses?.includes(partner2)) {
                        this.addRelationshipFromRelationships(partner1, partner2, 'spouse', true);
                    }
                }
            }

            // Create parent-child relationships (only if not already established)
            if (family.children && Array.isArray(family.children)) {
                family.children.forEach(childId => {
                    allPartners.forEach(parentId => {
                        // Only add if child doesn't already have this parent
                        if (!this.relationshipIndex[childId]?.parents?.includes(parentId)) {
                            this.addRelationshipFromRelationships(parentId, childId, 'child', false);
                        }
                    });
                });
            }
        });
    }

    /**
     * Get all partners from a family
     */
    private getAllPartners(family: Family): string[] {
        const partners: string[] = [];

        if (family.husband) {
            const husbandId = typeof family.husband === 'string' ? family.husband : family.husband;
            if (husbandId) partners.push(husbandId);
        }

        if (family.wife) {
            const wifeId = typeof family.wife === 'string' ? family.wife : family.wife;
            if (wifeId) partners.push(wifeId);
        }

        if (family.partners && Array.isArray(family.partners)) {
            family.partners.forEach(partner => {
                const partnerId = typeof partner === 'string' ? partner : partner;
                if (partnerId && !partners.includes(partnerId)) {
                    partners.push(partnerId);
                }
            });
        }

        return partners;
    }

    /**
     * Apply filters to persons
     */
    private applyFilters(persons: Person[], options: TransformationOptions): Person[] {
        let filtered = persons;

        // Filter by public/private
        if (!options.includePrivate) {
            filtered = filtered.filter(person => person.isPublic && person.status === 'active');
        }

        // Filter by date range
        if (options.filterByDateRange) {
            const { startDate, endDate } = options.filterByDateRange;
            filtered = filtered.filter(person => {
                if (!person.birthDate) return true;
                const birthDate = new Date(person.birthDate);
                if (startDate && birthDate < new Date(startDate)) return false;
                if (endDate && birthDate > new Date(endDate)) return false;
                return true;
            });
        }

        return filtered;
    }

    /**
     * Transform persons to family-chart format
     */
    private transformPersonsToFamilyChart(persons: Person[]): FamilyChartDataArray {
        return persons.map(person => {
            const personData = this.transformPersonData(person);
            const relationships = this.getPersonRelationships(person.$id);


            return {
                id: person.$id,
                data: personData,
                rels: {
                    parents: relationships.parents || [],
                    spouses: relationships.spouses || [],
                    children: relationships.children || []
                }
            };
        });
    }

    /**
     * Transform a single person to family-chart format
     */
    private transformPersonData(person: Person) {
        // Build full name
        const fullName = this.buildFullName(person);

        // Parse name into first and last names if not already provided
        const { firstName, lastName } = this.parseNameFields(person);

        // Convert gender to family-chart format (only M/F supported)
        const gender = this.convertGenderToFamilyChart(person.gender);

        // Build family chart person data
        const personData: any = {
            // Core family chart fields
            name: fullName,
            gender: gender,
            birthday: person.birthDate ? new Date(person.birthDate).toISOString().split('T')[0] : '',
            avatar: person.photo || '',

            // Additional fields for family chart
            'first name': firstName,
            'last name': lastName,
            'middle name': person.middleName || '',
            'maiden name': person.maidenName || '',
            nickname: person.nickname || '',
            title: person.title || '',

            // Extended person fields
            birthPlace: person.birthPlace || '',
            birthCountry: person.birthCountry || '',
            deathDate: person.deathDate ? new Date(person.deathDate).toISOString().split('T')[0] : '',
            deathPlace: person.deathPlace || '',
            deathCountry: person.deathCountry || '',
            photoThumbnail: person.photoThumbnail || '',
            bio: person.bio || '',
            wikiId: person.wikiId || '',
            occupation: person.occupation || '',
            education: person.education || '',
            nationality: person.nationality || '',
            ethnicity: person.ethnicity || '',
            religion: person.religion || '',
            email: person.email || '',
            phone: person.phone || '',
            address: person.address || '',
            city: person.city || '',
            state: person.state || '',
            country: person.country || '',
            zipCode: person.zipCode || '',
            notes: person.notes || '',
            metadata: person.metadata || '',
            status: person.status,
            isPublic: person.isPublic,
            displayOrder: person.displayOrder,
            isDeceased: person.isDeceased
        };

        return personData;
    }

    /**
     * Convert gender to family-chart format (only supports M/F)
     */
    private convertGenderToFamilyChart(gender: Person['gender']): 'M' | 'F' {
        switch (gender) {
            case 'M':
                return 'M';
            case 'F':
                return 'F';
            case 'O':
            case 'U':
            default:
                // Default to 'M' for other/unknown genders since family-chart doesn't support them
                return 'M';
        }
    }

  /**
   * Parse name fields from person data
   */
  private parseNameFields(person: Person): { firstName: string; lastName: string } {
    // If we already have firstName and lastName, use them
    if (person.firstName && person.lastName) {
      return {
        firstName: person.firstName,
        lastName: person.lastName
      };
    }

    // If we only have firstName, use it as first name
    if (person.firstName && !person.lastName) {
      return {
        firstName: person.firstName,
        lastName: ''
      };
    }

    // If we only have lastName, treat it as first name (edge case)
    if (!person.firstName && person.lastName) {
      return {
        firstName: person.lastName,
        lastName: ''
      };
    }

    // Parse from the name field
    if (person.name) {
      const nameParts = person.name.trim().split(/\s+/);
      if (nameParts.length === 1) {
        // Single name - use as first name
        return {
          firstName: nameParts[0],
          lastName: ''
        };
      } else if (nameParts.length >= 2) {
        // Multiple parts - first part as first name, rest as last name
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');
        return {
          firstName,
          lastName
        };
      }
    }

    // Fallback
    return {
      firstName: 'Unknown',
      lastName: ''
    };
  }

  /**
   * Build full name from person data
   */
  private buildFullName(person: Person): string {
    if (person.name) return person.name;

    const parts: string[] = [];
    if (person.title) parts.push(person.title);
    if (person.firstName) parts.push(person.firstName);
    if (person.middleName) parts.push(person.middleName);
    if (person.lastName) parts.push(person.lastName);

    const fullName = parts.join(' ').trim();
    return fullName || 'Unknown';
  }

    /**
     * Get relationships for a person
     */
    private getPersonRelationships(personId: string): { parents: string[], spouses: string[], children: string[] } {
        const rels = this.relationshipIndex[personId];
        if (!rels) {
            return { parents: [], spouses: [], children: [] };
        }

        // Filter to only include persons that exist in our dataset
        const personIds = new Set(this.personMap.keys());

        return {
            parents: (rels.parents || []).filter(id => personIds.has(id)),
            spouses: (rels.spouses || []).filter(id => personIds.has(id)),
            children: (rels.children || []).filter(id => personIds.has(id))
        };
    }

    /**
     * Get relationship map for debugging/analysis
     */
    getRelationshipMap(): RelationshipMap {
        return this.relationshipIndex;
    }

    /**
     * Validate data integrity
     */
    validateData(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Check for orphaned relationships
        this.relationshipMap.forEach((relationships, personId) => {
            if (!this.personMap.has(personId)) {
                errors.push(`Person ${personId} has relationships but doesn't exist`);
            }
        });

        // Check for invalid relationship references
        Object.entries(this.relationshipIndex).forEach(([personId, rels]) => {
            if (!this.personMap.has(personId)) {
                errors.push(`Relationship index contains non-existent person ${personId}`);
                return;
            }

            ['parents', 'spouses', 'children'].forEach(relType => {
                const relatedIds = (rels as any)[relType] || [];
                relatedIds.forEach((relatedId: string) => {
                    if (!this.personMap.has(relatedId)) {
                        errors.push(`Person ${personId} references non-existent ${relType.slice(0, -1)} ${relatedId}`);
                    }
                });
            });
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

/**
 * Convenience function for transforming data
 */
export function transformFamilyTreeData(
    persons: Person[],
    families: Family[],
    relationships: Relationship[],
    options: TransformationOptions = {}
): TransformationResult {
    const transformer = new FamilyTreeTransformer();
    return transformer.transformToFamilyChartData(persons, families, relationships, options);
}

/**
 * Create a new person object from family-chart data
 */
export function createPersonFromFamilyChart(datum: FamilyChartDatum, createdBy: string): Omit<Person, '$id' | '$createdAt' | '$updatedAt'> {
    const data = datum.data;

    return {
        name: data.name,
        firstName: data['first name'] || '',
        lastName: data['last name'] || '',
        middleName: data['middle name'] || '',
        maidenName: data['maiden name'] || '',
        nickname: data.nickname || '',
        title: data.title || '',
        gender: data.gender,
        birthDate: data.birthday ? new Date(data.birthday).toISOString() : undefined,
        birthPlace: data.birthPlace || '',
        birthCountry: data.birthCountry || '',
        deathDate: data.deathDate ? new Date(data.deathDate).toISOString() : undefined,
        deathPlace: data.deathPlace || '',
        deathCountry: data.deathCountry || '',
        photo: data.avatar || '',
        photoThumbnail: data.photoThumbnail || '',
        bio: data.bio || '',
        wikiId: data.wikiId || '',
        occupation: data.occupation || '',
        education: data.education || '',
        nationality: data.nationality || '',
        ethnicity: data.ethnicity || '',
        religion: data.religion || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || '',
        zipCode: data.zipCode || '',
        notes: data.notes || '',
        metadata: data.metadata || '',
        status: (data.status as Person['status']) || 'active',
        isPublic: data.isPublic ?? false,
        displayOrder: data.displayOrder ?? 0,
        isDeceased: data.isDeceased ?? false,
        createdBy
    };
}
