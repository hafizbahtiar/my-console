"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { BlogPost, BlogPostFormData, BlogTag } from "../../types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TipTap } from "@/components/ui/tiptap";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Loader2,
  Save,
  AlertCircle,
  Sparkles,
  Wand2,
  ChevronDown,
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

// Utility functions
const calculateReadTime = (content: string): string => {
  if (!content) return '1 min read';

  // Strip HTML tags and count words
  const text = content.replace(/<[^>]*>/g, '').trim();
  const words = text.split(/\s+/).filter(word => word.length > 0).length;

  // Average reading speed: 200 words per minute
  const minutes = Math.max(1, Math.ceil(words / 200));

  if (minutes === 1) return '1 min read';
  return `${minutes} min read`;
};

const countWords = (content: string): number => {
  if (!content) return 0;
  // Strip HTML tags and count words consistently
  const text = content.replace(/<[^>]*>/g, '').trim();
  return text.split(/\s+/).filter(word => word.length > 0).length;
};

const isValidUrl = (url: string): boolean => {
  if (!url || url.trim() === '') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};


export default function EditBlogPostPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
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

  // AI Excerpt Generation
  const generateExcerptWithAI = async () => {
    // Validate that both title and content are provided
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Both title and content are required for AI generation');
      return;
    }

    // Check if title has more than 1 word
    const titleWords = formData.title.trim().split(/\s+/).length;
    if (titleWords <= 1) {
      toast.error('Title must have more than 1 word for AI generation');
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

      toast.success('Excerpt generated successfully!');

    } catch (error) {
      console.error('AI generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate excerpt. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsGeneratingExcerpt(false);
    }
  };

  // AI Content Improvement
  const improveContentWithAI = async (action: 'improve' | 'rephrase' | 'shorten' | 'expand' | 'grammar') => {
    // Validate that content is provided
    if (!formData.content.trim()) {
      toast.error('Content is required for AI improvement');
      return;
    }

    // Check content length
    const plainTextContent = formData.content.replace(/<[^>]*>/g, '').trim();
    if (plainTextContent.length < 10) {
      toast.error('Content must be at least 10 characters long for AI improvement');
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

      const messageKeys = {
        improve: 'ai.messages.improved',
        rephrase: 'ai.messages.rephrased',
        shorten: 'ai.messages.shortened',
        expand: 'ai.messages.expanded',
        grammar: 'ai.messages.corrected'
      };

      toast.success(t(messageKeys[action]));

    } catch (error) {
      console.error('AI improvement error:', error);
      const errorMessage = error instanceof Error ? error.message : t('ai.messages.error');
      toast.error(errorMessage);
    } finally {
      setIsImprovingContent(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      if (!user || !postId) {
        router.push('/auth/dashboard');
        return;
      }

      try {
        await Promise.all([loadPost(), loadCategories(), loadTags()]);
      } catch (error) {
        console.error('Failed to load data:', error);
        setError('Failed to load blog post data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, postId, router]);

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


  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
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
      toast.error('Failed to create tag');
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
      toast.error(t('item_is_required', { item: 'Title' }));
      return;
    }
    if (!formData.slug.trim()) {
      toast.error(t('item_is_required', { item: 'Slug' }));
      return;
    }
    if (!formData.excerpt.trim()) {
      toast.error(t('item_is_required', { item: 'Excerpt' }));
      return;
    }
    if (!formData.content.trim()) {
      toast.error(t('item_is_required', { item: 'Content' }));
      return;
    }
    if (!formData.author.trim()) {
      toast.error(t('item_is_required', { item: 'Author' }));
      return;
    }
    if (!formData.blogCategories) {
      toast.error(t('item_is_required', { item: 'Category' }));
      return;
    }
    if (!formData.status.trim()) {
      toast.error(t('item_is_required', { item: 'Status' }));
      return;
    }

    // Validate featured image URL if provided
    if (formData.featuredImage && formData.featuredImage.trim() !== '') {
      if (!isValidUrl(formData.featuredImage)) {
        toast.error('Featured image must be a valid URL (e.g., https://example.com/image.jpg)');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const updatedPost = {
        ...formData,
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

      toast.success(t('general_use.success'));
      router.push(`/auth/blog/blog-posts/${postId}`);
    } catch (error) {
      console.error('Failed to update blog post:', error);
      toast.error(t('general_use.error'));
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <CardTitle className="text-destructive">{t("general_use.error")}</CardTitle>
            <CardDescription>
              {error || t("blog.view.post_not_found")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/auth/blog/blog-posts">{t("blog.posts.back_to_posts")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb Navigation */}
      <div className="sticky top-16 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-3">
          <nav className="flex items-center space-x-2 text-sm">
            <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground" asChild>
              <Link href="/auth/blog/blog-posts">
                <ArrowLeft className="h-3 w-3 mr-1" />
                {t("blog.posts.title")}
              </Link>
            </Button>
            <span className="text-muted-foreground">/</span>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground" asChild>
              <Link href={`/auth/blog/blog-posts/${postId}`}>
                {post ? post.title : t("general_use.unknown", { item: "Post" })}
              </Link>
            </Button>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground font-medium">{t("general_use.edit")}</span>
          </nav>
        </div>
      </div>

      {/* Header */}
      <div className="sticky top-28 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{t("blog.edit.title")}</h1>
              <p className="text-sm text-muted-foreground">
                {t("blog.edit.subtitle")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className={`w-2 h-2 rounded-full ${formData.status === 'published' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                {formData.status === 'published' ? t("blog.posts.published") : t("blog.posts.draft")}
              </div>
              {post && (
                <div className="text-sm text-muted-foreground">
                  {t("general_use.updated")}: {new Date(post.$updatedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="sticky top-48 z-20 border-b bg-background/95">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${formData.title ? 'bg-green-500' : 'bg-muted-foreground'}`}></div>
              <span className={formData.title ? 'text-foreground' : 'text-muted-foreground'}>{t("general_use.title")}</span>
            </div>
            <div className="w-4 h-px bg-border"></div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${formData.content ? 'bg-green-500' : 'bg-muted-foreground'}`}></div>
              <span className={formData.content ? 'text-foreground' : 'text-muted-foreground'}>{t("blog.edit.content_required")}</span>
            </div>
            <div className="w-4 h-px bg-border"></div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${formData.blogCategories ? 'bg-green-500' : 'bg-muted-foreground'}`}></div>
              <span className={formData.blogCategories ? 'text-foreground' : 'text-muted-foreground'}>{t("general_use.category")}</span>
            </div>
            <div className="w-4 h-px bg-border"></div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${formData.status ? 'bg-green-500' : 'bg-muted-foreground'}`}></div>
              <span className={formData.status ? 'text-foreground' : 'text-muted-foreground'}>{t("general_use.status")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid gap-8 xl:grid-cols-12">
            {/* Main Content Column */}
            <div className="xl:col-span-8 space-y-8">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("blog.edit.basic_info")}</CardTitle>
                  <CardDescription>
                    {t("blog.edit.basic_info_desc")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">{t("blog.edit.title_required")}</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Enter post title"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">{t("blog.edit.slug_required")}</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="post-slug"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="excerpt">{t("blog.edit.excerpt_required")}</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generateExcerptWithAI}
                        disabled={isGeneratingExcerpt || !formData.title.trim() || !formData.content.trim() || formData.title.trim().split(/\s+/).length <= 1}
                        className="flex items-center gap-2"
                      >
                        {isGeneratingExcerpt ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                        {isGeneratingExcerpt ? t('ai.generating') : t('ai.generate_with_ai')}
                      </Button>
                    </div>
                    <Textarea
                      id="excerpt"
                      value={formData.excerpt}
                      onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                      placeholder={t("blog.edit.excerpt_placeholder")}
                      rows={3}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("blog.edit.excerpt_ai_help")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="content">{t("blog.edit.content_required")}</Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isImprovingContent || !formData.content.trim() || formData.content.replace(/<[^>]*>/g, '').trim().length < 10}
                            className="flex items-center gap-2"
                          >
                            {isImprovingContent ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Wand2 className="h-4 w-4" />
                            )}
                            {isImprovingContent ? t('ai.improving') : t('ai.improve_content')}
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => improveContentWithAI('improve')}>
                            {t('ai.actions.improve')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => improveContentWithAI('rephrase')}>
                            {t('ai.actions.rephrase')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => improveContentWithAI('grammar')}>
                            {t('ai.actions.grammar')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => improveContentWithAI('shorten')}>
                            {t('ai.actions.shorten')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => improveContentWithAI('expand')}>
                            {t('ai.actions.expand')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <TipTap
                      value={formData.content}
                      stickyTop="top-59"
                      onChange={(value) => {
                        const readTime = calculateReadTime(value);
                        setFormData(prev => ({
                          ...prev,
                          content: value,
                          readTime: readTime
                        }));
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('ai.improve_help')}
                      <br />
                      <strong>{t('general_use.note')}:</strong> {t('ai.improve_note')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="xl:col-span-4 space-y-6">
              {/* Publishing Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("blog.edit.publishing")}</CardTitle>
                  <CardDescription>
                    {t("blog.edit.publishing_desc")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="status">{t("blog.edit.status_required")}</Label>
                    <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">{t("blog.posts.draft")}</SelectItem>
                        <SelectItem value="published">{t("blog.posts.published")}</SelectItem>
                        <SelectItem value="archived">{t("blog.posts.archived")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="featured"
                      checked={formData.isFeatured}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked as boolean }))}
                    />
                    <Label htmlFor="featured">{t("blog.edit.featured_post")}</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="comments"
                      checked={formData.allowComments}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowComments: checked as boolean }))}
                    />
                    <Label htmlFor="comments">{t("blog.edit.allow_comments")}</Label>
                  </div>
                </CardContent>
              </Card>

              {/* Author & Category */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("blog.edit.details")}</CardTitle>
                  <CardDescription>
                    {t("blog.edit.details_desc")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="author">{t("blog.edit.author_required")}</Label>
                    <Input
                      id="author"
                      value={formData.author}
                      onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                      placeholder="Author name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="readTime">{t("blog.view.read_time")}</Label>
                    <div className="relative">
                      <Input
                        id="readTime"
                        value={formData.readTime}
                        readOnly
                        className="w-full bg-muted/50 cursor-not-allowed pr-20"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        {t("blog.edit.auto_calculated")}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("blog.edit.read_time_help")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">{t("blog.edit.category_required")}</Label>
                    <Select
                      value={formData.blogCategories?.$id || ''}
                      onValueChange={(value) => {
                        const selectedCategory = categories.find(cat => cat.$id === value);
                        setFormData(prev => ({ ...prev, blogCategories: selectedCategory || null }));
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("general_use.category")} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.$id} value={category.$id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="featuredImage">{t("blog.edit.featured_image_url")}</Label>
                    <Input
                      id="featuredImage"
                      value={formData.featuredImage}
                      onChange={(e) => setFormData(prev => ({ ...prev, featuredImage: e.target.value }))}
                      placeholder={t("blog.edit.featured_image_placeholder")}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("blog.edit.featured_image_help")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="featuredImageAlt">{t("blog.edit.featured_image_alt")}</Label>
                    <Input
                      id="featuredImageAlt"
                      value={formData.featuredImageAlt}
                      onChange={(e) => setFormData(prev => ({ ...prev, featuredImageAlt: e.target.value }))}
                      placeholder={t("blog.edit.featured_image_alt_placeholder")}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("blog.view.tags")}</CardTitle>
                  <CardDescription>
                    {t("blog.edit.tags_desc")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>{t("blog.edit.add_tags")}</Label>
                      <div className="relative">
                        <Input
                          placeholder={t("blog.edit.tags_placeholder")}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const value = (e.target as HTMLInputElement).value.trim();
                              if (value) {
                                await addTag(value);
                                (e.target as HTMLInputElement).value = '';
                              }
                            }
                          }}
                        />
                        {/* Tag suggestions */}
                        {availableTags.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg max-h-40 overflow-y-auto z-10">
                            {availableTags
                              .filter(tag =>
                                !formData.blogTags.some((selectedTag: any) => selectedTag.$id === tag.$id) &&
                                tag.isActive
                              )
                              .slice(0, 5)
                              .map((tag) => (
                                <button
                                  key={tag.$id}
                                  type="button"
                                  onClick={() => addTag(tag.name)}
                                  className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm"
                                >
                                  {tag.name}
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Press Enter to add a tag. If it doesn't exist, a new tag will be created.
                      </p>
                    </div>

                    {/* Display current tags */}
                    {formData.blogTags.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">{t("blog.edit.current_tags")}</Label>
                        <div className="flex flex-wrap gap-2">
                          {formData.blogTags.map((tag: any) => (
                            <div
                              key={tag.$id}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-sm rounded-md border"
                            >
                              <span>{tag.name}</span>
                              <button
                                type="button"
                                onClick={() => removeTag(tag.$id)}
                                className="text-primary hover:text-primary/70 ml-1"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* SEO Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("blog.edit.seo_settings")}</CardTitle>
                  <CardDescription>
                    {t("blog.edit.seo_settings_desc")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="seoTitle">{t("blog.edit.seo_title")}</Label>
                    <Input
                      id="seoTitle"
                      value={formData.seoTitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                      placeholder={t("blog.edit.seo_title_placeholder")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seoDescription">{t("blog.edit.seo_description")}</Label>
                    <Textarea
                      id="seoDescription"
                      value={formData.seoDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                      placeholder={t("blog.edit.seo_description_placeholder")}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>{t("blog.edit.add_seo_keywords")}</Label>
                      <Input
                        placeholder={t("blog.edit.seo_keywords_placeholder")}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const value = (e.target as HTMLInputElement).value.trim();
                            if (value && !formData.seoKeywords.includes(value)) {
                              setFormData(prev => ({ ...prev, seoKeywords: [...prev.seoKeywords, value] }));
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}
                      />
                    </div>

                    {/* Display current SEO keywords */}
                    {formData.seoKeywords.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">{t("blog.edit.current_keywords")}</Label>
                        <div className="flex flex-wrap gap-2">
                          {formData.seoKeywords.map((keyword, index) => (
                            <div
                              key={index}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-secondary/50 text-secondary-foreground text-sm rounded-md border"
                            >
                              <span>{keyword}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    seoKeywords: prev.seoKeywords.filter((_, i) => i !== index)
                                  }));
                                }}
                                className="text-secondary-foreground hover:text-secondary-foreground/70 ml-1"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Submit Actions - Fixed at bottom */}
          <div className="sticky z-40 bottom-0 -mb-8 px-6 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-x">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {formData.content && (
                  <span>
                    {t("blog.edit.words_count", { count: countWords(formData.content).toString() })}
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" type="button" size="lg" asChild>
                  <Link href={`/auth/blog/blog-posts/${postId}`}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t("general_use.cancel")}
                  </Link>
                </Button>
                <Button type="submit" disabled={isSubmitting} size="lg">
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  {t("blog.edit.update_post")}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
