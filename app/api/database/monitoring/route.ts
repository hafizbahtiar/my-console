import { NextRequest, NextResponse } from 'next/server';
import { createProtectedGET, createProtectedDELETE } from '@/lib/api-protection';
import {
  getQueryStats,
  getSlowQueries,
  getOptimizationSuggestions,
  clearCache,
} from '@/lib/query-optimization';

/**
 * GET /api/database/monitoring
 * Get database query monitoring data
 */
export async function GET(request: NextRequest) {
  return createProtectedGET(
    async () => {
      const { searchParams } = new URL(request.url);
      const timeWindow = searchParams.get('timeWindow');
      const windowMs = timeWindow ? parseInt(timeWindow, 10) : undefined;

    const stats = getQueryStats(windowMs);
    const slowQueries = getSlowQueries();
    const suggestions = getOptimizationSuggestions();

      return NextResponse.json({
        success: true,
        data: {
          stats,
          slowQueries: slowQueries.slice(0, 50), // Limit to 50 most recent slow queries
          suggestions,
          timestamp: new Date().toISOString(),
        },
      });
    },
    {
      rateLimit: 'api',
    }
  )(request);
}

/**
 * DELETE /api/database/monitoring
 * Clear query cache and reset metrics
 */
export async function DELETE(request: NextRequest) {
  return createProtectedDELETE(
    async () => {
      const { searchParams } = new URL(request.url);
      const collection = searchParams.get('collection');
      
      if (collection) {
        clearCache(collection);
      } else {
        clearCache();
      }

      return NextResponse.json({
        success: true,
        message: collection
          ? `Cache cleared for collection: ${collection}`
          : 'All cache cleared',
      });
    },
    {
      rateLimit: 'api',
    }
  )(request);
}

