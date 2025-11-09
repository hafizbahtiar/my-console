"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Hash } from "lucide-react";
import { useTranslation } from "@/lib/language-context";
import { CommunityPostFormData } from "@/app/auth/community/community-posts/types";

interface TagsSectionProps {
  formData: CommunityPostFormData;
  maxTagLength: number;
  onAddTag: (tag: string) => void;
  onRemoveTag: (index: number) => void;
}

export function TagsSection({
  formData,
  maxTagLength,
  onAddTag,
  onRemoveTag,
}: TagsSectionProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg" suppressHydrationWarning>
          <Hash className="h-4 w-4 shrink-0" />
          {t('community_posts_page.create_page.tags.title') || t('community_posts_page.edit_page.tags.title')}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm" suppressHydrationWarning>
          {t('community_posts_page.create_page.tags.description', { max: maxTagLength.toString() }) || t('community_posts_page.edit_page.tags.description', { max: maxTagLength.toString() })}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm" suppressHydrationWarning>
              {t('community_posts_page.create_page.tags.add_label') || t('community_posts_page.edit_page.tags.add_label')}
            </Label>
            <Input
              placeholder={t('community_posts_page.create_page.tags.placeholder', { max: maxTagLength.toString() }) || t('community_posts_page.edit_page.tags.placeholder', { max: maxTagLength.toString() })}
              maxLength={maxTagLength}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const value = (e.target as HTMLInputElement).value.trim();
                  if (value) {
                    onAddTag(value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
            />
            <p className="text-xs text-muted-foreground" suppressHydrationWarning>
              {t('community_posts_page.create_page.tags.helper') || t('community_posts_page.edit_page.tags.helper')}
            </p>
          </div>

          {formData.tags.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm text-muted-foreground" suppressHydrationWarning>
                {t('community_posts_page.create_page.tags.current_label') || t('community_posts_page.edit_page.tags.current_label')}
              </Label>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => onRemoveTag(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

