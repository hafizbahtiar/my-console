"use client";

import { SafeHTML } from "@/components/ui/safe-html";
import { Pin, Lock, Star, MessageSquare } from "lucide-react";
import { useTranslation } from "@/lib/language-context";
import { CommunityPost } from "@/app/auth/community/community-posts/types";

interface ViewContentProps {
  post: CommunityPost;
}

export function ViewContent({ post }: ViewContentProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Content */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
          {t('content')}
        </h4>
        <div className="border rounded-lg p-6 bg-background prose prose-sm max-w-none dark:prose-invert">
          <SafeHTML html={post.content} />
        </div>
      </div>

      {/* Post Flags */}
      <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
          {t('community_posts_page.view_page.post_flags')}
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Pin className={`h-4 w-4 ${post.isPinned ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={post.isPinned ? 'font-medium' : 'text-muted-foreground'} suppressHydrationWarning>
              {post.isPinned ? t('community_posts_page.view_page.pinned') : t('community_posts_page.view_page.not_pinned')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className={`h-4 w-4 ${post.isLocked ? 'text-destructive' : 'text-muted-foreground'}`} />
            <span className={post.isLocked ? 'font-medium text-destructive' : 'text-muted-foreground'} suppressHydrationWarning>
              {post.isLocked ? t('community_posts_page.view_page.locked') : t('community_posts_page.view_page.not_locked')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Star className={`h-4 w-4 ${post.isFeatured ? 'text-yellow-500' : 'text-muted-foreground'}`} />
            <span className={post.isFeatured ? 'font-medium text-yellow-500' : 'text-muted-foreground'} suppressHydrationWarning>
              {post.isFeatured ? t('community_posts_page.view_page.featured') : t('community_posts_page.view_page.not_featured')}
            </span>
          </div>
          {post.lastReplyAt && (
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground text-xs" suppressHydrationWarning>
                {t('community_posts_page.view_page.last_reply')}: {new Date(post.lastReplyAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

