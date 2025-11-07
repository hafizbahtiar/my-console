"use client";

// Admin Blog Post View Page
// Purpose: Admin content review + analytics dashboard
// NOT for audience consumption (separate public page planned)
// View tracking: DISABLED (analytics for content creators only)

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { BlogPost, ViewAnalytics, LikeAnalytics, BlogComment } from "../types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/custom/status-badge";
import {
  ArrowLeft,
  AlertCircle,
  Eye,
  Heart,
  Edit,
  Calendar,
  User,
  Tag,
  TrendingUp,
  BarChart3,
  Globe,
  Clock,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import {
  tablesDB,
  DATABASE_ID,
  BLOG_POSTS_COLLECTION_ID,
  BLOG_CATEGORIES_COLLECTION_ID,
  BLOG_TAGS_COLLECTION_ID,
  BLOG_COMMENTS_COLLECTION_ID,
  BLOG_VIEWS_COLLECTION_ID,
  BLOG_LIKES_COLLECTION_ID
} from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/language-context";



export default function ViewBlogPostPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  // State
  const [post, setPost] = useState<BlogPost | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [threadedComments, setThreadedComments] = useState<BlogComment[]>([]);
  const [viewAnalytics, setViewAnalytics] = useState<ViewAnalytics | null>(null);
  const [likeAnalytics, setLikeAnalytics] = useState<LikeAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'analytics' | 'comments'>('content');

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      if (!user || !postId) {
        router.push('/auth/dashboard');
        return;
      }

      try {
        await Promise.all([
          loadPost(),
          loadCategories(),
          loadTags(),
          loadComments(),
          loadViewAnalytics(),
          loadLikeAnalytics(),
          // Only track views for non-admin users (audience)
          user ? Promise.resolve() : trackView()
        ]);
      } catch (error) {
        console.error('Failed to load data:', error);
        setError('Failed to load blog post data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, postId, router]);

  const updateViewCount = async (currentPost: BlogPost) => {
    try {
      await tablesDB.updateRow({
        databaseId: DATABASE_ID,
        tableId: BLOG_POSTS_COLLECTION_ID,
        rowId: postId,
        data: { views: currentPost.views + 1 }
      });
    } catch (error) {
      console.warn('Failed to update view count:', error);
    }
  };

  const loadPost = async () => {
    try {
      const postData = await tablesDB.getRow({
        databaseId: DATABASE_ID,
        tableId: BLOG_POSTS_COLLECTION_ID,
        rowId: postId,
      });

      const post = postData as unknown as BlogPost;
      setPost(post);

      // Only update view count for non-admin users (audience)
      if (!user) {
        await updateViewCount(post);
      }

      return post;
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
      setTags(tagsData.rows || []);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const loadComments = async () => {
    try {
      // Load all comments for this post using the relationship
      // Note: We'll filter approved and non-spam comments client-side
      // as Appwrite query string format for booleans can be tricky
      const commentsData = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: BLOG_COMMENTS_COLLECTION_ID,
        queries: [
          `equal("blogPosts", "${postId}")`
        ],
      });

      // Filter approved and non-spam comments client-side
      const allComments = (commentsData.rows || [])
        .map((row: any) => row as unknown as BlogComment)
        .filter((comment: BlogComment) =>
          comment.isApproved === true && comment.isSpam === false
        );

      // Sort by creation date (oldest first for chronological order)
      allComments.sort((a, b) =>
        new Date(a.$createdAt).getTime() - new Date(b.$createdAt).getTime()
      );

      setComments(allComments);

      // Build threaded structure
      const threaded = buildThreadedComments(allComments);
      setThreadedComments(threaded);
    } catch (error) {
      console.error('Failed to load comments:', error);
      setComments([]);
      setThreadedComments([]);
    }
  };

  const buildThreadedComments = (allComments: BlogComment[]): BlogComment[] => {
    // Create a map for quick lookup
    const commentMap = new Map<string, BlogComment>();
    const rootComments: BlogComment[] = [];

    // Initialize all comments with empty replies array
    allComments.forEach(comment => {
      commentMap.set(comment.$id, { ...comment, replies: [] });
    });

    // Build the tree structure
    allComments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.$id)!;

      if (comment.parentId) {
        // This is a reply, add it to parent's replies
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          if (!parent.replies) {
            parent.replies = [];
          }
          parent.replies.push(commentWithReplies);
        }
      } else {
        // This is a root comment
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments;
  };

  const loadViewAnalytics = async () => {
    try {
      const viewsData = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: BLOG_VIEWS_COLLECTION_ID,
        queries: [`equal("postId", "${postId}")`],
      });

      // Process view analytics
      const views = viewsData.rows || [];
      const totalViews = views.length;
      const uniqueViews = views.filter((v: any) => v.isUnique).length;

      // Group by referrer
      const referrerMap = new Map<string, number>();
      views.forEach((view: any) => {
        const referrer = view.referrer || 'Direct';
        referrerMap.set(referrer, (referrerMap.get(referrer) || 0) + 1);
      });
      const topReferrers = Array.from(referrerMap.entries())
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Group by country
      const countryMap = new Map<string, number>();
      views.forEach((view: any) => {
        if (view.country) {
          countryMap.set(view.country, (countryMap.get(view.country) || 0) + 1);
        }
      });
      const geographic = Array.from(countryMap.entries())
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count);

      // Recent views
      const recentViews = views
        .sort((a: any, b: any) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime())
        .slice(0, 10)
        .map((view: any) => ({
          timestamp: view.$createdAt,
          userAgent: view.userAgent || 'Unknown'
        }));

      setViewAnalytics({
        totalViews,
        uniqueViews,
        topReferrers,
        geographic,
        recentViews
      });
    } catch (error) {
      console.warn('Failed to load view analytics:', error);
      // Set default analytics
      setViewAnalytics({
        totalViews: 0,
        uniqueViews: 0,
        topReferrers: [],
        geographic: [],
        recentViews: []
      });
    }
  };

  const loadLikeAnalytics = async () => {
    try {
      const likesData = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: BLOG_LIKES_COLLECTION_ID,
        queries: [`equal("postId", "${postId}")`],
      });

      const likes = likesData.rows || [];
      const totalLikes = likes.length;
      const activeLikes = likes.filter((l: any) => l.isActive).length;

      // Group by like type
      const typeMap = new Map<string, number>();
      likes.filter((l: any) => l.isActive).forEach((like: any) => {
        const type = like.likeType || 'like';
        typeMap.set(type, (typeMap.get(type) || 0) + 1);
      });
      const likeTypes = Array.from(typeMap.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

      // Recent likes
      const recentLikes = likes
        .filter((l: any) => l.isActive)
        .sort((a: any, b: any) => new Date(b.updatedAt || b.$createdAt).getTime() - new Date(a.updatedAt || a.$createdAt).getTime())
        .slice(0, 10)
        .map((like: any) => ({
          timestamp: like.updatedAt || like.$createdAt,
          userId: like.userId,
          type: like.likeType || 'like'
        }));

      setLikeAnalytics({
        totalLikes,
        activeLikes,
        likeTypes,
        recentLikes
      });
    } catch (error) {
      console.warn('Failed to load like analytics:', error);
      // Set default analytics
      setLikeAnalytics({
        totalLikes: 0,
        activeLikes: 0,
        likeTypes: [],
        recentLikes: []
      });
    }
  };

  const trackView = async () => {
    try {
      // Only track views for audience users, not authenticated admin users
      if (user) {
        return; // Skip tracking for admin users
      }

      // Generate session ID if not exists
      let sessionId = localStorage.getItem('blog_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('blog_session_id', sessionId);
      }

      // Check if already viewed this post in this session
      const viewKey = `viewed_${postId}_${sessionId}`;
      const alreadyViewed = localStorage.getItem(viewKey);

      if (!alreadyViewed) {
        const viewData = {
          postId,
          sessionId,
          userId: null, // Always null for audience views (no authenticated user)
          userAgent: navigator.userAgent,
          referrer: document.referrer,
          isUnique: true, // For now, assume unique per session
          country: undefined as undefined, // Would need geolocation service
          city: undefined as undefined
        };

        await tablesDB.createRow({
          databaseId: DATABASE_ID,
          tableId: BLOG_VIEWS_COLLECTION_ID,
          rowId: `view_${Date.now()}_${sessionId}`,
          data: viewData
        });

        // Mark as viewed
        localStorage.setItem(viewKey, 'true');

        // View count update is handled in loadPost() for non-admin users
      }
    } catch (error) {
      console.warn('Failed to track audience view:', error);
      // Don't fail the page load for tracking errors
    }
  };

  const getCategoryName = (post: BlogPost) => {
    // Use only the relationship field
    if (post.blogCategories) {
      // Check if blogCategories is an object (expanded relationship)
      if (typeof post.blogCategories === 'object' && post.blogCategories.name) {
        return post.blogCategories.name;
      }
      // Check if blogCategories is a string (unexpanded relationship ID)
      else if (typeof post.blogCategories === 'string') {
        const category = categories.find(cat => cat.$id === post.blogCategories);
        return category?.name || post.blogCategories;
      }
    }
    return t("general_use.uncategorized", { defaultValue: "Uncategorized" });
  };

  const getTagNames = (tagIds: string[]) => {
    return tagIds.map(tagId => {
      const tag = tags.find(t => t.$id === tagId);
      return tag?.name || tagId;
    }).join(', ');
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
                Blog Posts
              </Link>
            </Button>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground font-medium">{post.title}</span>
          </nav>
        </div>
      </div>

      {/* Header */}
      <div className="sticky top-28 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{post.title}</h1>
              <p className="text-sm text-muted-foreground">
                {post.excerpt}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className={`w-2 h-2 rounded-full ${post.status === 'published' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <StatusBadge status={post.status} type="blog-post" />
              </div>
              <div className="text-sm text-muted-foreground">
                {t("general_use.updated")}: {new Date(post.$updatedAt).toLocaleDateString()}
              </div>
              <Button asChild>
                <Link href={`/auth/blog/blog-posts/${postId}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  {t("blog.view.edit_post")}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-40 z-20 border-b bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('content')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'content'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
            >
              {t("blog.view.content_tab")}
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'comments'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
            >
              <MessageSquare className="h-4 w-4" />
              {t("blog.view.comments_tab")} ({comments.length})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'analytics'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
            >
              <BarChart3 className="h-4 w-4" />
              {t("blog.view.analytics_tab")}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {activeTab === 'content' && (
          <div className="space-y-8">
            {/* Featured Image */}
            {post.featuredImage && (
              <div className="relative">
                <img
                  src={post.featuredImage}
                  alt={post.featuredImageAlt || post.title}
                  className="w-full h-64 object-cover rounded-lg shadow-md"
                />
                {post.featuredImageAlt && (
                  <p className="text-sm text-muted-foreground mt-2 italic">
                    {post.featuredImageAlt}
                  </p>
                )}
              </div>
            )}

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("blog.view.author")}</p>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{post.author}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("general_use.category")}</p>
                <p className="font-medium">{getCategoryName(post)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("blog.view.read_time")}</p>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">{post.readTime}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("blog.view.published_date")}</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : t("blog.view.not_published")}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("general_use.views")}</p>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span className="font-medium">{post.views}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("general_use.likes")}</p>
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  <span className="font-medium">{post.likes}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("general_use.status")}</p>
                <StatusBadge status={post.status} type="blog-post" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("blog.view.featured")}</p>
                <p className="font-medium">{post.isFeatured ? t("general_use.yes") : t("general_use.no")}</p>
              </div>
            </div>

            {/* Tags */}
            {post.blogTags && post.blogTags.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  {t("blog.view.tags")}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {post.blogTags.map((tag: any) => (
                    <Badge key={tag.$id} variant="secondary" className="text-sm">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* SEO Information */}
            {(post.seoTitle || post.seoDescription || post.seoKeywords.length > 0) && (
              <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("blog.view.seo_info")}</h4>
                <div className="space-y-2 text-sm">
                  {post.seoTitle && (
                    <div>
                      <span className="font-medium">{t("blog.view.seo_title_label")}</span> {post.seoTitle}
                    </div>
                  )}
                  {post.seoDescription && (
                    <div>
                      <span className="font-medium">{t("blog.view.seo_desc_label")}</span> {post.seoDescription}
                    </div>
                  )}
                  {post.seoKeywords.length > 0 && (
                    <div>
                      <span className="font-medium">{t("blog.view.seo_keywords_label")}</span>{' '}
                      <div className="inline-flex flex-wrap gap-1 mt-1">
                        {post.seoKeywords.map((keyword, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Content */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("blog.view.content")}</h4>
              <div className="border rounded-lg p-6 bg-background prose prose-sm max-w-none dark:prose-invert">
                <div dangerouslySetInnerHTML={{ __html: post.content }} />
              </div>
            </div>

            {/* Related Posts */}
            {post.relatedPosts.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("blog.view.related_posts")}</h4>
                <div className="text-sm text-muted-foreground">
                  {t("blog.view.related_posts_count", { count: post.relatedPosts.length.toString() })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Analytics Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t("blog.view.total_views")}</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{viewAnalytics?.totalViews || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {t("blog.view.unique_views", { count: viewAnalytics?.uniqueViews.toString() || '0' })}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t("blog.view.total_likes")}</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{likeAnalytics?.activeLikes || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {likeAnalytics?.totalLikes || 0} total interactions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t("blog.view.top_referrer")}</CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {viewAnalytics?.topReferrers[0]?.source || t("blog.view.direct_traffic")}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("blog.view.views_count", { count: viewAnalytics?.topReferrers[0]?.count.toString() || '0' })}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t("blog.view.engagement_rate")}</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {viewAnalytics?.totalViews ?
                      Math.round(((likeAnalytics?.activeLikes || 0) / viewAnalytics.totalViews) * 100) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("blog.view.likes_per_view")}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analytics */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* View Sources */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("blog.view.traffic_sources")}</CardTitle>
                  <CardDescription>{t("blog.view.traffic_sources_desc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  {viewAnalytics?.topReferrers.length ? (
                    <div className="space-y-3">
                      {viewAnalytics.topReferrers.map((referrer, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{referrer.source}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{
                                  width: `${(referrer.count / (viewAnalytics.topReferrers[0]?.count || 1)) * 100}%`
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium w-8 text-right">{referrer.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("blog.view.no_view_data")}</p>
                  )}
                </CardContent>
              </Card>

              {/* Geographic Data */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("blog.view.geographic_dist")}</CardTitle>
                  <CardDescription>{t("blog.view.geographic_dist_desc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  {viewAnalytics?.geographic.length ? (
                    <div className="space-y-3">
                      {viewAnalytics.geographic.slice(0, 5).map((geo, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{geo.country}</span>
                          <span className="text-sm font-medium">{t("blog.view.views_count", { count: geo.count.toString() })}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("blog.view.no_geographic_data")}</p>
                  )}
                </CardContent>
              </Card>

              {/* Like Types */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("blog.view.like_dist")}</CardTitle>
                  <CardDescription>{t("blog.view.like_dist_desc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  {likeAnalytics?.likeTypes.length ? (
                    <div className="space-y-3">
                      {likeAnalytics.likeTypes.map((type, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{type.type}</span>
                          <span className="text-sm font-medium">{type.count} likes</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("blog.view.no_like_data")}</p>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("blog.view.recent_activity")}</CardTitle>
                  <CardDescription>{t("blog.view.recent_activity_desc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {viewAnalytics?.recentViews.slice(0, 3).map((view, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t("blog.view.view_label")}</span>
                        <span>{new Date(view.timestamp).toLocaleDateString()}</span>
                      </div>
                    ))}
                    {likeAnalytics?.recentLikes.slice(0, 2).map((like, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground capitalize">{like.type}</span>
                        <span>{new Date(like.timestamp).toLocaleDateString()}</span>
                      </div>
                    ))}
                    {(!viewAnalytics?.recentViews.length && !likeAnalytics?.recentLikes.length) && (
                      <p className="text-sm text-muted-foreground">{t("blog.view.no_recent_activity")}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="space-y-8">
            {/* Comments Header */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  {t("blog.view.comments_title", { count: comments.length.toString() })}
                </CardTitle>
                <CardDescription>
                  {post.allowComments
                    ? t("blog.view.comments_enabled")
                    : t("blog.view.comments_disabled")
                  }
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Comments List */}
            {!post.allowComments ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    {t("blog.view.comments_disabled_message")}
                  </p>
                </CardContent>
              </Card>
            ) : threadedComments.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    {t("blog.view.no_comments")}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {threadedComments.map((comment) => (
                  <CommentItem key={comment.$id} comment={comment} depth={0} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Recursive comment component
function CommentItem({ comment, depth }: { comment: BlogComment; depth: number }) {
  const { t } = useTranslation();
  const maxDepth = 3;

  return (
    <div className={`${depth > 0 ? `ml-8 border-l-2 border-muted pl-4` : ''}`}>
      <Card className={`${depth > 0 ? 'bg-muted/30' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                {comment.author.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{comment.author}</p>
                  {comment.authorId && (
                    <Badge variant="outline" className="text-xs">
                      {t("blog.view.verified_author")}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(comment.$createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            {comment.depth > 0 && (
              <Badge variant="secondary" className="text-xs">
                {t("blog.view.reply")}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Comment Content */}
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="whitespace-pre-wrap text-sm">{comment.content}</p>
            </div>

            {/* Engagement Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <ThumbsUp className="h-4 w-4" />
                <span>{comment.likes}</span>
              </div>
              <div className="flex items-center gap-1">
                <ThumbsDown className="h-4 w-4" />
                <span>{comment.dislikes}</span>
              </div>
              {comment.replies && comment.replies.length > 0 && (
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{comment.replies.length} {t("blog.view.replies")}</span>
                </div>
              )}
            </div>

            {/* Nested Replies */}
            {comment.replies && comment.replies.length > 0 && depth < maxDepth && (
              <div className="space-y-4 mt-4">
                {comment.replies.map((reply) => (
                  <CommentItem key={reply.$id} comment={reply} depth={depth + 1} />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
