"use client";

import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/custom/status-badge";
import {
  User,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Calendar,
  Tag,
} from "lucide-react";
import { useTranslation } from "@/lib/language-context";
import { CommunityPost } from "@/app/auth/community/community-posts/types";

interface ViewMetadataProps {
  post: CommunityPost;
  getTopicName: (post: CommunityPost) => string;
}

export function ViewMetadata({ post, getTopicName }: ViewMetadataProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Metadata Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg border">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
            {t('author')}
          </p>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="font-medium">{post.author || t('community_posts_page.view_dialog.anonymous')}</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
            {t('community_posts_page.view_dialog.topic')}
          </p>
          <p className="font-medium">{getTopicName(post)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
            {t('community_posts_page.view_dialog.views')}
          </p>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span className="font-medium">{post.views}</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
            {t('community_posts_page.view_dialog.upvotes')}
          </p>
          <div className="flex items-center gap-2">
            <ThumbsUp className="h-4 w-4" />
            <span className="font-medium">{post.upvotes}</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
            {t('community_posts_page.view_dialog.downvotes')}
          </p>
          <div className="flex items-center gap-2">
            <ThumbsDown className="h-4 w-4" />
            <span className="font-medium">{post.downvotes}</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
            {t('community_posts_page.view_dialog.replies')}
          </p>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="font-medium">{post.replyCount}</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
            {t('status')}
          </p>
          <StatusBadge status={post.status} type="community-post" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
            {t('created')}
          </p>
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
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2" suppressHydrationWarning>
            <Tag className="h-4 w-4" />
            {t('community_posts_page.view_dialog.tags')}
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
    </>
  );
}

