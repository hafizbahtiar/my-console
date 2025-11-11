"use client";

// Admin Community Post View Page
// Purpose: Admin content review and management
// View tracking: DISABLED (analytics for content creators only)

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { CommunityPost } from "../types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/custom/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import {
  tablesDB,
  DATABASE_ID,
  COMMUNITY_POSTS_COLLECTION_ID,
  COMMUNITY_TOPICS_COLLECTION_ID
} from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/language-context";
import {
  ViewBreadcrumbNav,
  ViewHeader,
  ViewMetadata,
  ViewContent,
} from "@/components/app/auth/community/community-posts/view";
import { RepliesList } from "@/components/app/auth/community/community-posts/replies";

export default function ViewCommunityPostPage() {
  const { user, loading: authLoading } = useAuth();
  const { t, loading: translationLoading } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  // State
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      // Wait for auth to finish loading before proceeding
      if (authLoading) {
        return;
      }

      // Don't redirect on refresh - allow skeleton/error state to show
      if (!postId) {
        setError(t('community_posts_page.view_page.blog_post_not_found'));
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
          loadTopics()
        ]);
      } catch (error: any) {
        console.error('Failed to load data:', error);
        
        // Check for authorization errors
        const isAuthError = error?.code === 401 || 
                           error?.code === 403 || 
                           error?.message?.includes('not authorized') ||
                           error?.message?.includes('authorized') ||
                           error?.type === 'AppwriteException';
        
        if (isAuthError) {
          setError(t('community_posts_page.toast.permission_denied'));
        } else {
          setError(t('community_posts_page.view_page.failed_to_load'));
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
      return post;
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
      setTopics(topicsData.rows || []);
    } catch (error) {
      console.error('Failed to load topics:', error);
    }
  };

  const getTopicName = (post: CommunityPost) => {
    if (post.communityTopics) {
      if (typeof post.communityTopics === 'object' && post.communityTopics.name) {
        return post.communityTopics.name;
      } else if (typeof post.communityTopics === 'string') {
        const topic = topics.find(t => t.$id === post.communityTopics);
        return topic?.name || post.communityTopics;
      }
    }
    return t('community_posts_page.table.uncategorized');
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
                <Skeleton className="h-9 w-28" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="px-4 sm:px-6 py-8">
          <div className="space-y-8">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-96 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
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
              {error || t('community_posts_page.view_page.blog_post_not_found')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/auth/community/community-posts">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span suppressHydrationWarning>{t('community_posts_page.view_page.back_to_posts')}</span>
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
      <ViewBreadcrumbNav post={post} />

      {/* Header */}
      <ViewHeader post={post} postId={postId} />

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-8">
          <ViewMetadata post={post} getTopicName={getTopicName} />
          <ViewContent post={post} />
          <RepliesList postId={postId} isLocked={post.isLocked} />
        </div>
      </div>
    </div>
  );
}

