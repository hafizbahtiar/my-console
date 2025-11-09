"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/custom/status-badge";
import { SafeHTML } from "@/components/ui/safe-html";
import { Edit, Eye, Heart } from "lucide-react";
import { useTranslation } from "@/lib/language-context";
import { BlogPost } from "@/app/auth/blog/blog-posts/types";

interface ViewPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: BlogPost | null;
  getCategoryName: (post: BlogPost) => string;
}

export function ViewPostDialog({
  open,
  onOpenChange,
  post,
  getCategoryName,
}: ViewPostDialogProps) {
  const { t } = useTranslation();

  if (!post) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1200px] max-h-[95vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-3 sm:space-y-4 px-0 sm:px-0">
          <div className="space-y-2">
            <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold leading-tight">
              {post.title}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              {post.excerpt}
            </DialogDescription>
          </div>

          {/* Featured Image */}
          {post.featuredImage && (
            <div className="relative">
              <img
                src={post.featuredImage}
                alt={post.featuredImageAlt || post.title}
                className="w-full h-48 sm:h-64 object-cover rounded-lg shadow-md"
              />
              {post.featuredImageAlt && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-2 italic">
                  {post.featuredImageAlt}
                </p>
              )}
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 md:space-y-8 py-4 sm:py-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/30 rounded-lg">
            <div className="space-y-1">
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
                {t('blog_posts_page.view_dialog.author')}
              </p>
              <p className="font-medium text-xs sm:text-sm">{post.author}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
                {t('blog_posts_page.view_dialog.status')}
              </p>
              <StatusBadge status={post.status} type="blog-post" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
                {t('blog_posts_page.view_dialog.category')}
              </p>
              <p className="font-medium text-xs sm:text-sm">{getCategoryName(post)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
                {t('blog_posts_page.view_dialog.read_time')}
              </p>
              <p className="font-medium text-xs sm:text-sm">{post.readTime}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
                {t('blog_posts_page.view_dialog.views')}
              </p>
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="font-medium text-xs sm:text-sm">{post.views}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
                {t('blog_posts_page.view_dialog.likes')}
              </p>
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                <span className="font-medium text-xs sm:text-sm">{post.likes}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
                {t('blog_posts_page.view_dialog.published_date')}
              </p>
              <p className="font-medium text-xs sm:text-sm" suppressHydrationWarning>
                {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : t('blog_posts_page.view_dialog.not_published')}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
                {t('blog_posts_page.view_dialog.featured')}
              </p>
              <p className="font-medium text-xs sm:text-sm" suppressHydrationWarning>
                {post.isFeatured ? t('yes') : t('no')}
              </p>
            </div>
          </div>

          {/* Tags */}
          {post.blogTags && post.blogTags.length > 0 && (
            <div className="space-y-2 sm:space-y-3">
              <h4 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
                {t('blog_posts_page.view_dialog.tags')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {post.blogTags.map((tag: any) => (
                  <Badge key={tag.$id} variant="secondary" className="text-xs sm:text-sm">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* SEO Information */}
          {(post.seoTitle || post.seoDescription || post.seoKeywords.length > 0) && (
            <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 border rounded-lg bg-muted/20">
              <h4 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
                {t('blog_posts_page.view_dialog.seo_information')}
              </h4>
              <div className="space-y-2 text-xs sm:text-sm">
                {post.seoTitle && (
                  <div>
                    <span className="font-medium" suppressHydrationWarning>
                      {t('blog_posts_page.view_dialog.seo_title')}
                    </span> {post.seoTitle}
                  </div>
                )}
                {post.seoDescription && (
                  <div>
                    <span className="font-medium" suppressHydrationWarning>
                      {t('blog_posts_page.view_dialog.seo_description')}
                    </span> {post.seoDescription}
                  </div>
                )}
                {post.seoKeywords.length > 0 && (
                  <div>
                    <span className="font-medium" suppressHydrationWarning>
                      {t('blog_posts_page.view_dialog.seo_keywords')}
                    </span>{' '}
                    <div className="inline-flex flex-wrap gap-1 mt-1">
                      {post.seoKeywords.map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="space-y-2 sm:space-y-3">
            <h4 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
              {t('blog_posts_page.view_dialog.content')}
            </h4>
            <div className="border rounded-lg p-3 sm:p-4 md:p-6 bg-background prose prose-sm max-w-none dark:prose-invert">
              <SafeHTML html={post.content} />
            </div>
          </div>

          {/* Related Posts */}
          {post.relatedPosts.length > 0 && (
            <div className="space-y-2 sm:space-y-3">
              <h4 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
                {t('blog_posts_page.view_dialog.related_posts')}
              </h4>
              <div className="text-xs sm:text-sm text-muted-foreground" suppressHydrationWarning>
                {t('blog_posts_page.view_dialog.related_posts_count', {
                  count: post.relatedPosts.length.toString(),
                  plural: post.relatedPosts.length !== 1 ? 's' : ''
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4 sm:pt-6 flex-col sm:flex-row gap-3 sm:gap-2">
          <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1" suppressHydrationWarning>
            {t('blog_posts_page.view_dialog.updated', {
              date: post.$updatedAt ? new Date(post.$updatedAt).toLocaleString() : t('blog_posts_page.view_dialog.unknown')
            })}
          </div>
          <div className="flex gap-2 w-full sm:w-auto order-1 sm:order-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-initial" suppressHydrationWarning>
              {t('close')}
            </Button>
            <Button asChild className="flex-1 sm:flex-initial">
              <Link href={`/auth/blog/blog-posts/${post.$id}/edit`}>
                <Edit className="h-4 w-4 mr-2 shrink-0" />
                <span className="truncate" suppressHydrationWarning>
                  {t('edit')}
                </span>
              </Link>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

