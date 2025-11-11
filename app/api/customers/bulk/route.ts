import { NextRequest } from 'next/server';
import { createProtectedPOST } from '@/lib/api-protection';
import { tablesDB, DATABASE_ID, CUSTOMERS_COLLECTION_ID, account } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { APIError, createSuccessResponse } from '@/lib/api-error-handler';
import { auditLogger } from '@/lib/audit-log';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const bulkUpdateSchema = z.object({
  customerIds: z.array(z.string()).min(1, 'At least one customer ID is required'),
  operation: z.enum(['updateStatus', 'addTags', 'removeTags', 'setTags']),
  data: z.object({
    status: z.enum(['active', 'inactive', 'lead', 'prospect', 'archived']).optional(),
    tags: z.array(z.string()).optional(),
  }),
});

// POST /api/customers/bulk - Bulk operations on customers
export const POST = createProtectedPOST(
  async ({ body }) => {
    const user = await account.get();
    const validationResult = bulkUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      throw APIError.validationError('Invalid request data', validationResult.error.issues);
    }

    const { customerIds, operation, data } = validationResult.data;

    // Verify all customers belong to the authenticated user (self-service model)
    const customers = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: CUSTOMERS_COLLECTION_ID,
      queries: [
        Query.equal('userId', user.$id),
      ],
    });

    const userCustomerIds = customers.rows.map((c: any) => c.$id);
    const invalidIds = customerIds.filter(id => !userCustomerIds.includes(id));

    if (invalidIds.length > 0) {
      throw APIError.forbidden('You do not have permission to modify some of the selected customers');
    }

    let updated = 0;
    let errors: string[] = [];

    for (const customerId of customerIds) {
      try {
        const customer = customers.rows.find((c: any) => c.$id === customerId);
        if (!customer) continue;

        let updateData: any = {
          updatedBy: user.$id,
        };

        if (operation === 'updateStatus' && data.status) {
          updateData.status = data.status;
        } else if (operation === 'addTags' && data.tags) {
          // Parse existing metadata
          let metadata: any = {};
          if (customer.metadata) {
            try {
              metadata = typeof customer.metadata === 'string' 
                ? JSON.parse(customer.metadata) 
                : customer.metadata;
            } catch {
              metadata = {};
            }
          }

          // Add new tags (avoid duplicates)
          const existingTags = metadata.tags || [];
          const newTags = [...new Set([...existingTags, ...data.tags])];
          metadata.tags = newTags;
          updateData.metadata = JSON.stringify(metadata);
        } else if (operation === 'removeTags' && data.tags) {
          // Parse existing metadata
          let metadata: any = {};
          if (customer.metadata) {
            try {
              metadata = typeof customer.metadata === 'string' 
                ? JSON.parse(customer.metadata) 
                : customer.metadata;
            } catch {
              metadata = {};
            }
          }

          // Remove specified tags
          const existingTags = metadata.tags || [];
          const newTags = existingTags.filter((tag: string) => !data.tags!.includes(tag));
          metadata.tags = newTags;
          updateData.metadata = JSON.stringify(metadata);
        } else if (operation === 'setTags' && data.tags !== undefined) {
          // Parse existing metadata
          let metadata: any = {};
          if (customer.metadata) {
            try {
              metadata = typeof customer.metadata === 'string' 
                ? JSON.parse(customer.metadata) 
                : customer.metadata;
            } catch {
              metadata = {};
            }
          }

          // Set tags (replace existing)
          metadata.tags = data.tags;
          updateData.metadata = JSON.stringify(metadata);
        }

        await tablesDB.updateRow({
          databaseId: DATABASE_ID,
          tableId: CUSTOMERS_COLLECTION_ID,
          rowId: customerId,
          data: updateData,
        });

        updated++;

        // Log audit event
        await auditLogger.logSecurityEvent(user.$id, 'CUSTOMER_BULK_UPDATED', {
          customerId,
          operation,
          data: updateData,
        }).catch(() => {});
      } catch (error: any) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${customerId}: ${errorMsg}`);
        logger.warn(`Failed to update customer ${customerId} in bulk operation`, 'api/customers/bulk', error);
      }
    }

    return createSuccessResponse({
      updated,
      total: customerIds.length,
      errors: errors.length,
      errorDetails: errors,
    });
  },
  {
    rateLimit: 'api',
    requireCSRF: true,
  }
);

