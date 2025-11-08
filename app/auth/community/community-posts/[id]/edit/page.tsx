"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { CommunityPost, CommunityPostFormData } from "../../types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TipTap } from "@/components/ui/tiptap";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/custom/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft,
  Loader2,
  Save,
  MessageSquare,
  Hash,
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

const MAX_CONTENT_LENGTH = 5000;
const MAX_TAG_LENGTH = 20;

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 200);
};

export default function EditCommunityPostPage() {
  const { user } = useAuth();
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
      if (!user || !postId) {
        router.push('/auth/dashboard');
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
          setError('You do not have permission to edit this post');
        } else {
          setError("Error");
        }
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
      toast.error("Failed to load topics");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!formData.slug.trim()) {
      toast.error("Slug is required");
      return;
    }
    if (!formData.content.trim()) {
      toast.error("Content is required");
      return;
    }
    if (formData.content.length > MAX_CONTENT_LENGTH) {
      toast.error(`Content must be less than ${MAX_CONTENT_LENGTH} characters`);
      return;
    }
    if (!formData.authorId) {
      toast.error("Author ID is required");
      return;
    }

    // Validate tags
    const invalidTags = formData.tags.filter(tag => tag.length > MAX_TAG_LENGTH);
    if (invalidTags.length > 0) {
      toast.error(`Tags must be less than ${MAX_TAG_LENGTH} characters each`);
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

      toast.success("Post updated successfully");
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
        toast.error("You do not have permission to edit this post");
      } else {
        toast.error("Error");
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
      toast.error(`Tags must be less than ${MAX_TAG_LENGTH} characters each`);
      return;
    }

    if (formData.tags.includes(trimmedTag)) {
      toast.error("Tag already exists");
      return;
    }

    if (formData.tags.length >= 10) {
      toast.error("Maximum 10 tags allowed");
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

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>
              {error || "Post not found"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/auth/community/community-posts">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Posts
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
      <div className="sticky top-16 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-3">
          <nav className="flex items-center space-x-2 text-sm">
            <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground" asChild>
              <Link href="/auth/community/community-posts">
                <ArrowLeft className="h-3 w-3 mr-1" />
                Community Posts
              </Link>
            </Button>
            <span className="text-muted-foreground">/</span>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground" asChild>
              <Link href={`/auth/community/community-posts/${postId}`}>
                {post ? post.title : "Post"}
              </Link>
            </Button>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground font-medium">Edit</span>
          </nav>
        </div>
      </div>

      {/* Header */}
      <div className="sticky top-28 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Edit Community Post</h1>
              <p className="text-sm text-muted-foreground">
                Update your community post
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
                <div className="text-sm text-muted-foreground">
                  Updated: {new Date(post.$updatedAt).toLocaleDateString()}
                </div>
              )}
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
                  <CardTitle>Post Information</CardTitle>
                  <CardDescription>
                    Basic information about your post
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
                      maxLength={200}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="url-friendly-slug"
                      required
                      maxLength={200}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Textarea
                      id="excerpt"
                      value={formData.excerpt || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                      placeholder="Brief description of your post"
                      rows={3}
                      maxLength={500}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="content">Content *</Label>
                      <span className={`text-xs ${contentLength > MAX_CONTENT_LENGTH ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {contentLength} / {MAX_CONTENT_LENGTH} characters
                      </span>
                    </div>
                    <TipTap
                      value={formData.content}
                      stickyTop="top-48"
                      onChange={handleContentChange}
                      placeholder="Write your post content here..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum {MAX_CONTENT_LENGTH} characters
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="xl:col-span-4 space-y-6">
              {/* Topic Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Topic
                  </CardTitle>
                  <CardDescription>
                    Select a topic for your post
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="topic">Topic (Optional)</Label>
                    <Select
                      value={formData.communityTopics?.$id || ''}
                      onValueChange={(value) => {
                        const selectedTopic = topics.find(topic => topic.$id === value);
                        setFormData(prev => ({ ...prev, communityTopics: selectedTopic || null }));
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a topic" />
                      </SelectTrigger>
                      <SelectContent>
                        {topics.map((topic) => (
                          <SelectItem key={topic.$id} value={topic.$id}>
                            {topic.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {topics.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        No topics available
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Tags
                  </CardTitle>
                  <CardDescription>
                    Add tags (max {MAX_TAG_LENGTH} characters each)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Add Tags</Label>
                      <Input
                        placeholder={`Enter tag (max ${MAX_TAG_LENGTH} chars) and press Enter`}
                        maxLength={MAX_TAG_LENGTH}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const value = (e.target as HTMLInputElement).value.trim();
                            if (value) {
                              addTag(value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        Press Enter to add a tag. Maximum 10 tags allowed.
                      </p>
                    </div>

                    {/* Display current tags */}
                    {formData.tags.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Current Tags</Label>
                        <div className="flex flex-wrap gap-2">
                          {formData.tags.map((tag, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(index)}
                                className="ml-1 hover:text-destructive"
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

              {/* Post Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Post Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isPinned"
                        checked={formData.isPinned}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPinned: checked as boolean }))}
                      />
                      <Label htmlFor="isPinned" className="cursor-pointer">
                        Pin Post
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isLocked"
                        checked={formData.isLocked}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isLocked: checked as boolean }))}
                      />
                      <Label htmlFor="isLocked" className="cursor-pointer">
                        Lock Post
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isFeatured"
                        checked={formData.isFeatured}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked as boolean }))}
                      />
                      <Label htmlFor="isFeatured" className="cursor-pointer">
                        Feature Post
                      </Label>
                    </div>
                  </div>

                  {formData.author && (
                    <div className="space-y-2">
                      <Label>Author</Label>
                      <Input
                        value={formData.author}
                        onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                        placeholder="Author name"
                        maxLength={100}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="sticky z-40 bottom-0 -mb-8 px-6 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-x">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {contentLength > 0 && (
                  <span>
                    {contentLength} / {MAX_CONTENT_LENGTH} characters
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" type="button" size="lg" asChild>
                  <Link href={`/auth/community/community-posts/${postId}`}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Cancel
                  </Link>
                </Button>
                <Button type="submit" disabled={isSubmitting || contentLength > MAX_CONTENT_LENGTH} size="lg">
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

