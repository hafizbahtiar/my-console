"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare } from "lucide-react";
import { useTranslation } from "@/lib/language-context";
import { CommunityPostFormData } from "@/app/auth/community/community-posts/types";

interface TopicSectionProps {
  formData: CommunityPostFormData;
  topics: any[];
  onFormDataChange: (data: Partial<CommunityPostFormData>) => void;
}

export function TopicSection({
  formData,
  topics,
  onFormDataChange,
}: TopicSectionProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg" suppressHydrationWarning>
          <MessageSquare className="h-4 w-4 shrink-0" />
          {t('community_posts_page.create_page.topic.title') || t('community_posts_page.edit_page.topic.title')}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm" suppressHydrationWarning>
          {t('community_posts_page.create_page.topic.description') || t('community_posts_page.edit_page.topic.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-2">
          <Label htmlFor="topic" className="text-xs sm:text-sm" suppressHydrationWarning>
            {t('community_posts_page.create_page.topic.label') || t('community_posts_page.edit_page.topic.label')} ({t('optional')})
          </Label>
          <Select
            value={formData.communityTopics?.$id || ''}
            onValueChange={(value) => {
              const selectedTopic = topics.find(topic => topic.$id === value);
              onFormDataChange({ communityTopics: selectedTopic || null });
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('community_posts_page.create_page.topic.placeholder') || t('community_posts_page.edit_page.topic.placeholder')} />
            </SelectTrigger>
            <SelectContent>
              {topics.map((topic) => (
                <SelectItem key={topic.$id} value={topic.$id}>
                  {topic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {topics.length === 0 && (
            <p className="text-xs text-muted-foreground" suppressHydrationWarning>
              {t('community_posts_page.create_page.topic.no_topics') || t('community_posts_page.edit_page.topic.no_topics')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

