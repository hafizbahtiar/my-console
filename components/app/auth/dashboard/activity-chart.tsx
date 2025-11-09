"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingUp, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/language-context";

interface ChartData {
  date: string;
  blogPosts: number;
  communityPosts: number;
  users: number;
}

interface ActivityChartProps {
  chartData: ChartData[];
  isLoadingStats: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
}

export function ActivityChart({ chartData, isLoadingStats, isSuperAdmin, isAdmin }: ActivityChartProps) {
  const { t } = useTranslation();

  const chartConfig = {
    blogPosts: {
      label: t('dashboard_page.charts.blog_posts'),
      color: "hsl(var(--chart-1))",
    },
    communityPosts: {
      label: t('dashboard_page.charts.community_posts'),
      color: "hsl(var(--chart-2))",
    },
    users: {
      label: t('dashboard_page.charts.users'),
      color: "hsl(var(--chart-3))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg" suppressHydrationWarning>
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
          {t('dashboard_page.charts.activity_over_time')}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm" suppressHydrationWarning>
          {t('dashboard_page.charts.last_7_days')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingStats ? (
          <div className="flex items-center justify-center h-[250px] sm:h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] min-w-[300px]">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="blogPosts"
                  stroke="var(--color-blogPosts)"
                  strokeWidth={2}
                  name={t('dashboard_page.charts.blog_posts')}
                />
                <Line
                  type="monotone"
                  dataKey="communityPosts"
                  stroke="var(--color-communityPosts)"
                  strokeWidth={2}
                  name={t('dashboard_page.charts.community_posts')}
                />
                {(isSuperAdmin || isAdmin) && (
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="var(--color-users)"
                    strokeWidth={2}
                    name={t('dashboard_page.charts.users')}
                  />
                )}
              </LineChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

