"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "@/lib/language-context";
import { Activity, HardDrive } from "lucide-react";
import type { PerformanceMetrics, StorageDistribution } from "@/app/auth/admin/database/types";

interface DatabasePerformanceProps {
  performanceMetrics: PerformanceMetrics | null;
  storageDistribution: StorageDistribution[];
}

export function DatabasePerformance({ performanceMetrics, storageDistribution }: DatabasePerformanceProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg" suppressHydrationWarning>
            {t('database_page.performance.query_performance')}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm" suppressHydrationWarning>
            {t('database_page.performance.query_performance_description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
          {performanceMetrics ? (
            <>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-xs sm:text-sm gap-2">
                  <span className="truncate flex-1" suppressHydrationWarning>
                    {t('database_page.performance.read_operations')}
                  </span>
                  <span className="shrink-0 font-semibold" suppressHydrationWarning>
                    {performanceMetrics.readOperations.time}ms {t('database_page.performance.avg')}
                  </span>
                </div>
                <Progress value={performanceMetrics.readOperations.performance} className="h-2" />
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-xs sm:text-sm gap-2">
                  <span className="truncate flex-1" suppressHydrationWarning>
                    {t('database_page.performance.write_operations')}
                  </span>
                  <span className="shrink-0 font-semibold" suppressHydrationWarning>
                    {performanceMetrics.writeOperations.time}ms {t('database_page.performance.avg')}
                  </span>
                </div>
                <Progress value={performanceMetrics.writeOperations.performance} className="h-2" />
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-xs sm:text-sm gap-2">
                  <span className="truncate flex-1" suppressHydrationWarning>
                    {t('database_page.performance.search_queries')}
                  </span>
                  <span className="shrink-0 font-semibold" suppressHydrationWarning>
                    {performanceMetrics.searchQueries.time}ms {t('database_page.performance.avg')}
                  </span>
                </div>
                <Progress value={performanceMetrics.searchQueries.performance} className="h-2" />
              </div>
            </>
          ) : (
            <div className="text-center text-muted-foreground py-6 sm:py-8">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs sm:text-sm" suppressHydrationWarning>
                {t('database_page.performance.loading_database_info')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg" suppressHydrationWarning>
            {t('database_page.performance.storage_distribution')}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm" suppressHydrationWarning>
            {t('database_page.performance.storage_distribution_description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
          {storageDistribution.length > 0 ? (
            storageDistribution.map((item) => (
              <div key={item.collection} className="space-y-2.5">
                <div className="flex justify-between items-center text-xs sm:text-sm gap-2">
                  <span className="truncate flex-1">{item.collection}</span>
                  <span className="shrink-0 font-semibold">{item.percentage}%</span>
                </div>
                <Progress value={item.percentage} className="h-2" />
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-6 sm:py-8">
              <HardDrive className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs sm:text-sm" suppressHydrationWarning>
                {t('database_page.performance.no_storage_data')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
