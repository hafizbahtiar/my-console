"use client";

// Admin Blog Post View Page
// Purpose: Admin content review + analytics dashboard
// NOT for audience consumption (separate public page planned)
// View tracking: DISABLED (analytics for content creators only)

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { BlogPost, ViewAnalytics, LikeAnalytics, BlogComment } from "../types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
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
import {
  ViewBreadcrumbNav,
  ViewHeader,
  ViewTabs,
  ViewContentTab,
  ViewAnalyticsTab,
  ViewCommentsTab,
} from "@/components/app/auth/blog/blog-posts/view";



export default function ViewBlogPostPage() {
  const { user } = useAuth();
  const { t, loading: translationLoading } = useTranslation();
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
      // Don't redirect on refresh - allow skeleton/error state to show
      if (!postId) {
        setError(t('blog_posts_page.view_page.blog_post_not_found'));
        setIsLoading(false);
        return;
      }

      // Only load data if user is available
      if (!user) {
        setIsLoading(false);
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
          trackView()
        ]);
      } catch (error) {
        console.error('Failed to load data:', error);
        setError(t('blog_posts_page.view_page.failed_to_load'));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, postId, t]);

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
      // Validate postId before querying
      if (!postId || typeof postId !== 'string' || postId.trim() === '') {
        console.warn('Invalid postId for comments query:', postId);
        setComments([]);
        setThreadedComments([]);
        return;
      }

      const validPostId = postId.trim();
      
      // Load all comments and filter client-side
      // This avoids query syntax issues with relationship fields
      // Relationship queries in Appwrite can be tricky with string queries
      const commentsData = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: BLOG_COMMENTS_COLLECTION_ID,
      });

      // Filter comments by postId (checking both relationship object and string ID)
      // Then filter approved and non-spam comments
      const allComments = (commentsData.rows || [])
        .map((row: any) => row as unknown as BlogComment)
        .filter((comment: BlogComment) => {
          // Check if comment belongs to this post
          // blogPosts can be a relationship object or a string ID
          const commentPostId = typeof comment.blogPosts === 'object' && comment.blogPosts?.$id
            ? comment.blogPosts.$id
            : typeof comment.blogPosts === 'string'
            ? comment.blogPosts
            : null;
          
          return commentPostId === validPostId;
        })
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
      // Validate postId before querying
      if (!postId || typeof postId !== 'string' || postId.trim() === '') {
        console.warn('Invalid postId for views query:', postId);
        setViewAnalytics({
          totalViews: 0,
          uniqueViews: 0,
          topReferrers: [],
          geographic: [],
          recentViews: []
        });
        return;
      }

      const viewsData = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: BLOG_VIEWS_COLLECTION_ID,
        queries: [`equal("postId", "${postId.trim()}")`],
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
      // Validate postId before querying
      if (!postId || typeof postId !== 'string' || postId.trim() === '') {
        console.warn('Invalid postId for likes query:', postId);
        setLikeAnalytics({
          totalLikes: 0,
          activeLikes: 0,
          likeTypes: [],
          recentLikes: []
        });
        return;
      }

      const likesData = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: BLOG_LIKES_COLLECTION_ID,
        queries: [`equal("postId", "${postId.trim()}")`],
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
    return "Uncategorized";
  };

  const getTagNames = (tagIds: string[]) => {
    return tagIds.map(tagId => {
      const tag = tags.find(t => t.$id === tagId);
      return tag?.name || tagId;
    }).join(', ');
  };


  // Show skeleton while translations or data is loading
  if (translationLoading || isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 sm:p-6 pt-6">
        {/* Breadcrumb Skeleton */}
        <Skeleton className="h-10 w-full" />
        
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-8 w-3/4 sm:h-9 sm:w-2/3" />
            <Skeleton className="h-4 w-full sm:h-5 sm:w-4/5" />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>

        {/* Tabs Skeleton */}
        <Skeleton className="h-12 w-full" />

        {/* Content Skeleton */}
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex-1 space-y-4 p-4 sm:p-6 pt-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription suppressHydrationWarning>
            {error || t('blog_posts_page.view_page.blog_post_not_found')}
          </AlertDescription>
        </Alert>
        <Button asChild>
          <Link href="/auth/blog/blog-posts" suppressHydrationWarning>
            {t('blog_posts_page.view_page.back_to_posts')}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-6 pt-6">
      {/* Breadcrumb Navigation */}
      <ViewBreadcrumbNav post={post} />

      {/* Header */}
      <ViewHeader post={post} postId={postId} />

      {/* Tab Navigation */}
      <ViewTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        commentsCount={comments.length}
      />

      {/* Main Content */}
      <div className="px-4 sm:px-6 py-4 sm:py-8">
        {activeTab === 'content' && (
          <ViewContentTab post={post} getCategoryName={getCategoryName} />
        )}

        {activeTab === 'analytics' && (
          <ViewAnalyticsTab
            viewAnalytics={viewAnalytics}
            likeAnalytics={likeAnalytics}
          />
        )}

        {activeTab === 'comments' && (
          <ViewCommentsTab
            post={post}
            threadedComments={threadedComments}
          />
        )}
      </div>
    </div>
  );
}
