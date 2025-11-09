"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  Database,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  Trash2,
  Loader2,
} from "lucide-react";
import { useTranslation } from "@/lib/language-context";
import { toast } from "sonner";

interface QueryStats {
  totalQueries: number;
  averageExecutionTime: number;
  slowQueries: number;
  cacheHits: number;
  cacheMisses: number;
  queriesByCollection: Record<string, number>;
  averageExecutionTimeByCollection: Record<string, number>;
}

interface SlowQuery {
  query: string;
  collection: string;
  executionTime: number;
  timestamp: Date;
  threshold: number;
}

interface MonitoringData {
  stats: QueryStats;
  slowQueries: SlowQuery[];
  suggestions: string[];
  timestamp: string;
}

export function DatabaseMonitoring() {
  const { t } = useTranslation();
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeWindow, setTimeWindow] = useState<number | undefined>(undefined);

  const loadMonitoringData = async () => {
    try {
      const params = new URLSearchParams();
      if (timeWindow) {
        params.set('timeWindow', timeWindow.toString());
      }

      const response = await fetch(`/api/database/monitoring?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to load monitoring data');
      }

      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to load monitoring data');
      }
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
      toast.error(error instanceof Error ? error.message : t('database_page.monitoring.load_failed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMonitoringData();
  }, [timeWindow]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadMonitoringData();
  };

  const handleClearCache = async () => {
    try {
      const response = await fetch('/api/database/monitoring', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to clear cache');
      }

      toast.success(t('database_page.monitoring.cache_cleared'));
      loadMonitoringData();
    } catch (error) {
      console.error('Failed to clear cache:', error);
      toast.error(error instanceof Error ? error.message : t('database_page.monitoring.cache_clear_failed'));
    }
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) {
      return `${ms.toFixed(0)}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(d);
  };

  const getPerformanceColor = (time: number): string => {
    if (time < 100) return 'text-green-600';
    if (time < 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (time: number): 'default' | 'secondary' | 'destructive' => {
    if (time < 100) return 'default';
    if (time < 500) return 'secondary';
    return 'destructive';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <AlertTriangle className="h-8 w-8 text-muted-foreground" />
          <p className="ml-2 text-muted-foreground" suppressHydrationWarning>
            {t('database_page.monitoring.no_data')}
          </p>
        </CardContent>
      </Card>
    );
  }

  const { stats, slowQueries, suggestions } = data;
  const cacheHitRate = stats.totalQueries > 0
    ? (stats.cacheHits / (stats.cacheHits + stats.cacheMisses)) * 100
    : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold" suppressHydrationWarning>
            {t('database_page.monitoring.title')}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1" suppressHydrationWarning>
            {t('database_page.monitoring.description')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTimeWindow(timeWindow === 3600000 ? undefined : 3600000)}
            className="flex-1 sm:flex-initial"
            suppressHydrationWarning
          >
            {timeWindow === 3600000 ? t('database_page.monitoring.all_time') : t('database_page.monitoring.last_hour')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex-1 sm:flex-initial"
            suppressHydrationWarning
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCache}
            className="flex-1 sm:flex-initial"
            suppressHydrationWarning
          >
            <Trash2 className="h-4 w-4 mr-2" />
            <span suppressHydrationWarning>{t('database_page.monitoring.clear_cache')}</span>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium" suppressHydrationWarning>
              {t('database_page.monitoring.total_queries')}
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold" suppressHydrationWarning>
              {stats.totalQueries.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground" suppressHydrationWarning>
              {t('database_page.monitoring.queries_tracked')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium" suppressHydrationWarning>
              {t('database_page.monitoring.avg_execution_time')}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className={`text-xl sm:text-2xl font-bold ${getPerformanceColor(stats.averageExecutionTime)}`} suppressHydrationWarning>
              {formatTime(stats.averageExecutionTime)}
            </div>
            <p className="text-xs text-muted-foreground" suppressHydrationWarning>
              {t('database_page.monitoring.avg_time_description')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium" suppressHydrationWarning>
              {t('database_page.monitoring.slow_queries')}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold" suppressHydrationWarning>
              {stats.slowQueries}
            </div>
            <p className="text-xs text-muted-foreground" suppressHydrationWarning>
              {t('database_page.monitoring.slow_queries_description')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium" suppressHydrationWarning>
              {t('database_page.monitoring.cache_hit_rate')}
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold" suppressHydrationWarning>
              {cacheHitRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground break-words" suppressHydrationWarning>
              {stats.cacheHits} {t('database_page.monitoring.hits')} / {stats.cacheMisses} {t('database_page.monitoring.misses')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" suppressHydrationWarning>
              <Lightbulb className="h-5 w-5" />
              {t('database_page.monitoring.optimization_suggestions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2 text-xs sm:text-sm" suppressHydrationWarning>
                  <span className="text-muted-foreground shrink-0">•</span>
                  <span className="break-words">{suggestion}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Query Statistics by Collection */}
      {Object.keys(stats.queriesByCollection).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle suppressHydrationWarning>
              {t('database_page.monitoring.queries_by_collection')}
            </CardTitle>
            <CardDescription suppressHydrationWarning>
              {t('database_page.monitoring.queries_by_collection_description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px] sm:h-[300px]">
              <div className="space-y-3 sm:space-y-4">
                {Object.entries(stats.queriesByCollection)
                  .sort(([, a], [, b]) => b - a)
                  .map(([collection, count]) => {
                    const avgTime = stats.averageExecutionTimeByCollection[collection] || 0;
                    return (
                      <div key={collection} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm sm:text-base truncate" suppressHydrationWarning>{collection}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground" suppressHydrationWarning>
                            {count} {t('database_page.monitoring.queries')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                          <Badge variant={getPerformanceBadge(avgTime)} className="text-xs" suppressHydrationWarning>
                            {formatTime(avgTime)}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Slow Queries */}
      {slowQueries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" suppressHydrationWarning>
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t('database_page.monitoring.slow_queries_list')}
            </CardTitle>
            <CardDescription suppressHydrationWarning>
              {t('database_page.monitoring.slow_queries_list_description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[350px] sm:h-[400px]">
              <div className="space-y-3 sm:space-y-4">
                {slowQueries.map((query, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs sm:text-sm" suppressHydrationWarning>
                          {query.collection}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono break-all" suppressHydrationWarning>
                          {query.query || t('database_page.monitoring.no_query_string')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="destructive" className="text-xs" suppressHydrationWarning>
                          {formatTime(query.executionTime)}
                        </Badge>
                        <span className="text-xs text-muted-foreground whitespace-nowrap" suppressHydrationWarning>
                          {formatDate(query.timestamp)}
                        </span>
                      </div>
                    </div>
                    {index < slowQueries.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {stats.totalQueries === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center" suppressHydrationWarning>
              {t('database_page.monitoring.no_queries_yet')}
            </p>
            <p className="text-sm text-muted-foreground text-center mt-2" suppressHydrationWarning>
              {t('database_page.monitoring.no_queries_description')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

