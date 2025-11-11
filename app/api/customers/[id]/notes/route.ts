import { NextRequest } from 'next/server';
import { createProtectedGET, createProtectedPOST } from '@/lib/api-protection';
import { tablesDB, DATABASE_ID, CUSTOMERS_COLLECTION_ID, CUSTOMER_NOTES_COLLECTION_ID, account } from '@/lib/appwrite';
import { Query, ID } from 'appwrite';
import { auditLogger } from '@/lib/audit-log';
import { logger } from '@/lib/logger';
import { APIError, createSuccessResponse } from '@/lib/api-error-handler';
import { z } from 'zod';

const noteSchema = z.object({
  noteType: z.enum(['general', 'internal', 'customer_facing', 'meeting', 'call', 'email', 'contract', 'payment', 'support', 'complaint', 'feedback', 'reminder', 'task', 'other']),
  title: z.string().max(200).optional(),
  content: z.string().min(1, 'Content is required').max(10000),
  isImportant: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  relatedEntityType: z.string().max(50).optional(),
  relatedEntityId: z.string().max(128).optional(),
  metadata: z.string().max(5000).optional(),
});

// GET /api/customers/[id]/notes - Get all notes for a customer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return createProtectedGET(
    async ({ request }) => {
      const user = await account.get();
      if (!resolvedParams?.id) {
        throw APIError.badRequest('Customer ID is required');
      }

      const customerId = resolvedParams.id;

      // Verify customer exists and user owns it
      const customer = await tablesDB.getRow({
        databaseId: DATABASE_ID,
        tableId: CUSTOMERS_COLLECTION_ID,
        rowId: customerId,
      });

      if ((customer as any).userId !== user.$id) {
        throw APIError.forbidden('You do not have permission to view notes for this customer');
      }

      // Get notes
      const notes = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: CUSTOMER_NOTES_COLLECTION_ID,
        queries: [
          Query.equal('customerId', customerId),
          Query.orderDesc('isPinned'),
          Query.orderDesc('$createdAt'),
        ],
      });

      return createSuccessResponse(notes.rows);
    },
    {
      rateLimit: 'api',
    }
  )(request);
}

// POST /api/customers/[id]/notes - Create a new note
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return createProtectedPOST(
    async ({ body }) => {
      const user = await account.get();
      if (!resolvedParams?.id) {
        throw APIError.badRequest('Customer ID is required');
      }

      const customerId = resolvedParams.id;

      // Validate request body
      const validationResult = noteSchema.safeParse(body);
      if (!validationResult.success) {
        throw APIError.validationError('Validation failed', validationResult.error.issues);
      }

      const data = validationResult.data;

      // Verify customer exists and user owns it
      const customer = await tablesDB.getRow({
        databaseId: DATABASE_ID,
        tableId: CUSTOMERS_COLLECTION_ID,
        rowId: customerId,
      });

      if ((customer as any).userId !== user.$id) {
        throw APIError.forbidden('You do not have permission to create notes for this customer');
      }

      // Create note
      const noteData = {
        customerId: customerId,
        userId: user.$id,
        noteType: data.noteType,
        title: data.title || null,
        content: data.content,
        isImportant: data.isImportant || false,
        isPinned: data.isPinned || false,
        tags: data.tags || [],
        relatedEntityType: data.relatedEntityType || null,
        relatedEntityId: data.relatedEntityId || null,
        metadata: data.metadata || null,
        createdBy: user.$id,
      };

      const note = await tablesDB.createRow({
        databaseId: DATABASE_ID,
        tableId: CUSTOMER_NOTES_COLLECTION_ID,
        rowId: ID.unique(),
        data: noteData,
      });

      // Log in audit
      await auditLogger.logCustomerNoteCreated(user.$id, note.$id, customerId).catch(() => {});

      return createSuccessResponse(note);
    },
    {
      rateLimit: 'api',
      requireCSRF: true,
    }
  )(request);
}

