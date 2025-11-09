"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react";
import { useTranslation } from "@/lib/language-context";
import { BlogPost, BlogComment } from "@/app/auth/blog/blog-posts/types";

interface ViewCommentsTabProps {
  post: BlogPost;
  threadedComments: BlogComment[];
}

export function ViewCommentsTab({ post, threadedComments }: ViewCommentsTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Comments Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            <span suppressHydrationWarning>
              {t('blog_posts_page.view_page.comments.title')} ({threadedComments.length})
            </span>
          </CardTitle>
          <CardDescription suppressHydrationWarning>
            {post.allowComments
              ? t('blog_posts_page.view_page.comments.enabled')
              : t('blog_posts_page.view_page.comments.disabled')
            }
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Comments List */}
      {!post.allowComments ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-sm text-muted-foreground" suppressHydrationWarning>
              {t('blog_posts_page.view_page.comments.disabled_message')}
            </p>
          </CardContent>
        </Card>
      ) : threadedComments.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-sm text-muted-foreground" suppressHydrationWarning>
              {t('blog_posts_page.view_page.comments.no_comments')}
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
  );
}

// Recursive comment component
function CommentItem({ comment, depth }: { comment: BlogComment; depth: number }) {
  const { t } = useTranslation();
  const maxDepth = 3;

  return (
    <div className={`${depth > 0 ? `ml-4 sm:ml-8 border-l-2 border-muted pl-3 sm:pl-4` : ''}`}>
      <Card className={`${depth > 0 ? 'bg-muted/30' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 text-primary font-semibold text-xs sm:text-sm shrink-0">
                {comment.author.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-xs sm:text-sm truncate">{comment.author}</p>
                  {comment.authorId && (
                    <Badge variant="outline" className="text-xs shrink-0" suppressHydrationWarning>
                      {t('blog_posts_page.view_page.comments.verified_author')}
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
              <Badge variant="secondary" className="text-xs shrink-0" suppressHydrationWarning>
                {t('blog_posts_page.view_page.comments.reply')}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3 sm:space-y-4">
            {/* Comment Content */}
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="whitespace-pre-wrap text-xs sm:text-sm">{comment.content}</p>
            </div>

            {/* Engagement Stats */}
            <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span>{comment.likes}</span>
              </div>
              <div className="flex items-center gap-1">
                <ThumbsDown className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span>{comment.dislikes}</span>
              </div>
              {comment.replies && comment.replies.length > 0 && (
                <div className="flex items-center gap-1" suppressHydrationWarning>
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                  <span>
                    {comment.replies.length} {t('blog_posts_page.view_page.comments.replies')}
                  </span>
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

