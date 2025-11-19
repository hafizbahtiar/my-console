import { NextRequest, NextResponse } from 'next/server';
import { createProtectedPOST, createProtectedGET } from '@/lib/api-protection';
import { tablesDB, DATABASE_ID, PERSONS_COLLECTION_ID, account } from '@/lib/appwrite';
import { Query, ID } from 'appwrite';
import { auditLogger } from '@/lib/audit-log';
import { logger } from '@/lib/logger';
import { APIError, createSuccessResponse } from '@/lib/api-error-handler';
import { z } from 'zod';

// Schema for person creation
const personSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  middleName: z.string().max(100).optional(),
  maidenName: z.string().max(100).optional(),
  nickname: z.string().max(50).optional(),
  title: z.string().max(50).optional(),
  gender: z.enum(['M', 'F', 'O', 'U']),
  birthDate: z.string().optional(),
  birthPlace: z.string().max(300).optional(),
  birthCountry: z.string().max(100).optional(),
  deathDate: z.string().optional(),
  deathPlace: z.string().max(300).optional(),
  deathCountry: z.string().max(100).optional(),
  isDeceased: z.boolean().default(false),
  photo: z.string().max(2000).url().optional().or(z.literal('')),
  photoThumbnail: z.string().max(2000).url().optional().or(z.literal('')),
  bio: z.string().max(10000).optional(),
  wikiId: z.string().max(50).optional(),
  occupation: z.string().max(200).optional(),
  education: z.string().max(500).optional(),
  nationality: z.string().max(100).optional(),
  ethnicity: z.string().max(100).optional(),
  religion: z.string().max(100).optional(),
  email: z.string().email().max(255).optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
  notes: z.string().max(5000).optional(),
  metadata: z.string().max(5000).optional(),
  status: z.enum(['active', 'inactive', 'archived', 'draft']).default('active'),
  isPublic: z.boolean().default(false),
  displayOrder: z.number().int().min(0).default(0),
});

// POST /api/persons - Create a new person
export const POST = createProtectedPOST(
  async ({ body, request }) => {
    // Get authenticated user
    let user;
    try {
      user = await account.get();
    } catch (error) {
      throw APIError.unauthorized('Unauthorized');
    }

    // Check if user is admin (admin-only model)
    const userRecord = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: 'users',
      queries: [
        Query.equal('userId', user.$id),
        Query.limit(1),
      ],
    });

    if (userRecord.rows.length === 0 || (userRecord.rows[0] as any).role !== 'super_admin') {
      throw APIError.forbidden('Only administrators can create persons');
    }

    // Body is already validated by schema
    const data = body;

    // Check for duplicate wikiId if provided
    if (data.wikiId) {
      const wikiCheck = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: PERSONS_COLLECTION_ID,
        queries: [
          Query.equal('wikiId', data.wikiId),
          Query.limit(1),
        ],
      });

      if (wikiCheck.rows.length > 0) {
        throw APIError.conflict('A person with this Wikipedia ID already exists');
      }
    }

    // Create person record
    const personData = {
      name: data.name,
      firstName: data.firstName || undefined,
      lastName: data.lastName || undefined,
      middleName: data.middleName || undefined,
      maidenName: data.maidenName || undefined,
      nickname: data.nickname || undefined,
      title: data.title || undefined,
      gender: data.gender,
      birthDate: data.birthDate || undefined,
      birthPlace: data.birthPlace || undefined,
      birthCountry: data.birthCountry || undefined,
      deathDate: data.deathDate || undefined,
      deathPlace: data.deathPlace || undefined,
      deathCountry: data.deathCountry || undefined,
      isDeceased: data.isDeceased || false,
      photo: data.photo || undefined,
      photoThumbnail: data.photoThumbnail || undefined,
      bio: data.bio || undefined,
      wikiId: data.wikiId || undefined,
      occupation: data.occupation || undefined,
      education: data.education || undefined,
      nationality: data.nationality || undefined,
      ethnicity: data.ethnicity || undefined,
      religion: data.religion || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      country: data.country || undefined,
      zipCode: data.zipCode || undefined,
      notes: data.notes || undefined,
      metadata: data.metadata || undefined,
      status: data.status || 'active',
      isPublic: data.isPublic || false,
      displayOrder: data.displayOrder || 0,
      createdBy: user.$id,
    };

    const person = await tablesDB.createRow({
      databaseId: DATABASE_ID,
      tableId: PERSONS_COLLECTION_ID,
      rowId: ID.unique(),
      data: personData,
    });

    // Log person creation
    await auditLogger.logSecurityEvent(user.$id, 'PERSON_CREATED', {
      personId: person.$id,
      personName: (person as any).name,
    }).catch(() => { });

    return createSuccessResponse(person, 'Person created successfully', 201);
  },
  {
    rateLimit: 'api',
    schema: personSchema,
  }
);

// GET /api/persons - List persons (with pagination and filters)
export const GET = createProtectedGET(
  async ({ request }) => {
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

    const isAdmin = userRecord.rows.length > 0 && (userRecord.rows[0] as any).role === 'super_admin';

    // Extract search params from URL
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const gender = searchParams.get('gender') || '';
    const isPublic = searchParams.get('isPublic') || '';

    // Build queries
    const queries: any[] = [];

    // Non-admins can only see public persons
    if (!isAdmin) {
      queries.push(Query.equal('isPublic', true));
      queries.push(Query.equal('status', 'active'));
    }

    if (search) {
      queries.push(Query.or([
        Query.contains('name', search),
        Query.contains('firstName', search),
        Query.contains('lastName', search),
        Query.contains('email', search),
      ]));
    }

    if (status && isAdmin) {
      queries.push(Query.equal('status', status));
    }

    if (gender) {
      queries.push(Query.equal('gender', gender));
    }

    if (isPublic && isAdmin) {
      queries.push(Query.equal('isPublic', isPublic === 'true'));
    }

    // Add pagination
    queries.push(Query.limit(pageSize));
    queries.push(Query.offset((page - 1) * pageSize));

    // Add ordering
    queries.push(Query.orderDesc('$createdAt'));

    const response = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: PERSONS_COLLECTION_ID,
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

