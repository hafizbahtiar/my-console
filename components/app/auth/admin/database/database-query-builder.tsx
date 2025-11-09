"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/language-context";
import { Search, Plus, X, Play, Trash2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { tablesDB, DATABASE_ID } from "@/lib/appwrite";
import type { CollectionInfo } from "@/app/auth/admin/database/types";

interface DatabaseQueryBuilderProps {
  collections: CollectionInfo[];
}

interface QueryFilter {
  id: string;
  field: string;
  operator: 'equal' | 'notEqual' | 'greaterThan' | 'lessThan' | 'contains' | 'startsWith' | 'endsWith';
  value: string;
}

interface QueryOrder {
  field: string;
  direction: 'asc' | 'desc';
}

export function DatabaseQueryBuilder({ collections }: DatabaseQueryBuilderProps) {
  const { t } = useTranslation();
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [filters, setFilters] = useState<QueryFilter[]>([]);
  const [orderBy, setOrderBy] = useState<QueryOrder | null>(null);
  const [limit, setLimit] = useState<number>(20);
  const [offset, setOffset] = useState<number>(0);
  const [results, setResults] = useState<any[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryString, setQueryString] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const operators = [
    { value: 'equal', label: 'Equal (=)' },
    { value: 'notEqual', label: 'Not Equal (≠)' },
    { value: 'greaterThan', label: 'Greater Than (>)' },
    { value: 'lessThan', label: 'Less Than (<)' },
    { value: 'contains', label: 'Contains' },
    { value: 'startsWith', label: 'Starts With' },
    { value: 'endsWith', label: 'Ends With' },
  ];

  const addFilter = () => {
    setFilters([
      ...filters,
      {
        id: Date.now().toString(),
        field: '',
        operator: 'equal',
        value: '',
      },
    ]);
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter((f) => f.id !== id));
  };

  const updateFilter = (id: string, updates: Partial<QueryFilter>) => {
    setFilters(filters.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const buildQueryString = (): string => {
    const parts: string[] = [];

    // Add filters
    filters.forEach((filter) => {
      if (filter.field && filter.value) {
        const value = isNaN(Number(filter.value)) ? `"${filter.value}"` : filter.value;
        parts.push(`${filter.operator}("${filter.field}", ${value})`);
      }
    });

    // Add ordering
    if (orderBy?.field) {
      if (orderBy.direction === 'desc') {
        parts.push(`orderDesc("${orderBy.field}")`);
      } else {
        parts.push(`orderAsc("${orderBy.field}")`);
      }
    }

    // Add pagination
    parts.push(`limit(${limit})`);
    parts.push(`offset(${offset})`);

    return parts.join(', ');
  };

  const executeQuery = async () => {
    if (!selectedCollection) {
      toast.error(t('database_page.query_builder.select_collection'));
      return;
    }

    setIsExecuting(true);
    try {
      const queryString = buildQueryString();
      setQueryString(queryString);

      // Build queries array
      const queries: string[] = [];

      // Add filters
      filters.forEach((filter) => {
        if (filter.field && filter.value) {
          const value = isNaN(Number(filter.value)) ? `"${filter.value}"` : filter.value;
          queries.push(`${filter.operator}("${filter.field}", ${value})`);
        }
      });

      // Add ordering
      if (orderBy?.field) {
        if (orderBy.direction === 'desc') {
          queries.push(`orderDesc("${orderBy.field}")`);
        } else {
          queries.push(`orderAsc("${orderBy.field}")`);
        }
      }

      // Add pagination
      queries.push(`limit(${limit})`);
      queries.push(`offset(${offset})`);

      // Use optimized query execution with caching and performance tracking
      const { executeOptimizedQuery } = await import('@/lib/query-optimization');
      
      const { data: response, executionTime } = await executeOptimizedQuery(
        selectedCollection,
        async () => {
          return await tablesDB.listRows({
            databaseId: DATABASE_ID,
            tableId: selectedCollection,
            queries: queries.length > 0 ? queries : undefined,
          });
        },
        {
          queries,
          limit,
          offset,
          useCache: true,
          cacheTTL: 5 * 60 * 1000, // 5 minutes
        }
      );

      setResults(response.rows || []);
      toast.success(
        t('database_page.query_builder.query_executed', { 
          count: response.rows.length.toString()
        }) + ` (${executionTime}ms)`
      );
    } catch (error) {
      console.error('Query execution failed:', error);
      toast.error(error instanceof Error ? error.message : t('database_page.query_builder.query_failed'));
      setResults([]);
    } finally {
      setIsExecuting(false);
    }
  };

  const copyQuery = () => {
    navigator.clipboard.writeText(queryString);
    setCopied(true);
    toast.success(t('database_page.query_builder.query_copied'));
    setTimeout(() => setCopied(false), 2000);
  };

  const clearQuery = () => {
    setFilters([]);
    setOrderBy(null);
    setLimit(20);
    setOffset(0);
    setResults([]);
    setQueryString("");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2" suppressHydrationWarning>
            <Search className="h-5 w-5" />
            {t('database_page.query_builder.title')}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm" suppressHydrationWarning>
            {t('database_page.query_builder.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Collection Selection */}
          <div className="space-y-2">
            <Label suppressHydrationWarning>{t('database_page.query_builder.collection')}</Label>
            <Select value={selectedCollection} onValueChange={setSelectedCollection}>
              <SelectTrigger>
                <SelectValue placeholder={t('database_page.query_builder.select_collection')} />
              </SelectTrigger>
              <SelectContent>
                {collections.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    {collection.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filters */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label suppressHydrationWarning>{t('database_page.query_builder.filters')}</Label>
              <Button variant="outline" size="sm" onClick={addFilter} className="h-8">
                <Plus className="h-4 w-4 mr-1" />
                <span suppressHydrationWarning>{t('database_page.query_builder.add_filter')}</span>
              </Button>
            </div>
            {filters.length === 0 ? (
              <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                {t('database_page.query_builder.no_filters')}
              </p>
            ) : (
              <div className="space-y-2">
                {filters.map((filter) => (
                  <div key={filter.id} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label className="text-xs" suppressHydrationWarning>
                        {t('database_page.query_builder.field')}
                      </Label>
                      <Input
                        placeholder="field_name"
                        value={filter.field}
                        onChange={(e) => updateFilter(filter.id, { field: e.target.value })}
                        className="h-9"
                      />
                    </div>
                    <div className="w-40">
                      <Label className="text-xs" suppressHydrationWarning>
                        {t('database_page.query_builder.operator')}
                      </Label>
                      <Select
                        value={filter.operator}
                        onValueChange={(value) => updateFilter(filter.id, { operator: value as any })}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {operators.map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs" suppressHydrationWarning>
                        {t('database_page.query_builder.value')}
                      </Label>
                      <Input
                        placeholder="value"
                        value={filter.value}
                        onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                        className="h-9"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFilter(filter.id)}
                      className="h-9 w-9 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ordering */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label suppressHydrationWarning>{t('database_page.query_builder.order_by')}</Label>
              <Input
                placeholder="field_name"
                value={orderBy?.field || ''}
                onChange={(e) => setOrderBy({ field: e.target.value, direction: orderBy?.direction || 'asc' })}
              />
            </div>
            <div className="space-y-2">
              <Label suppressHydrationWarning>{t('database_page.query_builder.direction')}</Label>
              <Select
                value={orderBy?.direction || 'asc'}
                onValueChange={(value) => setOrderBy({ field: orderBy?.field || '', direction: value as 'asc' | 'desc' })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc" suppressHydrationWarning>{t('database_page.query_builder.ascending')}</SelectItem>
                  <SelectItem value="desc" suppressHydrationWarning>{t('database_page.query_builder.descending')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pagination */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label suppressHydrationWarning>{t('database_page.query_builder.limit')}</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value) || 20)}
              />
            </div>
            <div className="space-y-2">
              <Label suppressHydrationWarning>{t('database_page.query_builder.offset')}</Label>
              <Input
                type="number"
                min="0"
                value={offset}
                onChange={(e) => setOffset(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Query String Display */}
          {queryString && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label suppressHydrationWarning>{t('database_page.query_builder.query_string')}</Label>
                <Button variant="ghost" size="sm" onClick={copyQuery} className="h-8">
                  {copied ? (
                    <Check className="h-4 w-4 mr-1" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1" />
                  )}
                  <span suppressHydrationWarning>{t('database_page.query_builder.copy')}</span>
                </Button>
              </div>
              <div className="p-3 bg-muted rounded-md">
                <code className="text-xs font-mono break-all">{queryString}</code>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={executeQuery} disabled={isExecuting || !selectedCollection} className="flex-1">
              <Play className="h-4 w-4 mr-2" />
              <span suppressHydrationWarning>{t('database_page.query_builder.execute')}</span>
            </Button>
            <Button variant="outline" onClick={clearQuery} disabled={isExecuting}>
              <Trash2 className="h-4 w-4 mr-2" />
              <span suppressHydrationWarning>{t('database_page.query_builder.clear')}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg" suppressHydrationWarning>
              {t('database_page.query_builder.results')} ({results.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div key={result.$id || index} className="p-3 border rounded-md">
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

