# Performance Tuning Guide

## Overview

This guide provides comprehensive strategies and best practices for optimizing performance in My Console. It covers database queries, component rendering, bundle size, and overall application performance.

## Table of Contents

- [Performance Metrics](#performance-metrics)
- [Database Optimization](#database-optimization)
- [Component Optimization](#component-optimization)
- [Bundle Size Optimization](#bundle-size-optimization)
- [Caching Strategies](#caching-strategies)
- [Performance Monitoring](#performance-monitoring)
- [Best Practices](#best-practices)

## Performance Metrics

### Target Metrics

| Metric | Target | Current Status |
|--------|--------|----------------|
| **First Contentful Paint (FCP)** | < 1.8s | ✅ Optimized |
| **Largest Contentful Paint (LCP)** | < 2.5s | ✅ Optimized |
| **Time to Interactive (TTI)** | < 3.5s | ✅ Optimized |
| **Total Bundle Size** | < 500KB (gzipped) | ⚠️ Monitor |
| **Database Query Time** | < 500ms (avg) | ✅ Optimized |
| **Cache Hit Rate** | > 70% | ⚠️ Monitor |

### Monitoring Tools

- **Lighthouse**: Run `npm run build && npm run start` then test with Lighthouse
- **Query Optimization**: Use `/auth/admin/database` for query monitoring
- **Bundle Analyzer**: Use Next.js built-in bundle analysis

## Database Optimization

### 1. Query Optimization

#### Use Pagination

Always use pagination for large datasets:

```typescript
import { optimizedPagination } from '@/lib/pagination';

// ✅ Good: Server-side pagination
const result = await optimizedPagination<BlogPost>(
  tablesDB.listRows.bind(tablesDB),
  {
    databaseId: DATABASE_ID,
    tableId: BLOG_POSTS_COLLECTION_ID,
    page: 1,
    pageSize: 20,
    orderBy: '$updatedAt',
    orderDirection: 'desc',
  }
);
```

#### Use Indexes

Ensure proper indexes are created for frequently queried fields:

- ✅ Status fields (for filtering)
- ✅ Date fields (for sorting)
- ✅ Foreign key relationships
- ✅ Search fields (title, name, etc.)

#### Query Caching

Use the query optimization utilities for automatic caching:

```typescript
import { executeOptimizedQuery } from '@/lib/query-optimization';

const { data, cached, executionTime } = await executeOptimizedQuery(
  BLOG_POSTS_COLLECTION_ID,
  async () => {
    return await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: BLOG_POSTS_COLLECTION_ID,
      queries: [Query.equal('status', 'published')],
    });
  },
  {
    useCache: true,
    cacheTTL: 5 * 60 * 1000, // 5 minutes
  }
);
```

### 2. Avoid N+1 Queries

❌ **Bad**: Multiple queries in a loop
```typescript
for (const post of posts) {
  const category = await getCategory(post.categoryId); // N+1 query
}
```

✅ **Good**: Batch queries
```typescript
const categoryIds = posts.map(p => p.categoryId);
const categories = await getCategoriesByIds(categoryIds); // Single query
```

### 3. Limit Data Transfer

- ✅ Use pagination to limit results
- ✅ Only fetch required fields
- ✅ Use projections when possible
- ✅ Avoid loading all data for filtering

## Component Optimization

### 1. React.memo

Use `React.memo` for expensive components:

```typescript
import { memo } from 'react';

export const ExpensiveComponent = memo(({ data }: Props) => {
  // Component logic
}, (prevProps, nextProps) => {
  // Custom comparison if needed
  return prevProps.data.id === nextProps.data.id;
});
```

### 2. useMemo and useCallback

Memoize expensive calculations and callbacks:

```typescript
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies]);
```

### 3. Lazy Loading

Lazy load heavy components:

```typescript
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### 4. Virtual Scrolling

Use virtual scrolling for large lists:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50,
});
```

## Bundle Size Optimization

### 1. Code Splitting

Next.js automatically code-splits by route. For additional splitting:

```typescript
// Dynamic imports
const Component = dynamic(() => import('./Component'), {
  loading: () => <Skeleton />,
  ssr: false, // If component doesn't need SSR
});
```

### 2. Tree Shaking

Ensure unused code is eliminated:

- ✅ Use named imports instead of default imports
- ✅ Avoid importing entire libraries
- ✅ Use barrel exports carefully

### 3. TipTap Extensions

Only load necessary TipTap extensions:

```typescript
// ✅ Good: Load only needed extensions
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';

// ❌ Bad: Loading all extensions
import * from '@tiptap/extensions';
```

### 4. Image Optimization

Use Next.js Image component:

```typescript
import Image from 'next/image';

<Image
  src="/image.jpg"
  alt="Description"
  width={800}
  height={600}
  priority // For above-the-fold images
/>
```

## Caching Strategies

### 1. Query Caching

Query results are automatically cached using `executeOptimizedQuery`:

- **Default TTL**: 5 minutes
- **Cache Key**: Based on collection, queries, limit, offset
- **Invalidation**: Manual or automatic on updates

### 2. Static Generation

Use Next.js static generation when possible:

```typescript
// Generate static pages at build time
export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map(post => ({ slug: post.slug }));
}
```

### 3. Service Worker

Service worker provides offline caching:

- ✅ Static assets cached
- ✅ API responses cached (with TTL)
- ✅ Offline fallback support

## Performance Monitoring

### 1. Query Monitoring

Monitor database queries via `/auth/admin/database`:

- View slow queries (> 1 second)
- Check cache hit rates
- Review optimization suggestions

### 2. Performance API

Use Web Performance API for client-side monitoring:

```typescript
// Measure component render time
const start = performance.now();
// ... component logic
const end = performance.now();
console.log(`Render time: ${end - start}ms`);
```

### 3. Lighthouse CI

Set up Lighthouse CI for continuous monitoring:

```yaml
# .github/workflows/lighthouse.yml
- name: Run Lighthouse
  run: |
    npm install -g @lhci/cli
    lhci autorun
```

## Best Practices

### 1. Database Queries

- ✅ Always use pagination
- ✅ Index frequently queried fields
- ✅ Use query caching for repeated queries
- ✅ Avoid loading unnecessary data
- ✅ Batch related queries

### 2. Component Rendering

- ✅ Use React.memo for expensive components
- ✅ Memoize callbacks with useCallback
- ✅ Memoize computed values with useMemo
- ✅ Lazy load heavy components
- ✅ Use virtual scrolling for long lists

### 3. Bundle Size

- ✅ Code split by route
- ✅ Lazy load heavy dependencies
- ✅ Use dynamic imports
- ✅ Remove unused code
- ✅ Optimize images

### 4. Caching

- ✅ Cache query results
- ✅ Use static generation when possible
- ✅ Implement service worker caching
- ✅ Set appropriate TTL values
- ✅ Invalidate cache on updates

## Performance Checklist

### Before Deployment

- [ ] Run Lighthouse audit (target: 90+ score)
- [ ] Check bundle size (< 500KB gzipped)
- [ ] Review slow queries (< 500ms average)
- [ ] Verify cache hit rate (> 70%)
- [ ] Test on slow 3G connection
- [ ] Check Core Web Vitals (all green)

### Regular Maintenance

- [ ] Review query metrics weekly
- [ ] Monitor bundle size growth
- [ ] Check for new slow queries
- [ ] Update dependencies regularly
- [ ] Review and optimize new features

## Troubleshooting

### Slow Page Loads

1. Check bundle size with `npm run build`
2. Review Network tab for large requests
3. Check for N+1 queries
4. Verify caching is working
5. Review component render times

### Slow Database Queries

1. Check query execution time in monitoring dashboard
2. Verify indexes are created
3. Review query patterns
4. Check cache hit rate
5. Consider query optimization

### High Memory Usage

1. Check for memory leaks
2. Review component unmounting
3. Verify cleanup in useEffect
4. Check for large data structures
5. Review image optimization

## Resources

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Web Vitals](https://web.dev/vitals/)
- [Query Optimization Guide](./PAGINATION_OPTIMIZATION.md)
- [TipTap Performance](./TIPTAP_PERFORMANCE_ANALYSIS.md)

---

*Last Updated: January 2025*

