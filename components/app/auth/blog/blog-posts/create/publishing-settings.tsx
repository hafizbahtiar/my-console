"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "@/lib/language-context";
import { BlogPostFormData } from "@/app/auth/blog/blog-posts/types";

interface PublishingSettingsProps {
  formData: BlogPostFormData;
  categories: any[];
  onFormDataChange: (data: Partial<BlogPostFormData>) => void;
}

export function PublishingSettings({
  formData,
  categories,
  onFormDataChange,
}: PublishingSettingsProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Publishing Settings */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl" suppressHydrationWarning>
            {t('blog_posts_page.create_page.publishing.title')}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm" suppressHydrationWarning>
            {t('blog_posts_page.create_page.publishing.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          <div className="space-y-2">
            <Label htmlFor="status" className="text-xs sm:text-sm" suppressHydrationWarning>
              {t('blog_posts_page.create_page.publishing.status_label')}
            </Label>
            <Select value={formData.status} onValueChange={(value: any) => onFormDataChange({ status: value })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft" suppressHydrationWarning>{t('draft')}</SelectItem>
                <SelectItem value="published" suppressHydrationWarning>{t('published')}</SelectItem>
                <SelectItem value="archived" suppressHydrationWarning>{t('archived')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="featured"
              checked={formData.isFeatured}
              onCheckedChange={(checked) => onFormDataChange({ isFeatured: checked as boolean })}
            />
            <Label htmlFor="featured" className="text-xs sm:text-sm font-normal cursor-pointer" suppressHydrationWarning>
              {t('blog_posts_page.create_page.publishing.is_featured_label')}
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="comments"
              checked={formData.allowComments}
              onCheckedChange={(checked) => onFormDataChange({ allowComments: checked as boolean })}
            />
            <Label htmlFor="comments" className="text-xs sm:text-sm font-normal cursor-pointer" suppressHydrationWarning>
              {t('blog_posts_page.create_page.publishing.allow_comments_label')}
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl" suppressHydrationWarning>
            {t('blog_posts_page.create_page.publishing.title')}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm" suppressHydrationWarning>
            {t('blog_posts_page.create_page.publishing.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          <div className="space-y-2">
            <Label htmlFor="author" className="text-xs sm:text-sm" suppressHydrationWarning>
              {t('blog_posts_page.create_page.publishing.author_label')}
            </Label>
            <Input
              id="author"
              value={formData.author}
              onChange={(e) => onFormDataChange({ author: e.target.value })}
              placeholder={t('blog_posts_page.create_page.publishing.author_placeholder')}
              className="w-full"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="readTime" className="text-xs sm:text-sm" suppressHydrationWarning>
              {t('blog_posts_page.create_page.publishing.read_time_label')}
            </Label>
            <div className="relative">
              <Input
                id="readTime"
                value={formData.readTime}
                readOnly
                className="w-full bg-muted/50 cursor-not-allowed pr-16 sm:pr-20 text-xs sm:text-sm"
              />
              <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shrink-0"></div>
                <span className="hidden sm:inline" suppressHydrationWarning>
                  {t('blog_posts_page.create_page.publishing.read_time_auto_calculated')}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground" suppressHydrationWarning>
              {t('blog_posts_page.create_page.publishing.read_time_helper')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-xs sm:text-sm" suppressHydrationWarning>
              {t('blog_posts_page.create_page.publishing.category_label')}
            </Label>
            <Select
              value={formData.blogCategories?.$id || ''}
              onValueChange={(value) => {
                const selectedCategory = categories.find(cat => cat.$id === value);
                onFormDataChange({ blogCategories: selectedCategory || null });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('blog_posts_page.create_page.publishing.category_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.$id} value={category.$id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="featuredImage" className="text-xs sm:text-sm" suppressHydrationWarning>
              {t('blog_posts_page.create_page.publishing.featured_image_label')}
            </Label>
            <Input
              id="featuredImage"
              value={formData.featuredImage}
              onChange={(e) => onFormDataChange({ featuredImage: e.target.value })}
              placeholder={t('blog_posts_page.create_page.publishing.featured_image_placeholder')}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground" suppressHydrationWarning>
              {t('blog_posts_page.create_page.publishing.featured_image_helper')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="featuredImageAlt" className="text-xs sm:text-sm" suppressHydrationWarning>
              {t('blog_posts_page.create_page.publishing.featured_image_alt_label')}
            </Label>
            <Input
              id="featuredImageAlt"
              value={formData.featuredImageAlt}
              onChange={(e) => onFormDataChange({ featuredImageAlt: e.target.value })}
              placeholder={t('blog_posts_page.create_page.publishing.featured_image_alt_placeholder')}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
}

