"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";
import { BarChart3, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/language-context";

interface ContentDistribution {
  name: string;
  value: number;
  color: string;
}

interface ContentDistributionChartProps {
  contentDistribution: ContentDistribution[];
  isLoadingStats: boolean;
}

export function ContentDistributionChart({ contentDistribution, isLoadingStats }: ContentDistributionChartProps) {
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
          <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
          {t('dashboard_page.charts.content_distribution')}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm" suppressHydrationWarning>
          {t('dashboard_page.charts.content_overview')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingStats ? (
          <div className="flex items-center justify-center h-[250px] sm:h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : contentDistribution.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px]">
            <PieChart>
              <Pie
                data={contentDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {contentDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-[250px] sm:h-[300px] text-muted-foreground text-sm" suppressHydrationWarning>
            {t('dashboard_page.charts.no_data')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

