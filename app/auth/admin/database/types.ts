// Database Admin Page Types

// Appwrite document type
export interface AppwriteDocument {
  $createdAt: string;
  $updatedAt: string;
  [key: string]: unknown;
}

// Type definitions
export interface CollectionInfo {
  id: string;
  name: string;
  documents: number;
  size: string;
  lastModified: string;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  sampleValues: unknown[];
  length?: number;
  description?: string;
}

export interface CollectionSchema {
  id: string;
  name: string;
  columns: ColumnInfo[];
  totalDocuments: number;
}

export interface DatabaseStats {
  totalCollections: number;
  totalDocuments: number;
  totalSize: string;
  uptime: string;
  lastBackup: string;
  backupStatus: string;
}

export interface PerformanceMetrics {
  readOperations: { time: number; performance: number };
  writeOperations: { time: number; performance: number };
  searchQueries: { time: number; performance: number };
}

export interface StorageDistribution {
  collection: string;
  percentage: number;
}

export interface BackupRecord {
  id: string;
  type: string;
  status: string;
  size: string;
  timestamp: string;
  collections: number;
  totalRecords: number;
  duration: number;
}

// Collection name mapping
export const COLLECTION_NAMES: Record<string, string> = {
  'audit_logs': 'Audit Logs',
  'blog_categories': 'Blog Categories',
  'blog_posts': 'Blog Posts',
  'blog_tags': 'Blog Tags',
};
