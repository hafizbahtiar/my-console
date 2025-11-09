"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, MessageSquare, Users, Activity, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/language-context";

interface DashboardStats {
  totalBlogPosts: number;
  totalCommunityPosts: number;
  totalUsers: number;
  activeUsers: number;
  myBlogPosts: number;
  myCommunityPosts: number;
}

interface StatsCardsProps {
  stats: DashboardStats;
  isLoadingStats: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
}

export function StatsCards({ stats, isLoadingStats, isSuperAdmin, isAdmin }: StatsCardsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium" suppressHydrationWarning>
            {(isSuperAdmin || isAdmin) ? t('dashboard_page.stats.total_users') : t('dashboard_page.stats.my_posts')}
          </CardTitle>
          {(isSuperAdmin || isAdmin) ? (
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">
            {isLoadingStats ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              (isSuperAdmin || isAdmin) ? stats.totalUsers : (stats.myBlogPosts + stats.myCommunityPosts)
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
            {(isSuperAdmin || isAdmin)
              ? t('dashboard_page.stats.active_users_count', { count: stats.activeUsers.toString() })
              : t('dashboard_page.stats.my_posts_count', { 
                  blog: stats.myBlogPosts.toString(), 
                  community: stats.myCommunityPosts.toString() 
                })
            }
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium" suppressHydrationWarning>
            {t('dashboard_page.stats.blog_posts')}
          </CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">
            {isLoadingStats ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              stats.totalBlogPosts
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
            {(isSuperAdmin || isAdmin) ? t('dashboard_page.stats.total_posts') : t('dashboard_page.stats.my_posts_label')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium" suppressHydrationWarning>
            {t('dashboard_page.stats.community_posts')}
          </CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">
            {isLoadingStats ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              stats.totalCommunityPosts
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
            {(isSuperAdmin || isAdmin) ? t('dashboard_page.stats.total_posts') : t('dashboard_page.stats.my_posts_label')}
          </p>
        </CardContent>
      </Card>

      {(isSuperAdmin || isAdmin) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium" suppressHydrationWarning>
              {t('dashboard_page.stats.active_users')}
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {isLoadingStats ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                stats.activeUsers
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
              {t('dashboard_page.stats.last_30_days')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

