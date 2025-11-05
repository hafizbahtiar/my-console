"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, HardDrive } from "lucide-react";
import { useTranslation } from "@/lib/language-context";
import type { PerformanceMetrics, StorageDistribution } from "@/app/auth/admin/database/types";

interface DatabasePerformanceProps {
  performanceMetrics: PerformanceMetrics | null;
  storageDistribution: StorageDistribution[];
}

export function DatabasePerformance({ performanceMetrics, storageDistribution }: DatabasePerformanceProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t("database.query_performance")}</CardTitle>
          <CardDescription>{t("database.average_query_response_times")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {performanceMetrics ? (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t("database.read_operations")}</span>
                  <span>{performanceMetrics.readOperations.time}ms {t("database.avg")}</span>
                </div>
                <Progress value={performanceMetrics.readOperations.performance} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t("database.write_operations")}</span>
                  <span>{performanceMetrics.writeOperations.time}ms {t("database.avg")}</span>
                </div>
                <Progress value={performanceMetrics.writeOperations.performance} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t("database.search_queries")}</span>
                  <span>{performanceMetrics.searchQueries.time}ms {t("database.avg")}</span>
                </div>
                <Progress value={performanceMetrics.searchQueries.performance} className="h-2" />
              </div>
            </>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{t("database.loading_database_information")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("database.storage_distribution")}</CardTitle>
          <CardDescription>{t("database.data_distribution_across_collections")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {storageDistribution.length > 0 ? (
            storageDistribution.map((item) => (
              <div key={item.collection} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{item.collection}</span>
                  <span>{item.percentage}%</span>
                </div>
                <Progress value={item.percentage} className="h-2" />
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-4">
              <HardDrive className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{t("database.no_storage_data_available")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
