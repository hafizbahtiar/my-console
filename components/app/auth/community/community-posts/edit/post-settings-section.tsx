"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "@/lib/language-context";
import { CommunityPostFormData } from "@/app/auth/community/community-posts/types";

interface PostSettingsSectionProps {
  formData: CommunityPostFormData;
  onFormDataChange: (data: Partial<CommunityPostFormData>) => void;
}

export function PostSettingsSection({
  formData,
  onFormDataChange,
}: PostSettingsSectionProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-base sm:text-lg" suppressHydrationWarning>
          {t('community_posts_page.edit_page.settings.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6">
        <div className="space-y-2">
          <Label className="text-xs sm:text-sm" suppressHydrationWarning>
            {t('status')}
          </Label>
          <Select
            value={formData.status}
            onValueChange={(value: any) => onFormDataChange({ status: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending" suppressHydrationWarning>{t('pending')}</SelectItem>
              <SelectItem value="approved" suppressHydrationWarning>{t('approved')}</SelectItem>
              <SelectItem value="rejected" suppressHydrationWarning>{t('rejected')}</SelectItem>
              <SelectItem value="archived" suppressHydrationWarning>{t('archived')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPinned"
              checked={formData.isPinned}
              onCheckedChange={(checked) => onFormDataChange({ isPinned: checked as boolean })}
            />
            <Label htmlFor="isPinned" className="cursor-pointer text-xs sm:text-sm" suppressHydrationWarning>
              {t('community_posts_page.edit_page.settings.pin_post')}
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isLocked"
              checked={formData.isLocked}
              onCheckedChange={(checked) => onFormDataChange({ isLocked: checked as boolean })}
            />
            <Label htmlFor="isLocked" className="cursor-pointer text-xs sm:text-sm" suppressHydrationWarning>
              {t('community_posts_page.edit_page.settings.lock_post')}
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isFeatured"
              checked={formData.isFeatured}
              onCheckedChange={(checked) => onFormDataChange({ isFeatured: checked as boolean })}
            />
            <Label htmlFor="isFeatured" className="cursor-pointer text-xs sm:text-sm" suppressHydrationWarning>
              {t('community_posts_page.edit_page.settings.feature_post')}
            </Label>
          </div>
        </div>

        {formData.author && (
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm" suppressHydrationWarning>
              {t('author')}
            </Label>
            <Input
              value={formData.author}
              onChange={(e) => onFormDataChange({ author: e.target.value })}
              placeholder={t('community_posts_page.edit_page.settings.author_placeholder')}
              maxLength={100}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

