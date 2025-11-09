"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/custom/status-badge";
import { Edit } from "lucide-react";
import { useTranslation } from "@/lib/language-context";
import { BlogPost } from "@/app/auth/blog/blog-posts/types";

interface ViewHeaderProps {
  post: BlogPost;
  postId: string;
}

export function ViewHeader({ post, postId }: ViewHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="sticky top-[80px] sm:top-28 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div className="space-y-1 flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
              {post.title}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
              {post.excerpt}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <div className={`w-2 h-2 rounded-full shrink-0 ${post.status === 'published' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <StatusBadge status={post.status} type="blog-post" />
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground" suppressHydrationWarning>
              {t('blog_posts_page.view_page.updated')}: {new Date(post.$updatedAt).toLocaleDateString()}
            </div>
            <Button asChild size="sm" className="shrink-0">
              <Link href={`/auth/blog/blog-posts/${postId}/edit`}>
                <Edit className="h-4 w-4 mr-2 shrink-0" />
                <span className="truncate" suppressHydrationWarning>
                  {t('blog_posts_page.view_page.edit_post')}
                </span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

