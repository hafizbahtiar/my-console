"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { BlogPost, BlogPostFormData, BlogTag } from "../../types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Loader2,
  Save,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  tablesDB,
  DATABASE_ID,
  BLOG_POSTS_COLLECTION_ID,
  BLOG_CATEGORIES_COLLECTION_ID,
  BLOG_TAGS_COLLECTION_ID,
  storage,
  STORAGE_ID
} from "@/lib/appwrite";
import { Query } from "appwrite";
import { auditLogger } from "@/lib/audit-log";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/language-context";
import { getCSRFToken, getCSRFHeadersAlt } from "@/lib/csrf-utils";
import {
  EditBreadcrumbNav,
  ProgressIndicator,
  BasicInfoSection,
  PublishingSettings,
  TagsSection,
  SEOSettings,
  calculateReadTime,
  countWords,
  isValidUrl,
  generateSlug,
} from "@/components/app/auth/blog/blog-posts/create";
import { account } from "@/lib/appwrite";


export default function EditBlogPostPage() {
  const { user, loading: authLoading } = useAuth();
  const { t, loading: translationLoading } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  // State
  const [post, setPost] = useState<BlogPost | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [availableTags, setAvailableTags] = useState<BlogTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isGeneratingExcerpt, setIsGeneratingExcerpt] = useState(false);
  const [isImprovingContent, setIsImprovingContent] = useState(false);
  const [isGeneratingSEOSuggestions, setIsGeneratingSEOSuggestions] = useState(false);
  const [seoSuggestions, setSeoSuggestions] = useState<any>(null);
  const [showSEOSuggestions, setShowSEOSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagInputValue, setTagInputValue] = useState('');
  const [isTagInputFocused, setIsTagInputFocused] = useState(false);
  const [initialFormData, setInitialFormData] = useState<BlogPostFormData | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const isSubmittingRef = useRef(false); // Ref to track submission status immediately

  // Form states
  const [formData, setFormData] = useState<BlogPostFormData>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    author: '',
    authorId: '',
    blogCategories: null as any, // Relationship object
    blogTags: [], // Tag relationship objects
    readTime: '',
    featuredImage: '',
    featuredImageAlt: '',
    status: 'draft',
    publishedAt: undefined,
    views: 0,
    likes: 0,
    commentCount: 0,
    isFeatured: false,
    allowComments: true,
    seoTitle: '',
    seoDescription: '',
    seoKeywords: [],
    relatedPosts: [],
  });

  // Memoize content change handler to prevent unnecessary TipTap re-renders
  const handleContentChange = useCallback((value: string) => {
    const readTime = calculateReadTime(value);
    setFormData(prev => ({
      ...prev,
      content: value,
      readTime: readTime
    }));
  }, []); // Empty deps - calculateReadTime is a pure function, setFormData is stable

  // AI Title Generation
  const generateTitleWithAI = async () => {
    if (!formData.content.trim()) {
      toast.error(t('blog_posts_page.create_page.validation.content_required'));
      return;
    }

    const textContent = formData.content.replace(/<[^>]*>/g, '').trim();
    if (textContent.length < 50) {
      toast.error('Content must be at least 50 characters long');
      return;
    }

    setIsGeneratingTitle(true);
    try {
      const headers = await getCSRFHeadersAlt();
      const response = await fetch('/api/ai/generate-title', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: formData.content,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate title');
      }

      const data = await response.json();
      if (data.title) {
        handleTitleChange(data.title);
        toast.success('Title generated successfully!');
      }
    } catch (error: any) {
      console.error('Failed to generate title:', error);
      toast.error(error.message || 'Failed to generate title');
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  // SEO Suggestions
  const generateSEOSuggestions = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error(t('blog_posts_page.create_page.validation.title_required') + ' and ' + t('blog_posts_page.create_page.validation.content_required'));
      return;
    }

    setIsGeneratingSEOSuggestions(true);
    try {
      const headers = await getCSRFHeadersAlt();
      const response = await fetch('/api/ai/seo-suggestions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          description: formData.seoDescription,
          keywords: formData.seoKeywords,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate SEO suggestions');
      }

      const data = await response.json();
      if (data.suggestions) {
        setSeoSuggestions(data.suggestions);
        setShowSEOSuggestions(true);
        toast.success(t('blog_posts_page.create_page.seo.suggestions_title') + ' generated!');
      }
    } catch (error: any) {
      console.error('Failed to generate SEO suggestions:', error);
      toast.error(error.message || 'Failed to generate SEO suggestions');
    } finally {
      setIsGeneratingSEOSuggestions(false);
    }
  };

  // AI Excerpt Generation
  const generateExcerptWithAI = async () => {
    // Validate that both title and content are provided
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error(t('blog_posts_page.create_page.validation.title_required') + ' and ' + t('blog_posts_page.create_page.validation.content_required'));
      return;
    }

    // Check if title has more than 1 word
    const titleWords = formData.title.trim().split(/\s+/).length;
    if (titleWords <= 1) {
      toast.error('Title must have more than one word');
      return;
    }

    setIsGeneratingExcerpt(true);
    try {
      const headers = await getCSRFHeadersAlt();
      const response = await fetch('/api/ai/generate-excerpt', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: formData.title.trim(),
          content: formData.content.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate excerpt');
      }

      const data = await response.json();

      setFormData(prev => ({
        ...prev,
        excerpt: data.excerpt
      }));

      toast.success('Excerpt generated successfully');

    } catch (error) {
      console.error('AI generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate excerpt';
      toast.error(errorMessage);
    } finally {
      setIsGeneratingExcerpt(false);
    }
  };

  // AI Content Improvement
  const improveContentWithAI = async (action: 'improve' | 'rephrase' | 'shorten' | 'expand' | 'grammar') => {
    // Validate that content is provided
    if (!formData.content.trim()) {
      toast.error(t('blog_posts_page.create_page.validation.content_required'));
      return;
    }

    // Check content length
    const plainTextContent = formData.content.replace(/<[^>]*>/g, '').trim();
    if (plainTextContent.length < 10) {
      toast.error('Content must be at least 10 characters long');
      return;
    }

    setIsImprovingContent(true);
    try {
      const headers = await getCSRFHeadersAlt();
      const response = await fetch('/api/ai/improve-content', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: formData.content.trim(),
          action,
          title: formData.title.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to improve content');
      }

      const data = await response.json();

      setFormData(prev => ({
        ...prev,
        content: data.improvedContent
      }));

      const messages = {
        improve: 'Content improved successfully',
        rephrase: 'Content rephrased successfully',
        shorten: 'Content shortened successfully',
        expand: 'Content expanded successfully',
        grammar: 'Grammar corrected successfully'
      };

      toast.success(messages[action]);

    } catch (error) {
      console.error('AI improvement error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to improve content';
      toast.error(errorMessage);
    } finally {
      setIsImprovingContent(false);
    }
  };

  // Load data on component mount - must be called before conditional returns
  useEffect(() => {
    const loadData = async () => {
      // Wait for auth to finish loading before proceeding
      if (authLoading) {
        return;
      }

      // If auth finished loading and no user, redirect
      if (!user || !postId) {
        router.push('/auth/dashboard');
        return;
      }

      try {
        await Promise.all([loadPost(), loadCategories(), loadTags()]);
      } catch (error) {
        console.error('Failed to load data:', error);
        setError(t('error'));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, authLoading, postId, router, t]);

  // Fix category selection after both post and categories are loaded
  useEffect(() => {
    if (!post || categories.length === 0) return;
    // Get the raw category from post (source of truth)
    const rawCategory = post.blogCategories || null;
    if (!rawCategory) {
      setFormData(prev => ({ ...prev, blogCategories: null }));
      return;
    }
    // Extract category ID from raw category
    let categoryId: string | null = null;
    if (typeof rawCategory === 'string') {
      categoryId = rawCategory;
    } else if (typeof rawCategory === 'object' && rawCategory) {
      categoryId = (rawCategory as any).$id || (rawCategory as any).id || (rawCategory as any)._id || null;
    }
    if (!categoryId) {
      setFormData(prev => ({ ...prev, blogCategories: null }));
      return;
    }
    // Find the full category object from the categories list
    const categoryObj = categories.find(cat => cat.$id === categoryId) || null;
    // Update formData using functional update to access current state
    setFormData(prev => {
      const currentCategoryId = typeof prev.blogCategories === 'string'
        ? prev.blogCategories
        : (prev.blogCategories as any)?.$id;
      if (categoryObj) {
        if (currentCategoryId !== categoryObj.$id) {
          return { ...prev, blogCategories: categoryObj };
        }
      } else {
        if (currentCategoryId) {
          return { ...prev, blogCategories: null };
        }
      }
      return prev;
    });
  }, [post, categories]);

  // Fix tag selection after both post and tags are loaded
  useEffect(() => {
    // Wait for both post and availableTags to be loaded
    if (!post || !postId) {
      return;
    }
    if (availableTags.length === 0) {
      return;
    }

    // Appwrite Tables API's getRow doesn't populate many-to-many relationships
    // So post.blogTags will be null/undefined. We need to query tags separately.
    // Since relationships aren't populated in either direction, we need to query
    // tags using a relationship query.

    // Try to query tags using relationship query
    // Since listRows doesn't populate relationships, we need to query tags
    // that are related to this post using a relationship query
    const loadRelatedTags = async () => {
      try {
        // Import Query if needed - but first let's try checking the raw post data
        // The post might have tag IDs stored in a different format

        // Since relationships aren't populated, let's try querying tags
        // where blogPosts relationship contains this post ID
        // But we need to check if Appwrite Tables supports relationship queries

        // For now, let's check if we can get tag IDs from the post data directly
        // by inspecting the raw post object
        const rawPostData = post as any;

        // Log ALL fields to see if tags are stored somewhere else
        // console.log('[Edit Page] Tag resolution - ALL post fields:', Object.keys(rawPostData));
        // console.log('[Edit Page] Tag resolution - raw post.blogTags:', rawPostData.blogTags);
        // console.log('[Edit Page] Tag resolution - raw post.tags:', rawPostData.tags);

        // Check if there are any other fields that might contain tag data
        const possibleTagFields = ['blogTags', 'tags', 'tagIds', 'tag_ids', 'blog_tag_ids'];
        for (const field of possibleTagFields) {
          if (rawPostData[field] !== undefined && rawPostData[field] !== null) {
            // console.log(`[Edit Page] Tag resolution - found field "${field}":`, rawPostData[field], 'type:', typeof rawPostData[field]);
          }
        }

        // If blogTags or tags is stored as an array of IDs (even if not populated as objects),
        // we might be able to access it directly
        let tagIds: string[] = [];

        // Check both blogTags (relationship field) and tags (fallback array field)
        // We save to both fields because getRow doesn't populate many-to-many relationships
        // Priority: blogTags first (relationship), then tags (fallback array field)
        const tagsField = rawPostData.blogTags || rawPostData.tags;

        // console.log('[Edit Page] Tag resolution - tagsField value:', tagsField, 'type:', typeof tagsField, 'isArray:', Array.isArray(tagsField));

        // FALLBACK: If no tags found in post data, try to find tags by checking all tags
        // and seeing if their blogPosts relationship (even if not populated) might contain this post ID
        // This is a workaround for posts created before we started saving to the tags field
        if (!tagsField || (Array.isArray(tagsField) && tagsField.length === 0)) {
          // console.log('[Edit Page] Tag resolution - No tags in post data, trying fallback: checking all tags for blogPosts relationship...');

          // Check each tag's raw data to see if blogPosts field exists (even if not populated)
          // Sometimes Appwrite stores relationship IDs even if not populated
          for (const tag of availableTags) {
            const rawTag = tag as any;
            // Check if blogPosts exists and might contain this post ID
            if (rawTag.blogPosts !== undefined) {
              // It might be an array of IDs, an array of objects, or a single value
              const blogPostsValue = rawTag.blogPosts;
              if (Array.isArray(blogPostsValue)) {
                // Check if any element matches this post ID
                const hasPostId = blogPostsValue.some((item: any) => {
                  if (typeof item === 'string') return item === postId;
                  if (typeof item === 'object' && item) return (item.$id || item.id) === postId;
                  return false;
                });
                if (hasPostId) {
                  // console.log(`[Edit Page] Tag resolution - Found tag "${tag.name}" that references this post via blogPosts relationship`);
                  tagIds.push(tag.$id);
                }
              } else if (typeof blogPostsValue === 'string' && blogPostsValue === postId) {
                // console.log(`[Edit Page] Tag resolution - Found tag "${tag.name}" that references this post (single value)`);
                tagIds.push(tag.$id);
              }
            }
          }

          if (tagIds.length > 0) {
            // console.log('[Edit Page] Tag resolution - Fallback found tags:', tagIds.length, tagIds);
          }
        }

        if (tagsField) {
          if (Array.isArray(tagsField)) {
            // Handle array of IDs or array of objects
            if (tagsField.length > 0) {
              tagIds = tagsField
                .map((tag: any) => {
                  if (typeof tag === 'string') return tag;
                  if (typeof tag === 'object' && tag) {
                    // Could be full object or just { $id: '...' }
                    return tag.$id || tag.id || tag._id || null;
                  }
                  return null;
                })
                .filter((id: string | null): id is string => id !== null && id !== '');
              // console.log('[Edit Page] Tag resolution - extracted tag IDs from post:', tagIds);
            } else {
              // console.log('[Edit Page] Tag resolution - tagsField is empty array');
            }
          } else if (typeof tagsField === 'string') {
            // Single tag ID as string
            tagIds = [tagsField];
            // console.log('[Edit Page] Tag resolution - extracted single tag ID from post:', tagIds);
          } else {
            // console.log('[Edit Page] Tag resolution - tagsField is not array or string:', typeof tagsField, tagsField);
          }
        } else {
          // console.log('[Edit Page] Tag resolution - tagsField is falsy:', tagsField);
        }

        // If we found tag IDs, resolve them from availableTags
        if (tagIds.length > 0) {
          const resolvedTags = tagIds
            .map((tagId: string) => availableTags.find(tag => tag.$id === tagId))
            .filter((tag): tag is BlogTag => tag !== undefined);

          // console.log('[Edit Page] Tag resolution - resolved tags from IDs:', resolvedTags.length, resolvedTags.map(t => t.name));

          setFormData(prev => {
            const currentTagIds = prev.blogTags.map(t => t.$id).sort().join(',');
            const newTagIds = resolvedTags.map(t => t.$id).sort().join(',');

            if (currentTagIds !== newTagIds) {
              // console.log('[Edit Page] Tag resolution - updating formData with tags:', resolvedTags.length);
              return {
                ...prev,
                blogTags: resolvedTags
              };
            }

            return prev;
          });
          return;
        }

        // Note: Relationship queries for many-to-many relationships are not supported
        // in Appwrite Tables API (returns "Cannot query on virtual relationship attribute")
        // So we rely on the post data containing tag IDs in blogTags or tags field

        // If we still haven't found tags, log a warning
        if (tagIds.length === 0) {
          // console.warn('[Edit Page] Tag resolution - could not find tag IDs in post data.');
          // console.warn('[Edit Page] Tag resolution - checked fields: blogTags =', rawPostData.blogTags, ', tags =', rawPostData.tags);
          // console.warn('[Edit Page] Tag resolution - This post was likely created before we started saving tags to the "tags" field.');
          // console.warn('[Edit Page] Tag resolution - SOLUTION: Select tags in the UI and save the post once. This will populate the "tags" field and tags will load correctly on next edit.');
        }

      } catch (error) {
        console.error('[Edit Page] Tag resolution - error loading related tags:', error);
      }
    };

    loadRelatedTags();
  }, [post, availableTags, postId]);

  // Check if form has unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    // If form is being submitted (tracked via ref for immediate check), don't block navigation
    if (isSubmittingRef.current) return false;
    if (!initialFormData || isFormSubmitted) return false;

    // Compare form data with initial data
    const compareValues = (a: any, b: any): boolean => {
      if (a === b) return true;
      if (a == null || b == null) return a === b;
      if (typeof a !== typeof b) return false;

      if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        // Compare tag arrays by $id
        if (a.length > 0 && a[0]?.$id) {
          const aIds = a.map((item: any) => item.$id).sort();
          const bIds = b.map((item: any) => item.$id).sort();
          return JSON.stringify(aIds) === JSON.stringify(bIds);
        }
        return JSON.stringify(a) === JSON.stringify(b);
      }

      if (typeof a === 'object') {
        // Compare category objects by $id
        if (a.$id && b.$id) {
          return a.$id === b.$id;
        }
        return JSON.stringify(a) === JSON.stringify(b);
      }

      return a === b;
    };

    return (
      formData.title !== initialFormData.title ||
      formData.slug !== initialFormData.slug ||
      formData.excerpt !== initialFormData.excerpt ||
      formData.content !== initialFormData.content ||
      formData.status !== initialFormData.status ||
      formData.featuredImage !== initialFormData.featuredImage ||
      formData.featuredImageAlt !== initialFormData.featuredImageAlt ||
      formData.featuredImageFile !== initialFormData.featuredImageFile ||
      formData.isFeatured !== initialFormData.isFeatured ||
      formData.allowComments !== initialFormData.allowComments ||
      formData.seoTitle !== initialFormData.seoTitle ||
      formData.seoDescription !== initialFormData.seoDescription ||
      JSON.stringify(formData.seoKeywords) !== JSON.stringify(initialFormData.seoKeywords) ||
      !compareValues(formData.blogCategories, initialFormData.blogCategories) ||
      !compareValues(formData.blogTags, initialFormData.blogTags)
    );
  }, [formData, initialFormData, isFormSubmitted]);

  // Handle navigation with unsaved changes check
  const handleNavigation = useCallback((path: string) => {
    if (hasUnsavedChanges()) {
      setPendingNavigation(path);
      setShowUnsavedDialog(true);
    } else {
      router.push(path);
    }
  }, [hasUnsavedChanges, router]);

  // Browser back/forward and beforeunload handlers
  useEffect(() => {
    if (!initialFormData) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    // Handle browser back/forward buttons using history API
    const handlePopState = (e: PopStateEvent) => {
      if (hasUnsavedChanges() && !isFormSubmitted) {
        // Prevent navigation
        window.history.pushState(null, '', window.location.pathname);
        setPendingNavigation(document.referrer || '/auth/blog/blog-posts');
        setShowUnsavedDialog(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Push state to enable back button detection
    window.history.pushState(null, '', window.location.pathname);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges, initialFormData, isFormSubmitted]);

  const loadPost = async () => {
    try {
      // Use listRows with Query instead of getRow - listRows may return relationship data
      // that getRow doesn't populate (as seen in portfolio-next implementation)
      const postData = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: BLOG_POSTS_COLLECTION_ID,
        queries: [
          Query.equal('$id', postId),
          Query.limit(1),
        ],
      });

      if (!postData.rows || postData.rows.length === 0) {
        throw new Error('Post not found');
      }

      const post = postData.rows[0] as unknown as BlogPost;
      setPost(post);

      // Don't resolve category here - let useEffect handle it after categories are loaded
      // Just store the raw category data from the post
      const rawCategory = post.blogCategories || null;

      // Check if listRows returned relationship data (unlike getRow which doesn't populate relationships)
      const rawTags = post.blogTags || null;
      // console.log('[Edit Page] loadPost - post.blogTags from listRows:', rawTags);
      // console.log('[Edit Page] loadPost - post.tags from listRows:', (post as any).tags);

      // Populate form with post data
      const initialData: BlogPostFormData = {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        author: post.author,
        authorId: post.authorId || '',
        blogCategories: rawCategory, // Store raw category - will be resolved in useEffect
        blogTags: [], // Start with empty array - will be resolved in useEffect after tags are loaded
        readTime: post.readTime,
        featuredImage: post.featuredImage || '',
        featuredImageAlt: post.featuredImageAlt || '',
        status: post.status,
        publishedAt: post.publishedAt || '',
        views: post.views,
        likes: post.likes,
        isFeatured: post.isFeatured,
        seoTitle: post.seoTitle || '',
        seoDescription: post.seoDescription || '',
        seoKeywords: [...post.seoKeywords],
        allowComments: post.allowComments,
        commentCount: post.commentCount,
        relatedPosts: [...post.relatedPosts],
      };
      setFormData(initialData);
      setInitialFormData(initialData);
    } catch (error) {
      console.error('Failed to load post:', error);
      throw error;
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: BLOG_CATEGORIES_COLLECTION_ID,
      });
      setCategories(categoriesData.rows || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadTags = async () => {
    try {
      const tagsData = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: BLOG_TAGS_COLLECTION_ID,
      });
      setAvailableTags((tagsData.rows as unknown as BlogTag[]) || []);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };



  // Tag management functions
  const createTag = async (tagName: string): Promise<BlogTag | null> => {
    try {
      const slug = tagName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      const newTag = await tablesDB.createRow({
        databaseId: DATABASE_ID,
        tableId: BLOG_TAGS_COLLECTION_ID,
        rowId: `tag_${Date.now()}`,
        data: {
          name: tagName.trim(),
          slug: slug,
          isActive: true,
        },
      });

      const createdTag = newTag as unknown as BlogTag;
      setAvailableTags(prev => [...prev, createdTag]);
      return createdTag;
    } catch (error: any) {
      console.error('Failed to create tag:', error);

      // Check for unauthorized error
      if (error?.code === 401 || error?.code === 403 || error?.message?.includes('not authorized') || error?.message?.includes('Unauthorized')) {
        toast.error(`Permission denied. You need "Create" permission set to "role:super_admin" on the '${BLOG_TAGS_COLLECTION_ID}' table.`);
      } else {
        toast.error(t('blog_posts_page.create_page.tags.create_tag_failed'));
      }
      return null;
    }
  };

  const addTag = async (tagName: string) => {
    const trimmedName = tagName.trim();
    if (!trimmedName) return;

    // Check if tag already exists
    const existingTag = availableTags.find(tag =>
      tag.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (existingTag) {
      // Tag exists, check if already selected
      const isAlreadySelected = formData.blogTags.some((tag: any) => tag.$id === existingTag.$id);
      if (!isAlreadySelected) {
        setFormData(prev => ({
          ...prev,
          blogTags: [...prev.blogTags, existingTag]
        }));
      }
    } else {
      // Tag doesn't exist, create it
      const newTag = await createTag(trimmedName);
      if (newTag) {
        setFormData(prev => ({
          ...prev,
          blogTags: [...prev.blogTags, newTag]
        }));
      }
    }
  };

  const removeTag = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      blogTags: prev.blogTags.filter((tag: any) => tag.$id !== tagId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error(t('blog_posts_page.create_page.validation.title_required'));
      return;
    }
    if (!formData.slug.trim()) {
      toast.error(t('blog_posts_page.create_page.validation.slug_required'));
      return;
    }
    if (!formData.excerpt.trim()) {
      toast.error(t('blog_posts_page.create_page.validation.excerpt_required'));
      return;
    }
    if (!formData.content.trim()) {
      toast.error(t('blog_posts_page.create_page.validation.content_required'));
      return;
    }
    if (!formData.author.trim()) {
      toast.error(t('blog_posts_page.create_page.validation.author_required'));
      return;
    }
    if (!formData.blogCategories) {
      toast.error(t('blog_posts_page.create_page.validation.category_required'));
      return;
    }
    if (!formData.status.trim()) {
      toast.error(t('blog_posts_page.create_page.validation.status_required'));
      return;
    }

    // Validate featured image URL if provided
    if (formData.featuredImage && formData.featuredImage.trim() !== '') {
      if (!isValidUrl(formData.featuredImage)) {
        toast.error(t('blog_posts_page.create_page.validation.invalid_image_url'));
        return;
      }
    }

    setIsSubmitting(true);
    isSubmittingRef.current = true; // Set ref immediately to bypass unsaved changes check
    try {
      if (!user) {
        isSubmittingRef.current = false; // Reset ref if early return
        return;
      }

      // Upload featured image first if a file is selected
      let featuredImageUrl = formData.featuredImage && formData.featuredImage.trim() !== ''
        ? formData.featuredImage.trim()
        : null;

      if (formData.featuredImageFile) {
        try {
          // Get JWT for authentication (since session cookie is on Appwrite domain)
          const jwtResponse = await account.createJWT();
          const jwt = jwtResponse.jwt;
          // Get CSRF token
          const token = await getCSRFToken();
          // Create FormData
          const formDataToSend = new FormData();
          formDataToSend.append('file', formData.featuredImageFile);
          // Upload image
          const uploadResponse = await fetch('/api/blog/upload-image', {
            method: 'POST',
            headers: {
              'X-CSRF-Token': token,
              'X-Appwrite-JWT': jwt,  // Send JWT for server-side auth
            },
            credentials: 'include',
            body: formDataToSend,
          });
          // console.log('[DEBUG] Upload response status:', uploadResponse.status);
          if (!uploadResponse.ok) {
            const error = await uploadResponse.json();
            // console.error('[ERROR] Upload failed:', error);
            throw new Error(error.error?.message || error.error || 'Failed to upload image');
          }
          const uploadData = await uploadResponse.json();
          // console.log('[DEBUG] Upload response data:', uploadData);
          if (uploadData.success && (uploadData.data?.url || uploadData.url)) {
            featuredImageUrl = uploadData.data?.url || uploadData.url;
            // console.log('[DEBUG] Set featuredImageUrl:', featuredImageUrl);
            // Delete old image if exists and new one uploaded
            if (post?.featuredImage && featuredImageUrl !== post.featuredImage) {
              try {
                const oldFileId = post.featuredImage.split('/').pop()?.split('?')[0];
                if (oldFileId) {
                  await storage.deleteFile({ bucketId: STORAGE_ID, fileId: oldFileId });
                }
              } catch (deleteError) {
                console.warn('[WARN] Failed to delete old image:', deleteError);
                // Continue - non-critical error
              }
            }
          } else {
            // console.error('[ERROR] Invalid upload response:', uploadData);
            throw new Error('Invalid response from image upload');
          }
        } catch (uploadError: any) {
          // console.error('Image upload error:', uploadError);
          toast.error(uploadError.message || 'Failed to upload image');
          isSubmittingRef.current = false;
          setIsSubmitting(false);
          return;
        }
      }

      // Sanitize HTML content before saving
      const { sanitizeHTMLForStorage } = await import('@/lib/html-sanitizer');

      // Get tag IDs for saving
      const tagIds = formData.blogTags.map((tag: any) => tag.$id);
      // Exclude featuredImageFile from formData
      const { featuredImageFile, ...postData } = formData;
      const updatedPost = {
        ...postData,
        content: sanitizeHTMLForStorage(formData.content), // Sanitize HTML content
        publishedAt: formData.status === 'published' && !post?.publishedAt
          ? new Date().toISOString()
          : formData.publishedAt || post?.publishedAt,
        featuredImage: featuredImageUrl,
        featuredImageAlt: formData.featuredImageAlt && formData.featuredImageAlt.trim() !== '' ? formData.featuredImageAlt.trim() : null,
        // Convert tag relationships to the format expected by Appwrite
        blogTags: tagIds,
        // Also save to tags field (legacy/fallback) so we can read it back
        // since getRow doesn't populate many-to-many relationships
        tags: tagIds,
      };
      // console.log('[DEBUG] Saving post with featuredImage:', updatedPost.featuredImage);
      // console.log('[DEBUG] Updating row with data:', updatedPost);
      try {
        await tablesDB.updateRow({
          databaseId: DATABASE_ID,
          tableId: BLOG_POSTS_COLLECTION_ID,
          rowId: postId,
          data: updatedPost,
        });
        // console.log('[DEBUG] Post updated successfully');
      } catch (updateError: any) {
        // console.error('[ERROR] Failed to update post:', updateError);
        throw updateError;
      }

      // Note: Category post counts are calculated dynamically from relationships
      // No manual updates needed when categories change

      // Log audit event
      await auditLogger.log({
        action: 'BLOG_POST_UPDATED',
        resource: 'blog_posts',
        resourceId: postId,
        userId: user!.$id,
        metadata: {
          postTitle: updatedPost.title,
          changes: { title: updatedPost.title, status: updatedPost.status },
          description: `Updated blog post: ${updatedPost.title}`
        }
      });

      // Update initial form data to match current state (so hasUnsavedChanges returns false)
      const updatedInitialData: BlogPostFormData = {
        ...formData,
        title: updatedPost.title,
        slug: updatedPost.slug,
        excerpt: updatedPost.excerpt,
        content: updatedPost.content,
        status: updatedPost.status,
        featuredImage: updatedPost.featuredImage || '',
        featuredImageAlt: updatedPost.featuredImageAlt || '',
        featuredImageFile: undefined, // Clear file after upload
        publishedAt: updatedPost.publishedAt || undefined,
        seoTitle: updatedPost.seoTitle || '',
        seoDescription: updatedPost.seoDescription || '',
        seoKeywords: updatedPost.seoKeywords || [],
        blogTags: formData.blogTags, // Keep the tag objects for comparison
      };
      setInitialFormData(updatedInitialData);
      setIsFormSubmitted(true);

      toast.success(t('blog_posts_page.edit_page.updated_success'));

      // Navigate immediately - use window.location for hard navigation that bypasses React checks
      // This ensures navigation happens even if state updates haven't completed
      window.location.href = '/auth/blog/blog-posts';
    } catch (error: any) {
      // console.error('Failed to update blog post:', error);
      toast.error(error.message || t('blog_posts_page.edit_page.update_failed'));
      isSubmittingRef.current = false; // Reset ref on error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }));
  };

  // Show skeleton while translations or data is loading
  if (translationLoading || isLoading || authLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 sm:p-6 pt-6">
        {/* Breadcrumb Skeleton */}
        <Skeleton className="h-10 w-full" />

        {/* Header Skeleton */}
        <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 sm:h-9 sm:w-64" />
            <Skeleton className="h-4 w-64 sm:h-5 sm:w-80" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Progress Skeleton */}
        <Skeleton className="h-12 w-full" />

        {/* Form Skeleton */}
        <div className="grid gap-6 sm:gap-8 xl:grid-cols-12">
          <div className="xl:col-span-8 space-y-6">
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
          <div className="xl:col-span-4 space-y-4">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
        </div>

        {/* Submit Actions Skeleton */}
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex-1 space-y-4 p-4 sm:p-6 pt-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription suppressHydrationWarning>
            {error || t('blog_posts_page.edit_page.blog_post_not_found')}
          </AlertDescription>
        </Alert>
        <Button asChild>
          <Link href="/auth/blog/blog-posts" suppressHydrationWarning>
            {t('blog_posts_page.edit_page.back_to_posts')}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-6 pt-6">
      {/* Breadcrumb Navigation */}
      <div className="sticky top-16 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 sm:px-6 py-2 sm:py-3">
          <nav className="flex items-center space-x-2 text-xs sm:text-sm">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 sm:h-8 px-2 text-muted-foreground hover:text-foreground shrink-0"
              onClick={() => handleNavigation('/auth/blog/blog-posts')}
            >
              <ArrowLeft className="h-3 w-3 mr-1 shrink-0" />
              <span className="truncate" suppressHydrationWarning>
                {t('blog_posts_page.edit_page.breadcrumb')}
              </span>
            </Button>
            <span className="text-muted-foreground shrink-0">/</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 sm:h-8 px-2 text-muted-foreground hover:text-foreground shrink-0"
              onClick={() => handleNavigation(`/auth/blog/blog-posts/${postId}`)}
            >
              <span className="truncate">
                {post ? post.title : t('blog_posts_page.edit_page.unknown_post')}
              </span>
            </Button>
            <span className="text-muted-foreground shrink-0">/</span>
            <span className="text-foreground font-medium truncate" suppressHydrationWarning>
              {t('blog_posts_page.edit_page.edit')}
            </span>
          </nav>
        </div>
      </div>

      {/* Header */}
      <div className="sticky top-[80px] sm:top-28 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight" suppressHydrationWarning>
                {t('blog_posts_page.edit_page.title')}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground" suppressHydrationWarning>
                {t('blog_posts_page.edit_page.description')}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <div className={`w-2 h-2 rounded-full shrink-0 ${formData.status === 'published' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="truncate" suppressHydrationWarning>
                  {formData.status === 'published' ? t('published') : t('draft')}
                </span>
              </div>
              {post && (
                <div className="text-xs sm:text-sm text-muted-foreground" suppressHydrationWarning>
                  {t('blog_posts_page.edit_page.updated')}: {new Date(post.$updatedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <ProgressIndicator formData={formData} />

      {/* Main Content */}
      <div className="px-4 sm:px-6 py-4 sm:py-8">
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          <div className="grid gap-6 sm:gap-8 xl:grid-cols-12">
            {/* Main Content Column */}
            <div className="xl:col-span-8 space-y-6 sm:space-y-8">
              <BasicInfoSection
                formData={formData}
                onFormDataChange={(data) => setFormData(prev => ({ ...prev, ...data }))}
                onTitleChange={handleTitleChange}
                onContentChange={handleContentChange}
                isGeneratingTitle={isGeneratingTitle}
                isGeneratingExcerpt={isGeneratingExcerpt}
                isImprovingContent={isImprovingContent}
                onGenerateTitle={generateTitleWithAI}
                onGenerateExcerpt={generateExcerptWithAI}
                onImproveContent={improveContentWithAI}
              />
            </div>

            {/* Sidebar */}
            <div className="xl:col-span-4 space-y-4 sm:space-y-6">
              <PublishingSettings
                formData={formData}
                categories={categories}
                onFormDataChange={(data) => setFormData(prev => ({ ...prev, ...data }))}
              />

              <TagsSection
                selectedTags={formData.blogTags}
                availableTags={availableTags}
                tagInputValue={tagInputValue}
                isTagInputFocused={isTagInputFocused}
                onTagInputChange={setTagInputValue}
                onTagInputFocus={() => setIsTagInputFocused(true)}
                onTagInputBlur={() => setTimeout(() => setIsTagInputFocused(false), 200)}
                onTagInputKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const value = tagInputValue.trim();
                    if (value) {
                      await addTag(value);
                      setTagInputValue('');
                      setIsTagInputFocused(false);
                    }
                  }
                }}
                onAddTag={addTag}
                onRemoveTag={removeTag}
              />

              <SEOSettings
                formData={formData}
                seoSuggestions={seoSuggestions}
                showSEOSuggestions={showSEOSuggestions}
                isGeneratingSEOSuggestions={isGeneratingSEOSuggestions}
                onFormDataChange={(data) => setFormData(prev => ({ ...prev, ...data }))}
                onGenerateSEOSuggestions={generateSEOSuggestions}
                onCloseSuggestions={() => setShowSEOSuggestions(false)}
              />
            </div>
          </div>

          {/* Submit Actions - Fixed at bottom */}
          <div className="sticky z-40 bottom-0 -mb-8 px-4 sm:px-6 py-3 sm:py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <div className="text-xs sm:text-sm text-muted-foreground" suppressHydrationWarning>
                {formData.content && (
                  <span>
                    {t('blog_posts_page.edit_page.submit.words', { count: countWords(formData.content).toString() })}
                  </span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  type="button"
                  size="default"
                  className="w-full sm:w-auto"
                  onClick={() => handleNavigation(`/auth/blog/blog-posts/${postId}`)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2 shrink-0" />
                  <span className="truncate" suppressHydrationWarning>
                    {t('cancel')}
                  </span>
                </Button>
                <Button type="submit" variant="outline" disabled={isSubmitting} size="default" className="w-full sm:w-auto">
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" />}
                  <Save className="h-4 w-4 mr-2 shrink-0" />
                  <span className="truncate" suppressHydrationWarning>
                    {t('blog_posts_page.edit_page.submit.update')}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle suppressHydrationWarning>
              {t('blog_posts_page.edit_page.unsaved_changes_title')}
            </AlertDialogTitle>
            <AlertDialogDescription suppressHydrationWarning>
              {t('blog_posts_page.edit_page.unsaved_changes_description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowUnsavedDialog(false);
              setPendingNavigation(null);
            }} suppressHydrationWarning>
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                const navPath = pendingNavigation;
                setShowUnsavedDialog(false);
                setPendingNavigation(null);
                setIsFormSubmitted(true);
                // Use setTimeout to ensure state updates complete before navigation
                await new Promise(resolve => setTimeout(resolve, 0));
                if (navPath) {
                  router.push(navPath);
                }
              }}
              className="bg-red-600 text-white hover:bg-red-700"
              suppressHydrationWarning
            >
              {t('blog_posts_page.edit_page.leave_without_saving')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
