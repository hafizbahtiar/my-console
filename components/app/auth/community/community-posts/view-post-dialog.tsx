"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/custom/status-badge";
import { SafeHTML } from "@/components/ui/safe-html";
import { Separator } from "@/components/ui/separator";
import { Edit, Eye, ThumbsUp, ThumbsDown, MessageCircle, Pin, Lock, Star } from "lucide-react";
import { useTranslation } from "@/lib/language-context";
import { CommunityPost } from "@/app/auth/community/community-posts/types";

interface ViewPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: CommunityPost | null;
  getTopicName: (post: CommunityPost) => string;
}

export function ViewPostDialog({
  open,
  onOpenChange,
  post,
  getTopicName,
}: ViewPostDialogProps) {
  const { t } = useTranslation();

  if (!post) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1200px] max-h-[95vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="space-y-2">
            <DialogTitle className="text-2xl font-bold leading-tight flex items-center gap-2">
              {post.isPinned && <Pin className="h-5 w-5 text-primary" />}
              {post.isLocked && <Lock className="h-5 w-5 text-muted-foreground" />}
              {post.isFeatured && <Star className="h-5 w-5 text-yellow-500" />}
              {post.title}
            </DialogTitle>
            {post.excerpt && (
              <DialogDescription className="text-base">
                {post.excerpt}
              </DialogDescription>
            )}
          </div>
        </DialogHeader>

        {post && (
          <div className="space-y-8 py-6">
            {/* Metadata Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg border">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
                  {t('author')}
                </p>
                <p className="font-medium">{post.author || t('community_posts_page.view_dialog.anonymous')}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
                  {t('status')}
                </p>
                <StatusBadge status={post.status} type="community-post" />
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
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span className="font-medium">{post.views}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
                  {t('community_posts_page.view_dialog.upvotes')}
                </p>
                <div className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  <span className="font-medium">{post.upvotes}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
                  {t('community_posts_page.view_dialog.downvotes')}
                </p>
                <div className="flex items-center gap-1">
                  <ThumbsDown className="h-4 w-4" />
                  <span className="font-medium">{post.downvotes}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
                  {t('community_posts_page.view_dialog.replies')}
                </p>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  <span className="font-medium">{post.replyCount}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
                  {t('created')}
                </p>
                <p className="font-medium">
                  {post.$createdAt ? new Date(post.$createdAt).toLocaleDateString() : '-'}
                </p>
              </div>
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
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

            <Separator />

            {/* Content */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
                {t('content')}
              </h4>
              <div className="border rounded-lg p-6 bg-background prose prose-sm max-w-none dark:prose-invert">
                <SafeHTML html={post.content} />
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="border-t pt-6">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground" suppressHydrationWarning>
              {t('community_posts_page.view_dialog.updated', {
                date: post?.$updatedAt ? new Date(post.$updatedAt).toLocaleString() : '-'
              })}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} suppressHydrationWarning>
                {t('close')}
              </Button>
              <Button asChild>
                <Link href={`/auth/community/community-posts/${post?.$id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  <span suppressHydrationWarning>{t('edit')}</span>
                </Link>
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

