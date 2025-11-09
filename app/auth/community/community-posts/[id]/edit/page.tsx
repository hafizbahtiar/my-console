"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { CommunityPost, CommunityPostFormData } from "../../types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/custom/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  COMMUNITY_POSTS_COLLECTION_ID,
  COMMUNITY_TOPICS_COLLECTION_ID
} from "@/lib/appwrite";
import { auditLogger } from "@/lib/audit-log";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/language-context";
import {
  EditBreadcrumbNav,
  BasicInfoSection,
  TopicSection,
  TagsSection,
  PostSettingsSection,
  generateSlug,
} from "@/components/app/auth/community/community-posts/edit";

const MAX_CONTENT_LENGTH = 5000;
const MAX_TAG_LENGTH = 20;

export default function EditCommunityPostPage() {
  const { user, loading: authLoading } = useAuth();
  const { t, loading: translationLoading } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  // State
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contentLength, setContentLength] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState<CommunityPostFormData>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    author: '',
    authorId: '',
    authorEmail: '',
    communityTopics: null,
    status: 'pending',
    isPinned: false,
    isLocked: false,
    isFeatured: false,
    views: 0,
    upvotes: 0,
    downvotes: 0,
    replyCount: 0,
    tags: [],
  });

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      // Wait for auth to finish loading before proceeding
      if (authLoading) {
        return;
      }

      // Don't redirect on refresh - allow skeleton/error state to show
      if (!postId) {
        setError(t('community_posts_page.edit_page.unknown_post'));
        setIsLoading(false);
        return;
      }

      // Only load data if user is available
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        await Promise.all([loadPost(), loadTopics()]);
      } catch (error: any) {
        console.error('Failed to load data:', error);
        
        // Check for authorization errors
        const isAuthError = error?.code === 401 || 
                           error?.code === 403 || 
                           error?.message?.includes('not authorized') ||
                           error?.message?.includes('authorized') ||
                           error?.type === 'AppwriteException';
        
        if (isAuthError) {
          setError(t('community_posts_page.edit_page.permission_denied'));
        } else {
          setError(t('error'));
        }
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
        tableId: COMMUNITY_POSTS_COLLECTION_ID,
        rowId: postId,
      });

      const post = postData as unknown as CommunityPost;
      setPost(post);

      // Populate form with post data
      setFormData({
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt || '',
        author: post.author || '',
        authorId: post.authorId,
        authorEmail: post.authorEmail || '',
        communityTopics: post.communityTopics || null,
        status: post.status,
        isPinned: post.isPinned,
        isLocked: post.isLocked,
        isFeatured: post.isFeatured,
        views: post.views,
        upvotes: post.upvotes,
        downvotes: post.downvotes,
        replyCount: post.replyCount,
        tags: Array.isArray(post.tags) ? post.tags : [],
      });

      // Calculate content length
      const textContent = post.content.replace(/<[^>]*>/g, '');
      setContentLength(textContent.length);
    } catch (error) {
      console.error('Failed to load post:', error);
      throw error;
    }
  };

  const loadTopics = async () => {
    try {
      const topicsData = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: COMMUNITY_TOPICS_COLLECTION_ID,
      });
      // Filter active topics
      const activeTopics = (topicsData.rows || []).filter((topic: any) => topic.isActive);
      setTopics(activeTopics);
    } catch (error) {
      console.error('Failed to load topics:', error);
      toast.error(t('error'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error(t('community_posts_page.edit_page.validation.title_required'));
      return;
    }
    if (!formData.slug.trim()) {
      toast.error(t('community_posts_page.edit_page.validation.slug_required'));
      return;
    }
    if (!formData.content.trim()) {
      toast.error(t('community_posts_page.edit_page.validation.content_required'));
      return;
    }
    if (formData.content.length > MAX_CONTENT_LENGTH) {
      toast.error(t('community_posts_page.edit_page.validation.content_too_long', { max: MAX_CONTENT_LENGTH.toString() }));
      return;
    }
    if (!formData.authorId) {
      toast.error(t('community_posts_page.edit_page.validation.author_id_required'));
      return;
    }

    // Validate tags
    const invalidTags = formData.tags.filter(tag => tag.length > MAX_TAG_LENGTH);
    if (invalidTags.length > 0) {
      toast.error(t('community_posts_page.edit_page.validation.tag_too_long', { max: MAX_TAG_LENGTH.toString() }));
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedPost = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        content: formData.content.trim(),
        excerpt: formData.excerpt?.trim() || null,
        author: formData.author?.trim() || null,
        authorId: formData.authorId,
        authorEmail: formData.authorEmail || null,
        communityTopics: formData.communityTopics?.$id || null,
        status: formData.status,
        isPinned: formData.isPinned,
        isLocked: formData.isLocked,
        isFeatured: formData.isFeatured,
        views: formData.views,
        upvotes: formData.upvotes,
        downvotes: formData.downvotes,
        replyCount: formData.replyCount,
        tags: formData.tags.filter(tag => tag.trim().length > 0),
      };

      await tablesDB.updateRow({
        databaseId: DATABASE_ID,
        tableId: COMMUNITY_POSTS_COLLECTION_ID,
        rowId: postId,
        data: updatedPost,
      });

      // Log audit event
      await auditLogger.log({
        action: 'COMMUNITY_POST_UPDATED',
        resource: 'community_posts',
        resourceId: postId,
        userId: user!.$id,
        metadata: {
          postTitle: updatedPost.title,
          changes: { title: updatedPost.title, status: updatedPost.status },
          description: `Updated community post: ${updatedPost.title}`
        }
      });

      toast.success(t('community_posts_page.edit_page.success'));
      router.push(`/auth/community/community-posts/${postId}`);
    } catch (error: any) {
      console.error('Failed to update community post:', error);
      
      // Check for authorization errors
      const isAuthError = error?.code === 401 || 
                         error?.code === 403 || 
                         error?.message?.includes('not authorized') ||
                         error?.message?.includes('authorized') ||
                         error?.type === 'AppwriteException';
      
      if (isAuthError) {
        toast.error(t('community_posts_page.edit_page.permission_denied'));
      } else {
        toast.error(t('community_posts_page.edit_page.failed'));
      }
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

  const handleContentChange = (content: string) => {
    // Strip HTML to count actual text length
    const textContent = content.replace(/<[^>]*>/g, '');
    setContentLength(textContent.length);
    
    setFormData(prev => ({
      ...prev,
      content
    }));
  };

  const addTag = (tagName: string) => {
    const trimmedTag = tagName.trim();
    if (!trimmedTag) return;

    if (trimmedTag.length > MAX_TAG_LENGTH) {
      toast.error(t('community_posts_page.edit_page.validation.tag_too_long', { max: MAX_TAG_LENGTH.toString() }));
      return;
    }

    if (formData.tags.includes(trimmedTag)) {
      toast.error(t('community_posts_page.edit_page.validation.tag_exists'));
      return;
    }

    if (formData.tags.length >= 10) {
      toast.error(t('community_posts_page.edit_page.validation.max_tags'));
      return;
    }

    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, trimmedTag]
    }));
  };

  const removeTag = (tagIndex: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, index) => index !== tagIndex)
    }));
  };

  // Wrapper function to handle partial updates
  const handleFormDataChange = (data: Partial<CommunityPostFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  // Show skeleton while translations or data is loading
  if (translationLoading || isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Breadcrumb Skeleton */}
        <div className="sticky top-16 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="px-4 sm:px-6 py-2 sm:py-3">
            <Skeleton className="h-8 w-full" />
          </div>
        </div>

        {/* Header Skeleton */}
        <div className="sticky top-28 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-8 w-48 sm:h-9 sm:w-64" />
                <Skeleton className="h-4 w-64 sm:h-5 sm:w-80" />
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="px-4 sm:px-6 py-8">
          <div className="grid gap-8 xl:grid-cols-12">
            <div className="xl:col-span-8 space-y-8">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-64 w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="xl:col-span-4 space-y-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <CardTitle className="text-destructive" suppressHydrationWarning>{t('error')}</CardTitle>
            <CardDescription suppressHydrationWarning>
              {error || t('community_posts_page.edit_page.unknown_post')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/auth/community/community-posts">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span suppressHydrationWarning>{t('back')}</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb Navigation */}
      <EditBreadcrumbNav postId={postId} post={post} />

      {/* Header */}
      <div className="sticky top-28 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight" suppressHydrationWarning>
                {t('community_posts_page.edit_page.title')}
              </h1>
              <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                {t('community_posts_page.edit_page.description')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className={`w-2 h-2 rounded-full ${
                  formData.status === 'approved' ? 'bg-green-500' : 
                  formData.status === 'pending' ? 'bg-yellow-500' : 
                  'bg-red-500'
                }`}></div>
                <StatusBadge status={formData.status} type="community-post" />
              </div>
              {post && (
                <div className="text-sm text-muted-foreground" suppressHydrationWarning>
                  {t('community_posts_page.edit_page.updated_status')}: {new Date(post.$updatedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid gap-8 xl:grid-cols-12">
            {/* Main Content Column */}
            <div className="xl:col-span-8 space-y-8">
              <BasicInfoSection
                formData={formData}
                contentLength={contentLength}
                maxContentLength={MAX_CONTENT_LENGTH}
                onFormDataChange={handleFormDataChange}
                onTitleChange={handleTitleChange}
                onContentChange={handleContentChange}
              />
            </div>

            {/* Sidebar */}
            <div className="xl:col-span-4 space-y-6">
              <TopicSection
                formData={formData}
                topics={topics}
                onFormDataChange={handleFormDataChange}
              />

              <TagsSection
                formData={formData}
                maxTagLength={MAX_TAG_LENGTH}
                onAddTag={addTag}
                onRemoveTag={removeTag}
              />

              <PostSettingsSection
                formData={formData}
                onFormDataChange={handleFormDataChange}
              />
            </div>
          </div>

          {/* Submit Actions */}
          <div className="sticky z-40 bottom-0 -mb-8 px-4 sm:px-6 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-x">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground" suppressHydrationWarning>
                {contentLength > 0 && (
                  <span>
                    {contentLength} / {MAX_CONTENT_LENGTH} {t('community_posts_page.edit_page.basic_info.characters')}
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" type="button" size="lg" asChild>
                  <Link href={`/auth/community/community-posts/${postId}`}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    <span suppressHydrationWarning>{t('cancel')}</span>
                  </Link>
                </Button>
                <Button type="submit" disabled={isSubmitting || contentLength > MAX_CONTENT_LENGTH} size="lg">
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  <span suppressHydrationWarning>{t('save')}</span>
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

