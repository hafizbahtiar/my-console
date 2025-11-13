import { NextRequest } from 'next/server';
import { createProtectedPOST, createProtectedPUT, createProtectedDELETE } from '@/lib/api-protection';
import { tablesDB, DATABASE_ID, COMMUNITY_VOTES_COLLECTION_ID, COMMUNITY_POSTS_COLLECTION_ID, COMMUNITY_REPLIES_COLLECTION_ID, account } from '@/lib/appwrite';
import { Query, ID } from 'appwrite';
import { auditLogger } from '@/lib/audit-log';
import { APIError, createSuccessResponse } from '@/lib/api-error-handler';
import { z } from 'zod';

// Schema for vote creation/update
const voteSchema = z.object({
  postId: z.string().optional(),
  replyId: z.string().optional(),
  voteType: z.enum(['upvote', 'downvote']),
}).refine(
  (data) => (data.postId && !data.replyId) || (!data.postId && data.replyId),
  {
    message: 'Either postId or replyId must be provided, but not both',
  }
);

// POST /api/community/votes - Create a new vote
export const POST = createProtectedPOST(
  async ({ body }) => {
    const user = await account.get();

    // Body is already validated by schema in options
    const data = body;

    // Check if user already voted on this post/reply
    const existingVoteQuery: any[] = [
      Query.equal('userId', user.$id),
    ];

    if (data.postId) {
      existingVoteQuery.push(Query.equal('postId', data.postId));
    } else if (data.replyId) {
      existingVoteQuery.push(Query.equal('replyId', data.replyId));
    }

    const existingVotes = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: COMMUNITY_VOTES_COLLECTION_ID,
      queries: existingVoteQuery,
    });

    // If vote exists, update it instead
    if (existingVotes.rows.length > 0) {
      const existingVote = existingVotes.rows[0] as any;
      
      // If same vote type, remove the vote (toggle off)
      if (existingVote.voteType === data.voteType) {
        await tablesDB.deleteRow({
          databaseId: DATABASE_ID,
          tableId: COMMUNITY_VOTES_COLLECTION_ID,
          rowId: existingVote.$id,
        });

        // Update post/reply vote counts
        await updateVoteCounts(data.postId, data.replyId, data.voteType, -1);

        return createSuccessResponse({ removed: true }, 'Vote removed');
      } else {
        // Update to different vote type
        await tablesDB.updateRow({
          databaseId: DATABASE_ID,
          tableId: COMMUNITY_VOTES_COLLECTION_ID,
          rowId: existingVote.$id,
          data: {
            voteType: data.voteType,
          },
        });

        // Update post/reply vote counts (remove old, add new)
        const oldVoteType = existingVote.voteType === 'upvote' ? 'downvote' : 'upvote';
        await updateVoteCounts(data.postId, data.replyId, oldVoteType, -1);
        await updateVoteCounts(data.postId, data.replyId, data.voteType, 1);

        return createSuccessResponse({ updated: true, voteType: data.voteType }, 'Vote updated');
      }
    }

    // Create new vote
    const voteData = {
      userId: user.$id,
      postId: data.postId || null,
      replyId: data.replyId || null,
      voteType: data.voteType,
    };

    const vote = await tablesDB.createRow({
      databaseId: DATABASE_ID,
      tableId: COMMUNITY_VOTES_COLLECTION_ID,
      rowId: ID.unique(),
      data: voteData,
    });

    // Update post/reply vote counts
    await updateVoteCounts(data.postId, data.replyId, data.voteType, 1);

    // Log in audit
    await auditLogger.logSecurityEvent(user.$id, 'COMMUNITY_VOTE_CREATED', {
      voteId: vote.$id,
      postId: data.postId,
      replyId: data.replyId,
      voteType: data.voteType,
    }).catch(() => {});

    return createSuccessResponse(vote, 'Vote created successfully', 201);
  },
  {
    rateLimit: 'api',
    schema: voteSchema,
  }
);

// Helper function to update vote counts
async function updateVoteCounts(
  postId: string | undefined,
  replyId: string | undefined,
  voteType: 'upvote' | 'downvote',
  delta: number
) {
  if (postId) {
    const post = await tablesDB.getRow({
      databaseId: DATABASE_ID,
      tableId: COMMUNITY_POSTS_COLLECTION_ID,
      rowId: postId,
    }) as any;

    const updateData: any = {};
    if (voteType === 'upvote') {
      updateData.upvotes = Math.max(0, (post.upvotes || 0) + delta);
    } else {
      updateData.downvotes = Math.max(0, (post.downvotes || 0) + delta);
    }

    await tablesDB.updateRow({
      databaseId: DATABASE_ID,
      tableId: COMMUNITY_POSTS_COLLECTION_ID,
      rowId: postId,
      data: updateData,
    });
  } else if (replyId) {
    const reply = await tablesDB.getRow({
      databaseId: DATABASE_ID,
      tableId: COMMUNITY_REPLIES_COLLECTION_ID,
      rowId: replyId,
    }) as any;

    const updateData: any = {};
    if (voteType === 'upvote') {
      updateData.upvotes = Math.max(0, (reply.upvotes || 0) + delta);
    } else {
      updateData.downvotes = Math.max(0, (reply.downvotes || 0) + delta);
    }

    await tablesDB.updateRow({
      databaseId: DATABASE_ID,
      tableId: COMMUNITY_REPLIES_COLLECTION_ID,
      rowId: replyId,
      data: updateData,
    });
  }
}

