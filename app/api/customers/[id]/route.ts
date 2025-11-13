import { NextRequest, NextResponse } from 'next/server';
import { createProtectedGET, createProtectedPUT, createProtectedDELETE } from '@/lib/api-protection';
import { tablesDB, DATABASE_ID, CUSTOMERS_COLLECTION_ID, account } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { auditLogger } from '@/lib/audit-log';
import { logger } from '@/lib/logger';
import { APIError, createSuccessResponse, createErrorResponse, APIErrorCode } from '@/lib/api-error-handler';
import { z } from 'zod';

// Schema for customer update
const customerUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'lead', 'prospect', 'archived']).optional(),
  assignedTo: z.string().optional(),
  source: z.enum(['website', 'referral', 'social_media', 'advertising', 'trade_show', 'cold_call', 'email_campaign', 'other']).optional(),
  industry: z.string().optional(),
  customerType: z.enum(['individual', 'company', 'non-profit', 'government']).optional(),
  currency: z.string().optional(),
  language: z.enum(['en', 'ms']).optional(),
  timezone: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.string().optional(),
  updatedBy: z.string().optional(),
});

// GET /api/customers/[id] - Get a specific customer
export const GET = createProtectedGET(
  async ({ request, params }) => {
    // Get authenticated user
    let user;
    try {
      user = await account.get();
    } catch (error) {
      throw APIError.unauthorized('Unauthorized');
    }

    if (!params || !params.id) {
      throw APIError.badRequest('Customer ID is required');
    }

    const customerId = params.id;

    try {
      const customer = await tablesDB.getRow({
        databaseId: DATABASE_ID,
        tableId: CUSTOMERS_COLLECTION_ID,
        rowId: customerId,
      });

      // Verify user owns this customer record (self-service model)
      if ((customer as any).userId !== user.$id) {
        throw APIError.forbidden('You do not have permission to view this customer');
      }

      return createSuccessResponse(customer);
    } catch (error: any) {
      if (error instanceof APIError) {
        throw error;
      }
      if (error.code === 404) {
        throw APIError.notFound('Customer not found');
      }
      logger.error('Failed to get customer', 'api/customers/[id]', error, { customerId });
      throw APIError.internalServerError('Failed to retrieve customer', error);
    }
  },
  {
    rateLimit: 'api',
  }
);

// PUT /api/customers/[id] - Update a customer
export const PUT = createProtectedPUT(
  async ({ body, request, params }) => {
    // Get authenticated user
    let user;
    try {
      user = await account.get();
    } catch (error) {
      throw APIError.unauthorized('Unauthorized');
    }

    if (!params || !params.id) {
      throw APIError.badRequest('Customer ID is required');
    }

    const customerId = params.id;

    // Body is already validated by schema in options
    const data = body;

    try {
      // Get existing customer
      const existingCustomer = await tablesDB.getRow({
        databaseId: DATABASE_ID,
        tableId: CUSTOMERS_COLLECTION_ID,
        rowId: customerId,
      });

      // Verify user owns this customer record (self-service model)
      if ((existingCustomer as any).userId !== user.$id) {
        throw APIError.forbidden('You do not have permission to update this customer');
      }

      // Check for duplicate email if email is being changed
      if (data.email && data.email !== (existingCustomer as any).email) {
        const emailCheck = await tablesDB.listRows({
          databaseId: DATABASE_ID,
          tableId: CUSTOMERS_COLLECTION_ID,
          queries: [
            Query.equal('email', data.email),
            Query.limit(1),
          ],
        });

        if (emailCheck.rows.length > 0) {
          throw APIError.conflict('A customer with this email already exists');
        }
      }

      // Prepare update data (only include fields that are provided)
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.email !== undefined) updateData.email = data.email || undefined;
      if (data.phone !== undefined) updateData.phone = data.phone || undefined;
      if (data.company !== undefined) updateData.company = data.company || undefined;
      if (data.jobTitle !== undefined) updateData.jobTitle = data.jobTitle || undefined;
      if (data.address !== undefined) updateData.address = data.address || undefined;
      if (data.city !== undefined) updateData.city = data.city || undefined;
      if (data.state !== undefined) updateData.state = data.state || undefined;
      if (data.zipCode !== undefined) updateData.zipCode = data.zipCode || undefined;
      if (data.country !== undefined) updateData.country = data.country || undefined;
      if (data.website !== undefined) updateData.website = data.website || undefined;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo || undefined;
      if (data.source !== undefined) updateData.source = data.source;
      if (data.industry !== undefined) updateData.industry = data.industry || undefined;
      if (data.customerType !== undefined) updateData.customerType = data.customerType;
      if (data.currency !== undefined) updateData.currency = data.currency || undefined;
      if (data.language !== undefined) updateData.language = data.language;
      if (data.timezone !== undefined) updateData.timezone = data.timezone || undefined;
      if (data.notes !== undefined) updateData.notes = data.notes || undefined;
      if (data.metadata !== undefined) updateData.metadata = data.metadata || undefined;
      if (data.updatedBy) updateData.updatedBy = data.updatedBy;

      // Update customer
      const updatedCustomer = await tablesDB.updateRow({
        databaseId: DATABASE_ID,
        tableId: CUSTOMERS_COLLECTION_ID,
        rowId: customerId,
        data: updateData,
      });

      // Log customer update
      await auditLogger.logSecurityEvent(user.$id, 'CUSTOMER_UPDATED', {
        customerId: updatedCustomer.$id,
        customerName: (updatedCustomer as any).name,
      }).catch(() => {});

      return createSuccessResponse(updatedCustomer, 'Customer updated successfully');
    } catch (error: any) {
      if (error instanceof APIError) {
        throw error;
      }
      if (error.code === 404) {
        throw APIError.notFound('Customer not found');
      }
      logger.error('Failed to update customer', 'api/customers/[id]', error, { customerId });
      throw APIError.internalServerError('Failed to update customer', error);
    }
  },
  {
    rateLimit: 'api',
    schema: customerUpdateSchema,
  }
);

// DELETE /api/customers/[id] - Delete a customer
export const DELETE = createProtectedDELETE(
  async ({ request, params }) => {
    // Get authenticated user
    let user;
    try {
      user = await account.get();
    } catch (error) {
      throw APIError.unauthorized('Unauthorized');
    }

    if (!params || !params.id) {
      throw APIError.badRequest('Customer ID is required');
    }

    const customerId = params.id;

    try {
      // Get existing customer to verify ownership
      const existingCustomer = await tablesDB.getRow({
        databaseId: DATABASE_ID,
        tableId: CUSTOMERS_COLLECTION_ID,
        rowId: customerId,
      });

      // Verify user owns this customer record (self-service model)
      if ((existingCustomer as any).userId !== user.$id) {
        throw APIError.forbidden('You do not have permission to delete this customer');
      }

      // Delete customer
      await tablesDB.deleteRow({
        databaseId: DATABASE_ID,
        tableId: CUSTOMERS_COLLECTION_ID,
        rowId: customerId,
      });

      // Log customer deletion
      await auditLogger.logSecurityEvent(user.$id, 'CUSTOMER_DELETED', {
        customerId,
        customerName: (existingCustomer as any).name,
      }).catch(() => {});

      return createSuccessResponse(null, 'Customer deleted successfully');
    } catch (error: any) {
      if (error instanceof APIError) {
        throw error;
      }
      if (error.code === 404) {
        throw APIError.notFound('Customer not found');
      }
      logger.error('Failed to delete customer', 'api/customers/[id]', error, { customerId });
      throw APIError.internalServerError('Failed to delete customer', error);
    }
  },
  {
    rateLimit: 'api',
  }
);

