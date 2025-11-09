"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TipTap } from "@/components/ui/tiptap";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, Sparkles, Wand2, ChevronDown } from "lucide-react";
import { useTranslation } from "@/lib/language-context";
import { BlogPostFormData } from "@/app/auth/blog/blog-posts/types";

interface BasicInfoSectionProps {
  formData: BlogPostFormData;
  onFormDataChange: (data: Partial<BlogPostFormData>) => void;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  isGeneratingTitle: boolean;
  isGeneratingExcerpt: boolean;
  isImprovingContent: boolean;
  onGenerateTitle: () => void;
  onGenerateExcerpt: () => void;
  onImproveContent: (action: 'improve' | 'rephrase' | 'shorten' | 'expand' | 'grammar') => void;
}

export function BasicInfoSection({
  formData,
  onFormDataChange,
  onTitleChange,
  onContentChange,
  isGeneratingTitle,
  isGeneratingExcerpt,
  isImprovingContent,
  onGenerateTitle,
  onGenerateExcerpt,
  onImproveContent,
}: BasicInfoSectionProps) {
  const { t } = useTranslation();

  const canGenerateTitle = formData.content.trim() && formData.content.replace(/<[^>]*>/g, '').trim().length >= 50;
  const canGenerateExcerpt = formData.title.trim() && formData.content.trim() && formData.title.trim().split(/\s+/).length > 1;
  const canImproveContent = formData.content.trim() && formData.content.replace(/<[^>]*>/g, '').trim().length >= 10;

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-lg sm:text-xl" suppressHydrationWarning>
          {t('blog_posts_page.create_page.basic_info.title')}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm" suppressHydrationWarning>
          {t('blog_posts_page.create_page.basic_info.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <Label htmlFor="title" className="text-xs sm:text-sm" suppressHydrationWarning>
              {t('blog_posts_page.create_page.basic_info.title_label')}
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onGenerateTitle}
              disabled={isGeneratingTitle || !canGenerateTitle}
              className="flex items-center gap-2 w-full sm:w-auto shrink-0"
            >
              {isGeneratingTitle ? (
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin shrink-0" />
              ) : (
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
              )}
              <span className="truncate text-xs sm:text-sm" suppressHydrationWarning>
                {isGeneratingTitle ? t('blog_posts_page.create_page.basic_info.generating_title') : t('blog_posts_page.create_page.basic_info.generate_title')}
              </span>
            </Button>
          </div>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={t('blog_posts_page.create_page.basic_info.title_placeholder')}
            className="w-full"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug" className="text-xs sm:text-sm" suppressHydrationWarning>
            {t('blog_posts_page.create_page.basic_info.slug_label')}
          </Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => onFormDataChange({ slug: e.target.value })}
            placeholder={t('blog_posts_page.create_page.basic_info.slug_placeholder')}
            className="w-full"
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <Label htmlFor="excerpt" className="text-xs sm:text-sm" suppressHydrationWarning>
              {t('blog_posts_page.create_page.basic_info.excerpt_label')}
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onGenerateExcerpt}
              disabled={isGeneratingExcerpt || !canGenerateExcerpt}
              className="flex items-center gap-2 w-full sm:w-auto shrink-0"
            >
              {isGeneratingExcerpt ? (
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin shrink-0" />
              ) : (
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
              )}
              <span className="truncate text-xs sm:text-sm" suppressHydrationWarning>
                {isGeneratingExcerpt ? t('blog_posts_page.create_page.basic_info.generating_excerpt') : t('blog_posts_page.create_page.basic_info.generate_excerpt')}
              </span>
            </Button>
          </div>
          <Textarea
            id="excerpt"
            value={formData.excerpt}
            onChange={(e) => onFormDataChange({ excerpt: e.target.value })}
            placeholder={t('blog_posts_page.create_page.basic_info.excerpt_placeholder')}
            rows={3}
            className="w-full"
            required
          />
          <p className="text-xs text-muted-foreground" suppressHydrationWarning>
            {t('blog_posts_page.create_page.basic_info.excerpt_helper')}
            <br />
            <strong suppressHydrationWarning>{t('blog_posts_page.create_page.basic_info.excerpt_note')}</strong>
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <Label htmlFor="content" className="text-xs sm:text-sm" suppressHydrationWarning>
              {t('blog_posts_page.create_page.basic_info.content_label')}
            </Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isImprovingContent || !canImproveContent}
                  className="flex items-center gap-2 w-full sm:w-auto shrink-0"
                >
                  {isImprovingContent ? (
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin shrink-0" />
                  ) : (
                    <Wand2 className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                  )}
                  <span className="truncate text-xs sm:text-sm" suppressHydrationWarning>
                    {isImprovingContent ? t('blog_posts_page.create_page.basic_info.improving') : t('blog_posts_page.create_page.basic_info.improve_content')}
                  </span>
                  <ChevronDown className="h-3 w-3 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 sm:w-56">
                <DropdownMenuItem onClick={() => onImproveContent('improve')} className="text-xs sm:text-sm" suppressHydrationWarning>
                  {t('blog_posts_page.create_page.basic_info.improve')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onImproveContent('rephrase')} className="text-xs sm:text-sm" suppressHydrationWarning>
                  {t('blog_posts_page.create_page.basic_info.rephrase')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onImproveContent('grammar')} className="text-xs sm:text-sm" suppressHydrationWarning>
                  {t('blog_posts_page.create_page.basic_info.grammar')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onImproveContent('shorten')} className="text-xs sm:text-sm" suppressHydrationWarning>
                  {t('blog_posts_page.create_page.basic_info.shorten')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onImproveContent('expand')} className="text-xs sm:text-sm" suppressHydrationWarning>
                  {t('blog_posts_page.create_page.basic_info.expand')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <TipTap
            value={formData.content}
            stickyTop="top-59"
            onChange={onContentChange}
          />
          <p className="text-xs text-muted-foreground" suppressHydrationWarning>
            {t('blog_posts_page.create_page.basic_info.content_helper')}
            <br />
            <strong suppressHydrationWarning>{t('blog_posts_page.create_page.basic_info.content_note')}</strong>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

