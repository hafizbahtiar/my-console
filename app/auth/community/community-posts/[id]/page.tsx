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
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/custom/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft,
  AlertCircle,
  Eye,
  Edit,
  Calendar,
  User,
  Tag,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Pin,
  Lock,
  Star,
} from "lucide-react";
import {
  tablesDB,
  DATABASE_ID,
  COMMUNITY_POSTS_COLLECTION_ID,
  COMMUNITY_TOPICS_COLLECTION_ID
} from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { SafeHTML } from "@/components/ui/safe-html";

export default function ViewCommunityPostPage() {
  const { user } = useAuth();
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
      if (!user || !postId) {
        router.push('/auth/dashboard');
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
          setError('You do not have permission to access this post');
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
    return "Uncategorized";
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
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
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
            <span className="text-foreground font-medium">{post.title}</span>
          </nav>
        </div>
      </div>

      {/* Header */}
      <div className="sticky top-28 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {post.isPinned && <Pin className="h-4 w-4 text-primary" />}
                {post.isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                {post.isFeatured && <Star className="h-4 w-4 text-yellow-500" />}
                <h1 className="text-2xl font-bold tracking-tight">{post.title}</h1>
              </div>
              {post.excerpt && (
                <p className="text-sm text-muted-foreground">
                  {post.excerpt}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className={`w-2 h-2 rounded-full ${
                  post.status === 'approved' ? 'bg-green-500' : 
                  post.status === 'pending' ? 'bg-yellow-500' : 
                  'bg-red-500'
                }`}></div>
                <StatusBadge status={post.status} type="community-post" />
              </div>
              <div className="text-sm text-muted-foreground">
                Updated: {new Date(post.$updatedAt).toLocaleDateString()}
              </div>
              <Button asChild>
                <Link href={`/auth/community/community-posts/${postId}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg border">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Author</p>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="font-medium">{post.author || "Anonymous"}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Topic</p>
              <p className="font-medium">{getTopicName(post)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Views</p>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span className="font-medium">{post.views}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Upvotes</p>
              <div className="flex items-center gap-2">
                <ThumbsUp className="h-4 w-4" />
                <span className="font-medium">{post.upvotes}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Downvotes</p>
              <div className="flex items-center gap-2">
                <ThumbsDown className="h-4 w-4" />
                <span className="font-medium">{post.downvotes}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Replies</p>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="font-medium">{post.replyCount}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</p>
              <StatusBadge status={post.status} type="community-post" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">
                  {post.$createdAt ? new Date(post.$createdAt).toLocaleDateString() : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Content</h4>
            <div className="border rounded-lg p-6 bg-background prose prose-sm max-w-none dark:prose-invert">
              <SafeHTML html={post.content} />
            </div>
          </div>

          {/* Post Flags */}
          <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Post Flags</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Pin className={`h-4 w-4 ${post.isPinned ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={post.isPinned ? 'font-medium' : 'text-muted-foreground'}>
                  {post.isPinned ? "Pinned" : "Not Pinned"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className={`h-4 w-4 ${post.isLocked ? 'text-destructive' : 'text-muted-foreground'}`} />
                <span className={post.isLocked ? 'font-medium text-destructive' : 'text-muted-foreground'}>
                  {post.isLocked ? "Locked" : "Not Locked"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Star className={`h-4 w-4 ${post.isFeatured ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                <span className={post.isFeatured ? 'font-medium text-yellow-500' : 'text-muted-foreground'}>
                  {post.isFeatured ? "Featured" : "Not Featured"}
                </span>
              </div>
              {post.lastReplyAt && (
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground text-xs">
                    Last reply: {new Date(post.lastReplyAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

