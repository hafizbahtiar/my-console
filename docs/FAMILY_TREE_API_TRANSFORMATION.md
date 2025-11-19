# Family Tree API Transformation Guide

## Overview

This guide explains how to transform data from the normalized 3-collection schema (`persons`, `families`, `relationships`) into the format required by the `family-chart` library for visualization.

## Family-Chart Library Format

The `family-chart` library expects data in this format:

```typescript
interface FamilyChartData {
  individuals: Array<{
    id: string;
    name: string;
    gender?: 'M' | 'F' | 'O' | 'U';
    photo?: string;
    birthDate?: string;
    deathDate?: string;
    // ... other fields
  }>;
  families: Array<{
    husband?: string; // Person ID
    wife?: string; // Person ID
    partners?: string[]; // Array of person IDs
    children?: string[]; // Array of person IDs
  }>;
}
```

## Transformation Functions

### Complete Transformation Function

```typescript
import { databases, Query, ID } from '@/lib/appwrite';

interface Person {
  $id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  gender: 'M' | 'F' | 'O' | 'U';
  birthDate?: string;
  deathDate?: string;
  photo?: string;
  isDeceased: boolean;
  isPublic: boolean;
  status: string;
  // ... other fields
}

interface Family {
  $id: string;
  husband?: string;
  wife?: string;
  partners: string[];
  children: string[];
  marriageDate?: string;
  isDivorced: boolean;
  status: string;
  // ... other fields
}

interface Relationship {
  $id: string;
  personA: string;
  personB: string;
  type: string;
  isBidirectional: boolean;
  status: string;
  // ... other fields
}

/**
 * Transform Appwrite data to family-chart format
 */
export async function transformToFamilyChartData(
  includePrivate: boolean = false
): Promise<FamilyChartData> {
  // Fetch all persons (filter by isPublic if needed)
  const personsQuery = includePrivate
    ? []
    : [Query.equal('isPublic', true), Query.equal('status', 'active')];
  
  const personsResponse = await databases.listDocuments(
    'console-db',
    'persons',
    personsQuery
  );
  const persons = personsResponse.documents as Person[];

  // Fetch all families
  const familiesResponse = await databases.listDocuments(
    'console-db',
    'families',
    [Query.equal('status', 'active')]
  );
  const families = familiesResponse.documents as Family[];

  // Transform persons to individuals
  const individuals = persons.map(person => ({
    id: person.$id,
    name: person.name || getFullName(person),
    gender: person.gender,
    photo: person.photo,
    birthDate: person.birthDate,
    deathDate: person.deathDate,
    isDeceased: person.isDeceased,
    // Add any additional fields needed by family-chart
  }));

  // Transform families
  const familiesData = families.map(family => {
    const familyData: any = {};
    
    // Add traditional husband/wife if present
    if (family.husband) familyData.husband = family.husband;
    if (family.wife) familyData.wife = family.wife;
    
    // Add partners array (combine with husband/wife if needed)
    const allPartners = getAllPartners(family);
    if (allPartners.length > 0) {
      familyData.partners = allPartners;
    }
    
    // Add children
    if (family.children && family.children.length > 0) {
      familyData.children = family.children;
    }
    
    return familyData;
  });

  return {
    individuals,
    families: familiesData,
  };
}

/**
 * Get all partners from a family (husband, wife, and partners array)
 */
function getAllPartners(family: Family): string[] {
  const partners: string[] = [];
  if (family.husband) partners.push(family.husband);
  if (family.wife) partners.push(family.wife);
  if (family.partners && family.partners.length > 0) {
    partners.push(...family.partners);
  }
  // Remove duplicates
  return [...new Set(partners)];
}

/**
 * Get full name from person object
 */
function getFullName(person: Person): string {
  if (person.name) return person.name;
  
  const parts: string[] = [];
  if (person.firstName) parts.push(person.firstName);
  if (person.middleName) parts.push(person.middleName);
  if (person.lastName) parts.push(person.lastName);
  
  return parts.join(' ') || 'Unknown';
}
```

## API Route Implementation

### GET /api/tree - Complete Family Tree Data

```typescript
// app/api/tree/route.ts
import { NextResponse } from 'next/server';
import { transformToFamilyChartData } from '@/lib/family-tree-utils';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    
    // Include private persons if user is admin
    const includePrivate = user?.role === 'super_admin';
    
    const treeData = await transformToFamilyChartData(includePrivate);
    
    return NextResponse.json(treeData);
  } catch (error) {
    console.error('Error fetching family tree:', error);
    return NextResponse.json(
      { error: 'Failed to fetch family tree' },
      { status: 500 }
    );
  }
}
```

### GET /api/persons/[id]/tree - Person-Specific Tree

```typescript
// app/api/persons/[id]/tree/route.ts
import { NextResponse } from 'next/server';
import { databases, Query } from '@/lib/appwrite';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const personId = params.id;
    
    // Get person
    const person = await databases.getDocument(
      'console-db',
      'persons',
      personId
    );
    
    // Get all families where person is involved
    const allFamilies = await databases.listDocuments(
      'console-db',
      'families'
    );
    
    const personFamilies = allFamilies.documents.filter(f => {
      return (
        f.husband === personId ||
        f.wife === personId ||
        (f.partners && f.partners.includes(personId)) ||
        (f.children && f.children.includes(personId))
      );
    });
    
    // Get all related persons
    const relatedPersonIds = new Set<string>();
    personFamilies.forEach(family => {
      if (family.husband) relatedPersonIds.add(family.husband);
      if (family.wife) relatedPersonIds.add(family.wife);
      if (family.partners) family.partners.forEach(id => relatedPersonIds.add(id));
      if (family.children) family.children.forEach(id => relatedPersonIds.add(id));
    });
    
    // Fetch all related persons
    const relatedPersons = await Promise.all(
      Array.from(relatedPersonIds).map(id =>
        databases.getDocument('console-db', 'persons', id)
      )
    );
    
    // Transform to family-chart format
    const individuals = relatedPersons.map(p => ({
      id: p.$id,
      name: p.name,
      gender: p.gender,
      photo: p.photo,
      birthDate: p.birthDate,
      deathDate: p.deathDate,
    }));
    
    const families = personFamilies.map(f => ({
      husband: f.husband,
      wife: f.wife,
      partners: getAllPartners(f),
      children: f.children || [],
    }));
    
    return NextResponse.json({
      individuals,
      families,
    });
  } catch (error) {
    console.error('Error fetching person tree:', error);
    return NextResponse.json(
      { error: 'Failed to fetch person tree' },
      { status: 500 }
    );
  }
}
```

## Frontend Integration

### React Component Example

```typescript
// components/family-tree-chart.tsx
'use client';

import { useEffect, useState } from 'react';
import { FamilyChart } from 'family-chart';

interface FamilyChartData {
  individuals: Array<{
    id: string;
    name: string;
    gender?: 'M' | 'F' | 'O' | 'U';
    photo?: string;
    birthDate?: string;
    deathDate?: string;
  }>;
  families: Array<{
    husband?: string;
    wife?: string;
    partners?: string[];
    children?: string[];
  }>;
}

export function FamilyTreeChart({ personId }: { personId?: string }) {
  const [data, setData] = useState<FamilyChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTreeData() {
      try {
        setLoading(true);
        const url = personId 
          ? `/api/persons/${personId}/tree`
          : '/api/tree';
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch tree data');
        }
        
        const treeData = await response.json();
        setData(treeData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchTreeData();
  }, [personId]);

  useEffect(() => {
    if (!data) return;

    // Initialize family chart
    const chart = new FamilyChart({
      data: data,
      container: document.getElementById('family-tree-container'),
      // ... other options
    });

    return () => {
      // Cleanup if needed
      chart.destroy?.();
    };
  }, [data]);

  if (loading) return <div>Loading family tree...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data available</div>;

  return (
    <div>
      <div id="family-tree-container" style={{ width: '100%', height: '600px' }} />
    </div>
  );
}
```

## Edge Cases & Optimizations

### 1. Handling Large Trees

For large family trees, consider pagination or lazy loading:

```typescript
export async function transformToFamilyChartDataPaginated(
  limit: number = 100,
  offset: number = 0
): Promise<FamilyChartData & { hasMore: boolean }> {
  const personsResponse = await databases.listDocuments(
    'console-db',
    'persons',
    [
      Query.equal('isPublic', true),
      Query.equal('status', 'active'),
      Query.limit(limit),
      Query.offset(offset),
    ]
  );

  // ... transformation logic

  return {
    individuals,
    families: familiesData,
    hasMore: personsResponse.documents.length === limit,
  };
}
```

### 2. Filtering by Date Range

```typescript
export async function transformToFamilyChartDataByDateRange(
  startDate?: string,
  endDate?: string
): Promise<FamilyChartData> {
  const queries: string[] = [
    Query.equal('isPublic', true),
    Query.equal('status', 'active'),
  ];

  if (startDate) {
    queries.push(Query.greaterThanEqual('birthDate', startDate));
  }
  if (endDate) {
    queries.push(Query.lessThanEqual('birthDate', endDate));
  }

  const personsResponse = await databases.listDocuments(
    'console-db',
    'persons',
    queries
  );

  // ... rest of transformation
}
```

### 3. Including Relationships Collection

If you want to include relationships from the `relationships` collection:

```typescript
export async function transformToFamilyChartDataWithRelationships(): Promise<FamilyChartData> {
  // ... get persons and families as before

  // Get relationships
  const relationshipsResponse = await databases.listDocuments(
    'console-db',
    'relationships',
    [Query.equal('status', 'active')]
  );
  const relationships = relationshipsResponse.documents;

  // Add relationship edges to families
  // Note: This depends on how family-chart handles additional relationships
  // You may need to extend the families array or create additional data structure

  return {
    individuals,
    families: familiesData,
    // Add relationships if family-chart supports it
  };
}
```

## Performance Considerations

1. **Caching**: Consider caching the transformed data for frequently accessed trees
2. **Incremental Loading**: Load tree data incrementally as user expands nodes
3. **Indexing**: Ensure proper indexes on `persons.isPublic`, `persons.status`, `families.status`
4. **Batch Queries**: Use batch queries when fetching multiple persons

## Testing

### Test Data Example

```typescript
const testTreeData: FamilyChartData = {
  individuals: [
    {
      id: 'p1',
      name: 'Tunku Abdul Rahman',
      gender: 'M',
      birthDate: '1903-02-08',
      deathDate: '1990-12-06',
      isDeceased: true,
    },
    {
      id: 'p2',
      name: 'Siti Aminah',
      gender: 'F',
      birthDate: '1905-01-15',
    },
    {
      id: 'p3',
      name: 'Raja Ahmad',
      gender: 'M',
      birthDate: '1930-05-20',
    },
  ],
  families: [
    {
      husband: 'p1',
      wife: 'p2',
      children: ['p3'],
    },
  ],
};
```

## Notes

- The transformation preserves all necessary data for family-chart visualization
- Gender format matches family-chart requirements (`M`, `F`, `O`, `U`)
- Public visibility is controlled by `isPublic` flag
- Status filtering ensures only active records are included
- The transformation handles both traditional (husband/wife) and modern (partners array) family structures

---

*Last Updated: January 2025*

