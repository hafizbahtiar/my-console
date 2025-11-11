"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/custom/status-badge";
import { Pin, Lock, Star, Edit } from "lucide-react";
import { useTranslation } from "@/lib/language-context";
import { CommunityPost } from "@/app/auth/community/community-posts/types";
import { VoteButtons } from "../replies/vote-buttons";

interface ViewHeaderProps {
  post: CommunityPost;
  postId: string;
}

export function ViewHeader({ post, postId }: ViewHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="sticky top-28 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 py-4">
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
            <VoteButtons postId={postId} upvotes={post.upvotes} downvotes={post.downvotes} />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className={`w-2 h-2 rounded-full ${
                post.status === 'approved' ? 'bg-green-500' : 
                post.status === 'pending' ? 'bg-yellow-500' : 
                'bg-red-500'
              }`}></div>
              <StatusBadge status={post.status} type="community-post" />
            </div>
            <div className="text-sm text-muted-foreground" suppressHydrationWarning>
              {t('community_posts_page.view_page.updated')}: {new Date(post.$updatedAt).toLocaleDateString()}
            </div>
            <Button asChild>
              <Link href={`/auth/community/community-posts/${postId}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                <span suppressHydrationWarning>{t('edit')}</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

