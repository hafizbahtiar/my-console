"use client";

import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/custom/status-badge";
import { SafeHTML } from "@/components/ui/safe-html";
import {
  User,
  Clock,
  Calendar,
  Eye,
  Heart,
  Tag,
} from "lucide-react";
import { useTranslation } from "@/lib/language-context";
import { BlogPost } from "@/app/auth/blog/blog-posts/types";

interface ViewContentTabProps {
  post: BlogPost;
  getCategoryName: (post: BlogPost) => string;
}

export function ViewContentTab({ post, getCategoryName }: ViewContentTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 sm:space-y-8">
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

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/30 rounded-lg">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
            {t('blog_posts_page.view_page.metadata.author')}
          </p>
          <div className="flex items-center gap-2">
            <User className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
            <span className="font-medium text-xs sm:text-sm truncate">{post.author}</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
            {t('blog_posts_page.view_page.metadata.category')}
          </p>
          <p className="font-medium text-xs sm:text-sm truncate">{getCategoryName(post)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
            {t('blog_posts_page.view_page.metadata.read_time')}
          </p>
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
            <span className="font-medium text-xs sm:text-sm">{post.readTime}</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
            {t('blog_posts_page.view_page.metadata.published_date')}
          </p>
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
            <span className="font-medium text-xs sm:text-sm" suppressHydrationWarning>
              {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : t('blog_posts_page.view_page.metadata.not_published')}
            </span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
            {t('blog_posts_page.view_page.metadata.views')}
          </p>
          <div className="flex items-center gap-2">
            <Eye className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
            <span className="font-medium text-xs sm:text-sm">{post.views}</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
            {t('blog_posts_page.view_page.metadata.likes')}
          </p>
          <div className="flex items-center gap-2">
            <Heart className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
            <span className="font-medium text-xs sm:text-sm">{post.likes}</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
            {t('blog_posts_page.view_page.metadata.status')}
          </p>
          <StatusBadge status={post.status} type="blog-post" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
            {t('blog_posts_page.view_page.metadata.featured')}
          </p>
          <p className="font-medium text-xs sm:text-sm" suppressHydrationWarning>
            {post.isFeatured ? t('yes') : t('no')}
          </p>
        </div>
      </div>

      {/* Tags */}
      {post.blogTags && post.blogTags.length > 0 && (
        <div className="space-y-2 sm:space-y-3">
          <h4 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2" suppressHydrationWarning>
            <Tag className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
            {t('blog_posts_page.view_page.tags')}
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
            {t('blog_posts_page.view_page.seo_information')}
          </h4>
          <div className="space-y-2 text-xs sm:text-sm">
            {post.seoTitle && (
              <div>
                <span className="font-medium" suppressHydrationWarning>
                  {t('blog_posts_page.view_page.seo_title')}
                </span>{' '}
                <span>{post.seoTitle}</span>
              </div>
            )}
            {post.seoDescription && (
              <div>
                <span className="font-medium" suppressHydrationWarning>
                  {t('blog_posts_page.view_page.seo_description')}
                </span>{' '}
                <span>{post.seoDescription}</span>
              </div>
            )}
            {post.seoKeywords.length > 0 && (
              <div>
                <span className="font-medium" suppressHydrationWarning>
                  {t('blog_posts_page.view_page.seo_keywords')}
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
          {t('content')}
        </h4>
        <div className="border rounded-lg p-4 sm:p-6 bg-background prose prose-sm max-w-none dark:prose-invert">
          <SafeHTML html={post.content} />
        </div>
      </div>

      {/* Related Posts */}
      {post.relatedPosts.length > 0 && (
        <div className="space-y-2 sm:space-y-3">
          <h4 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
            {t('blog_posts_page.view_page.related_posts')}
          </h4>
          <div className="text-xs sm:text-sm text-muted-foreground" suppressHydrationWarning>
            {t('blog_posts_page.view_page.related_posts_count', {
              count: post.relatedPosts.length.toString(),
              plural: post.relatedPosts.length !== 1 ? 's' : ''
            })}
          </div>
        </div>
      )}
    </div>
  );
}

