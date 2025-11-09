"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Eye,
  Heart,
  Globe,
  TrendingUp,
} from "lucide-react";
import { useTranslation } from "@/lib/language-context";
import { ViewAnalytics, LikeAnalytics } from "@/app/auth/blog/blog-posts/types";

interface ViewAnalyticsTabProps {
  viewAnalytics: ViewAnalytics | null;
  likeAnalytics: LikeAnalytics | null;
}

export function ViewAnalyticsTab({ viewAnalytics, likeAnalytics }: ViewAnalyticsTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Analytics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium" suppressHydrationWarning>
              {t('blog_posts_page.view_page.analytics.total_views')}
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{viewAnalytics?.totalViews || 0}</div>
            <p className="text-xs text-muted-foreground" suppressHydrationWarning>
              {viewAnalytics?.uniqueViews || 0} {t('blog_posts_page.view_page.analytics.unique_views')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium" suppressHydrationWarning>
              {t('blog_posts_page.view_page.analytics.total_likes')}
            </CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{likeAnalytics?.activeLikes || 0}</div>
            <p className="text-xs text-muted-foreground" suppressHydrationWarning>
              {likeAnalytics?.totalLikes || 0} {t('blog_posts_page.view_page.analytics.total_interactions')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium" suppressHydrationWarning>
              {t('blog_posts_page.view_page.analytics.top_referrer')}
            </CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold truncate" suppressHydrationWarning>
              {viewAnalytics?.topReferrers[0]?.source || t('blog_posts_page.view_page.analytics.direct_traffic')}
            </div>
            <p className="text-xs text-muted-foreground" suppressHydrationWarning>
              {viewAnalytics?.topReferrers[0]?.count || 0} {t('blog_posts_page.view_page.analytics.views_count')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium" suppressHydrationWarning>
              {t('blog_posts_page.view_page.analytics.engagement_rate')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {viewAnalytics?.totalViews ?
                Math.round(((likeAnalytics?.activeLikes || 0) / viewAnalytics.totalViews) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground" suppressHydrationWarning>
              {t('blog_posts_page.view_page.analytics.likes_per_view')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        {/* View Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg" suppressHydrationWarning>
              {t('blog_posts_page.view_page.analytics.traffic_sources')}
            </CardTitle>
            <CardDescription suppressHydrationWarning>
              {t('blog_posts_page.view_page.analytics.traffic_sources_description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {viewAnalytics?.topReferrers.length ? (
              <div className="space-y-3">
                {viewAnalytics.topReferrers.map((referrer, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm truncate">{referrer.source}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-12 sm:w-16 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{
                            width: `${(referrer.count / (viewAnalytics.topReferrers[0]?.count || 1)) * 100}%`
                          }}
                        />
                      </div>
                      <span className="text-xs sm:text-sm font-medium w-6 sm:w-8 text-right">{referrer.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground" suppressHydrationWarning>
                {t('blog_posts_page.view_page.analytics.no_view_data')}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Geographic Data */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg" suppressHydrationWarning>
              {t('blog_posts_page.view_page.analytics.geographic_distribution')}
            </CardTitle>
            <CardDescription suppressHydrationWarning>
              {t('blog_posts_page.view_page.analytics.geographic_description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {viewAnalytics?.geographic.length ? (
              <div className="space-y-3">
                {viewAnalytics.geographic.slice(0, 5).map((geo, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm truncate">{geo.country}</span>
                    <span className="text-xs sm:text-sm font-medium shrink-0" suppressHydrationWarning>
                      {geo.count} {t('blog_posts_page.view_page.analytics.views_count')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground" suppressHydrationWarning>
                {t('blog_posts_page.view_page.analytics.no_geographic_data')}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Like Types */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg" suppressHydrationWarning>
              {t('blog_posts_page.view_page.analytics.like_distribution')}
            </CardTitle>
            <CardDescription suppressHydrationWarning>
              {t('blog_posts_page.view_page.analytics.like_distribution_description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {likeAnalytics?.likeTypes.length ? (
              <div className="space-y-3">
                {likeAnalytics.likeTypes.map((type, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm capitalize">{type.type}</span>
                    <span className="text-xs sm:text-sm font-medium shrink-0" suppressHydrationWarning>
                      {type.count} {t('blog_posts_page.view_page.analytics.views_count')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground" suppressHydrationWarning>
                {t('blog_posts_page.view_page.analytics.no_like_data')}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg" suppressHydrationWarning>
              {t('blog_posts_page.view_page.analytics.recent_activity')}
            </CardTitle>
            <CardDescription suppressHydrationWarning>
              {t('blog_posts_page.view_page.analytics.recent_activity_description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {viewAnalytics?.recentViews.slice(0, 3).map((view, index) => (
                <div key={index} className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground" suppressHydrationWarning>
                    {t('blog_posts_page.view_page.analytics.view')}
                  </span>
                  <span>{new Date(view.timestamp).toLocaleDateString()}</span>
                </div>
              ))}
              {likeAnalytics?.recentLikes.slice(0, 2).map((like, index) => (
                <div key={index} className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground capitalize">{like.type}</span>
                  <span>{new Date(like.timestamp).toLocaleDateString()}</span>
                </div>
              ))}
              {(!viewAnalytics?.recentViews.length && !likeAnalytics?.recentLikes.length) && (
                <p className="text-xs sm:text-sm text-muted-foreground" suppressHydrationWarning>
                  {t('blog_posts_page.view_page.analytics.no_recent_activity')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

