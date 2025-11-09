"use client";

import { MessageSquare, BarChart3 } from "lucide-react";
import { useTranslation } from "@/lib/language-context";

interface ViewTabsProps {
  activeTab: 'content' | 'analytics' | 'comments';
  onTabChange: (tab: 'content' | 'analytics' | 'comments') => void;
  commentsCount: number;
}

export function ViewTabs({ activeTab, onTabChange, commentsCount }: ViewTabsProps) {
  const { t } = useTranslation();

  return (
    <div className="sticky top-[155px] sm:top-40 z-20 border-b bg-muted/30">
      <div className="px-4 sm:px-6">
        <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto">
          <button
            onClick={() => onTabChange('content')}
            className={`py-3 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap shrink-0 ${activeTab === 'content'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            suppressHydrationWarning
          >
            {t('blog_posts_page.view_page.tabs.content')}
          </button>
          <button
            onClick={() => onTabChange('comments')}
            className={`py-3 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap shrink-0 ${activeTab === 'comments'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            suppressHydrationWarning
          >
            <MessageSquare className="h-4 w-4 shrink-0" />
            <span>{t('blog_posts_page.view_page.tabs.comments')}</span>
            <span className="text-muted-foreground">({commentsCount})</span>
          </button>
          <button
            onClick={() => onTabChange('analytics')}
            className={`py-3 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap shrink-0 ${activeTab === 'analytics'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            suppressHydrationWarning
          >
            <BarChart3 className="h-4 w-4 shrink-0" />
            <span>{t('blog_posts_page.view_page.tabs.analytics')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

