"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/language-context";
import { BlogPostFormData } from "@/app/auth/blog/blog-posts/types";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Update preview when featuredImage or featuredImageFile changes
  useEffect(() => {
    if (formData.featuredImageFile) {
      // Create preview from File object
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(formData.featuredImageFile);
    } else if (formData.featuredImage) {
      // Use existing URL
      setPreviewUrl(formData.featuredImage);
    } else {
      setPreviewUrl(null);
    }
  }, [formData.featuredImageFile, formData.featuredImage]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t('blog_posts_page.create_page.publishing.upload_invalid_type'));
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error(t('blog_posts_page.create_page.publishing.upload_file_too_large'));
      return;
    }

    // Store file temporarily (will be uploaded on save)
    onFormDataChange({ 
      featuredImageFile: file,
      featuredImage: '' // Clear existing URL if any
    });

    toast.success(t('blog_posts_page.create_page.publishing.image_selected'));
  };

  const handleRemoveImage = () => {
    onFormDataChange({ 
      featuredImage: '', 
      featuredImageAlt: '',
      featuredImageFile: undefined
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

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
              value={typeof formData.blogCategories === 'object' ? formData.blogCategories?.$id || '' : formData.blogCategories || ''}
              onValueChange={(value) => {
                const selected = categories.find(cat => cat.$id === value);
                onFormDataChange({ blogCategories: selected || null });
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

            {/* File Upload Section */}
            <div className="space-y-3">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Upload Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleUploadClick}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                <span suppressHydrationWarning>
                  {t('blog_posts_page.create_page.publishing.upload_image')}
                </span>
              </Button>

              {/* Image Preview */}
              {previewUrl && (
                <div className="relative border rounded-lg overflow-hidden bg-muted/50">
                  <div className="aspect-video relative w-full">
                    <img
                      src={previewUrl}
                      alt={formData.featuredImageAlt || 'Featured image preview'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // If image fails to load, show placeholder
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    {formData.featuredImageFile && (
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {t('blog_posts_page.create_page.publishing.image_will_upload_on_save')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* URL Input (Fallback) */}
              <div className="space-y-1">
                <Label htmlFor="featuredImageUrl" className="text-xs text-muted-foreground" suppressHydrationWarning>
                  {t('blog_posts_page.create_page.publishing.featured_image_url_label')}
                </Label>
                <Input
                  id="featuredImageUrl"
                  value={formData.featuredImage}
                  onChange={(e) => onFormDataChange({ featuredImage: e.target.value })}
                  placeholder={t('blog_posts_page.create_page.publishing.featured_image_placeholder')}
                  className="w-full"
                />
              </div>
            </div>

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

