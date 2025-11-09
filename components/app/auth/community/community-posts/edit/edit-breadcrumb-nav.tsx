"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "@/lib/language-context";
import { CommunityPost } from "@/app/auth/community/community-posts/types";

interface EditBreadcrumbNavProps {
  postId: string;
  post: CommunityPost | null;
}

export function EditBreadcrumbNav({ postId, post }: EditBreadcrumbNavProps) {
  const { t } = useTranslation();

  return (
    <div className="sticky top-16 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-4 sm:px-6 py-2 sm:py-3">
        <nav className="flex items-center space-x-2 text-xs sm:text-sm">
          <Button variant="ghost" size="sm" className="h-7 sm:h-8 px-2 text-muted-foreground hover:text-foreground shrink-0" asChild>
            <Link href="/auth/community/community-posts">
              <ArrowLeft className="h-3 w-3 mr-1 shrink-0" />
              <span className="truncate" suppressHydrationWarning>
                {t('community_posts_page.title')}
              </span>
            </Link>
          </Button>
          <span className="text-muted-foreground shrink-0">/</span>
          <Button variant="ghost" size="sm" className="h-7 sm:h-8 px-2 text-muted-foreground hover:text-foreground shrink-0" asChild>
            <Link href={`/auth/community/community-posts/${postId}`}>
              <span className="truncate">
                {post ? post.title : t('community_posts_page.edit_page.unknown_post')}
              </span>
            </Link>
          </Button>
          <span className="text-muted-foreground shrink-0">/</span>
          <span className="text-foreground font-medium truncate" suppressHydrationWarning>
            {t('edit')}
          </span>
        </nav>
      </div>
    </div>
  );
}

