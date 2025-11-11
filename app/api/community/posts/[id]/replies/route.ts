import { NextRequest } from 'next/server';
import { createProtectedGET, createProtectedPOST } from '@/lib/api-protection';
import { tablesDB, DATABASE_ID, COMMUNITY_REPLIES_COLLECTION_ID, COMMUNITY_POSTS_COLLECTION_ID, account } from '@/lib/appwrite';
import { Query, ID } from 'appwrite';
import { auditLogger } from '@/lib/audit-log';
import { APIError, createSuccessResponse } from '@/lib/api-error-handler';
import { z } from 'zod';

// Schema for reply creation
const replySchema = z.object({
  content: z.string().min(1, 'Content is required').max(5000, 'Content must be less than 5000 characters'),
  parentId: z.string().optional(), // For threaded replies
});

// GET /api/community/posts/[id]/replies - Get all replies for a post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return createProtectedGET(
    async ({ request }) => {
      const user = await account.get();
      const postId = resolvedParams.id;

      if (!postId) {
        throw APIError.badRequest('Post ID is required');
      }

      // Verify post exists
      try {
        await tablesDB.getRow({
          databaseId: DATABASE_ID,
          tableId: COMMUNITY_POSTS_COLLECTION_ID,
          rowId: postId,
        });
      } catch (error) {
        throw APIError.notFound('Post not found');
      }

      // Get all approved replies for this post
      const replies = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: COMMUNITY_REPLIES_COLLECTION_ID,
        queries: [
          Query.equal('postId', postId),
          Query.equal('status', 'approved'),
          Query.orderAsc('$createdAt'),
        ],
      });

      return createSuccessResponse(replies.rows || []);
    },
    {
      rateLimit: 'api',
    }
  )(request);
}

// POST /api/community/posts/[id]/replies - Create a new reply
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return createProtectedPOST(
    async ({ body }) => {
      const user = await account.get();
      const postId = resolvedParams.id;

      if (!postId) {
        throw APIError.badRequest('Post ID is required');
      }

      // Validate request body
      const validationResult = replySchema.safeParse(body);
      if (!validationResult.success) {
        throw APIError.validationError('Validation failed', validationResult.error.issues);
      }

      const data = validationResult.data;

      // Verify post exists and is not locked
      const post = await tablesDB.getRow({
        databaseId: DATABASE_ID,
        tableId: COMMUNITY_POSTS_COLLECTION_ID,
        rowId: postId,
      }) as any;

      if (post.isLocked) {
        throw APIError.forbidden('This post is locked and cannot be replied to');
      }

      // Calculate depth if replying to another reply
      let depth = 0;
      if (data.parentId) {
        const parentReply = await tablesDB.getRow({
          databaseId: DATABASE_ID,
          tableId: COMMUNITY_REPLIES_COLLECTION_ID,
          rowId: data.parentId,
        }) as any;
        
        depth = (parentReply.depth || 0) + 1;
        
        // Limit nesting depth to 3 levels
        if (depth > 3) {
          throw APIError.badRequest('Maximum reply depth exceeded');
        }
      }

      // Create reply
      const replyData = {
        content: data.content,
        author: user.name || user.email || 'Anonymous',
        authorId: user.$id,
        authorEmail: user.email || null,
        postId: postId,
        parentId: data.parentId || null,
        status: 'pending', // Default to pending for moderation
        isSpam: false,
        upvotes: 0,
        downvotes: 0,
        depth: depth,
        isSolution: false,
      };

      const reply = await tablesDB.createRow({
        databaseId: DATABASE_ID,
        tableId: COMMUNITY_REPLIES_COLLECTION_ID,
        rowId: ID.unique(),
        data: replyData,
      });

      // Update post reply count and last reply info
      const currentReplyCount = (post.replyCount || 0) + 1;
      await tablesDB.updateRow({
        databaseId: DATABASE_ID,
        tableId: COMMUNITY_POSTS_COLLECTION_ID,
        rowId: postId,
        data: {
          replyCount: currentReplyCount,
          lastReplyAt: new Date().toISOString(),
          lastReplyBy: user.$id,
        },
      });

      // Log in audit
      await auditLogger.logSecurityEvent(user.$id, 'COMMUNITY_REPLY_CREATED', {
        replyId: reply.$id,
        postId: postId,
      }).catch(() => {});

      return createSuccessResponse(reply, 'Reply created successfully', 201);
    },
    {
      rateLimit: 'api',
      requireCSRF: true,
    }
  )(request);
}

