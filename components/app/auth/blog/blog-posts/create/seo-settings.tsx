"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/language-context";
import { BlogPostFormData } from "@/app/auth/blog/blog-posts/types";

interface SEOSettingsProps {
  formData: BlogPostFormData;
  seoSuggestions: any;
  showSEOSuggestions: boolean;
  isGeneratingSEOSuggestions: boolean;
  onFormDataChange: (data: Partial<BlogPostFormData>) => void;
  onGenerateSEOSuggestions: () => void;
  onCloseSuggestions: () => void;
}

export function SEOSettings({
  formData,
  seoSuggestions,
  showSEOSuggestions,
  isGeneratingSEOSuggestions,
  onFormDataChange,
  onGenerateSEOSuggestions,
  onCloseSuggestions,
}: SEOSettingsProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-lg sm:text-xl" suppressHydrationWarning>
              {t('blog_posts_page.create_page.seo.title')}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm" suppressHydrationWarning>
              {t('blog_posts_page.create_page.seo.description')}
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onGenerateSEOSuggestions}
            disabled={isGeneratingSEOSuggestions || !formData.title.trim() || !formData.content.trim()}
            className="flex items-center gap-2 w-full sm:w-auto shrink-0"
          >
            {isGeneratingSEOSuggestions ? (
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin shrink-0" />
            ) : (
              <Wand2 className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
            )}
            <span className="truncate text-xs sm:text-sm" suppressHydrationWarning>
              {isGeneratingSEOSuggestions ? t('blog_posts_page.create_page.seo.generating') : t('blog_posts_page.create_page.seo.get_suggestions')}
            </span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* SEO Suggestions Display */}
        {showSEOSuggestions && seoSuggestions && (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader className="p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg" suppressHydrationWarning>
                  {t('blog_posts_page.create_page.seo.suggestions_title')}
                </CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onCloseSuggestions}
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className={`text-2xl font-bold ${seoSuggestions.overall?.score >= 80 ? 'text-green-600' : seoSuggestions.overall?.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {seoSuggestions.overall?.score || 0}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground" suppressHydrationWarning>
                  {t('blog_posts_page.create_page.seo.overall_score')}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Title Suggestions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs sm:text-sm font-medium" suppressHydrationWarning>
                    {t('blog_posts_page.create_page.seo.title_label')}
                  </Label>
                  <Badge variant={seoSuggestions.title?.score >= 80 ? 'default' : seoSuggestions.title?.score >= 60 ? 'secondary' : 'destructive'}>
                    {seoSuggestions.title?.score || 0}/100
                  </Badge>
                </div>
                {seoSuggestions.title?.suggested && (
                  <div className="space-y-2">
                    <Input
                      value={seoSuggestions.title.suggested}
                      readOnly
                      className="text-xs sm:text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onFormDataChange({ seoTitle: seoSuggestions.title.suggested });
                        toast.success(t('blog_posts_page.create_page.seo.suggestion_applied'));
                      }}
                      className="w-full text-xs"
                      suppressHydrationWarning
                    >
                      {t('blog_posts_page.create_page.seo.apply_suggestion')}
                    </Button>
                  </div>
                )}
                {seoSuggestions.title?.feedback && seoSuggestions.title.feedback.length > 0 && (
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {seoSuggestions.title.feedback.map((fb: string, idx: number) => (
                      <li key={idx}>• {fb}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Description Suggestions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs sm:text-sm font-medium" suppressHydrationWarning>
                    {t('blog_posts_page.create_page.seo.meta_description_label')}
                  </Label>
                  <Badge variant={seoSuggestions.description?.score >= 80 ? 'default' : seoSuggestions.description?.score >= 60 ? 'secondary' : 'destructive'}>
                    {seoSuggestions.description?.score || 0}/100
                  </Badge>
                </div>
                {seoSuggestions.description?.suggested && (
                  <div className="space-y-2">
                    <Textarea
                      value={seoSuggestions.description.suggested}
                      readOnly
                      rows={3}
                      className="text-xs sm:text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onFormDataChange({ seoDescription: seoSuggestions.description.suggested });
                        toast.success(t('blog_posts_page.create_page.seo.suggestion_applied'));
                      }}
                      className="w-full text-xs"
                      suppressHydrationWarning
                    >
                      {t('blog_posts_page.create_page.seo.apply_suggestion')}
                    </Button>
                  </div>
                )}
                {seoSuggestions.description?.feedback && seoSuggestions.description.feedback.length > 0 && (
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {seoSuggestions.description.feedback.map((fb: string, idx: number) => (
                      <li key={idx}>• {fb}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Keywords Suggestions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs sm:text-sm font-medium" suppressHydrationWarning>
                    {t('blog_posts_page.create_page.seo.keywords_label')}
                  </Label>
                  <Badge variant={seoSuggestions.keywords?.score >= 80 ? 'default' : seoSuggestions.keywords?.score >= 60 ? 'secondary' : 'destructive'}>
                    {seoSuggestions.keywords?.score || 0}/100
                  </Badge>
                </div>
                {seoSuggestions.keywords?.suggested && seoSuggestions.keywords.suggested.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {seoSuggestions.keywords.suggested.map((keyword: string, idx: number) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                          onClick={() => {
                            if (!formData.seoKeywords.includes(keyword)) {
                              onFormDataChange({ seoKeywords: [...formData.seoKeywords, keyword] });
                              toast.success(t('blog_posts_page.create_page.seo.keyword_added'));
                            }
                          }}
                        >
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {seoSuggestions.keywords?.feedback && seoSuggestions.keywords.feedback.length > 0 && (
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {seoSuggestions.keywords.feedback.map((fb: string, idx: number) => (
                      <li key={idx}>• {fb}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Overall Feedback */}
              {seoSuggestions.overall?.feedback && seoSuggestions.overall.feedback.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <Label className="text-xs sm:text-sm font-medium" suppressHydrationWarning>
                    {t('blog_posts_page.create_page.seo.overall_feedback')}
                  </Label>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {seoSuggestions.overall.feedback.map((fb: string, idx: number) => (
                      <li key={idx}>• {fb}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          <Label htmlFor="seoTitle" className="text-xs sm:text-sm" suppressHydrationWarning>
            {t('blog_posts_page.create_page.seo.seo_title_label')}
          </Label>
          <Input
            id="seoTitle"
            value={formData.seoTitle}
            onChange={(e) => onFormDataChange({ seoTitle: e.target.value })}
            placeholder={t('blog_posts_page.create_page.seo.seo_title_placeholder')}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="seoDescription" className="text-xs sm:text-sm" suppressHydrationWarning>
            {t('blog_posts_page.create_page.seo.seo_description_label')}
          </Label>
          <Textarea
            id="seoDescription"
            value={formData.seoDescription}
            onChange={(e) => onFormDataChange({ seoDescription: e.target.value })}
            placeholder={t('blog_posts_page.create_page.seo.seo_description_placeholder')}
            rows={2}
            className="w-full"
          />
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm" suppressHydrationWarning>
              {t('blog_posts_page.create_page.seo.add_keywords_label')}
            </Label>
            <Input
              placeholder={t('blog_posts_page.create_page.seo.keywords_placeholder')}
              className="w-full"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const value = (e.target as HTMLInputElement).value.trim();
                  if (value && !formData.seoKeywords.includes(value)) {
                    onFormDataChange({ seoKeywords: [...formData.seoKeywords, value] });
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
            />
          </div>

          {/* Display current SEO keywords */}
          {formData.seoKeywords.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm text-muted-foreground" suppressHydrationWarning>
                {t('blog_posts_page.create_page.seo.current_keywords')}
              </Label>
              <div className="flex flex-wrap gap-2">
                {formData.seoKeywords.map((keyword, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs sm:text-sm"
                  >
                    <span>{keyword}</span>
                    <button
                      type="button"
                      onClick={() => {
                        onFormDataChange({
                          seoKeywords: formData.seoKeywords.filter((_, i) => i !== index)
                        });
                      }}
                      className="ml-1 hover:opacity-70"
                      aria-label="Remove keyword"
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

