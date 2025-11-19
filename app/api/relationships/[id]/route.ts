import { NextRequest, NextResponse } from 'next/server';
import { createProtectedGET, createProtectedPUT, createProtectedDELETE } from '@/lib/api-protection';
import { tablesDB, DATABASE_ID, RELATIONSHIPS_COLLECTION_ID, account } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { auditLogger } from '@/lib/audit-log';
import { logger } from '@/lib/logger';
import { APIError, createSuccessResponse } from '@/lib/api-error-handler';
import { z } from 'zod';

// Schema for relationship update
const relationshipUpdateSchema = z.object({
  personA: z.string().max(128).optional(),
  personB: z.string().max(128).optional(),
  type: z.enum(['married', 'divorced', 'engaged', 'parent', 'child', 'sibling', 'half_sibling', 'step_sibling', 'adopted', 'adoptive_parent', 'cousin', 'uncle_aunt', 'nephew_niece', 'grandparent', 'grandchild', 'in_law', 'godparent', 'godchild', 'guardian', 'ward', 'other']).optional(),
  date: z.string().optional(),
  place: z.string().max(300).optional(),
  note: z.string().max(2000).optional(),
  isBidirectional: z.boolean().optional(),
  status: z.enum(['active', 'inactive', 'archived', 'draft']).optional(),
  metadata: z.string().max(5000).optional(),
});

// GET /api/relationships/[id] - Get relationship by ID
export const GET = createProtectedGET(
  async ({ request, params }) => {
    const relationshipId = params.id;

    const relationship = await tablesDB.getRow({
      databaseId: DATABASE_ID,
      tableId: RELATIONSHIPS_COLLECTION_ID,
      rowId: relationshipId,
    });

    return createSuccessResponse(relationship);
  },
  {
    rateLimit: 'api',
  }
);

// PUT /api/relationships/[id] - Update relationship
export const PUT = createProtectedPUT(
  async ({ body, request, params }) => {
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
      throw APIError.forbidden('Only administrators can update relationships');
    }

    const relationshipId = params.id;
    const data = body;

    // Validate personA and personB are different if both provided
    if (data.personA && data.personB && data.personA === data.personB) {
      throw APIError.badRequest('Person A and Person B must be different');
    }

    // Validate that persons exist if provided
    if (data.personA) {
      try {
        await tablesDB.getRow({
          databaseId: DATABASE_ID,
          tableId: 'persons',
          rowId: data.personA,
        });
      } catch (error) {
        throw APIError.badRequest(`Person A with ID ${data.personA} does not exist`);
      }
    }

    if (data.personB) {
      try {
        await tablesDB.getRow({
          databaseId: DATABASE_ID,
          tableId: 'persons',
          rowId: data.personB,
        });
      } catch (error) {
        throw APIError.badRequest(`Person B with ID ${data.personB} does not exist`);
      }
    }

    // Build update data
    const updateData: any = {
      updatedBy: user.$id,
    };

    Object.keys(data).forEach(key => {
      if (data[key as keyof typeof data] !== undefined) {
        updateData[key] = data[key as keyof typeof data];
      }
    });

    const updatedRelationship = await tablesDB.updateRow({
      databaseId: DATABASE_ID,
      tableId: RELATIONSHIPS_COLLECTION_ID,
      rowId: relationshipId,
      data: updateData,
    });

    // Log relationship update
    await auditLogger.logSecurityEvent(user.$id, 'RELATIONSHIP_UPDATED', {
      relationshipId: updatedRelationship.$id,
      type: (updatedRelationship as any).type,
    }).catch(() => { });

    return createSuccessResponse(updatedRelationship, 'Relationship updated successfully');
  },
  {
    rateLimit: 'api',
    schema: relationshipUpdateSchema,
  }
);

// DELETE /api/relationships/[id] - Delete relationship
export const DELETE = createProtectedDELETE(
  async ({ request, params }) => {
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
      throw APIError.forbidden('Only administrators can delete relationships');
    }

    const relationshipId = params.id;

    // Check if relationship exists
    const relationship = await tablesDB.getRow({
      databaseId: DATABASE_ID,
      tableId: RELATIONSHIPS_COLLECTION_ID,
      rowId: relationshipId,
    });

    // Delete relationship
    await tablesDB.deleteRow({
      databaseId: DATABASE_ID,
      tableId: RELATIONSHIPS_COLLECTION_ID,
      rowId: relationshipId,
    });

    // Log relationship deletion
    await auditLogger.logSecurityEvent(user.$id, 'RELATIONSHIP_DELETED', {
      relationshipId: relationshipId,
      type: (relationship as any).type,
    }).catch(() => { });

    return createSuccessResponse({ id: relationshipId }, 'Relationship deleted successfully');
  },
  {
    rateLimit: 'api',
  }
);

