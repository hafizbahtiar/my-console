import { NextRequest, NextResponse } from 'next/server';
import { createProtectedGET, createProtectedPUT, createProtectedDELETE } from '@/lib/api-protection';
import { tablesDB, DATABASE_ID, CUSTOMERS_COLLECTION_ID, account } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { auditLogger } from '@/lib/audit-log';
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
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return createProtectedGET(
    async ({ request }) => {
      // Get authenticated user
      let user;
      try {
        user = await account.get();
      } catch (error) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (!resolvedParams || !resolvedParams.id) {
        return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
      }

      const customerId = resolvedParams.id;

      try {
        const customer = await tablesDB.getRow({
          databaseId: DATABASE_ID,
          tableId: CUSTOMERS_COLLECTION_ID,
          rowId: customerId,
        });

        // Verify user owns this customer record (self-service model)
        if ((customer as any).userId !== user.$id) {
          return NextResponse.json(
            { error: 'You do not have permission to view this customer' },
            { status: 403 }
          );
        }

        return NextResponse.json(customer);
      } catch (error: any) {
        if (error.code === 404) {
          return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }
        console.error('Failed to get customer:', error);
        return NextResponse.json(
          { error: 'Failed to retrieve customer' },
          { status: 500 }
        );
      }
    },
    {
      rateLimit: 'api',
    }
  )(request);
}

// PUT /api/customers/[id] - Update a customer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return createProtectedPUT(
    async ({ body, request }) => {
      const routeParams = resolvedParams;
      // Get authenticated user
      let user;
      try {
        user = await account.get();
      } catch (error) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (!routeParams || !routeParams.id) {
        return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
      }

      const customerId = routeParams.id;

      // Validate request body
      const validationResult = customerUpdateSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validationResult.error.issues },
          { status: 400 }
        );
      }

      const data = validationResult.data;

      try {
        // Get existing customer
        const existingCustomer = await tablesDB.getRow({
          databaseId: DATABASE_ID,
          tableId: CUSTOMERS_COLLECTION_ID,
          rowId: customerId,
        });

        // Verify user owns this customer record (self-service model)
        if ((existingCustomer as any).userId !== user.$id) {
          return NextResponse.json(
            { error: 'You do not have permission to update this customer' },
            { status: 403 }
          );
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
            return NextResponse.json(
              { error: 'A customer with this email already exists' },
              { status: 409 }
            );
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

        return NextResponse.json(updatedCustomer);
      } catch (error: any) {
        if (error.code === 404) {
          return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }
        console.error('Failed to update customer:', error);
        return NextResponse.json(
          { error: 'Failed to update customer' },
          { status: 500 }
        );
      }
    },
    {
      rateLimit: 'api',
    }
  )(request);
}

// DELETE /api/customers/[id] - Delete a customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return createProtectedDELETE(
    async ({ request, params: routeParams }) => {
      // Get authenticated user
      let user;
      try {
        user = await account.get();
      } catch (error) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (!routeParams || !routeParams.id) {
        return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
      }

      const customerId = routeParams.id;

      try {
        // Get existing customer to verify ownership
        const existingCustomer = await tablesDB.getRow({
          databaseId: DATABASE_ID,
          tableId: CUSTOMERS_COLLECTION_ID,
          rowId: customerId,
        });

        // Verify user owns this customer record (self-service model)
        if ((existingCustomer as any).userId !== user.$id) {
          return NextResponse.json(
            { error: 'You do not have permission to delete this customer' },
            { status: 403 }
          );
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

        return NextResponse.json({ success: true, message: 'Customer deleted successfully' });
      } catch (error: any) {
        if (error.code === 404) {
          return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }
        console.error('Failed to delete customer:', error);
        return NextResponse.json(
          { error: 'Failed to delete customer' },
          { status: 500 }
        );
      }
    },
    {
      rateLimit: 'api',
    }
  )(request);
}

