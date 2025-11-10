"use client";

import { useState, useEffect, useCallback } from "react";
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
  BLOG_TAGS_COLLECTION_ID
} from "@/lib/appwrite";
import { auditLogger } from "@/lib/audit-log";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/language-context";
import { getCSRFHeadersAlt } from "@/lib/csrf-utils";
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
    if (post && categories.length > 0) {
      // Only fix if blogCategories exists but might be in wrong format
      if (formData.blogCategories) {
        let categoryObj: any | null = null;

        // Check if blogCategories is a string ID instead of an object
        if (typeof formData.blogCategories === 'string') {
          categoryObj = categories.find(cat => cat.$id === formData.blogCategories) || null;
        }
        // Check if blogCategories is an object but might not have the right structure
        else if (typeof formData.blogCategories === 'object') {
          // If it already has $id and matches a category, use it as is
          if ((formData.blogCategories as any).$id) {
            categoryObj = categories.find(cat => cat.$id === (formData.blogCategories as any).$id) || null;
            // If found, use the full category object from the list (to ensure consistency)
            if (categoryObj) {
              // Only update if the structure is different
              if (JSON.stringify(formData.blogCategories) !== JSON.stringify(categoryObj)) {
                setFormData(prev => ({
                  ...prev,
                  blogCategories: categoryObj
                }));
              }
              return; // Already correct format
            }
          }
          // Try to find by other ID properties
          const categoryId = (formData.blogCategories as any).id || (formData.blogCategories as any)._id || (formData.blogCategories as any).$id;
          if (categoryId) {
            categoryObj = categories.find(cat => cat.$id === categoryId) || null;
          }
        }

        // Update formData if we found a matching category object
        if (categoryObj && (!formData.blogCategories || typeof formData.blogCategories === 'string' || (formData.blogCategories as any).$id !== categoryObj.$id)) {
          setFormData(prev => ({
            ...prev,
            blogCategories: categoryObj
          }));
        }
      }
    }
  }, [post, categories]);

  // Check if form has unsaved changes
  const hasUnsavedChanges = useCallback(() => {
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
      const postData = await tablesDB.getRow({
        databaseId: DATABASE_ID,
        tableId: BLOG_POSTS_COLLECTION_ID,
        rowId: postId,
      });

      const post = postData as unknown as BlogPost;
      setPost(post);

      // Populate form with post data
      const initialData: BlogPostFormData = {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        author: post.author,
        authorId: post.authorId || '',
        blogCategories: post.blogCategories || null,
        blogTags: post.blogTags || [],
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
    } catch (error) {
      console.error('Failed to create tag:', error);
      toast.error(t('blog_posts_page.create_page.tags.create_tag_failed'));
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
    try {
      // Sanitize HTML content before saving
      const { sanitizeHTMLForStorage } = await import('@/lib/html-sanitizer');

      const updatedPost = {
        ...formData,
        content: sanitizeHTMLForStorage(formData.content), // Sanitize HTML content
        publishedAt: formData.status === 'published' && !post?.publishedAt
          ? new Date().toISOString()
          : formData.publishedAt || post?.publishedAt,
        featuredImage: formData.featuredImage && formData.featuredImage.trim() !== '' ? formData.featuredImage.trim() : null,
        featuredImageAlt: formData.featuredImageAlt && formData.featuredImageAlt.trim() !== '' ? formData.featuredImageAlt.trim() : null,
        // Convert tag relationships to the format expected by Appwrite
        blogTags: formData.blogTags.map((tag: any) => tag.$id),
      };

      await tablesDB.updateRow({
        databaseId: DATABASE_ID,
        tableId: BLOG_POSTS_COLLECTION_ID,
        rowId: postId,
        data: updatedPost,
      });

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

      setIsFormSubmitted(true);
      toast.success(t('blog_posts_page.edit_page.updated_success'));
      router.push(`/auth/blog/blog-posts/${postId}`);
    } catch (error) {
      console.error('Failed to update blog post:', error);
      toast.error(t('blog_posts_page.edit_page.update_failed'));
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
                isGeneratingTitle={false}
                isGeneratingExcerpt={isGeneratingExcerpt}
                isImprovingContent={isImprovingContent}
                onGenerateTitle={() => { }}
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
          <div className="sticky z-40 bottom-0 -mb-8 px-4 sm:px-6 py-3 sm:py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-x">
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
                  size="lg"
                  className="w-full sm:w-auto"
                  onClick={() => handleNavigation(`/auth/blog/blog-posts/${postId}`)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2 shrink-0" />
                  <span className="truncate" suppressHydrationWarning>
                    {t('cancel')}
                  </span>
                </Button>
                <Button type="submit" disabled={isSubmitting} size="lg" className="w-full sm:w-auto">
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
