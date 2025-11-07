# Community Votes Database Schema

## Overview
The `community_votes` collection tracks user votes (upvotes/downvotes) on community posts and replies. This collection prevents duplicate voting and enables vote-based sorting and ranking.

## Collection Configuration

**Collection ID**: `community_votes`
**Database**: `console-db`

## Attributes

| Attribute | Type | Size | Required | Default | Description | Index |
|-----------|------|------|----------|---------|-------------|-------|
| `userId` | String | 50 | ✅ | - | User ID who voted | ✅ |
| `postId` | String | 50 | ❌ | null | Post ID being voted on | ✅ |
| `replyId` | String | 50 | ❌ | null | Reply ID being voted on | ✅ |
| `voteType` | String | 10 | ✅ | - | Vote type (upvote/downvote) | ✅ |
| `ipAddress` | String | 45 | ❌ | null | IP address for fraud prevention | ❌ |

## Enum Values

### Vote Type Values
- `upvote` - Positive vote
- `downvote` - Negative vote

## Indexes

### Key Indexes
1. **userId** (ascending) - For user vote lookup
2. **postId** (ascending) - For post vote lookup
3. **replyId** (ascending) - For reply vote lookup
4. **voteType** (ascending) - For vote type filtering
5. **userId + postId** (composite, unique) - Prevent duplicate post votes
6. **userId + replyId** (composite, unique) - Prevent duplicate reply votes

### Unique Constraints
- User can only vote once per post (userId + postId unique)
- User can only vote once per reply (userId + replyId unique)
- Either postId or replyId must be set, not both

## Permissions

- **Create**: `users` (authenticated users can vote)
- **Read**: `*` (votes are public for transparency)
- **Update**: `users` (users can change their vote)
- **Delete**: `users` (users can remove their vote)

## Relations

### Outgoing Relations
- `postId` → `community_posts.$id` (Many to One) *[Vote on post]*
- `replyId` → `community_replies.$id` (Many to One) *[Vote on reply]*
- `userId` → `users.$id` (Many to One) *[Vote by user]*

### Relationship Notes
- **Post Relationship**: Votes are linked to posts via `postId`
- **Reply Relationship**: Votes are linked to replies via `replyId`
- **Mutual Exclusivity**: A vote must reference either a post OR a reply, not both
- **Deletion Behavior**: CASCADE deletion - when a post/reply is deleted, associated votes are automatically deleted

## TypeScript Interface

```typescript
interface CommunityVote {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  userId: string;
  postId?: string;
  replyId?: string;
  voteType: 'upvote' | 'downvote';
  ipAddress?: string;
}
```

## Data Validation Rules

### User ID
- **Required**: Must be authenticated user ID
- **Format**: Valid user ID from Appwrite

### Post/Reply ID
- **Required**: Either `postId` or `replyId` must be set
- **Mutual Exclusivity**: Cannot set both `postId` and `replyId`
- **Reference**: Must reference existing post or reply

### Vote Type
- **Required**: Must be either `upvote` or `downvote`
- **Changeable**: Users can change vote type (upvote → downvote or vice versa)

### Duplicate Prevention
- User can only have one vote per post
- User can only have one vote per reply
- Changing vote type updates existing vote record

## Business Logic

### Vote Creation/Update
```typescript
async function voteOnPost(userId: string, postId: string, voteType: 'upvote' | 'downvote'): Promise<void> {
  // Check for existing vote
  const existingVotes = await databases.listDocuments(
    DATABASE_ID,
    'community_votes',
    [
      Query.equal('userId', userId),
      Query.equal('postId', postId)
    ]
  );

  if (existingVotes.documents.length > 0) {
    const existingVote = existingVotes.documents[0];
    
    // If same vote type, remove vote (toggle off)
    if (existingVote.voteType === voteType) {
      await databases.deleteDocument(
        DATABASE_ID,
        'community_votes',
        existingVote.$id
      );
      await updatePostVoteCount(postId, existingVote.voteType, -1);
    } else {
      // Change vote type
      await databases.updateDocument(
        DATABASE_ID,
        'community_votes',
        existingVote.$id,
        { voteType }
      );
      await updatePostVoteCount(postId, existingVote.voteType, -1);
      await updatePostVoteCount(postId, voteType, 1);
    }
  } else {
    // Create new vote
    await databases.createDocument(
      DATABASE_ID,
      'community_votes',
      ID.unique(),
      {
        userId,
        postId,
        voteType,
        ipAddress: getClientIP()
      }
    );
    await updatePostVoteCount(postId, voteType, 1);
  }
}
```

### Vote Count Update
```typescript
async function updatePostVoteCount(postId: string, voteType: 'upvote' | 'downvote', delta: number): Promise<void> {
  const post = await databases.getDocument(
    DATABASE_ID,
    'community_posts',
    postId
  );

  const updates: any = {};
  if (voteType === 'upvote') {
    updates.upvotes = Math.max(0, post.upvotes + delta);
  } else {
    updates.downvotes = Math.max(0, post.downvotes + delta);
  }

  await databases.updateDocument(
    DATABASE_ID,
    'community_posts',
    postId,
    updates
  );
}

async function updateReplyVoteCount(replyId: string, voteType: 'upvote' | 'downvote', delta: number): Promise<void> {
  const reply = await databases.getDocument(
    DATABASE_ID,
    'community_replies',
    replyId
  );

  const updates: any = {};
  if (voteType === 'upvote') {
    updates.upvotes = Math.max(0, reply.upvotes + delta);
  } else {
    updates.downvotes = Math.max(0, reply.downvotes + delta);
  }

  await databases.updateDocument(
    DATABASE_ID,
    'community_replies',
    replyId,
    updates
  );
}
```

### Vote Aggregation
```typescript
async function getPostVotes(postId: string): Promise<{ upvotes: number; downvotes: number; score: number }> {
  const votes = await databases.listDocuments(
    DATABASE_ID,
    'community_votes',
    [Query.equal('postId', postId)]
  );

  const upvotes = votes.documents.filter(v => v.voteType === 'upvote').length;
  const downvotes = votes.documents.filter(v => v.voteType === 'downvote').length;
  const score = upvotes - downvotes;

  return { upvotes, downvotes, score };
}
```

## Anti-Fraud Measures

- **IP Tracking**: Store IP address for fraud detection
- **Rate Limiting**: Max 100 votes per hour per user
- **Duplicate Prevention**: Unique constraints prevent multiple votes
- **Vote Validation**: Verify post/reply exists before allowing vote
- **User Verification**: Require authenticated users only

## Performance Considerations

- Vote counts cached in post/reply documents
- Vote aggregation calculated on-demand
- Indexes optimized for user and post/reply lookups
- Batch vote count updates for efficiency
- Async vote count updates to avoid write contention

## Usage Examples

### Upvote a Post
```typescript
await voteOnPost(userId, postId, 'upvote');
```

### Downvote a Reply
```typescript
await voteOnReply(userId, replyId, 'downvote');
```

### Check User Vote
```typescript
async function getUserVote(userId: string, postId: string): Promise<'upvote' | 'downvote' | null> {
  const votes = await databases.listDocuments(
    DATABASE_ID,
    'community_votes',
    [
      Query.equal('userId', userId),
      Query.equal('postId', postId)
    ]
  );

  return votes.documents[0]?.voteType || null;
}
```

### Remove Vote
```typescript
async function removeVote(userId: string, postId: string): Promise<void> {
  const votes = await databases.listDocuments(
    DATABASE_ID,
    'community_votes',
    [
      Query.equal('userId', userId),
      Query.equal('postId', postId)
    ]
  );

  if (votes.documents.length > 0) {
    const vote = votes.documents[0];
    await databases.deleteDocument(DATABASE_ID, 'community_votes', vote.$id);
    await updatePostVoteCount(postId, vote.voteType, -1);
  }
}
```

## Migration Considerations

### From Legacy System
- Import existing votes with proper user/post/reply mapping
- Validate all relationships post-migration
- Recalculate vote counts for all posts/replies
- Ensure unique constraints are enforced

### Future Considerations
- Vote weighting (reputation-based)
- Vote history tracking
- Vote analytics and insights
- Anonymous voting option
- Vote-based badges/achievements

