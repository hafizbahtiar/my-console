"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/language-context";
import { BlogTag } from "@/app/auth/blog/blog-posts/types";

interface TagsSectionProps {
  selectedTags: any[];
  availableTags: BlogTag[];
  tagInputValue: string;
  isTagInputFocused: boolean;
  onTagInputChange: (value: string) => void;
  onTagInputFocus: () => void;
  onTagInputBlur: () => void;
  onTagInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => Promise<void>;
  onAddTag: (tagName: string) => Promise<void>;
  onRemoveTag: (tagId: string) => void;
}

export function TagsSection({
  selectedTags,
  availableTags,
  tagInputValue,
  isTagInputFocused,
  onTagInputChange,
  onTagInputFocus,
  onTagInputBlur,
  onTagInputKeyDown,
  onAddTag,
  onRemoveTag,
}: TagsSectionProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-lg sm:text-xl" suppressHydrationWarning>
          {t('blog_posts_page.create_page.tags.title')}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm" suppressHydrationWarning>
          {t('blog_posts_page.create_page.tags.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm" suppressHydrationWarning>
            {t('add_item', { item: t('blog_posts_page.create_page.tags.title') })}
            </Label>
            <div className="relative">
              <Input
                placeholder={t('blog_posts_page.create_page.tags.add_tag_placeholder')}
                className="w-full"
                value={tagInputValue}
                onChange={(e) => onTagInputChange(e.target.value)}
                onFocus={onTagInputFocus}
                onBlur={onTagInputBlur}
                onKeyDown={onTagInputKeyDown}
              />
              {/* Tag suggestions - show when focused */}
              {isTagInputFocused && availableTags.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg max-h-40 overflow-y-auto z-10">
                  {availableTags
                    .filter(tag => {
                      const isNotSelected = !selectedTags.some((selectedTag: any) => selectedTag.$id === tag.$id);
                      const isActive = tag.isActive;
                      const matchesInput = !tagInputValue.trim() || tag.name.toLowerCase().includes(tagInputValue.toLowerCase());
                      return isNotSelected && isActive && matchesInput;
                    })
                    .slice(0, 10)
                    .map((tag) => (
                      <button
                        key={tag.$id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault(); // Prevent input blur
                          onAddTag(tag.name);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-xs sm:text-sm"
                      >
                        {tag.name}
                      </button>
                    ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground" suppressHydrationWarning>
              {t('blog_posts_page.create_page.tags.add_tag_placeholder')}
            </p>
          </div>

          {/* Display current tags */}
          {selectedTags.length > 0 ? (
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm text-muted-foreground" suppressHydrationWarning>
                {t('blog_posts_page.create_page.tags.title')}
              </Label>
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag: any) => (
                  <Badge
                    key={tag.$id}
                    variant="secondary"
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs sm:text-sm"
                  >
                    <span>{tag.name}</span>
                    <button
                      type="button"
                      onClick={() => onRemoveTag(tag.$id)}
                      className="ml-1 hover:opacity-70"
                      aria-label="Remove tag"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground" suppressHydrationWarning>
              {t('blog_posts_page.create_page.tags.no_tags')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

