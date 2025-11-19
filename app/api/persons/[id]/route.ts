import { NextRequest, NextResponse } from 'next/server';
import { createProtectedGET, createProtectedPUT, createProtectedDELETE } from '@/lib/api-protection';
import { DATABASE_ID, PERSONS_COLLECTION_ID } from '@/lib/appwrite';
import { Query, Client, Account, TablesDB } from 'appwrite';
import { auditLogger } from '@/lib/audit-log';
import { logger } from '@/lib/logger';
import { APIError, createSuccessResponse } from '@/lib/api-error-handler';
import { z } from 'zod';

// Schema for person update
const personUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200).optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  middleName: z.string().max(100).optional(),
  maidenName: z.string().max(100).optional(),
  nickname: z.string().max(50).optional(),
  title: z.string().max(50).optional(),
  gender: z.enum(['M', 'F', 'O', 'U']).optional(),
  birthDate: z.string().optional(),
  birthPlace: z.string().max(300).optional(),
  birthCountry: z.string().max(100).optional(),
  deathDate: z.string().optional(),
  deathPlace: z.string().max(300).optional(),
  deathCountry: z.string().max(100).optional(),
  isDeceased: z.boolean().optional(),
  photo: z.string().max(2000).url().optional().or(z.literal('')),
  photoThumbnail: z.string().max(2000).url().optional().or(z.literal('')),
  bio: z.string().max(10000).optional(),
  wikiId: z.string().max(50).optional(),
  occupation: z.string().max(200).optional(),
  education: z.string().max(500).optional(),
  nationality: z.string().max(100).optional(),
  ethnicity: z.string().max(100).optional(),
  religion: z.string().max(100).optional(),
  email: z.string().email().max(255).optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
  notes: z.string().max(5000).optional(),
  metadata: z.string().max(5000).optional(),
  status: z.enum(['active', 'inactive', 'archived', 'draft']).optional(),
  isPublic: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

// GET /api/persons/[id] - Get person by ID
export const GET = createProtectedGET(
  async ({ request, params }) => {
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

    const personId = params.id;

    const person = await authenticatedTablesDB.getRow({
      databaseId: DATABASE_ID,
      tableId: PERSONS_COLLECTION_ID,
      rowId: personId,
    });

    // Non-admins can only see public persons
    if (!isAdmin && (!(person as any).isPublic || (person as any).status !== 'active')) {
      throw APIError.forbidden('You do not have permission to view this person');
    }

    return createSuccessResponse(person);
  },
  {
    rateLimit: 'api',
  }
);

// PUT /api/persons/[id] - Update person
export const PUT = createProtectedPUT(
  async ({ body, request, params }) => {
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

    if (userRecord.rows.length === 0 || (userRecord.rows[0] as any).role !== 'super_admin') {
      throw APIError.forbidden('Only administrators can update persons');
    }

    const personId = params.id;
    const data = body;

    // Check if person exists
    const existingPerson = await authenticatedTablesDB.getRow({
      databaseId: DATABASE_ID,
      tableId: PERSONS_COLLECTION_ID,
      rowId: personId,
    });

    // Check for duplicate wikiId if provided and changed
    if (data.wikiId && data.wikiId !== (existingPerson as any).wikiId) {
      const wikiCheck = await authenticatedTablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: PERSONS_COLLECTION_ID,
        queries: [
          Query.equal('wikiId', data.wikiId),
          Query.limit(1),
        ],
      });

      if (wikiCheck.rows.length > 0) {
        throw APIError.conflict('A person with this Wikipedia ID already exists');
      }
    }

    // Build update data (only include provided fields)
    const updateData: any = {
      updatedBy: user.$id,
    };

    Object.keys(data).forEach(key => {
      if (data[key as keyof typeof data] !== undefined) {
        updateData[key] = data[key as keyof typeof data] === '' ? undefined : data[key as keyof typeof data];
      }
    });

    const updatedPerson = await authenticatedTablesDB.updateRow({
      databaseId: DATABASE_ID,
      tableId: PERSONS_COLLECTION_ID,
      rowId: personId,
      data: updateData,
    });

    // Log person update
    await auditLogger.logSecurityEvent(user.$id, 'PERSON_UPDATED', {
      personId: updatedPerson.$id,
      personName: (updatedPerson as any).name,
    }).catch(() => { });

    return createSuccessResponse(updatedPerson, 'Person updated successfully');
  },
  {
    rateLimit: 'api',
    schema: personUpdateSchema,
  }
);

// DELETE /api/persons/[id] - Delete person
export const DELETE = createProtectedDELETE(
  async ({ request, params }) => {
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

    if (userRecord.rows.length === 0 || (userRecord.rows[0] as any).role !== 'super_admin') {
      throw APIError.forbidden('Only administrators can delete persons');
    }

    const personId = params.id;

    // Check if person exists
    const person = await authenticatedTablesDB.getRow({
      databaseId: DATABASE_ID,
      tableId: PERSONS_COLLECTION_ID,
      rowId: personId,
    });

    // Check if person is referenced in families or relationships
    const familiesCheck = await authenticatedTablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: 'families',
      queries: [
        Query.or([
          Query.equal('husband', personId),
          Query.equal('wife', personId),
        ]),
        Query.limit(1),
      ],
    });

    if (familiesCheck.rows.length > 0) {
      throw APIError.conflict('Cannot delete person: person is referenced in families. Please remove family references first.');
    }

    // Delete person
    await authenticatedTablesDB.deleteRow({
      databaseId: DATABASE_ID,
      tableId: PERSONS_COLLECTION_ID,
      rowId: personId,
    });

    // Log person deletion
    await auditLogger.logSecurityEvent(user.$id, 'PERSON_DELETED', {
      personId: personId,
      personName: (person as any).name,
    }).catch(() => { });

    return createSuccessResponse({ id: personId }, 'Person deleted successfully');
  },
  {
    rateLimit: 'api',
  }
);

