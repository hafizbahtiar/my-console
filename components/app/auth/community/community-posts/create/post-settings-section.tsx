"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
          {t('community_posts_page.create_page.settings.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6">
        <div className="space-y-2">
          <Label className="text-xs sm:text-sm" suppressHydrationWarning>
            {t('status')}
          </Label>
          <div className="p-3 bg-muted rounded-md">
            <Badge variant="secondary" suppressHydrationWarning>
              {t('pending')}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2" suppressHydrationWarning>
              {t('community_posts_page.create_page.settings.pending_message')}
            </p>
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
              placeholder={t('community_posts_page.create_page.settings.author_placeholder')}
              maxLength={100}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

