import { NextRequest, NextResponse } from 'next/server';
import { createProtectedGET, createProtectedPUT, createProtectedDELETE } from '@/lib/api-protection';
import { tablesDB, DATABASE_ID, FAMILIES_COLLECTION_ID, account } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { auditLogger } from '@/lib/audit-log';
import { logger } from '@/lib/logger';
import { APIError, createSuccessResponse } from '@/lib/api-error-handler';
import { z } from 'zod';

// Schema for family update
const familyUpdateSchema = z.object({
  husband: z.string().max(128).optional(),
  wife: z.string().max(128).optional(),
  partners: z.array(z.string().max(128)).optional(),
  children: z.array(z.string().max(128)).optional(),
  familyName: z.string().max(200).optional(),
  marriageDate: z.string().optional(),
  marriagePlace: z.string().max(300).optional(),
  divorceDate: z.string().optional(),
  isDivorced: z.boolean().optional(),
  isHistoric: z.boolean().optional(),
  notes: z.string().max(5000).optional(),
  metadata: z.string().max(5000).optional(),
  status: z.enum(['active', 'inactive', 'archived', 'draft']).optional(),
  displayOrder: z.number().int().min(0).optional(),
});

// GET /api/families/[id] - Get family by ID
export const GET = createProtectedGET(
  async ({ request, params }) => {
    const familyId = params.id;

    const family = await tablesDB.getRow({
      databaseId: DATABASE_ID,
      tableId: FAMILIES_COLLECTION_ID,
      rowId: familyId,
    });

    return createSuccessResponse(family);
  },
  {
    rateLimit: 'api',
  }
);

// PUT /api/families/[id] - Update family
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
      throw APIError.forbidden('Only administrators can update families');
    }

    const familyId = params.id;
    const data = body;

    // Validate that referenced persons exist if provided
    const personIds = [
      ...(data.husband ? [data.husband] : []),
      ...(data.wife ? [data.wife] : []),
      ...(data.partners || []),
      ...(data.children || []),
    ];

    if (personIds.length > 0) {
      for (const personId of personIds) {
        try {
          await tablesDB.getRow({
            databaseId: DATABASE_ID,
            tableId: 'persons',
            rowId: personId,
          });
        } catch (error) {
          throw APIError.badRequest(`Person with ID ${personId} does not exist`);
        }
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

    const updatedFamily = await tablesDB.updateRow({
      databaseId: DATABASE_ID,
      tableId: FAMILIES_COLLECTION_ID,
      rowId: familyId,
      data: updateData,
    });

    // Log family update
    await auditLogger.logSecurityEvent(user.$id, 'FAMILY_UPDATED', {
      familyId: updatedFamily.$id,
      familyName: (updatedFamily as any).familyName || 'Unnamed Family',
    }).catch(() => { });

    return createSuccessResponse(updatedFamily, 'Family updated successfully');
  },
  {
    rateLimit: 'api',
    schema: familyUpdateSchema,
  }
);

// DELETE /api/families/[id] - Delete family
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
      throw APIError.forbidden('Only administrators can delete families');
    }

    const familyId = params.id;

    // Check if family exists
    const family = await tablesDB.getRow({
      databaseId: DATABASE_ID,
      tableId: FAMILIES_COLLECTION_ID,
      rowId: familyId,
    });

    // Delete family
    await tablesDB.deleteRow({
      databaseId: DATABASE_ID,
      tableId: FAMILIES_COLLECTION_ID,
      rowId: familyId,
    });

    // Log family deletion
    await auditLogger.logSecurityEvent(user.$id, 'FAMILY_DELETED', {
      familyId: familyId,
      familyName: (family as any).familyName || 'Unnamed Family',
    }).catch(() => { });

    return createSuccessResponse({ id: familyId }, 'Family deleted successfully');
  },
  {
    rateLimit: 'api',
  }
);

