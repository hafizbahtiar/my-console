import { NextRequest, NextResponse } from 'next/server';
import { createProtectedPOST, createProtectedGET } from '@/lib/api-protection';
import { tablesDB, DATABASE_ID, RELATIONSHIPS_COLLECTION_ID, account } from '@/lib/appwrite';
import { Query, ID } from 'appwrite';
import { auditLogger } from '@/lib/audit-log';
import { logger } from '@/lib/logger';
import { APIError, createSuccessResponse } from '@/lib/api-error-handler';
import { z } from 'zod';

// Schema for relationship creation
const relationshipSchema = z.object({
  personA: z.string().min(1, 'Person A is required').max(128),
  personB: z.string().min(1, 'Person B is required').max(128),
  type: z.enum(['married', 'divorced', 'engaged', 'parent', 'child', 'sibling', 'half_sibling', 'step_sibling', 'adopted', 'adoptive_parent', 'cousin', 'uncle_aunt', 'nephew_niece', 'grandparent', 'grandchild', 'in_law', 'godparent', 'godchild', 'guardian', 'ward', 'other']),
  date: z.string().optional(),
  place: z.string().max(300).optional(),
  note: z.string().max(2000).optional(),
  isBidirectional: z.boolean().default(true),
  status: z.enum(['active', 'inactive', 'archived', 'draft']).default('active'),
  metadata: z.string().max(5000).optional(),
});

// POST /api/relationships - Create a new relationship
export const POST = createProtectedPOST(
  async ({ body, request }) => {
    // Get authenticated user
    let user;
    try {
      user = await account.get();
    } catch (error) {
      throw APIError.unauthorized('Unauthorized');
    }

    // Check if user is admin
    const userRecord = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: 'users',
      queries: [
        Query.equal('userId', user.$id),
        Query.limit(1),
      ],
    });

    if (userRecord.rows.length === 0 || (userRecord.rows[0] as any).role !== 'super_admin') {
      throw APIError.forbidden('Only administrators can create relationships');
    }

    const data = body;

    // Validate personA and personB are different
    if (data.personA === data.personB) {
      throw APIError.badRequest('Person A and Person B must be different');
    }

    // Validate that persons exist
    try {
      await tablesDB.getRow({
        databaseId: DATABASE_ID,
        tableId: 'persons',
        rowId: data.personA,
      });
    } catch (error) {
      throw APIError.badRequest(`Person A with ID ${data.personA} does not exist`);
    }

    try {
      await tablesDB.getRow({
        databaseId: DATABASE_ID,
        tableId: 'persons',
        rowId: data.personB,
      });
    } catch (error) {
      throw APIError.badRequest(`Person B with ID ${data.personB} does not exist`);
    }

    // Create relationship record
    const relationshipData = {
      personA: data.personA,
      personB: data.personB,
      type: data.type,
      date: data.date || undefined,
      place: data.place || undefined,
      note: data.note || undefined,
      isBidirectional: data.isBidirectional !== undefined ? data.isBidirectional : true,
      status: data.status || 'active',
      metadata: data.metadata || undefined,
      createdBy: user.$id,
    };

    const relationship = await tablesDB.createRow({
      databaseId: DATABASE_ID,
      tableId: RELATIONSHIPS_COLLECTION_ID,
      rowId: ID.unique(),
      data: relationshipData,
    });

    // Log relationship creation
    await auditLogger.logSecurityEvent(user.$id, 'RELATIONSHIP_CREATED', {
      relationshipId: relationship.$id,
      personA: data.personA,
      personB: data.personB,
      type: data.type,
    }).catch(() => { });

    return createSuccessResponse(relationship, 'Relationship created successfully', 201);
  },
  {
    rateLimit: 'api',
    schema: relationshipSchema,
  }
);

// GET /api/relationships - List relationships
export const GET = createProtectedGET(
  async ({ request }) => {
    // Extract search params
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const personId = searchParams.get('personId') || '';
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';

    // Build queries
    const queries: any[] = [];

    if (personId) {
      queries.push(Query.or([
        Query.equal('personA', personId),
        Query.equal('personB', personId),
      ]));
    }

    if (type) {
      queries.push(Query.equal('type', type));
    }

    if (status) {
      queries.push(Query.equal('status', status));
    }

    // Add pagination
    queries.push(Query.limit(pageSize));
    queries.push(Query.offset((page - 1) * pageSize));

    // Add ordering
    queries.push(Query.orderDesc('$createdAt'));

    const response = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: RELATIONSHIPS_COLLECTION_ID,
      queries,
    });

    return createSuccessResponse({
      rows: response.rows,
      total: response.total,
      page,
      pageSize,
    });
  },
  {
    rateLimit: 'api',
  }
);

