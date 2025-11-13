import { NextRequest } from 'next/server';
import { createProtectedPUT, createProtectedDELETE } from '@/lib/api-protection';
import { tablesDB, DATABASE_ID, CUSTOMERS_COLLECTION_ID, CUSTOMER_NOTES_COLLECTION_ID, account } from '@/lib/appwrite';
import { auditLogger } from '@/lib/audit-log';
import { logger } from '@/lib/logger';
import { APIError, createSuccessResponse } from '@/lib/api-error-handler';
import { z } from 'zod';

const noteUpdateSchema = z.object({
  noteType: z.enum(['general', 'internal', 'customer_facing', 'meeting', 'call', 'email', 'contract', 'payment', 'support', 'complaint', 'feedback', 'reminder', 'task', 'other']).optional(),
  title: z.string().max(200).optional(),
  content: z.string().min(1).max(10000).optional(),
  isImportant: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  relatedEntityType: z.string().max(50).optional(),
  relatedEntityId: z.string().max(128).optional(),
  metadata: z.string().max(5000).optional(),
});

// PUT /api/customers/[id]/notes/[noteId] - Update a note
export const PUT = createProtectedPUT(
  async ({ body, params }) => {
    const user = await account.get();
    if (!params?.id || !params?.noteId) {
      throw APIError.badRequest('Customer ID and Note ID are required');
    }

    const customerId = params.id;
    const noteId = params.noteId;

    // Body is already validated by schema in options
    const data = body;

    // Verify customer exists and user owns it
    const customer = await tablesDB.getRow({
      databaseId: DATABASE_ID,
      tableId: CUSTOMERS_COLLECTION_ID,
      rowId: customerId,
    });

    if ((customer as any).userId !== user.$id) {
      throw APIError.forbidden('You do not have permission to update notes for this customer');
    }

    // Verify note exists and belongs to customer
    const note = await tablesDB.getRow({
      databaseId: DATABASE_ID,
      tableId: CUSTOMER_NOTES_COLLECTION_ID,
      rowId: noteId,
    });

    if ((note as any).customerId !== customerId) {
      throw APIError.forbidden('Note does not belong to this customer');
    }

    // Update note
    const updateData: any = {
      updatedBy: user.$id,
    };

    if (data.noteType !== undefined) updateData.noteType = data.noteType;
    if (data.title !== undefined) updateData.title = data.title || null;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.isImportant !== undefined) updateData.isImportant = data.isImportant;
    if (data.isPinned !== undefined) updateData.isPinned = data.isPinned;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.relatedEntityType !== undefined) updateData.relatedEntityType = data.relatedEntityType || null;
    if (data.relatedEntityId !== undefined) updateData.relatedEntityId = data.relatedEntityId || null;
    if (data.metadata !== undefined) updateData.metadata = data.metadata || null;

    const updatedNote = await tablesDB.updateRow({
      databaseId: DATABASE_ID,
      tableId: CUSTOMER_NOTES_COLLECTION_ID,
      rowId: noteId,
      data: updateData,
    });

    // Log in audit
    await auditLogger.logCustomerNoteUpdated(user.$id, noteId, customerId).catch(() => {});

    return createSuccessResponse(updatedNote);
  },
  {
    rateLimit: 'api',
    schema: noteUpdateSchema,
  }
);

// DELETE /api/customers/[id]/notes/[noteId] - Delete a note
export const DELETE = createProtectedDELETE(
  async ({ request, params }) => {
    const user = await account.get();
    if (!params?.id || !params?.noteId) {
      throw APIError.badRequest('Customer ID and Note ID are required');
    }

    const customerId = params.id;
    const noteId = params.noteId;

    // Verify customer exists and user owns it
    const customer = await tablesDB.getRow({
      databaseId: DATABASE_ID,
      tableId: CUSTOMERS_COLLECTION_ID,
      rowId: customerId,
    });

    if ((customer as any).userId !== user.$id) {
      throw APIError.forbidden('You do not have permission to delete notes for this customer');
    }

    // Verify note exists and belongs to customer
    const note = await tablesDB.getRow({
      databaseId: DATABASE_ID,
      tableId: CUSTOMER_NOTES_COLLECTION_ID,
      rowId: noteId,
    });

    if ((note as any).customerId !== customerId) {
      throw APIError.forbidden('Note does not belong to this customer');
    }

    // Delete note
    await tablesDB.deleteRow({
      databaseId: DATABASE_ID,
      tableId: CUSTOMER_NOTES_COLLECTION_ID,
      rowId: noteId,
    });

    // Log in audit
    await auditLogger.logCustomerNoteDeleted(user.$id, noteId, customerId).catch(() => {});

    return createSuccessResponse({ success: true });
  },
  {
    rateLimit: 'api',
  }
);

