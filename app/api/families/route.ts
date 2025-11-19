import { NextRequest, NextResponse } from 'next/server';
import { createProtectedPOST, createProtectedGET } from '@/lib/api-protection';
import { tablesDB, DATABASE_ID, FAMILIES_COLLECTION_ID, account } from '@/lib/appwrite';
import { Query, ID } from 'appwrite';
import { auditLogger } from '@/lib/audit-log';
import { logger } from '@/lib/logger';
import { APIError, createSuccessResponse } from '@/lib/api-error-handler';
import { z } from 'zod';

// Schema for family creation
const familySchema = z.object({
  husband: z.string().max(128).optional(),
  wife: z.string().max(128).optional(),
  partners: z.array(z.string().max(128)).default([]),
  children: z.array(z.string().max(128)).default([]),
  familyName: z.string().max(200).optional(),
  marriageDate: z.string().optional(),
  marriagePlace: z.string().max(300).optional(),
  divorceDate: z.string().optional(),
  isDivorced: z.boolean().default(false),
  isHistoric: z.boolean().default(false),
  notes: z.string().max(5000).optional(),
  metadata: z.string().max(5000).optional(),
  status: z.enum(['active', 'inactive', 'archived', 'draft']).default('active'),
  displayOrder: z.number().int().min(0).default(0),
});

// POST /api/families - Create a new family
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
      throw APIError.forbidden('Only administrators can create families');
    }

    const data = body;

    // Validate that referenced persons exist
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

    // At least one partner or child required
    const allPartners = [
      ...(data.husband ? [data.husband] : []),
      ...(data.wife ? [data.wife] : []),
      ...(data.partners || []),
    ];
    if (allPartners.length === 0 && (!data.children || data.children.length === 0)) {
      throw APIError.badRequest('Family must have at least one partner or child');
    }

    // Create family record
    const familyData = {
      husband: data.husband || undefined,
      wife: data.wife || undefined,
      partners: data.partners || [],
      children: data.children || [],
      familyName: data.familyName || undefined,
      marriageDate: data.marriageDate || undefined,
      marriagePlace: data.marriagePlace || undefined,
      divorceDate: data.divorceDate || undefined,
      isDivorced: data.isDivorced || false,
      isHistoric: data.isHistoric || false,
      notes: data.notes || undefined,
      metadata: data.metadata || undefined,
      status: data.status || 'active',
      displayOrder: data.displayOrder || 0,
      createdBy: user.$id,
    };

    const family = await tablesDB.createRow({
      databaseId: DATABASE_ID,
      tableId: FAMILIES_COLLECTION_ID,
      rowId: ID.unique(),
      data: familyData,
    });

    // Log family creation
    await auditLogger.logSecurityEvent(user.$id, 'FAMILY_CREATED', {
      familyId: family.$id,
      familyName: (family as any).familyName || 'Unnamed Family',
    }).catch(() => { });

    return createSuccessResponse(family, 'Family created successfully', 201);
  },
  {
    rateLimit: 'api',
    schema: familySchema,
  }
);

// GET /api/families - List families
export const GET = createProtectedGET(
  async ({ request }) => {
    // Get authenticated user
    let user;
    try {
      user = await account.get();
    } catch (error) {
      throw APIError.unauthorized('Unauthorized');
    }

    // Extract search params
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const isHistoric = searchParams.get('isHistoric') || '';

    // Build queries
    const queries: any[] = [];

    if (search) {
      queries.push(Query.or([
        Query.contains('familyName', search),
      ]));
    }

    if (status) {
      queries.push(Query.equal('status', status));
    }

    if (isHistoric) {
      queries.push(Query.equal('isHistoric', isHistoric === 'true'));
    }

    // Add pagination
    queries.push(Query.limit(pageSize));
    queries.push(Query.offset((page - 1) * pageSize));

    // Add ordering
    queries.push(Query.orderDesc('$createdAt'));

    const response = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: FAMILIES_COLLECTION_ID,
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

