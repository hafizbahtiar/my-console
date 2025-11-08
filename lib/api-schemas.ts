/**
 * Zod Schemas for API Request Validation
 * Centralized validation schemas for all API endpoints
 */

import { z } from 'zod';

// Common validation schemas
export const commonSchemas = {
  // ID validation (UUID or ObjectId)
  id: z.string().min(1, 'ID is required').regex(
    /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$|^[a-f\d]{24}$/i,
    'Invalid ID format'
  ),

  // Email validation
  email: z.string().email('Invalid email format').min(1, 'Email is required'),

  // URL validation
  url: z.string().url('Invalid URL format'),

  // Pagination
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).default(20).optional(),
  }),

  // Date range
  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
};

// AI API Schemas
export const aiSchemas = {
  generateExcerpt: z.object({
    title: z
      .string()
      .min(1, 'Title is required')
      .refine(
        (val) => val.trim().split(/\s+/).length > 1,
        'Title must have more than 1 word'
      ),
    content: z
      .string()
      .min(1, 'Content is required')
      .refine(
        (val) => {
          const textContent = val.replace(/<[^>]*>/g, '').trim();
          return textContent.length > 0;
        },
        'Content is empty or contains only HTML tags'
      ),
  }),

  improveContent: z.object({
    content: z
      .string()
      .min(10, 'Content must be at least 10 characters')
      .max(10000, 'Content must be less than 10,000 characters')
      .refine(
        (val) => {
          const textContent = val.replace(/<[^>]*>/g, '').trim();
          return textContent.length >= 10;
        },
        'Content must be at least 10 characters after removing HTML'
      ),
    action: z.enum(['improve', 'rephrase', 'shorten', 'expand', 'grammar'], {
      message: 'Invalid action. Must be one of: improve, rephrase, shorten, expand, grammar',
    }),
    title: z.string().optional(),
  }),
};

// Backup API Schemas
export const backupSchemas = {
  createBackup: z.object({
    type: z.enum(['auto', 'manual']).default('manual').optional(),
  }),

  deleteBackup: z.object({
    id: z.string().min(1, 'Backup ID is required'),
  }),
};

// User API Schemas
export const userSchemas = {
  checkSuperAdmin: z.object({
    userId: z.string().min(1, 'User ID is required'),
  }),
};

// Blog API Schemas
export const blogSchemas = {
  createPost: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    slug: z.string().min(1, 'Slug is required'),
    content: z.string().min(1, 'Content is required').transform((val) => {
      // HTML sanitization will be applied in the API handler
      return val;
    }),
    excerpt: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
    featuredImage: z.string().url().optional().or(z.literal('')),
    seoTitle: z.string().max(60).optional(),
    seoDescription: z.string().max(160).optional(),
    seoKeywords: z.array(z.string()).optional(),
  }),

  updatePost: z.object({
    title: z.string().min(1).max(200).optional(),
    slug: z.string().min(1).optional(),
    content: z.string().min(1).optional().transform((val) => {
      // HTML sanitization will be applied in the API handler
      return val;
    }),
    excerpt: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    featuredImage: z.string().url().optional().or(z.literal('')),
    seoTitle: z.string().max(60).optional(),
    seoDescription: z.string().max(160).optional(),
    seoKeywords: z.array(z.string()).optional(),
  }),
};

// Community API Schemas (for future use)
export const communitySchemas = {
  createPost: z.object({
    title: z.string().min(1, 'Title is required').max(200),
    content: z.string().min(1, 'Content is required'),
    topicId: z.string().min(1, 'Topic ID is required'),
    tags: z.array(z.string()).optional(),
  }),

  createReply: z.object({
    content: z.string().min(1, 'Content is required'),
    postId: z.string().min(1, 'Post ID is required'),
    parentId: z.string().optional(),
  }),
};

// Audit API Schemas
export const auditSchemas = {
  filterLogs: z.object({
    action: z.string().optional(),
    resource: z.string().optional(),
    userId: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    ...commonSchemas.pagination.shape,
  }),
};

// Export all schemas
export const apiSchemas = {
  ai: aiSchemas,
  backup: backupSchemas,
  user: userSchemas,
  blog: blogSchemas,
  community: communitySchemas,
  audit: auditSchemas,
  common: commonSchemas,
};

