"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BlogPostFormData, BlogTag } from "../types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TipTap } from "@/components/ui/tiptap";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  Save,
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

export default function CreateBlogPostPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // State
  const [categories, setCategories] = useState<any[]>([]);
  const [availableTags, setAvailableTags] = useState<BlogTag[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingExcerpt, setIsGeneratingExcerpt] = useState(false);
  const [isImprovingContent, setIsImprovingContent] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isGeneratingSEOSuggestions, setIsGeneratingSEOSuggestions] = useState(false);
  const [seoSuggestions, setSeoSuggestions] = useState<any>(null);
  const [showSEOSuggestions, setShowSEOSuggestions] = useState(false);
  const [tagInputValue, setTagInputValue] = useState('');
  const [isTagInputFocused, setIsTagInputFocused] = useState(false);

  // Memoize content change handler to prevent unnecessary TipTap re-renders
  const handleContentChange = useCallback((value: string) => {
    const readTime = calculateReadTime(value);
    setFormData(prev => ({
      ...prev,
      content: value,
      readTime: readTime
    }));
  }, []); // Empty deps - calculateReadTime is a pure function, setFormData is stable

  // Helper to get CSRF token
  const getCSRFToken = async (): Promise<string> => {
    try {
      const response = await fetch('/api/csrf-token');
      const data = await response.json();
      return data.token || '';
    } catch {
      return '';
    }
  };

  // AI Title Generation
  const generateTitleWithAI = async () => {
    if (!formData.content.trim()) {
      toast.error('Content is required to generate a title');
      return;
    }

    const textContent = formData.content.replace(/<[^>]*>/g, '').trim();
    if (textContent.length < 50) {
      toast.error('Content must be at least 50 characters long');
      return;
    }

    setIsGeneratingTitle(true);
    try {
      const csrfToken = await getCSRFToken();
      const response = await fetch('/api/ai/generate-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
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
      toast.error('Title and content are required');
      return;
    }

    setIsGeneratingSEOSuggestions(true);
    try {
      const csrfToken = await getCSRFToken();
      const response = await fetch('/api/ai/seo-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
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
        toast.success('SEO suggestions generated!');
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
      toast.error('Title and content are required');
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
      toast.error('Content is required');
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

  // Load data on component mount - must be called before conditional returns
  useEffect(() => {
    const loadData = async () => {
      // Wait for auth to finish loading before proceeding
      if (authLoading) {
        return;
      }

      // If auth finished loading and no user, redirect
      if (!user) {
        router.push('/auth/dashboard');
        return;
      }

      // Initialize form with user data
      setFormData(prev => ({
        ...prev,
        author: user.name || user.email || '',
        authorId: user.$id || '',
      }));

      await Promise.all([loadCategories(), loadTags()]);
    };

    loadData();
  }, [user, authLoading, router]);

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
      toast.error('Title is required');
      return;
    }
    if (!formData.slug.trim()) {
      toast.error('Slug is required');
      return;
    }
    if (!formData.excerpt.trim()) {
      toast.error('Excerpt is required');
      return;
    }
    if (!formData.content.trim()) {
      toast.error('Content is required');
      return;
    }
    if (!formData.author.trim()) {
      toast.error('Author is required');
      return;
    }
    if (!formData.blogCategories) {
      toast.error('Category is required');
      return;
    }
    if (!formData.readTime.trim()) {
      toast.error('Read time is required');
      return;
    }
    if (!formData.status.trim()) {
      toast.error('Status is required');
      return;
    }

    // Validate featured image URL if provided
    if (formData.featuredImage && formData.featuredImage.trim() !== '') {
      if (!isValidUrl(formData.featuredImage)) {
        toast.error('Invalid image URL');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Sanitize HTML content before saving
      const { sanitizeHTMLForStorage } = await import('@/lib/html-sanitizer');

      const newPost = {
        ...formData,
        content: sanitizeHTMLForStorage(formData.content), // Sanitize HTML content
        publishedAt: formData.status === 'published' ? new Date().toISOString() : null,
        featuredImage: formData.featuredImage && formData.featuredImage.trim() !== '' ? formData.featuredImage.trim() : null,
        featuredImageAlt: formData.featuredImageAlt && formData.featuredImageAlt.trim() !== '' ? formData.featuredImageAlt.trim() : null,
        // Convert tag relationships to the format expected by Appwrite
        blogTags: formData.blogTags.map((tag: any) => tag.$id),
      };

      await tablesDB.createRow({
        databaseId: DATABASE_ID,
        tableId: BLOG_POSTS_COLLECTION_ID,
        rowId: `post_${Date.now()}`,
        data: newPost,
      });

      // Note: Category post counts are calculated dynamically from relationships
      // No manual updates needed

      // Log audit event
      await auditLogger.log({
        action: 'BLOG_POST_CREATED',
        resource: 'blog_posts',
        resourceId: `post_${Date.now()}`,
        userId: user!.$id,
        metadata: {
          postTitle: newPost.title,
          postSlug: newPost.slug,
          description: `Created blog post: ${newPost.title}`
        }
      });

      toast.success("Post created successfully");
      router.push('/auth/blog/blog-posts');
    } catch (error) {
      console.error('Failed to create blog post:', error);
      toast.error("Error");
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

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-16 w-16 sm:h-32 sm:w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-6 pt-6">
      {/* Breadcrumb Navigation */}
      <div className="sticky top-16 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 sm:px-6 py-2 sm:py-3">
          <nav className="flex items-center space-x-2 text-xs sm:text-sm">
            <Button variant="ghost" size="sm" className="h-7 sm:h-8 px-2 text-muted-foreground hover:text-foreground shrink-0" asChild>
              <Link href="/auth/blog/blog-posts">
                <ArrowLeft className="h-3 w-3 mr-1 shrink-0" />
                <span className="truncate">Blog Posts</span>
              </Link>
            </Button>
            <span className="text-muted-foreground shrink-0">/</span>
            <span className="text-foreground font-medium truncate">Create</span>
          </nav>
        </div>
      </div>

      {/* Header */}
      <div className="sticky top-[80px] sm:top-28 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Create Blog Post</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Create a new blog post with AI-powered assistance
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full shrink-0"></div>
                <span className="truncate">Auto-save enabled</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="sticky top-[155px] sm:top-48 z-20 border-b bg-background/95">
        <div className="px-4 sm:px-6 py-2 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm overflow-x-auto">
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <div className={`w-2 h-2 rounded-full shrink-0 ${formData.title ? 'bg-green-500' : 'bg-muted-foreground'}`}></div>
              <span className={formData.title ? 'text-foreground' : 'text-muted-foreground'}>Title</span>
            </div>
            <div className="w-2 sm:w-4 h-px bg-border shrink-0"></div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <div className={`w-2 h-2 rounded-full shrink-0 ${formData.content ? 'bg-green-500' : 'bg-muted-foreground'}`}></div>
              <span className={formData.content ? 'text-foreground' : 'text-muted-foreground'}>Content</span>
            </div>
            <div className="w-2 sm:w-4 h-px bg-border shrink-0"></div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <div className={`w-2 h-2 rounded-full shrink-0 ${formData.blogCategories ? 'bg-green-500' : 'bg-muted-foreground'}`}></div>
              <span className={formData.blogCategories ? 'text-foreground' : 'text-muted-foreground'}>Category</span>
            </div>
            <div className="w-2 sm:w-4 h-px bg-border shrink-0"></div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <div className={`w-2 h-2 rounded-full shrink-0 ${formData.status ? 'bg-green-500' : 'bg-muted-foreground'}`}></div>
              <span className={formData.status ? 'text-foreground' : 'text-muted-foreground'}>Status</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 py-4 sm:py-8">
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          <div className="grid gap-6 sm:gap-8 xl:grid-cols-12">
            {/* Main Content Column */}
            <div className="xl:col-span-8 space-y-6 sm:space-y-8">
              {/* Basic Information */}
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">Basic Information</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Essential information about your blog post
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <Label htmlFor="title" className="text-xs sm:text-sm">Title *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generateTitleWithAI}
                        disabled={isGeneratingTitle || !formData.content.trim() || formData.content.replace(/<[^>]*>/g, '').trim().length < 50}
                        className="flex items-center gap-2 w-full sm:w-auto shrink-0"
                      >
                        {isGeneratingTitle ? (
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin shrink-0" />
                        ) : (
                          <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                        )}
                        <span className="truncate text-xs sm:text-sm">{isGeneratingTitle ? 'Generating...' : 'Generate Title'}</span>
                      </Button>
                    </div>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Enter post title"
                      className="w-full"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug" className="text-xs sm:text-sm">Slug *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="url-friendly-slug"
                      className="w-full"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <Label htmlFor="excerpt" className="text-xs sm:text-sm">Excerpt *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generateExcerptWithAI}
                        disabled={isGeneratingExcerpt || !formData.title.trim() || !formData.content.trim() || formData.title.trim().split(/\s+/).length <= 1}
                        className="flex items-center gap-2 w-full sm:w-auto shrink-0"
                      >
                        {isGeneratingExcerpt ? (
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin shrink-0" />
                        ) : (
                          <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                        )}
                        <span className="truncate text-xs sm:text-sm">{isGeneratingExcerpt ? 'Generating...' : 'Generate with AI'}</span>
                      </Button>
                    </div>
                    <Textarea
                      id="excerpt"
                      value={formData.excerpt}
                      onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                      placeholder="Brief description of your post"
                      rows={3}
                      className="w-full"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      A brief summary of your post. Use AI to generate automatically.
                      <br />
                      <strong>Note:</strong> AI-generated excerpts are suggestions and should be reviewed.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <Label htmlFor="content" className="text-xs sm:text-sm">Content *</Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isImprovingContent || !formData.content.trim() || formData.content.replace(/<[^>]*>/g, '').trim().length < 10}
                            className="flex items-center gap-2 w-full sm:w-auto shrink-0"
                          >
                            {isImprovingContent ? (
                              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin shrink-0" />
                            ) : (
                              <Wand2 className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                            )}
                            <span className="truncate text-xs sm:text-sm">{isImprovingContent ? 'Improving...' : 'Improve Content'}</span>
                            <ChevronDown className="h-3 w-3 shrink-0" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 sm:w-56">
                          <DropdownMenuItem onClick={() => improveContentWithAI('improve')} className="text-xs sm:text-sm">
                            Improve
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => improveContentWithAI('rephrase')} className="text-xs sm:text-sm">
                            Rephrase
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => improveContentWithAI('grammar')} className="text-xs sm:text-sm">
                            Fix Grammar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => improveContentWithAI('shorten')} className="text-xs sm:text-sm">
                            Shorten
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => improveContentWithAI('expand')} className="text-xs sm:text-sm">
                            Expand
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <TipTap
                      value={formData.content}
                      stickyTop="top-59"
                      onChange={handleContentChange}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use AI to improve, rephrase, fix grammar, shorten, or expand your content.
                      <br />
                      <strong>Note:</strong> AI improvements are suggestions and should be reviewed.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="xl:col-span-4 space-y-4 sm:space-y-6">
              {/* Publishing Settings */}
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">Publishing</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Control when and how your post is published
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-xs sm:text-sm">Status *</Label>
                    <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="featured"
                      checked={formData.isFeatured}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked as boolean }))}
                    />
                    <Label htmlFor="featured" className="text-xs sm:text-sm font-normal cursor-pointer">Featured Post</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="comments"
                      checked={formData.allowComments}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowComments: checked as boolean }))}
                    />
                    <Label htmlFor="comments" className="text-xs sm:text-sm font-normal cursor-pointer">Allow Comments</Label>
                  </div>
                </CardContent>
              </Card>

              {/* Author & Category */}
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">Details</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Additional information about your post
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                  <div className="space-y-2">
                    <Label htmlFor="author" className="text-xs sm:text-sm">Author *</Label>
                    <Input
                      id="author"
                      value={formData.author}
                      onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                      placeholder="Author name"
                      className="w-full"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="readTime" className="text-xs sm:text-sm">Read Time</Label>
                    <div className="relative">
                      <Input
                        id="readTime"
                        value={formData.readTime}
                        readOnly
                        className="w-full bg-muted/50 cursor-not-allowed pr-16 sm:pr-20 text-xs sm:text-sm"
                      />
                      <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shrink-0"></div>
                        <span className="hidden sm:inline">Auto-calculated</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Automatically calculated based on content length
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-xs sm:text-sm">Category *</Label>
                    <Select
                      value={formData.blogCategories?.$id || ''}
                      onValueChange={(value) => {
                        const selectedCategory = categories.find(cat => cat.$id === value);
                        setFormData(prev => ({ ...prev, blogCategories: selectedCategory || null }));
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select category" />
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
                    <Label htmlFor="featuredImage" className="text-xs sm:text-sm">Featured Image URL</Label>
                    <Input
                      id="featuredImage"
                      value={formData.featuredImage}
                      onChange={(e) => setFormData(prev => ({ ...prev, featuredImage: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      URL to the featured image for this post
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="featuredImageAlt" className="text-xs sm:text-sm">Featured Image Alt Text</Label>
                    <Input
                      id="featuredImageAlt"
                      value={formData.featuredImageAlt}
                      onChange={(e) => setFormData(prev => ({ ...prev, featuredImageAlt: e.target.value }))}
                      placeholder="Description of the image"
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">Tags</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Add tags to categorize your post
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm">Add Tags</Label>
                      <div className="relative">
                        <Input
                          placeholder="Type and press Enter"
                          className="w-full"
                          value={tagInputValue}
                          onChange={(e) => setTagInputValue(e.target.value)}
                          onFocus={() => setIsTagInputFocused(true)}
                          onBlur={() => {
                            // Delay to allow click on suggestion
                            setTimeout(() => setIsTagInputFocused(false), 200);
                          }}
                          onKeyDown={async (e) => {
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
                        />
                        {/* Tag suggestions - show when focused */}
                        {isTagInputFocused && availableTags.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg max-h-40 overflow-y-auto z-10">
                            {availableTags
                              .filter(tag => {
                                const isNotSelected = !formData.blogTags.some((selectedTag: any) => selectedTag.$id === tag.$id);
                                const isActive = tag.isActive;
                                const matchesInput = !tagInputValue.trim() || tag.name.toLowerCase().includes(tagInputValue.toLowerCase());
                                return isNotSelected && isActive && matchesInput;
                              })
                              .slice(0, 10)
                              .map((tag) => (
                                <button
                                  key={tag.$id}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault(); // Prevent input blur
                                    addTag(tag.name);
                                    setTagInputValue('');
                                    setIsTagInputFocused(false);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-xs sm:text-sm"
                                >
                                  {tag.name}
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Type a tag name and press Enter to add it
                      </p>
                    </div>

                    {/* Display current tags */}
                    {formData.blogTags.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs sm:text-sm text-muted-foreground">Current Tags</Label>
                        <div className="flex flex-wrap gap-2">
                          {formData.blogTags.map((tag: any) => (
                            <Badge
                              key={tag.$id}
                              variant="secondary"
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs sm:text-sm"
                            >
                              <span>{tag.name}</span>
                              <button
                                type="button"
                                onClick={() => removeTag(tag.$id)}
                                className="ml-1 hover:opacity-70"
                                aria-label="Remove tag"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* SEO Settings */}
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg sm:text-xl">SEO Settings</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Optimize your post for search engines
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateSEOSuggestions}
                      disabled={isGeneratingSEOSuggestions || !formData.title.trim() || !formData.content.trim()}
                      className="flex items-center gap-2 w-full sm:w-auto shrink-0"
                    >
                      {isGeneratingSEOSuggestions ? (
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin shrink-0" />
                      ) : (
                        <Wand2 className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      )}
                      <span className="truncate text-xs sm:text-sm">{isGeneratingSEOSuggestions ? 'Generating...' : 'Get SEO Suggestions'}</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                  {/* SEO Suggestions Display */}
                  {showSEOSuggestions && seoSuggestions && (
                    <Card className="border-primary/50 bg-primary/5">
                      <CardHeader className="p-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base sm:text-lg">SEO Suggestions</CardTitle>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSEOSuggestions(false)}
                            className="h-6 w-6 p-0"
                          >
                            ×
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className={`text-2xl font-bold ${seoSuggestions.overall?.score >= 80 ? 'text-green-600' : seoSuggestions.overall?.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {seoSuggestions.overall?.score || 0}
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            Overall SEO Score
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 space-y-4">
                        {/* Title Suggestions */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs sm:text-sm font-medium">Title</Label>
                            <Badge variant={seoSuggestions.title?.score >= 80 ? 'default' : seoSuggestions.title?.score >= 60 ? 'secondary' : 'destructive'}>
                              {seoSuggestions.title?.score || 0}/100
                            </Badge>
                          </div>
                          {seoSuggestions.title?.suggested && (
                            <div className="space-y-2">
                              <Input
                                value={seoSuggestions.title.suggested}
                                readOnly
                                className="text-xs sm:text-sm"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, seoTitle: seoSuggestions.title.suggested }));
                                  toast.success('Suggestion applied');
                                }}
                                className="w-full text-xs"
                              >
                                Apply Suggestion
                              </Button>
                            </div>
                          )}
                          {seoSuggestions.title?.feedback && seoSuggestions.title.feedback.length > 0 && (
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {seoSuggestions.title.feedback.map((fb: string, idx: number) => (
                                <li key={idx}>• {fb}</li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {/* Description Suggestions */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs sm:text-sm font-medium">Meta Description</Label>
                            <Badge variant={seoSuggestions.description?.score >= 80 ? 'default' : seoSuggestions.description?.score >= 60 ? 'secondary' : 'destructive'}>
                              {seoSuggestions.description?.score || 0}/100
                            </Badge>
                          </div>
                          {seoSuggestions.description?.suggested && (
                            <div className="space-y-2">
                              <Textarea
                                value={seoSuggestions.description.suggested}
                                readOnly
                                rows={3}
                                className="text-xs sm:text-sm"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, seoDescription: seoSuggestions.description.suggested }));
                                  toast.success('Suggestion applied');
                                }}
                                className="w-full text-xs"
                              >
                                Apply Suggestion
                              </Button>
                            </div>
                          )}
                          {seoSuggestions.description?.feedback && seoSuggestions.description.feedback.length > 0 && (
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {seoSuggestions.description.feedback.map((fb: string, idx: number) => (
                                <li key={idx}>• {fb}</li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {/* Keywords Suggestions */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs sm:text-sm font-medium">Keywords</Label>
                            <Badge variant={seoSuggestions.keywords?.score >= 80 ? 'default' : seoSuggestions.keywords?.score >= 60 ? 'secondary' : 'destructive'}>
                              {seoSuggestions.keywords?.score || 0}/100
                            </Badge>
                          </div>
                          {seoSuggestions.keywords?.suggested && seoSuggestions.keywords.suggested.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-2">
                                {seoSuggestions.keywords.suggested.map((keyword: string, idx: number) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                                    onClick={() => {
                                      if (!formData.seoKeywords.includes(keyword)) {
                                        setFormData(prev => ({ ...prev, seoKeywords: [...prev.seoKeywords, keyword] }));
                                        toast.success('Keyword added');
                                      }
                                    }}
                                  >
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {seoSuggestions.keywords?.feedback && seoSuggestions.keywords.feedback.length > 0 && (
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {seoSuggestions.keywords.feedback.map((fb: string, idx: number) => (
                                <li key={idx}>• {fb}</li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {/* Overall Feedback */}
                        {seoSuggestions.overall?.feedback && seoSuggestions.overall.feedback.length > 0 && (
                          <div className="space-y-2 pt-2 border-t">
                            <Label className="text-xs sm:text-sm font-medium">Overall Feedback</Label>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {seoSuggestions.overall.feedback.map((fb: string, idx: number) => (
                                <li key={idx}>• {fb}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="seoTitle" className="text-xs sm:text-sm">SEO Title</Label>
                    <Input
                      id="seoTitle"
                      value={formData.seoTitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                      placeholder="SEO optimized title"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seoDescription" className="text-xs sm:text-sm">SEO Description</Label>
                    <Textarea
                      id="seoDescription"
                      value={formData.seoDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                      placeholder="Meta description for search engines"
                      rows={2}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm">Add SEO Keywords</Label>
                      <Input
                        placeholder="Type keyword and press Enter"
                        className="w-full"
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
                        <Label className="text-xs sm:text-sm text-muted-foreground">Current Keywords</Label>
                        <div className="flex flex-wrap gap-2">
                          {formData.seoKeywords.map((keyword, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs sm:text-sm"
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
                                className="ml-1 hover:opacity-70"
                                aria-label="Remove keyword"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </Badge>
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
          <div className="sticky z-40 bottom-0 -mb-8 px-4 sm:px-6 py-3 sm:py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-x">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <div className="text-xs sm:text-sm text-muted-foreground">
                {formData.content && (
                  <span>
                    {countWords(formData.content)} words
                  </span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <Button variant="outline" type="button" size="lg" asChild className="w-full sm:w-auto">
                  <Link href="/auth/blog/blog-posts">
                    <ArrowLeft className="h-4 w-4 mr-2 shrink-0" />
                    <span className="truncate">Cancel</span>
                  </Link>
                </Button>
                <Button type="submit" disabled={isSubmitting} size="lg" className="w-full sm:w-auto">
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" />}
                  <Save className="h-4 w-4 mr-2 shrink-0" />
                  <span className="truncate">Create Post</span>
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
