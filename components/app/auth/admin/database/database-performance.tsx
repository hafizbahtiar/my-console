"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, HardDrive } from "lucide-react";
import type { PerformanceMetrics, StorageDistribution } from "@/app/auth/admin/database/types";

interface DatabasePerformanceProps {
  performanceMetrics: PerformanceMetrics | null;
  storageDistribution: StorageDistribution[];
}

export function DatabasePerformance({ performanceMetrics, storageDistribution }: DatabasePerformanceProps) {
  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Query Performance</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Average query response times</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
          {performanceMetrics ? (
            <>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-xs sm:text-sm gap-2">
                  <span className="truncate flex-1">Read Operations</span>
                  <span className="shrink-0 font-semibold">{performanceMetrics.readOperations.time}ms avg</span>
                </div>
                <Progress value={performanceMetrics.readOperations.performance} className="h-2" />
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-xs sm:text-sm gap-2">
                  <span className="truncate flex-1">Write Operations</span>
                  <span className="shrink-0 font-semibold">{performanceMetrics.writeOperations.time}ms avg</span>
                </div>
                <Progress value={performanceMetrics.writeOperations.performance} className="h-2" />
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-xs sm:text-sm gap-2">
                  <span className="truncate flex-1">Search Queries</span>
                  <span className="shrink-0 font-semibold">{performanceMetrics.searchQueries.time}ms avg</span>
                </div>
                <Progress value={performanceMetrics.searchQueries.performance} className="h-2" />
              </div>
            </>
          ) : (
            <div className="text-center text-muted-foreground py-6 sm:py-8">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs sm:text-sm">Loading database information...</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Storage Distribution</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Data distribution across collections</CardDescription>
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
              <p className="text-xs sm:text-sm">No storage data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
