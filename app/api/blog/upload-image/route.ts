import { NextRequest, NextResponse } from 'next/server';
import { Client, Account, Storage, ID } from 'appwrite';
import { validateImageFileSize, DEFAULT_FILE_SIZE_CONFIG } from '@/lib/file-validation';
import { logger } from '@/lib/logger';
import { createErrorResponse, createSuccessResponse, APIErrorCode, APIError } from '@/lib/api-error-handler';
import { createProtectedPOST } from '@/lib/api-protection';
import { STORAGE_ID } from '@/lib/appwrite';

// Allowed image MIME types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

/**
 * POST /api/blog/upload-image
 * Upload featured image for blog posts
 */
export const POST = createProtectedPOST(
  async ({ request }) => {
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID?.toLowerCase() || '';
    logger.debug('Project ID for session cookie: ' + projectId);
    const cookies = request.cookies.getAll();
    logger.debug('All cookies in request: ' + JSON.stringify(cookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' }))));
    const jwt = request.headers.get('X-Appwrite-JWT');
    logger.debug('JWT from header: ' + (jwt || '').substring(0, 20) + (jwt ? '...' : 'NONE'));
    const session = request.cookies.get(`a_session_${projectId}`)?.value ||
      request.cookies.get(`a_session_${projectId}_legacy`)?.value;
    logger.debug('Extracted session value: ' + (session ? session.substring(0, 20) + '...' : 'NONE'));
    if (!jwt && !session) {
      logger.warn('No JWT or session cookie found for image upload');
      throw APIError.unauthorized('Authentication required - no JWT or session');
    }
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '')
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '');
    if (jwt) {
      client.setJWT(jwt);
      logger.debug('Using JWT authentication');
    } else {
      client.setSession(session || ''); // Ensure session is string
      logger.debug('Using session cookie authentication');
    }
    const account = new Account(client);
    const storage = new Storage(client);
    // Verify authentication
    let user;
    try {
      user = await account.get();
      logger.debug('Successfully got user: ' + JSON.stringify({ userId: user.$id, email: user.email }));
    } catch (error) {
      logger.error('account.get() failed: ' + (error instanceof Error ? error.message : String(error)));
      throw APIError.unauthorized('Authentication required - invalid credentials');
    }

    // Parse FormData (createProtectedPOST doesn't parse FormData, so we do it manually)
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        createErrorResponse(
          APIErrorCode.BAD_REQUEST,
          'No file provided',
          400
        ),
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        createErrorResponse(
          APIErrorCode.BAD_REQUEST,
          `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
          400
        ),
        { status: 400 }
      );
    }

    // Validate file size
    try {
      validateImageFileSize(file.size, DEFAULT_FILE_SIZE_CONFIG);
    } catch (error: any) {
      logger.warn('Image file size validation failed', 'api/blog/upload-image', error, {
        fileName: file.name,
        fileSize: file.size,
        maxSize: DEFAULT_FILE_SIZE_CONFIG.imageMaxSize,
      });
      return NextResponse.json(
        createErrorResponse(
          APIErrorCode.PAYLOAD_TOO_LARGE,
          error.message || 'File size exceeds maximum allowed size (5MB)',
          413
        ),
        { status: 413 }
      );
    }

    const fileId = ID.unique();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fullFileId = `blog_featured_${fileId}.${fileExtension}`.slice(0, 36).toLowerCase().replace(/[^a-z0-9.-]/g, '-');
    // Ensure it doesn't start with special char
    const safeFileId = fullFileId.replace(/^[^a-z0-9]/, 'f');

    // Convert to Node.js File-like object
    const arrayBuffer = await file.arrayBuffer();
    const nodeFile = new File([arrayBuffer], file.name, { type: file.type });
    // Upload to Appwrite Storage
    try {
      const uploadedFile = await storage.createFile(
        STORAGE_ID,
        safeFileId,
        nodeFile
      );

      // Get file URL
      // Construct the file view URL manually
      const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '';
      const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
      const fileUrl = `${endpoint}/storage/buckets/${STORAGE_ID}/files/${uploadedFile.$id}/view?project=${projectId}`;

      logger.info('Image uploaded successfully', 'api/blog/upload-image', {
        fileId: uploadedFile.$id,
        fileName: file.name,
        fileSize: file.size,
        userId: user.$id,
      });

      const responseData = {
        success: true,
        data: {
          fileId: uploadedFile.$id,
          url: fileUrl,
          name: file.name,
          size: file.size,
          type: file.type,
        },
        message: 'Image uploaded successfully',
        status: 201
      };
      console.log('[DEBUG] Response JSON sent:', JSON.stringify(responseData));
      return NextResponse.json(responseData, { status: 201 });
    } catch (storageError: any) {
      logger.error('Failed to upload image to storage', 'api/blog/upload-image', storageError, {
        fileName: file.name,
        fileSize: file.size,
        userId: user.$id,
      });

      // Handle specific Appwrite errors
      if (storageError.code === 401 || storageError.code === 403) {
        return NextResponse.json(
          createErrorResponse(
            APIErrorCode.FORBIDDEN,
            'Permission denied. Please check storage bucket permissions.',
            403
          ),
          { status: 403 }
        );
      }

      return NextResponse.json(
        createErrorResponse(
          APIErrorCode.INTERNAL_SERVER_ERROR,
          storageError.message || 'Failed to upload image',
          500
        ),
        { status: 500 }
      );
    }
  },
  {
    rateLimit: 'upload',
    requireCSRF: true, // Explicitly require CSRF (default for POST)
  }
);

