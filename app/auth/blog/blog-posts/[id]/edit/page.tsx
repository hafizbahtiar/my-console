"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { BlogPost, BlogPostFormData, BlogTag } from "../../types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  const [error, setError] = useState<string | null>(null);
  const [tagInputValue, setTagInputValue] = useState('');
  const [isTagInputFocused, setIsTagInputFocused] = useState(false);

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
      const response = await fetch('/api/ai/generate-excerpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      const response = await fetch('/api/ai/improve-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      setFormData({
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
      });
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
      <EditBreadcrumbNav postId={postId} post={post} />

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
                onGenerateTitle={() => {}}
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
                seoSuggestions={null}
                showSEOSuggestions={false}
                isGeneratingSEOSuggestions={false}
                onFormDataChange={(data) => setFormData(prev => ({ ...prev, ...data }))}
                onGenerateSEOSuggestions={() => {}}
                onCloseSuggestions={() => {}}
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
                <Button variant="outline" type="button" size="lg" asChild className="w-full sm:w-auto">
                  <Link href={`/auth/blog/blog-posts/${postId}`}>
                    <ArrowLeft className="h-4 w-4 mr-2 shrink-0" />
                    <span className="truncate" suppressHydrationWarning>
                      {t('cancel')}
                    </span>
                  </Link>
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
    </div>
  );
}
