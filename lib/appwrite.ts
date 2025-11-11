import { Client, Account, Databases, Storage, TablesDB, Teams } from 'appwrite'

const client = new Client()

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')

export const account = new Account(client)
export const databases = new Databases(client)
export const storage = new Storage(client)
export const tablesDB = new TablesDB(client)
export const teams = new Teams(client)

// Database ID
export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'console-db'

// Collection IDs
export const BLOG_POSTS_COLLECTION_ID = 'blog_posts'
export const BLOG_CATEGORIES_COLLECTION_ID = 'blog_categories'
export const BLOG_TAGS_COLLECTION_ID = 'blog_tags'
export const BLOG_COMMENTS_COLLECTION_ID = 'blog_comments'
export const BLOG_VIEWS_COLLECTION_ID = 'blog_views'
export const BLOG_LIKES_COLLECTION_ID = 'blog_likes'
export const COMMUNITY_POSTS_COLLECTION_ID = 'community_posts'
export const COMMUNITY_TOPICS_COLLECTION_ID = 'community_topics'
export const COMMUNITY_REPLIES_COLLECTION_ID = 'community_replies'
export const COMMUNITY_VOTES_COLLECTION_ID = 'community_votes'
export const USERS_COLLECTION_ID = 'users'
export const AUDIT_COLLECTION_ID = 'audit_logs'
export const SECURITY_EVENTS_COLLECTION_ID = 'security_events'
export const IP_BLOCKLIST_COLLECTION_ID = 'ip_blocklist'
export const CUSTOMERS_COLLECTION_ID = 'customers'
export const CUSTOMER_NOTES_COLLECTION_ID = 'customer_notes'
export const CUSTOMER_INTERACTIONS_COLLECTION_ID = 'customer_interactions'

export default client
