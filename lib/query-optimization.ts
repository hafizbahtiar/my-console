/**
 * Query Optimization Utilities
 * 
 * Provides query caching, performance tracking, slow query detection,
 * and optimization suggestions for database queries.
 */

export interface QueryMetrics {
  query: string;
  collection: string;
  executionTime: number;
  timestamp: Date;
  resultCount?: number;
  cached?: boolean;
}

export interface SlowQuery {
  query: string;
  collection: string;
  executionTime: number;
  timestamp: Date;
  threshold: number;
}

export interface QueryStats {
  totalQueries: number;
  averageExecutionTime: number;
  slowQueries: number;
  cacheHits: number;
  cacheMisses: number;
  queriesByCollection: Record<string, number>;
  averageExecutionTimeByCollection: Record<string, number>;
}

// In-memory query cache (can be replaced with Redis in production)
const queryCache = new Map<string, { data: any; timestamp: Date; ttl: number }>();

// Query metrics storage (in-memory, can be persisted to database)
const queryMetrics: QueryMetrics[] = [];
const MAX_METRICS_HISTORY = 1000; // Keep last 1000 queries

// Slow query threshold (milliseconds)
const SLOW_QUERY_THRESHOLD = 1000; // 1 second

/**
 * Generate cache key from query parameters
 */
export function generateCacheKey(
  collection: string,
  queries: string[] = [],
  limit?: number,
  offset?: number
): string {
  const queryString = queries.sort().join('|');
  return `${collection}:${queryString}:${limit || ''}:${offset || ''}`;
}

/**
 * Get cached query result
 */
export function getCachedQuery<T>(cacheKey: string): T | null {
  const cached = queryCache.get(cacheKey);
  if (!cached) {
    return null;
  }

  // Check if cache is expired
  const now = new Date();
  const age = now.getTime() - cached.timestamp.getTime();
  if (age > cached.ttl) {
    queryCache.delete(cacheKey);
    return null;
  }

  return cached.data as T;
}

/**
 * Cache query result
 */
export function cacheQuery<T>(
  cacheKey: string,
  data: T,
  ttl: number = 5 * 60 * 1000 // 5 minutes default
): void {
  queryCache.set(cacheKey, {
    data,
    timestamp: new Date(),
    ttl,
  });
}

/**
 * Clear cache for a specific collection or all cache
 */
export function clearCache(collection?: string): void {
  if (collection) {
    // Clear all cache keys for this collection
    const keysToDelete: string[] = [];
    queryCache.forEach((_, key) => {
      if (key.startsWith(`${collection}:`)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => queryCache.delete(key));
  } else {
    queryCache.clear();
  }
}

/**
 * Track query execution metrics
 */
export function trackQuery(metrics: QueryMetrics): void {
  queryMetrics.push(metrics);
  
  // Keep only last N metrics
  if (queryMetrics.length > MAX_METRICS_HISTORY) {
    queryMetrics.shift();
  }
}

/**
 * Get slow queries
 */
export function getSlowQueries(threshold: number = SLOW_QUERY_THRESHOLD): SlowQuery[] {
  return queryMetrics
    .filter(m => m.executionTime > threshold)
    .map(m => ({
      query: m.query,
      collection: m.collection,
      executionTime: m.executionTime,
      timestamp: m.timestamp,
      threshold,
    }))
    .sort((a, b) => b.executionTime - a.executionTime);
}

/**
 * Get query statistics
 */
export function getQueryStats(timeWindow?: number): QueryStats {
  const now = new Date();
  const window = timeWindow || Infinity;
  
  const recentMetrics = queryMetrics.filter(
    m => (now.getTime() - m.timestamp.getTime()) <= window
  );

  if (recentMetrics.length === 0) {
    return {
      totalQueries: 0,
      averageExecutionTime: 0,
      slowQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      queriesByCollection: {},
      averageExecutionTimeByCollection: {},
    };
  }

  const totalExecutionTime = recentMetrics.reduce((sum, m) => sum + m.executionTime, 0);
  const averageExecutionTime = totalExecutionTime / recentMetrics.length;
  const slowQueries = recentMetrics.filter(m => m.executionTime > SLOW_QUERY_THRESHOLD).length;
  const cacheHits = recentMetrics.filter(m => m.cached).length;
  const cacheMisses = recentMetrics.filter(m => !m.cached).length;

  // Group by collection
  const queriesByCollection: Record<string, number> = {};
  const executionTimeByCollection: Record<string, number[]> = {};

  recentMetrics.forEach(m => {
    queriesByCollection[m.collection] = (queriesByCollection[m.collection] || 0) + 1;
    if (!executionTimeByCollection[m.collection]) {
      executionTimeByCollection[m.collection] = [];
    }
    executionTimeByCollection[m.collection].push(m.executionTime);
  });

  // Calculate average execution time by collection
  const averageExecutionTimeByCollection: Record<string, number> = {};
  Object.keys(executionTimeByCollection).forEach(collection => {
    const times = executionTimeByCollection[collection];
    const sum = times.reduce((a, b) => a + b, 0);
    averageExecutionTimeByCollection[collection] = sum / times.length;
  });

  return {
    totalQueries: recentMetrics.length,
    averageExecutionTime,
    slowQueries,
    cacheHits,
    cacheMisses,
    queriesByCollection,
    averageExecutionTimeByCollection,
  };
}

/**
 * Get optimization suggestions based on query metrics
 */
export function getOptimizationSuggestions(): string[] {
  const stats = getQueryStats();
  const suggestions: string[] = [];

  if (stats.totalQueries === 0) {
    return ['No query data available'];
  }

  // Check cache hit rate
  const cacheHitRate = stats.cacheHits / (stats.cacheHits + stats.cacheMisses);
  if (cacheHitRate < 0.3 && stats.totalQueries > 10) {
    suggestions.push('Low cache hit rate. Consider increasing cache TTL or implementing more aggressive caching.');
  }

  // Check for slow queries
  if (stats.slowQueries > 0) {
    const slowQueryRate = stats.slowQueries / stats.totalQueries;
    if (slowQueryRate > 0.1) {
      suggestions.push(`High number of slow queries (${stats.slowQueries}). Consider adding indexes or optimizing queries.`);
    }
  }

  // Check average execution time
  if (stats.averageExecutionTime > 500) {
    suggestions.push(`High average execution time (${stats.averageExecutionTime.toFixed(0)}ms). Review query patterns and indexes.`);
  }

  // Check for collections with high query counts
  const sortedCollections = Object.entries(stats.queriesByCollection)
    .sort(([, a], [, b]) => b - a);
  
  if (sortedCollections.length > 0) {
    const [topCollection, count] = sortedCollections[0];
    if (count > stats.totalQueries * 0.5) {
      suggestions.push(`Collection "${topCollection}" has high query volume (${count} queries). Consider implementing caching for this collection.`);
    }
  }

  // Check for collections with high average execution time
  const slowCollections = Object.entries(stats.averageExecutionTimeByCollection)
    .filter(([, time]) => time > 500)
    .sort(([, a], [, b]) => b - a);
  
  if (slowCollections.length > 0) {
    const [collection, time] = slowCollections[0];
    suggestions.push(`Collection "${collection}" has high average execution time (${time.toFixed(0)}ms). Review indexes and query patterns.`);
  }

  if (suggestions.length === 0) {
    suggestions.push('Query performance looks good! No optimization needed at this time.');
  }

  return suggestions;
}

/**
 * Wrapper function to execute query with optimization
 */
export async function executeOptimizedQuery<T>(
  collection: string,
  queryFn: () => Promise<T>,
  options: {
    queries?: string[];
    limit?: number;
    offset?: number;
    useCache?: boolean;
    cacheTTL?: number;
  } = {}
): Promise<{ data: T; cached: boolean; executionTime: number }> {
  const {
    queries = [],
    limit,
    offset,
    useCache = true,
    cacheTTL = 5 * 60 * 1000, // 5 minutes
  } = options;

  const startTime = Date.now();
  const cacheKey = useCache ? generateCacheKey(collection, queries, limit, offset) : null;

  // Try cache first
  if (useCache && cacheKey) {
    const cached = getCachedQuery<T>(cacheKey);
    if (cached !== null) {
      const executionTime = Date.now() - startTime;
      trackQuery({
        query: queries.join(' | ') || 'all',
        collection,
        executionTime,
        timestamp: new Date(),
        cached: true,
      });
      return { data: cached, cached: true, executionTime };
    }
  }

  // Execute query
  const data = await queryFn();
  const executionTime = Date.now() - startTime;

  // Cache result
  if (useCache && cacheKey) {
    cacheQuery(cacheKey, data, cacheTTL);
  }

  // Track metrics
  trackQuery({
    query: queries.join(' | ') || 'all',
    collection,
    executionTime,
    timestamp: new Date(),
    cached: false,
  });

  return { data, cached: false, executionTime };
}

