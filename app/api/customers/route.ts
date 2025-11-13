import { NextRequest, NextResponse } from 'next/server';
import { createProtectedPOST, createProtectedGET } from '@/lib/api-protection';
import { tablesDB, DATABASE_ID, CUSTOMERS_COLLECTION_ID, account } from '@/lib/appwrite';
import { Query, ID } from 'appwrite';
import { auditLogger } from '@/lib/audit-log';
import { logger } from '@/lib/logger';
import { APIError, createSuccessResponse } from '@/lib/api-error-handler';
import { z } from 'zod';

// Schema for customer creation
const customerSchema = z.object({
  userId: z.string(),
  name: z.string().min(1, 'Name is required'),
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
  status: z.enum(['active', 'inactive', 'lead', 'prospect', 'archived']),
  assignedTo: z.string().optional(),
  source: z.enum(['website', 'referral', 'social_media', 'advertising', 'trade_show', 'cold_call', 'email_campaign', 'other']).optional(),
  industry: z.string().optional(),
  customerType: z.enum(['individual', 'company', 'non-profit', 'government']),
  currency: z.string().optional(),
  language: z.enum(['en', 'ms']).optional(),
  timezone: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.string().optional(),
});

// POST /api/customers - Create a new customer
export const POST = createProtectedPOST(
  async ({ body, request }) => {
    // Get authenticated user
    let user;
    try {
      user = await account.get();
    } catch (error) {
      throw APIError.unauthorized('Unauthorized');
    }

    // Body is already validated by schema in options
    const data = body;

    // Ensure userId matches the authenticated user (self-service model)
    if (data.userId !== user.$id) {
      throw APIError.forbidden('You can only create customer records for yourself');
    }

    // Check if user already has a customer record
    const existingCheck = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: CUSTOMERS_COLLECTION_ID,
      queries: [
        Query.equal('userId', user.$id),
        Query.limit(1),
      ],
    });

    if (existingCheck.rows.length > 0) {
      throw APIError.conflict('You already have a customer profile. Please update your existing profile instead.');
    }

    // Check for duplicate email if provided
    if (data.email) {
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

    // Create customer record
    const customerData = {
      userId: data.userId,
      name: data.name,
      email: data.email || undefined,
      phone: data.phone || undefined,
      company: data.company || undefined,
      jobTitle: data.jobTitle || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      zipCode: data.zipCode || undefined,
      country: data.country || undefined,
      website: data.website || undefined,
      status: data.status,
      assignedTo: data.assignedTo || undefined,
      source: data.source || undefined,
      industry: data.industry || undefined,
      customerType: data.customerType,
      currency: data.currency || undefined,
      language: data.language || undefined,
      timezone: data.timezone || undefined,
      notes: data.notes || undefined,
      metadata: data.metadata || undefined,
      totalRevenue: 0,
      totalInvoices: 0,
      createdBy: user.$id,
    };

    const customer = await tablesDB.createRow({
      databaseId: DATABASE_ID,
      tableId: CUSTOMERS_COLLECTION_ID,
      rowId: ID.unique(),
      data: customerData,
    });

    // Log customer creation
    await auditLogger.logSecurityEvent(user.$id, 'CUSTOMER_CREATED', {
      customerId: customer.$id,
      customerName: (customer as any).name,
    }).catch(() => { });

    return createSuccessResponse(customer, 'Customer created successfully', 201);
  },
  {
    rateLimit: 'api',
    schema: customerSchema,
  }
);

// GET /api/customers - List customers (with pagination and filters)
export const GET = createProtectedGET(
  async ({ request }) => {
    // Get authenticated user
    let user;
    try {
      user = await account.get();
    } catch (error) {
      throw APIError.unauthorized('Unauthorized');
    }

    // Extract search params from URL
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const customerType = searchParams.get('customerType') || '';

    // Build queries
    const queries: any[] = [];

    // Self-service model: users can only see their own customer record
    // Admins can see all customers (would need to check admin status)
    queries.push(Query.equal('userId', user.$id));

    if (search) {
      queries.push(Query.or([
        Query.contains('name', search),
        Query.contains('email', search),
        Query.contains('company', search),
      ]));
    }

    if (status) {
      queries.push(Query.equal('status', status));
    }

    if (customerType) {
      queries.push(Query.equal('customerType', customerType));
    }

    // Add pagination
    queries.push(Query.limit(pageSize));
    queries.push(Query.offset((page - 1) * pageSize));

    // Add ordering
    queries.push(Query.orderDesc('$createdAt'));

    const response = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: CUSTOMERS_COLLECTION_ID,
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

