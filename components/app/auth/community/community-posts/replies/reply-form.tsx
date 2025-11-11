"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/lib/language-context";
import { toast } from "sonner";

interface ReplyFormProps {
  postId: string;
  parentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReplyForm({ postId, parentId, onSuccess, onCancel }: ReplyFormProps) {
  const { t } = useTranslation();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error(t('community_posts_page.replies.content_required'));
      return;
    }

    if (content.length > 5000) {
      toast.error(t('community_posts_page.replies.content_too_long', { max: 5000 }));
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/community/posts/${postId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          parentId: parentId || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create reply');
      }

      toast.success(t('community_posts_page.replies.created_success'));
      setContent("");
      onSuccess?.();
    } catch (error: any) {
      console.error('Failed to create reply:', error);
      toast.error(error.message || t('community_posts_page.replies.created_failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t('community_posts_page.replies.placeholder')}
        rows={4}
        maxLength={5000}
        disabled={isSubmitting}
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {content.length} / 5000 {t('community_posts_page.replies.characters')}
        </p>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {t('cancel')}
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting || !content.trim()}
          >
            {isSubmitting ? t('community_posts_page.replies.submitting') : t('community_posts_page.replies.submit')}
          </Button>
        </div>
      </div>
    </form>
  );
}

