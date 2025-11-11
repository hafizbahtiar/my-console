import { NextRequest } from 'next/server';
import { createProtectedGET, createProtectedPOST } from '@/lib/api-protection';
import { tablesDB, DATABASE_ID, CUSTOMERS_COLLECTION_ID, CUSTOMER_INTERACTIONS_COLLECTION_ID, account } from '@/lib/appwrite';
import { Query, ID } from 'appwrite';
import { auditLogger } from '@/lib/audit-log';
import { logger } from '@/lib/logger';
import { APIError, createSuccessResponse } from '@/lib/api-error-handler';
import { z } from 'zod';

const interactionSchema = z.object({
  interactionType: z.enum(['call', 'email', 'meeting', 'note', 'task', 'quote', 'proposal', 'contract', 'support', 'complaint', 'feedback', 'other']),
  subject: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
  contactMethod: z.enum(['phone', 'email', 'in_person', 'video_call', 'chat', 'social_media', 'other']).optional(),
  direction: z.enum(['inbound', 'outbound']).optional(),
  duration: z.number().int().positive().optional(),
  outcome: z.enum(['successful', 'no_answer', 'voicemail', 'busy', 'follow_up_required', 'resolved', 'escalated', 'cancelled', 'other']).optional(),
  nextAction: z.string().max(500).optional(),
  nextActionDate: z.string().optional(),
  relatedEntityType: z.string().max(50).optional(),
  relatedEntityId: z.string().max(128).optional(),
  metadata: z.string().max(5000).optional(),
});

// GET /api/customers/[id]/interactions - Get all interactions for a customer
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
        throw APIError.forbidden('You do not have permission to view interactions for this customer');
      }

      // Get interactions
      const interactions = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: CUSTOMER_INTERACTIONS_COLLECTION_ID,
        queries: [
          Query.equal('customerId', customerId),
          Query.orderDesc('$createdAt'),
        ],
      });

      return createSuccessResponse(interactions.rows);
    },
    {
      rateLimit: 'api',
    }
  )(request);
}

// POST /api/customers/[id]/interactions - Create a new interaction
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
      const validationResult = interactionSchema.safeParse(body);
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
        throw APIError.forbidden('You do not have permission to create interactions for this customer');
      }

      // Create interaction
      const interactionData = {
        customerId: customerId,
        userId: user.$id,
        interactionType: data.interactionType,
        subject: data.subject || null,
        description: data.description || null,
        contactMethod: data.contactMethod || null,
        direction: data.direction || 'outbound',
        duration: data.duration || null,
        outcome: data.outcome || null,
        nextAction: data.nextAction || null,
        nextActionDate: data.nextActionDate || null,
        relatedEntityType: data.relatedEntityType || null,
        relatedEntityId: data.relatedEntityId || null,
        metadata: data.metadata || null,
        createdBy: user.$id,
      };

      const interaction = await tablesDB.createRow({
        databaseId: DATABASE_ID,
        tableId: CUSTOMER_INTERACTIONS_COLLECTION_ID,
        rowId: ID.unique(),
        data: interactionData,
      });

      // Update customer's last contact date
      await tablesDB.updateRow({
        databaseId: DATABASE_ID,
        tableId: CUSTOMERS_COLLECTION_ID,
        rowId: customerId,
        data: {
          lastContactAt: new Date().toISOString(),
        },
      }).catch(() => {});

      // Update customer's next follow-up if nextActionDate is set
      if (data.nextActionDate) {
        await tablesDB.updateRow({
          databaseId: DATABASE_ID,
          tableId: CUSTOMERS_COLLECTION_ID,
          rowId: customerId,
          data: {
            nextFollowUpAt: data.nextActionDate,
          },
        }).catch(() => {});
      }

      // Log in audit
      await auditLogger.logCustomerInteractionCreated(user.$id, interaction.$id, customerId).catch(() => {});

      return createSuccessResponse(interaction);
    },
    {
      rateLimit: 'api',
      requireCSRF: true,
    }
  )(request);
}

