"use client";

import { useTranslation } from "@/lib/language-context";
import { BlogPostFormData } from "@/app/auth/blog/blog-posts/types";

interface ProgressIndicatorProps {
  formData: BlogPostFormData;
}

export function ProgressIndicator({ formData }: ProgressIndicatorProps) {
  const { t } = useTranslation();

  return (
    <div className="sticky top-[155px] sm:top-48 z-20 border-b bg-background/95">
      <div className="px-4 sm:px-6 py-2 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm overflow-x-auto">
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <div className={`w-2 h-2 rounded-full shrink-0 ${formData.title ? 'bg-green-500' : 'bg-muted-foreground'}`}></div>
            <span className={formData.title ? 'text-foreground' : 'text-muted-foreground'} suppressHydrationWarning>
              {t('blog_posts_page.create_page.progress.title')}
            </span>
          </div>
          <div className="w-2 sm:w-4 h-px bg-border shrink-0"></div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <div className={`w-2 h-2 rounded-full shrink-0 ${formData.content ? 'bg-green-500' : 'bg-muted-foreground'}`}></div>
            <span className={formData.content ? 'text-foreground' : 'text-muted-foreground'} suppressHydrationWarning>
              {t('blog_posts_page.create_page.progress.content')}
            </span>
          </div>
          <div className="w-2 sm:w-4 h-px bg-border shrink-0"></div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <div className={`w-2 h-2 rounded-full shrink-0 ${formData.blogCategories ? 'bg-green-500' : 'bg-muted-foreground'}`}></div>
            <span className={formData.blogCategories ? 'text-foreground' : 'text-muted-foreground'} suppressHydrationWarning>
              {t('blog_posts_page.create_page.progress.category')}
            </span>
          </div>
          <div className="w-2 sm:w-4 h-px bg-border shrink-0"></div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <div className={`w-2 h-2 rounded-full shrink-0 ${formData.status ? 'bg-green-500' : 'bg-muted-foreground'}`}></div>
            <span className={formData.status ? 'text-foreground' : 'text-muted-foreground'} suppressHydrationWarning>
              {t('blog_posts_page.create_page.progress.status')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

