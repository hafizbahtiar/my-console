import { NextRequest, NextResponse } from 'next/server';
import { createProtectedGET } from '@/lib/api-protection';
import { DATABASE_ID, PERSONS_COLLECTION_ID, FAMILIES_COLLECTION_ID } from '@/lib/appwrite';
import { Query, Client, Account, TablesDB } from 'appwrite';
import { APIError, createSuccessResponse } from '@/lib/api-error-handler';

// GET /api/tree - Get complete family tree data for visualization
export const GET = createProtectedGET(
  async ({ request }) => {
    // Create authenticated client
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID?.toLowerCase() || '';
    const jwt = request.headers.get('X-Appwrite-JWT');
    const session = request.cookies.get(`a_session_${projectId}`)?.value ||
      request.cookies.get(`a_session_${projectId}_legacy`)?.value;
    
    if (!jwt && !session) {
      throw APIError.unauthorized('Authentication required - no JWT or session');
    }
    
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '')
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '');
    
    if (jwt) {
      client.setJWT(jwt);
    } else {
      client.setSession(session || '');
    }
    
    const account = new Account(client);
    const authenticatedTablesDB = new TablesDB(client);
    
    // Get authenticated user
    let user;
    try {
      user = await account.get();
    } catch (error) {
      throw APIError.unauthorized('Unauthorized');
    }

    // Check if user is admin
    const userRecord = await authenticatedTablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: 'users',
      queries: [
        Query.equal('userId', user.$id),
        Query.limit(1),
      ],
    });

    const isAdmin = userRecord.rows.length > 0 && (userRecord.rows[0] as any).role === 'super_admin';

    // Extract search params
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const includePrivate = searchParams.get('includePrivate') === 'true' && isAdmin;

    // Fetch all persons
    const personsQueries: any[] = [];
    if (!includePrivate) {
      personsQueries.push(Query.equal('isPublic', true));
      personsQueries.push(Query.equal('status', 'active'));
    } else if (!isAdmin) {
      personsQueries.push(Query.equal('isPublic', true));
      personsQueries.push(Query.equal('status', 'active'));
    }

    const personsResponse = await authenticatedTablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: PERSONS_COLLECTION_ID,
      queries: personsQueries,
    });
    const persons = personsResponse.rows;

    // Fetch all families
    const familiesResponse = await authenticatedTablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: FAMILIES_COLLECTION_ID,
      queries: [Query.equal('status', 'active')],
    });
    const families = familiesResponse.rows;

    // Transform to family-chart format
    const individuals = persons.map((person: any) => ({
      id: person.$id,
      name: person.name || getFullName(person),
      gender: person.gender,
      photo: person.photo,
      birthDate: person.birthDate,
      deathDate: person.deathDate,
      isDeceased: person.isDeceased,
    }));

    const familiesData = families.map((family: any) => {
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

    return createSuccessResponse({
      individuals,
      families: familiesData,
    });
  },
  {
    rateLimit: 'api',
  }
);

// Helper functions
function getAllPartners(family: any): string[] {
  const partners: string[] = [];
  if (family.husband) partners.push(family.husband);
  if (family.wife) partners.push(family.wife);
  if (family.partners && family.partners.length > 0) {
    partners.push(...family.partners);
  }
  return [...new Set(partners)];
}

function getFullName(person: any): string {
  if (person.name) return person.name;

  const parts: string[] = [];
  if (person.title) parts.push(person.title);
  if (person.firstName) parts.push(person.firstName);
  if (person.middleName) parts.push(person.middleName);
  if (person.lastName) parts.push(person.lastName);

  return parts.join(' ') || 'Unknown';
}

