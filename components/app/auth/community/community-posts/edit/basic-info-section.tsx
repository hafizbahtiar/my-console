"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TipTap } from "@/components/ui/tiptap";
import { useTranslation } from "@/lib/language-context";
import { CommunityPostFormData } from "@/app/auth/community/community-posts/types";

interface BasicInfoSectionProps {
  formData: CommunityPostFormData;
  contentLength: number;
  maxContentLength: number;
  onFormDataChange: (data: Partial<CommunityPostFormData>) => void;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
}

export function BasicInfoSection({
  formData,
  contentLength,
  maxContentLength,
  onFormDataChange,
  onTitleChange,
  onContentChange,
}: BasicInfoSectionProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-lg sm:text-xl" suppressHydrationWarning>
          {t('community_posts_page.create_page.basic_info.title') || t('community_posts_page.edit_page.basic_info.title')}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm" suppressHydrationWarning>
          {t('community_posts_page.create_page.basic_info.description') || t('community_posts_page.edit_page.basic_info.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-xs sm:text-sm" suppressHydrationWarning>
            {t('title')} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={t('community_posts_page.create_page.basic_info.title_placeholder') || t('community_posts_page.edit_page.basic_info.title_placeholder')}
            className="w-full"
            required
            maxLength={200}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug" className="text-xs sm:text-sm" suppressHydrationWarning>
            {t('slug')} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => onFormDataChange({ slug: e.target.value })}
            placeholder={t('community_posts_page.create_page.basic_info.slug_placeholder') || t('community_posts_page.edit_page.basic_info.slug_placeholder')}
            className="w-full"
            required
            maxLength={200}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="excerpt" className="text-xs sm:text-sm" suppressHydrationWarning>
            {t('community_posts_page.edit_page.basic_info.excerpt_label')}
          </Label>
          <Textarea
            id="excerpt"
            value={formData.excerpt || ''}
            onChange={(e) => onFormDataChange({ excerpt: e.target.value })}
            placeholder={t('community_posts_page.create_page.basic_info.excerpt_placeholder') || t('community_posts_page.edit_page.basic_info.excerpt_placeholder')}
            rows={3}
            className="w-full"
            maxLength={500}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="content" className="text-xs sm:text-sm" suppressHydrationWarning>
              {t('content')} <span className="text-destructive">*</span>
            </Label>
            <span className={`text-xs ${contentLength > maxContentLength ? 'text-destructive' : 'text-muted-foreground'}`}>
              {contentLength} / {maxContentLength} {t('community_posts_page.create_page.basic_info.characters') || t('community_posts_page.edit_page.basic_info.characters')}
            </span>
          </div>
          <TipTap
            value={formData.content}
            stickyTop="top-48"
            onChange={onContentChange}
            placeholder={t('community_posts_page.create_page.basic_info.content_placeholder') || t('community_posts_page.edit_page.basic_info.content_placeholder')}
          />
          <p className="text-xs text-muted-foreground" suppressHydrationWarning>
            {t('community_posts_page.create_page.basic_info.content_helper', { max: maxContentLength.toString() }) || t('community_posts_page.edit_page.basic_info.content_helper', { max: maxContentLength.toString() })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

