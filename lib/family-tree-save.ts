import { FamilyChartDataArray, Person, Family, Relationship } from './family-tree-types';
import { tablesDB, DATABASE_ID, PERSONS_COLLECTION_ID, FAMILIES_COLLECTION_ID, RELATIONSHIPS_COLLECTION_ID } from './appwrite';
import { Query, ID } from 'appwrite';

/**
 * Family Tree Save Utilities
 *
 * Provides clean, reliable functions for saving family tree changes
 * back to the Appwrite database.
 */

/**
 * Convert gender from family-chart format back to database format
 */
function convertGenderFromFamilyChart(gender: 'M' | 'F'): 'M' | 'F' | 'O' | 'U' {
    // Family-chart only supports M/F, so we keep those as-is
    return gender;
}

/**
 * Create person data from family-chart format
 */
function createPersonDataFromFamilyChart(data: any, userId: string): Partial<Person> {
    return {
        name: data.name || `${data['first name'] || ''} ${data['last name'] || ''}`.trim() || 'Unknown',
        firstName: data['first name'] || '',
        lastName: data['last name'] || '',
        middleName: data['middle name'] || '',
        maidenName: data['maiden name'] || '',
        nickname: data.nickname || '',
        title: data.title || '',
        gender: convertGenderFromFamilyChart(data.gender) || 'U',
        birthDate: data.birthday ? new Date(data.birthday).toISOString() : undefined,
        deathDate: data['death date'] ? new Date(data['death date']).toISOString() : undefined,
        birthPlace: data['birth place'] || '',
        deathPlace: data['death place'] || '',
        photo: data.avatar || '',
        photoThumbnail: data.photoThumbnail || '',
        occupation: data.occupation || '',
        bio: data.bio || '',
        wikiId: data.wikiId || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || '',
        notes: data.notes || '',
        status: 'active',
        isPublic: false,
        displayOrder: 0,
        isDeceased: data.isDeceased || false
    };
}

export interface SaveResult {
    success: boolean;
    savedPersons: number;
    savedFamilies: number;
    savedRelationships: number;
    errors: string[];
}

export interface SaveOptions {
    userId: string;
    createMissingFamilies?: boolean;
    validateRelationships?: boolean;
}

/**
 * Save family tree changes from family-chart format back to database
 */
export async function saveFamilyTreeChanges(
    currentData: FamilyChartDataArray,
    originalData: FamilyChartDataArray,
    options: SaveOptions
): Promise<SaveResult> {
    const result: SaveResult = {
        success: false,
        savedPersons: 0,
        savedFamilies: 0,
        savedRelationships: 0,
        errors: []
    };

    try {
        // Filter current chart data to only real persons
        const realCurrentData = filterRealPersons(currentData);

        // For original data, we need both filtered and unfiltered versions
        // Filtered for finding new/updated persons, unfiltered for finding deletions
        const realOriginalData = filterRealPersons(originalData);

        // Analyze changes between real current data and ALL original data (including what should be deleted)
        const changes = analyzeChanges(realCurrentData, originalData);

        // Save persons first
        const personResults = await savePersonChanges(changes, options);
        result.savedPersons = personResults.saved;

        // Save relationships based on the current chart connections
        const relationshipResults = await saveRelationships(realCurrentData, realOriginalData, options);
        result.savedRelationships = relationshipResults.saved;

        result.success = result.errors.length === 0;
    } catch (error) {
        result.errors.push(`Save failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
}

/**
 * Filter out temporary/placeholder persons created by family-chart
 * BE EXTREMELY AGGRESSIVE - remove ALL chart artifacts
 */
function filterRealPersons(data: FamilyChartDataArray): FamilyChartDataArray {
    console.log('Filtering', data.length, 'persons for real ones');

    // First pass: identify real persons by name
    const realPersons = new Map<string, any>(); // name -> person

    for (const person of data) {
        const name = (person.data?.name || person.data?.['first name'] || '').trim();
        const hasRealName = name && name !== 'Unknown' && !name.includes('unnamed') &&
            !name.includes('unknown person') && name !== 'father' &&
            name !== 'mother' && name !== 'spouse' && name !== 'son' &&
            name !== 'daughter';

        if (hasRealName) {
            // If we already have this name, keep the one with more complete data
            const existing = realPersons.get(name);
            if (!existing || Object.keys(person.data || {}).length > Object.keys(existing.data || {}).length) {
                realPersons.set(name, person);
                console.log('Keeping real person:', name, person.id);
            } else {
                console.log('Discarding duplicate person:', name, person.id);
            }
        } else {
            console.log('Filtering out non-real person:', person.id, name || 'no name');
        }
    }

    // Return only the unique real persons
    const result = Array.from(realPersons.values());
    console.log('Final filtered result:', result.length, 'real persons');
    return result;
}

/**
 * Analyze what changed between current and original data
 * SMART DELETION: Delete persons that were removed from chart
 */
function analyzeChanges(currentData: FamilyChartDataArray, originalData: FamilyChartDataArray) {
    const changes = {
        newPersons: [] as FamilyChartDataArray,
        updatedPersons: [] as FamilyChartDataArray,
        deletedPersons: [] as string[]
    };

    const currentMap = new Map(currentData.map(d => [d.id, d]));
    const originalMap = new Map(originalData.map(d => [d.id, d]));

    console.log('Analyzing changes:');
    console.log('- Current data:', currentData.length, 'items');
    console.log('- Original data:', originalData.length, 'items');
    console.log('- Current persons:', currentData.map(d => ({ id: d.id, name: d.data?.name || d.data?.['first name'] })));
    console.log('- Original persons:', originalData.map(d => ({ id: d.id, name: d.data?.name || d.data?.['first name'] })));

    // Find new and updated persons
    for (const currentDatum of currentData) {
        const originalDatum = originalMap.get(currentDatum.id);

        if (!originalDatum) {
            // New person - only add if it has a real name
            const name = currentDatum.data?.name?.trim() || currentDatum.data?.['first name']?.trim();
            if (name && name !== 'Unknown' && !name.includes('unnamed')) {
                console.log('Found new person:', currentDatum.id, name);
                changes.newPersons.push(currentDatum);
            }
        } else if (JSON.stringify(currentDatum.data) !== JSON.stringify(originalDatum.data)) {
            // Updated person
            console.log('Found updated person:', currentDatum.id);
            changes.updatedPersons.push(currentDatum);
        }
    }

    // SMART DELETION: Delete persons that exist in database but not in current chart
    // But be careful - only delete persons that have real names (not placeholders)
    for (const originalDatum of originalData) {
        if (!currentMap.has(originalDatum.id)) {
            const name = originalDatum.data?.name?.trim() || originalDatum.data?.['first name']?.trim();
            const hasRealName = name && name !== 'Unknown' && !name.includes('unnamed');

            if (hasRealName) {
                console.log('Person removed from chart, will delete:', originalDatum.id, name);
                changes.deletedPersons.push(originalDatum.id);
            } else {
                console.log('Skipping deletion of placeholder person:', originalDatum.id);
            }
        }
    }

    console.log('Changes summary:');
    console.log('- New persons:', changes.newPersons.length);
    console.log('- Updated persons:', changes.updatedPersons.length);
    console.log('- Deleted persons:', changes.deletedPersons.length);

    return changes;
}

/**
 * Save person changes
 */
async function savePersonChanges(changes: ReturnType<typeof analyzeChanges>, options: SaveOptions) {
    const results = { saved: 0, errors: 0 };

    // Get existing persons to check for duplicates
    const existingPersons = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: PERSONS_COLLECTION_ID,
        queries: [Query.equal('status', 'active')]
    });

    const existingNames = new Set(existingPersons.rows.map((p: any) => p.name?.toLowerCase().trim()));

    // Save new persons (but check for duplicates)
    for (const personDatum of changes.newPersons) {
        try {
            const personData = createPersonDataFromFamilyChart(personDatum.data, options.userId);
            const personName = personData.name?.toLowerCase().trim();

            // Check if person with this name already exists
            if (existingNames.has(personName)) {
                console.log('Skipping duplicate person:', personName);
                continue;
            }

            await tablesDB.createRow({
                databaseId: DATABASE_ID,
                tableId: PERSONS_COLLECTION_ID,
                rowId: personDatum.id,
                data: personData
            });

            existingNames.add(personName); // Add to our set to prevent future duplicates
            results.saved++;
            console.log('Saved new person:', personName);
        } catch (error) {
            console.error('Error saving new person:', error);
            results.errors++;
        }
    }

    // Update existing persons
    for (const personDatum of changes.updatedPersons) {
        try {
            const updateData = extractPersonUpdateData(personDatum.data);

            await tablesDB.updateRow({
                databaseId: DATABASE_ID,
                tableId: PERSONS_COLLECTION_ID,
                rowId: personDatum.id,
                data: updateData
            });

            results.saved++;
        } catch (error) {
            console.error('Error updating person:', error);
            results.errors++;
        }
    }

    // Delete removed persons AND their relationships
    for (const personId of changes.deletedPersons) {
        try {
            // First, delete all relationships involving this person
            console.log('Deleting relationships for person:', personId);

            // Get all relationships where this person is involved
            const personRelationships = await tablesDB.listRows({
                databaseId: DATABASE_ID,
                tableId: RELATIONSHIPS_COLLECTION_ID,
                queries: [
                    Query.or([
                        Query.equal('personA', personId),
                        Query.equal('personB', personId)
                    ])
                ]
            });

            // Delete all relationships for this person
            for (const rel of personRelationships.rows) {
                await tablesDB.deleteRow({
                    databaseId: DATABASE_ID,
                    tableId: RELATIONSHIPS_COLLECTION_ID,
                    rowId: rel.$id
                });
                console.log('Deleted relationship:', rel.$id, rel.type);
            }

            // Then delete the person
            await tablesDB.deleteRow({
                databaseId: DATABASE_ID,
                tableId: PERSONS_COLLECTION_ID,
                rowId: personId
            });

            console.log('Deleted person and', personRelationships.rows.length, 'relationships:', personId);
            results.saved++;
        } catch (error) {
            console.error('Error deleting person and relationships:', error);
            results.errors++;
        }
    }

    return results;
}

/**
 * Extract update data from family chart person data
 */
function extractPersonUpdateData(data: any): Partial<Person> {
    const updateData: Partial<Person> = {};

    // Name fields
    if (data['first name']) updateData.firstName = data['first name'];
    if (data['last name']) updateData.lastName = data['last name'];
    if (data['middle name']) updateData.middleName = data['middle name'];
    if (data['maiden name']) updateData.maidenName = data['maiden name'];
    if (data.nickname) updateData.nickname = data.nickname;
    if (data.title) updateData.title = data.title;

    // Core fields
    if (data.name) updateData.name = data.name;
    if (data.gender) updateData.gender = convertGenderFromFamilyChart(data.gender);
    if (data.avatar) updateData.photo = data.avatar;

    // Date fields
    if (data.birthday) {
        try {
            updateData.birthDate = new Date(data.birthday).toISOString();
        } catch (e) {
            console.warn('Invalid birth date format:', data.birthday);
        }
    }

    if (data['death date']) {
        try {
            updateData.deathDate = new Date(data['death date']).toISOString();
        } catch (e) {
            console.warn('Invalid death date format:', data['death date']);
        }
    }

    // Location fields
    if (data['birth place']) updateData.birthPlace = data['birth place'];
    if (data['death place']) updateData.deathPlace = data['death place'];
    if (data.city) updateData.city = data.city;
    if (data.state) updateData.state = data.state;
    if (data.country) updateData.country = data.country;

    // Other fields
    if (data.occupation) updateData.occupation = data.occupation;
    if (data.email) updateData.email = data.email;
    if (data.phone) updateData.phone = data.phone;
    if (data.bio) updateData.bio = data.bio;
    if (data.notes) updateData.notes = data.notes;

    // Boolean fields
    if (typeof data.isDeceased === 'boolean') updateData.isDeceased = data.isDeceased;
    if (typeof data.isPublic === 'boolean') updateData.isPublic = data.isPublic;

    return updateData;
}

/**
 * Save relationships based on chart connections
 */
async function saveRelationships(currentData: FamilyChartDataArray, originalData: FamilyChartDataArray, options: SaveOptions) {
    const results = { saved: 0, errors: 0 };

    try {
        // Filter to only real persons (not temporary placeholders)
        const realCurrentData = filterRealPersons(currentData);
        
        // Create a map of person IDs to their data for easy lookup (use filtered data)
        const personMap = new Map(realCurrentData.map(p => [p.id, p]));

        // Get existing relationships to avoid duplicates
        const existingRelationships = await tablesDB.listRows({
            databaseId: DATABASE_ID,
            tableId: RELATIONSHIPS_COLLECTION_ID,
            queries: [Query.equal('status', 'active')]
        });

        const existingRelMap = new Map<string, any>();
        existingRelationships.rows.forEach((rel: any) => {
            // Store relationship with both directions and both types for comprehensive lookup
            // Key format: personA|personB|type
            const key1 = [rel.personA, rel.personB, rel.type].join('|');
            const key2 = [rel.personB, rel.personA, rel.type].join('|');
            
            // Also check with opposite type (parent vs child)
            const oppositeType = rel.type === 'parent' ? 'child' : (rel.type === 'child' ? 'parent' : rel.type);
            const key3 = [rel.personA, rel.personB, oppositeType].join('|');
            const key4 = [rel.personB, rel.personA, oppositeType].join('|');
            
            // For spouse/married relationships, treat them as equivalent
            if (rel.type === 'spouse' || rel.type === 'married') {
                const spouseType = rel.type === 'spouse' ? 'married' : 'spouse';
                const key5 = [rel.personA, rel.personB, spouseType].join('|');
                const key6 = [rel.personB, rel.personA, spouseType].join('|');
                existingRelMap.set(key5, rel);
                existingRelMap.set(key6, rel);
            }
            
            existingRelMap.set(key1, rel);
            existingRelMap.set(key2, rel);
            existingRelMap.set(key3, rel);
            existingRelMap.set(key4, rel);
        });

        // Process each person's relationships - save NEW relationships for ALL persons
        const relationshipsToSave = new Set<string>(); // Deduplicate relationship keys
        const originalDataMap = new Map(originalData.map(d => [d.id, d])); // For comparing relationships

        // Only process real persons (not temporary placeholders)
        for (const person of realCurrentData) {
            const personName = person.data?.name || person.data?.['first name'] || person.id;
            const originalPerson = originalDataMap.get(person.id);
            const originalParents = originalPerson?.rels?.parents || [];

            console.log('Processing relationships for person:', person.id, personName);
            console.log('- Current parents:', person.rels?.parents || []);
            console.log('- Original parents:', originalParents);

            // Save parent-child relationships (for both new and existing persons)
            if (person.rels?.parents) {
                for (const parentId of person.rels.parents) {
                    // Only save if parent exists in our real data
                    if (!personMap.has(parentId)) {
                        console.log('Skipping parent not in real data:', parentId);
                        continue;
                    }

                    // Check if this relationship is NEW (not in original data)
                    const isNewRelationship = !originalParents.includes(parentId);

                    if (isNewRelationship) {
                        // Create relationship key: parent|child|parent (preserve order, use 'parent' type)
                        // personA = parent, personB = child, type = 'parent'
                        const relationshipKey = [parentId, person.id, 'parent'].join('|');

                        if (!existingRelMap.has(relationshipKey) && !relationshipsToSave.has(relationshipKey)) {
                            relationshipsToSave.add(relationshipKey);
                            console.log('Will save NEW parent-child relationship:', parentId, '(parent) ->', person.id, '(child)');
                        } else {
                            console.log('Relationship already exists, skipping:', relationshipKey);
                        }
                    } else {
                        console.log('Relationship already in original data, skipping:', parentId, '->', person.id);
                    }
                }
            }

            // Also check children relationships (if person is a parent)
            if (person.rels?.children) {
                const originalChildren = originalPerson?.rels?.children || [];

                for (const childId of person.rels.children) {
                    // Only save if child exists in our real data
                    if (!personMap.has(childId)) {
                        continue;
                    }

                    // Check if this relationship is NEW
                    const isNewRelationship = !originalChildren.includes(childId);

                    if (isNewRelationship) {
                        const relationshipKey = [person.id, childId, 'parent'].join('|');

                        if (!existingRelMap.has(relationshipKey) && !relationshipsToSave.has(relationshipKey)) {
                            relationshipsToSave.add(relationshipKey);
                            console.log('Will save NEW parent-child relationship:', person.id, '(parent) ->', childId, '(child)');
                        } else {
                            console.log('Relationship already exists, skipping:', relationshipKey);
                        }
                    }
                }
            }
        }

        // Auto-create spouse relationships for parents who share children
        // BUT ONLY if both parents are REAL persons (not temporary placeholders)
        console.log('Checking for spouse relationships between parents...');

        // First, create a set of real person IDs (from filtered data)
        const realPersonIds = new Set(realCurrentData.map(p => p.id));

        // Collect all parent-child relationships (only from real persons)
        for (const person of realCurrentData) {
            if (person.rels?.parents && person.rels.parents.length >= 2) {
                // This person has multiple parents - they should be spouses
                // BUT only if both parents are REAL persons (not temporary placeholders)
                const parents = person.rels.parents.filter(parentId => {
                    // Parent must exist in personMap AND be a real person (not temporary)
                    return personMap.has(parentId) && realPersonIds.has(parentId);
                });
                
                if (parents.length >= 2) {
                    console.log('Found', parents.length, 'real parents for person:', person.id, person.data?.name);
                    
                    // Create pairs of parents
                    for (let i = 0; i < parents.length; i++) {
                        for (let j = i + 1; j < parents.length; j++) {
                            const parent1 = parents[i];
                            const parent2 = parents[j];
                            
                            // Double-check both parents are real
                            const parent1Data = personMap.get(parent1);
                            const parent2Data = personMap.get(parent2);
                            const parent1Name = parent1Data?.data?.name || parent1Data?.data?.['first name'] || '';
                            const parent2Name = parent2Data?.data?.name || parent2Data?.data?.['first name'] || '';
                            
                            // Skip if either parent is a placeholder
                            if (!parent1Name || !parent2Name || 
                                parent1Name.toLowerCase() === 'mother' || parent1Name.toLowerCase() === 'father' ||
                                parent1Name.toLowerCase() === 'spouse' || parent2Name.toLowerCase() === 'mother' ||
                                parent2Name.toLowerCase() === 'father' || parent2Name.toLowerCase() === 'spouse') {
                                console.log('Skipping spouse relationship - one or both parents are placeholders:', parent1Name, parent2Name);
                                continue;
                            }
                            
                            // Create spouse relationship key (order doesn't matter for spouses)
                            // Check both 'spouse' and 'married' types
                            const spouseKey1 = [parent1, parent2, 'spouse'].join('|');
                            const spouseKey2 = [parent2, parent1, 'spouse'].join('|');
                            const marriedKey1 = [parent1, parent2, 'married'].join('|');
                            const marriedKey2 = [parent2, parent1, 'married'].join('|');
                            
                            // Check if spouse relationship already exists (check both types)
                            const hasSpouseRel = existingRelMap.has(spouseKey1) || 
                                                 existingRelMap.has(spouseKey2) ||
                                                 existingRelMap.has(marriedKey1) ||
                                                 existingRelMap.has(marriedKey2) ||
                                                 relationshipsToSave.has(spouseKey1) ||
                                                 relationshipsToSave.has(spouseKey2) ||
                                                 relationshipsToSave.has(marriedKey1) ||
                                                 relationshipsToSave.has(marriedKey2);
                            
                            // Check if they were already spouses in original data
                            const wereSpouses = parent1Data?.rels?.spouses?.includes(parent2) ||
                                               parent2Data?.rels?.spouses?.includes(parent1);
                            
                            if (!hasSpouseRel && !wereSpouses) {
                                relationshipsToSave.add(spouseKey1);
                                console.log('Will save NEW spouse relationship (shared child):', parent1Name, '<->', parent2Name);
                            } else {
                                console.log('Spouse relationship already exists or was in original data:', parent1Name, '<->', parent2Name);
                            }
                        }
                    }
                } else {
                    console.log('Skipping spouse relationship - not enough real parents (found', parents.length, 'real parents, need 2)');
                }
            }
        }

        // Now save all the deduplicated relationships
        for (const relKey of relationshipsToSave) {
            const [personA, personB, type] = relKey.split('|');
            const relationshipType = type as Relationship['type'];

            try {
                // Determine if relationship is bidirectional (spouse relationships are bidirectional)
                const isBidirectional = relationshipType === 'spouse' || relationshipType === 'married';

                await tablesDB.createRow({
                    databaseId: DATABASE_ID,
                    tableId: RELATIONSHIPS_COLLECTION_ID,
                    rowId: ID.unique(),
                    data: {
                        personA: personA,
                        personB: personB,
                        type: relationshipType,
                        isBidirectional: isBidirectional,
                        status: 'active'
                    }
                });
                results.saved++;
                
                if (relationshipType === 'spouse' || relationshipType === 'married') {
                    console.log('Saved spouse relationship:', personA, '<->', personB);
                } else {
                    console.log('Saved relationship:', personA, `(${relationshipType}) ->`, personB);
                }
            } catch (error: any) {
                console.error('Error saving relationship:', error?.message || error, relKey);
                // Log full error details for debugging
                if (error?.response) {
                    console.error('Appwrite error response:', error.response);
                }
                results.errors++;
            }
        }

    } catch (error) {
        console.error('Error saving relationships:', error);
        results.errors++;
    }

    return results;
}

/**
 * Validate data integrity before saving
 */
export function validateFamilyTreeData(data: FamilyChartDataArray): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const personIds = new Set(data.map(d => d.id));

    for (const datum of data) {
        // Check for required fields
        if (!datum.id) {
            errors.push('Person missing ID');
            continue;
        }

        if (!datum.data?.name && !datum.data?.['first name'] && !datum.data?.['last name']) {
            errors.push(`Person ${datum.id} missing name`);
        }

        // Check relationship references
        if (datum.rels?.parents) {
            for (const parentId of datum.rels.parents) {
                if (!personIds.has(parentId)) {
                    errors.push(`Person ${datum.id} references non-existent parent ${parentId}`);
                }
            }
        }

        if (datum.rels?.spouses) {
            for (const spouseId of datum.rels.spouses) {
                if (!personIds.has(spouseId)) {
                    errors.push(`Person ${datum.id} references non-existent spouse ${spouseId}`);
                }
            }
        }

        if (datum.rels?.children) {
            for (const childId of datum.rels.children) {
                if (!personIds.has(childId)) {
                    errors.push(`Person ${datum.id} references non-existent child ${childId}`);
                }
            }
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}
