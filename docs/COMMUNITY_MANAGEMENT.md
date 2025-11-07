# Community Management Module

## Overview

The Community Management module provides a comprehensive discussion platform for users to engage, ask questions, share knowledge, and build a community around your application. This module supports topic-based discussions, threaded replies, voting, moderation, and user engagement tracking.

## Features

- **Topic-Based Discussions**: Organize discussions into topics/categories
- **Threaded Replies**: Support nested reply threads (up to 3 levels)
- **Voting System**: Upvote/downvote posts and replies
- **Moderation**: Admin and topic moderator approval workflow
- **Spam Prevention**: Automatic spam detection and manual review
- **User Engagement**: View counts, reply counts, and activity tracking
- **Solution Marking**: Mark replies as solutions to questions
- **Pinning & Locking**: Pin important posts and lock discussions
- **Rich Content**: TipTap editor support for rich text formatting

## Collections

### Core Collections

1. **community_posts** - Main discussion posts
   - Stores user posts, questions, and discussions
   - Supports moderation, pinning, locking, and featuring
   - Tracks views, votes, and reply counts
   - See: [APPWRITE_DB_COMMUNITY_POSTS.md](./APPWRITE_DB_COMMUNITY_POSTS.md)

2. **community_topics** - Discussion topics/categories
   - Organizes posts into topics
   - Supports hierarchical topic structure
   - Topic-specific moderation and rules
   - See: [APPWRITE_DB_COMMUNITY_TOPICS.md](./APPWRITE_DB_COMMUNITY_TOPICS.md)

3. **community_replies** - Replies to posts
   - Threaded reply system (up to 3 levels deep)
   - Solution marking for Q&A
   - Vote tracking per reply
   - See: [APPWRITE_DB_COMMUNITY_REPLIES.md](./APPWRITE_DB_COMMUNITY_REPLIES.md)

4. **community_votes** - User votes on posts/replies
   - Prevents duplicate voting
   - Tracks upvotes and downvotes
   - Enables vote-based sorting
   - See: [APPWRITE_DB_COMMUNITY_VOTES.md](./APPWRITE_DB_COMMUNITY_VOTES.md)

## Architecture

### Relationships

```
community_topics (1) ──< (Many) community_posts
                              │
                              ├──< (Many) community_replies
                              │
                              └──< (Many) community_votes

community_replies (1) ──< (Many) community_replies (self-referencing for threading)
                    │
                    └──< (Many) community_votes
```

### Data Flow

1. **Post Creation**: User creates post → Status: `pending` → Admin/Moderator reviews → Status: `approved`
2. **Reply Creation**: User replies to post → Status: `pending` → Auto-approval or manual review → Status: `approved`
3. **Voting**: User votes on post/reply → Vote count updated → Post/reply score recalculated
4. **Moderation**: Admin/Moderator can approve, reject, pin, lock, or delete content

## Key Features

### Moderation Workflow

1. **Post Submission**: All new posts start with `pending` status
2. **Auto-Approval**: Trusted users (based on history) may be auto-approved
3. **Manual Review**: Admins and topic moderators review pending content
4. **Approval**: Content becomes visible to all users
5. **Rejection**: Content remains hidden, author notified

### Spam Prevention

- Rate limiting (5 posts/hour, 10 replies/hour per user)
- Automatic spam detection
- IP-based blocking
- Manual spam flagging
- Admin review queue

### Voting System

- One vote per user per post/reply
- Vote type changeable (upvote ↔ downvote)
- Vote counts cached in post/reply documents
- Score calculation: `upvotes - downvotes`
- Hot score algorithm for trending content

### Threading

- Maximum depth: 3 levels
- Parent replies must be approved before child replies
- Thread structure via `parentId` and `depth` fields
- Flat view option available

### Solution Marking

- Only one solution per post
- Marking a reply as solution unmarks previous solution
- Solution indicator visible in UI
- Useful for Q&A style discussions

## Permissions

### Post Permissions
- **Create**: Authenticated users
- **Read**: Public (approved posts), Private (pending posts visible to author/admins)
- **Update**: Post authors and admins
- **Delete**: Post authors and admins

### Reply Permissions
- **Create**: Authenticated users
- **Read**: Public (approved replies), Private (pending replies visible to author/admins)
- **Update**: Reply authors and admins
- **Delete**: Reply authors and admins

### Topic Permissions
- **Create**: Admins only
- **Read**: Public topics visible to all, Private topics to members
- **Update**: Admins only
- **Delete**: Admins only

### Vote Permissions
- **Create**: Authenticated users
- **Read**: Public
- **Update**: Vote authors (to change vote type)
- **Delete**: Vote authors (to remove vote)

## Implementation Guide

### Component Architecture

The community management module follows a **modular component architecture** pattern for maintainability and reusability.

#### Community Topics Module Structure

The community topics management page (`/auth/community/community-topics`) is organized into separate, focused components:

```
components/app/auth/community/community-topics/
├── access-control.tsx        # Access control wrapper
│   └── Checks Super Admin team membership or admin label
│   └── Handles loading states and redirects
├── delete-topic-dialog.tsx   # Delete confirmation dialog
│   └── Reusable confirmation component
├── icon-picker.tsx           # Visual icon selector
│   └── 50+ Lucide icons in searchable grid
│   └── Scrollable popover (works in dialogs)
│   └── Clear button in same row
├── topic-form.tsx            # Unified create/edit form
│   └── All form fields (name, slug, description, etc.)
│   └── AI description generation
│   └── Auto-slug generation
│   └── Used in both create and edit dialogs
├── topics-table.tsx          # Topics listing table
│   └── Pagination support
│   └── Edit/Delete actions
│   └── Empty state handling
├── types.ts                  # TypeScript definitions
│   └── CommunityTopic interface
│   └── TopicFormData interface
│   └── IconOption interface
│   └── AVAILABLE_ICONS array
│   └── DEFAULT_FORM_DATA constant
└── utils.ts                  # Utility functions
    └── generateSlug()
    └── generateUniqueSlug()
    └── getIconComponent()
    └── getParentTopicName()
    └── getAvailableParents()
```

#### Benefits of This Architecture

1. **Maintainability**: Each component is focused and easy to understand
2. **Reusability**: Components can be used in different contexts
3. **Testability**: Smaller components are easier to test
4. **Type Safety**: Centralized types ensure consistency
5. **Code Organization**: Clear separation of concerns

#### Main Page Structure

The main page (`app/auth/community/community-topics/page.tsx`) orchestrates all components:

- **State Management**: Topics, pagination, dialogs, form data
- **Data Operations**: Load, create, update, delete topics
- **Event Handlers**: Form submissions, dialog management
- **Access Control**: Wrapped in AccessControl component

### Setting Up Collections

1. **Create Collections** in Appwrite Console:
   - `community_posts`
   - `community_topics`
   - `community_replies`
   - `community_votes`

2. **Add Attributes** as specified in each collection's documentation

3. **Create Indexes** for optimal query performance

4. **Set Permissions** according to the permission model

5. **Create Relationships** between collections

### Basic Operations

#### Creating a Post
```typescript
const post = await databases.createDocument(
  DATABASE_ID,
  'community_posts',
  ID.unique(),
  {
    title: 'How to use the API?',
    slug: 'how-to-use-the-api',
    content: '<p>I need help with...</p>',
    author: user.name,
    authorId: user.$id,
    communityTopics: topicId,
    status: 'pending',
    tags: ['api', 'help']
  }
);
```

#### Creating a Reply
```typescript
const reply = await databases.createDocument(
  DATABASE_ID,
  'community_replies',
  ID.unique(),
  {
    content: 'You can use the API like this...',
    author: user.name,
    authorId: user.$id,
    postId: postId,
    status: 'pending',
    depth: 0
  }
);
```

#### Voting on a Post
```typescript
await voteOnPost(userId, postId, 'upvote');
```

#### Marking Solution
```typescript
await markAsSolution(replyId, postId);
```

## Query Patterns

### Get Posts by Topic
```typescript
const posts = await databases.listDocuments(
  DATABASE_ID,
  'community_posts',
  [
    Query.equal('communityTopics', topicId),
    Query.equal('status', 'approved'),
    Query.orderDesc('$createdAt')
  ]
);
```

### Get Trending Posts
```typescript
const trending = await databases.listDocuments(
  DATABASE_ID,
  'community_posts',
  [
    Query.equal('status', 'approved'),
    Query.orderDesc('upvotes'),
    Query.limit(10)
  ]
);
```

### Get Post Replies
```typescript
const replies = await databases.listDocuments(
  DATABASE_ID,
  'community_replies',
  [
    Query.equal('postId', postId),
    Query.equal('status', 'approved'),
    Query.equal('parentId', null), // Top-level replies
    Query.orderAsc('$createdAt')
  ]
);
```

### Get Threaded Replies
```typescript
const thread = await databases.listDocuments(
  DATABASE_ID,
  'community_replies',
  [
    Query.equal('postId', postId),
    Query.equal('parentId', parentReplyId),
    Query.equal('status', 'approved'),
    Query.orderAsc('$createdAt')
  ]
);
```

## Best Practices

### Performance
- Use pagination for large result sets (20-50 items per page)
- Cache vote counts and reply counts
- Update counts asynchronously
- Use indexes for common query patterns
- Lazy load threaded replies

### Moderation
- Review pending content regularly
- Set up auto-approval for trusted users
- Monitor spam queue daily
- Use topic-specific moderators
- Maintain clear community guidelines

### User Experience
- Show pending status to authors
- Provide clear feedback on moderation decisions
- Enable email notifications for replies
- Support @mentions in replies
- Display solution indicators clearly

## Future Enhancements

- **User Reputation System**: Points/badges based on contributions
- **Post Templates**: Pre-defined templates for common post types
- **Rich Media**: Image/video attachments
- **Post Bookmarks**: Save posts for later
- **Post Following**: Get notifications for specific posts
- **Advanced Search**: Full-text search with filters
- **Post Analytics**: View analytics for posts
- **Multi-language Support**: Translate posts/replies
- **Post Reactions**: Emoji reactions in addition to votes
- **Post Scheduling**: Schedule posts for future publication

## Integration Points

### With Blog Module
- Link blog posts to community discussions
- Cross-reference related content
- Share blog posts in community

### With User System
- User profiles show community activity
- Reputation system integration
- User badges and achievements

### With Notification System
- Email notifications for replies
- In-app notifications for mentions
- Admin notifications for moderation

## Security Considerations

- **Input Sanitization**: Sanitize all user-generated content
- **Rate Limiting**: Prevent spam and abuse
- **IP Tracking**: Track IPs for fraud prevention
- **Permission Checks**: Verify permissions on all operations
- **Content Moderation**: Review all content before approval
- **Spam Detection**: Automatic and manual spam filtering

## Troubleshooting

### Common Issues

1. **Posts not appearing**: Check status is `approved`
2. **Votes not counting**: Verify unique constraints are set
3. **Replies not threading**: Check `parentId` and `depth` fields
4. **Counts not updating**: Ensure async update functions are called
5. **Permission errors**: Verify user roles and permissions

### Debug Queries

```typescript
// Check pending posts
const pending = await databases.listDocuments(
  DATABASE_ID,
  'community_posts',
  [Query.equal('status', 'pending')]
);

// Check vote counts
const votes = await databases.listDocuments(
  DATABASE_ID,
  'community_votes',
  [Query.equal('postId', postId)]
);
```

## Frontend Implementation

### Pages

#### Community Topics Management (`/auth/community/community-topics`)
- **Access**: Super Admin team members or users with 'admin' label
- **Features**:
  - List all topics with pagination
  - Create new topics with visual icon picker
  - Edit existing topics
  - Delete topics (with confirmation)
  - Hierarchical topic structure support
  - Auto-generated slugs from topic names
  - AI-powered description generation

#### Community Posts Management (`/auth/community/community-posts`)
- **Access**: Authenticated users
- **Features**:
  - List all posts with filtering and search
  - Create new posts with rich text editor
  - View post details
  - Edit existing posts
  - Delete posts (with confirmation)
  - Status management (pending, approved, rejected, etc.)

### Component Usage Examples

#### Using Icon Picker
```typescript
import { IconPicker } from '@/components/app/auth/community/community-topics/icon-picker'

<IconPicker
  value={formData.icon}
  onChange={(icon) => setFormData(prev => ({ ...prev, icon }))}
  onClear={() => setFormData(prev => ({ ...prev, icon: '' }))}
/>
```

#### Using Topic Form
```typescript
import { TopicForm } from '@/components/app/auth/community/community-topics/topic-form'

<TopicForm
  formData={formData}
  setFormData={setFormData}
  allTopics={allTopics}
  selectedTopic={selectedTopic}
  mode="create" // or "edit"
/>
```

#### Using Access Control
```typescript
import { AccessControl } from '@/components/app/auth/community/community-topics/access-control'

<AccessControl>
  {/* Protected content */}
</AccessControl>
```

## Related Documentation

- [APPWRITE_DB_COMMUNITY_POSTS.md](./APPWRITE_DB_COMMUNITY_POSTS.md) - Posts collection schema
- [APPWRITE_DB_COMMUNITY_TOPICS.md](./APPWRITE_DB_COMMUNITY_TOPICS.md) - Topics collection schema
- [APPWRITE_DB_COMMUNITY_REPLIES.md](./APPWRITE_DB_COMMUNITY_REPLIES.md) - Replies collection schema
- [APPWRITE_DB_COMMUNITY_VOTES.md](./APPWRITE_DB_COMMUNITY_VOTES.md) - Votes collection schema
- [APPWRITE_SETUP.md](./APPWRITE_SETUP.md) - Appwrite configuration
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Overall system architecture

