"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TipTap } from "@/components/ui/tiptap";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Loader2,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { tablesDB } from "@/lib/appwrite";
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

// Database configuration
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'console-db';
const BLOG_POSTS_COLLECTION_ID = 'blog_posts';
const BLOG_CATEGORIES_COLLECTION_ID = 'blog_categories';
const BLOG_TAGS_COLLECTION_ID = 'blog_tags';

export default function CreateBlogPostPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  // State
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    author: '',
    authorId: '',
    category: '',
    tags: [] as string[],
    readTime: '',
    featuredImage: '',
    featuredImageAlt: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
    publishedAt: '',
    views: 0,
    likes: 0,
    isFeatured: false,
    seoTitle: '',
    seoDescription: '',
    seoKeywords: [] as string[],
    allowComments: true,
    commentCount: 0,
    relatedPosts: [] as string[],
  });

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
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
  }, [user, router]);

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
      setTags(tagsData.rows || []);
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
    if (!formData.category.trim()) {
      toast.error(t('item_is_required', { item: 'Category' }));
      return;
    }
    if (!formData.readTime.trim()) {
      toast.error(t('item_is_required', { item: 'Read time' }));
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
      const newPost = {
        ...formData,
        publishedAt: formData.status === 'published' ? new Date().toISOString() : null,
        featuredImage: formData.featuredImage && formData.featuredImage.trim() !== '' ? formData.featuredImage.trim() : null,
        featuredImageAlt: formData.featuredImageAlt && formData.featuredImageAlt.trim() !== '' ? formData.featuredImageAlt.trim() : null,
      };

      await tablesDB.createRow({
        databaseId: DATABASE_ID,
        tableId: BLOG_POSTS_COLLECTION_ID,
        rowId: `post_${Date.now()}`,
        data: newPost,
      });

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

      toast.success(t('general_use.success'));
      router.push('/auth/blog/blog-posts');
    } catch (error) {
      console.error('Failed to create blog post:', error);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-16 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/blog/blog-posts">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Blog Posts
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Create Blog Post</h1>
                <p className="text-sm text-muted-foreground">
                  Add a new blog post to your collection.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Auto-save enabled
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${formData.title ? 'bg-green-500' : 'bg-muted-foreground'}`}></div>
              <span className={formData.title ? 'text-foreground' : 'text-muted-foreground'}>Title</span>
            </div>
            <div className="w-4 h-px bg-border"></div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${formData.content ? 'bg-green-500' : 'bg-muted-foreground'}`}></div>
              <span className={formData.content ? 'text-foreground' : 'text-muted-foreground'}>Content</span>
            </div>
            <div className="w-4 h-px bg-border"></div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${formData.category ? 'bg-green-500' : 'bg-muted-foreground'}`}></div>
              <span className={formData.category ? 'text-foreground' : 'text-muted-foreground'}>Category</span>
            </div>
            <div className="w-4 h-px bg-border"></div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${formData.status ? 'bg-green-500' : 'bg-muted-foreground'}`}></div>
              <span className={formData.status ? 'text-foreground' : 'text-muted-foreground'}>Ready</span>
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
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Enter the main details for your blog post.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Enter post title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="post-slug"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt *</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                    placeholder="Brief description of the post"
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content *</Label>
                  <TipTap
                    value={formData.content}
                    stickyTop="top-37"
                    onChange={(value) => {
                      const readTime = calculateReadTime(value);
                      setFormData(prev => ({
                        ...prev,
                        content: value,
                        readTime: readTime
                      }));
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-4 space-y-6">
            {/* Publishing Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Publishing</CardTitle>
                <CardDescription>
                  Configure publishing options.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
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
                  <Label htmlFor="featured">Featured Post</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="comments"
                    checked={formData.allowComments}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowComments: checked as boolean }))}
                  />
                  <Label htmlFor="comments">Allow Comments</Label>
                </div>
              </CardContent>
            </Card>

            {/* Author & Category */}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
                <CardDescription>
                  Set author, category, and other details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="author">Author *</Label>
                  <Input
                    id="author"
                    value={formData.author}
                    onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                    placeholder="Author name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="readTime">Read Time</Label>
                  <div className="relative">
                    <Input
                      id="readTime"
                      value={formData.readTime}
                      readOnly
                      className="w-full bg-muted/50 cursor-not-allowed pr-20"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Auto-calculated
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Read time is automatically calculated based on your content (200 words per minute)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a category" />
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
                  <Label htmlFor="featuredImage">Featured Image URL</Label>
                  <Input
                    id="featuredImage"
                    value={formData.featuredImage}
                    onChange={(e) => setFormData(prev => ({ ...prev, featuredImage: e.target.value }))}
                    placeholder="https://example.com/image.jpg (leave empty if none)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter a complete URL starting with https:// or leave empty
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="featuredImageAlt">Featured Image Alt Text</Label>
                  <Input
                    id="featuredImageAlt"
                    value={formData.featuredImageAlt}
                    onChange={(e) => setFormData(prev => ({ ...prev, featuredImageAlt: e.target.value }))}
                    placeholder="Alt text for accessibility"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
                <CardDescription>
                  Add tags to categorize your post. Type a tag and press Enter to add it.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Add Tags</Label>
                    <Input
                      placeholder="Type a tag and press Enter..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const value = (e.target as HTMLInputElement).value.trim();
                          if (value && !formData.tags.includes(value)) {
                            setFormData(prev => ({ ...prev, tags: [...prev.tags, value] }));
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                  </div>

                  {/* Display current tags */}
                  {formData.tags.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Current Tags:</Label>
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, index) => (
                          <div
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-sm rounded-md border"
                          >
                            <span>{tag}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  tags: prev.tags.filter((_, i) => i !== index)
                                }));
                              }}
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
                <CardTitle>SEO Settings</CardTitle>
                <CardDescription>
                  Optimize your post for search engines.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="seoTitle">SEO Title</Label>
                  <Input
                    id="seoTitle"
                    value={formData.seoTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                    placeholder="SEO title (leave empty to use post title)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seoDescription">SEO Description</Label>
                  <Textarea
                    id="seoDescription"
                    value={formData.seoDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                    placeholder="SEO description for meta tags"
                    rows={2}
                  />
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Add SEO Keywords</Label>
                    <Input
                      placeholder="Type a keyword and press Enter..."
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
                      <Label className="text-sm text-muted-foreground">Current Keywords:</Label>
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
        <div className="sticky bottom-0 -mx-6 -mb-8 px-6 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {formData.content && (
                <span>
                  {countWords(formData.content)} words
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" type="button" asChild>
                <Link href="/auth/blog/blog-posts">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting} size="lg">
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
    </div>
  );
}
