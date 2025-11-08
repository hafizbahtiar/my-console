# Service Worker Implementation Guide

## Overview

My Console includes a comprehensive service worker implementation for offline support, caching, and improved performance. The service worker uses multiple caching strategies optimized for different types of resources.

## Features

- ✅ **Automatic Registration**: Service worker registers automatically on app startup
- ✅ **Multiple Caching Strategies**: Cache First, Network First, and Stale While Revalidate
- ✅ **Offline Support**: Cached resources available when offline
- ✅ **Cache Management**: Clear cache, get cache info, and manage updates
- ✅ **TypeScript Support**: Full type safety for service worker APIs
- ✅ **Update Handling**: Automatic detection and handling of service worker updates

## Architecture

### Files Structure

```
public/
  └── sw.js                    # Service worker script

lib/
  └── service-worker.ts        # Service worker manager class

components/app/
  └── service-worker-init.tsx  # Auto-registration component

hooks/
  └── use-service-worker.ts    # React hook for service worker

types/
  └── service-worker.d.ts      # TypeScript declarations
```

## Caching Strategies

### 1. Cache First (Static Assets)

**Used for**: Images, fonts, icons, JSON files, Next.js static assets

**Strategy**: Check cache first, fallback to network

**Cache Duration**: 7 days

**Example Resources**:
- `/favicon.ico`
- `/favicons/*`
- `/locales/*`
- `/_next/static/*`
- Images (`.png`, `.jpg`, `.svg`, etc.)

### 2. Network First (API Routes & Pages)

**Used for**: API endpoints, page routes

**Strategy**: Try network first, fallback to cache

**Cache Duration**: 
- API routes: 5 minutes
- Pages: 24 hours

**Example Resources**:
- `/api/health`
- `/api/monitoring`
- Page routes (`/`, `/auth/dashboard`, etc.)

### 3. Stale While Revalidate (Other Resources)

**Used for**: Other resources not covered above

**Strategy**: Return cached version immediately, update in background

**Cache Duration**: 24 hours

## Usage

### Automatic Registration

The service worker is automatically registered when the app loads via the `ServiceWorkerInit` component in the root layout:

```tsx
// app/layout.tsx
import { ServiceWorkerInit } from "@/components/app/service-worker-init";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ServiceWorkerInit />
        {children}
      </body>
    </html>
  );
}
```

### Using the Hook

Access service worker state and functions in React components:

```tsx
import { useServiceWorker } from '@/hooks/use-service-worker';

function MyComponent() {
  const {
    isSupported,
    isRegistered,
    isUpdateAvailable,
    cacheInfo,
    isLoading,
    refreshCacheInfo,
    clearCache,
    skipWaiting,
    unregister,
  } = useServiceWorker();

  if (!isSupported) {
    return <div>Service worker not supported</div>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <p>Registered: {isRegistered ? 'Yes' : 'No'}</p>
      <p>Update Available: {isUpdateAvailable ? 'Yes' : 'No'}</p>
      
      {isUpdateAvailable && (
        <button onClick={skipWaiting}>
          Update Now
        </button>
      )}
      
      <button onClick={clearCache}>
        Clear Cache
      </button>
      
      <button onClick={refreshCacheInfo}>
        Refresh Cache Info
      </button>
      
      <div>
        <h3>Cache Info:</h3>
        {cacheInfo.map((cache) => (
          <div key={cache.name}>
            {cache.name}: {cache.size} items
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Direct API Usage

Use the service worker manager directly:

```tsx
import {
  getServiceWorkerManager,
  registerServiceWorker,
  clearServiceWorkerCache,
  getServiceWorkerCacheInfo,
} from '@/lib/service-worker';

// Register service worker
const registration = await registerServiceWorker({
  enabled: true,
  onUpdateAvailable: () => {
    console.log('Update available!');
  },
  onUpdateInstalled: () => {
    console.log('Update installed!');
  },
  onError: (error) => {
    console.error('Service worker error:', error);
  },
});

// Get cache info
const cacheInfo = await getServiceWorkerCacheInfo();
console.log('Cache info:', cacheInfo);

// Clear all caches
await clearServiceWorkerCache();
```

## Cache Management

### Cache Names

The service worker uses multiple cache names for different resource types:

- `my-console-static-v1.0.0`: Static assets (images, fonts, icons)
- `my-console-api-v1.0.0`: API responses
- `my-console-runtime-v1.0.0`: Runtime resources (pages, etc.)

### Clearing Caches

#### Clear All Caches

```tsx
import { clearServiceWorkerCache } from '@/lib/service-worker';

await clearServiceWorkerCache();
```

#### Clear Specific Cache

```tsx
const cache = await caches.open('my-console-static-v1.0.0');
await cache.delete('/path/to/resource');
```

### Getting Cache Information

```tsx
import { getServiceWorkerCacheInfo } from '@/lib/service-worker';

const cacheInfo = await getServiceWorkerCacheInfo();
// Returns: [{ name: 'my-console-static-v1.0.0', size: 10 }, ...]
```

## Update Handling

### Automatic Updates

The service worker automatically checks for updates when:
- The app loads
- The user navigates to a new page
- The service worker registration is accessed

### Manual Update Check

```tsx
const registration = await navigator.serviceWorker.getRegistration();
if (registration) {
  await registration.update();
}
```

### Skip Waiting (Activate New Version)

When a new service worker is installed, you can activate it immediately:

```tsx
import { getServiceWorkerManager } from '@/lib/service-worker';

const manager = getServiceWorkerManager();
await manager.skipWaiting();
// Page will reload automatically
```

## Configuration

### Cache Durations

Edit cache durations in `public/sw.js`:

```javascript
const MAX_CACHE_AGE = {
  static: 7 * 24 * 60 * 60,  // 7 days
  api: 5 * 60,                // 5 minutes
  runtime: 24 * 60 * 60,      // 24 hours
};
```

### Static Assets to Cache

Add assets to pre-cache in `public/sw.js`:

```javascript
const STATIC_ASSETS = [
  '/',
  '/favicon.ico',
  '/manifest.json',
  // Add more assets here
];
```

### API Routes to Cache

Configure which API routes should be cached:

```javascript
const API_ROUTES_TO_CACHE = [
  '/api/health',
  '/api/monitoring',
  // Add more routes here
];
```

## Development

### Testing Service Worker

1. **Open DevTools**: Chrome DevTools > Application > Service Workers
2. **Check Registration**: Verify service worker is registered
3. **Test Offline**: Use "Offline" checkbox in Network tab
4. **Inspect Caches**: Application > Cache Storage

### Debugging

Service worker logs are available in the browser console:

```
[Service Worker] Installing...
[Service Worker] Caching static assets
[Service Worker] Activating...
[Service Worker] Registered successfully
```

### Unregistering (Development)

To unregister the service worker during development:

```tsx
import { unregisterServiceWorker } from '@/lib/service-worker';

await unregisterServiceWorker();
```

Or use DevTools: Application > Service Workers > Unregister

## Best Practices

### 1. Version Management

Update the cache version when deploying:

```javascript
// public/sw.js
const CACHE_NAME = 'my-console-v1.0.1'; // Increment version
```

### 2. Cache Size Limits

Monitor cache size and implement limits if needed:

```javascript
// Add cache size limit check
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
```

### 3. Selective Caching

Don't cache sensitive data or user-specific content:

```javascript
// Skip caching for authenticated routes
if (url.pathname.startsWith('/auth/')) {
  return; // Don't cache
}
```

### 4. Update Strategy

Choose when to prompt users for updates:

- **Immediate**: Skip waiting and reload
- **On Next Visit**: Let user continue, update on next load
- **Manual**: Show update notification, let user choose

## Troubleshooting

### Service Worker Not Registering

1. **Check HTTPS**: Service workers require HTTPS (or localhost)
2. **Check Browser Support**: Verify browser supports service workers
3. **Check Console**: Look for error messages
4. **Check File Path**: Ensure `/sw.js` is accessible

### Cache Not Updating

1. **Check Version**: Ensure cache version is updated
2. **Clear Old Caches**: Old caches may persist
3. **Hard Refresh**: Use Ctrl+Shift+R (Cmd+Shift+R on Mac)
4. **Unregister**: Unregister and re-register service worker

### Offline Not Working

1. **Check Cache**: Verify resources are cached
2. **Check Strategy**: Ensure correct caching strategy is used
3. **Check Network**: Verify offline mode is enabled in DevTools
4. **Check Console**: Look for fetch errors

## Performance Impact

### Benefits

- ✅ **Faster Load Times**: Cached resources load instantly
- ✅ **Offline Support**: App works without internet
- ✅ **Reduced Bandwidth**: Fewer network requests
- ✅ **Better UX**: Instant page loads for returning users

### Considerations

- ⚠️ **Cache Size**: Monitor cache size to avoid storage issues
- ⚠️ **Update Strategy**: Balance between freshness and performance
- ⚠️ **Initial Load**: First load still requires network

## Security Considerations

1. **HTTPS Only**: Service workers only work over HTTPS (or localhost)
2. **Cache Sensitive Data**: Don't cache authentication tokens or sensitive data
3. **Content Security Policy**: Ensure CSP allows service worker execution
4. **Update Verification**: Verify service worker updates are legitimate

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [PAGINATION_OPTIMIZATION.md](./PAGINATION_OPTIMIZATION.md) - Performance optimizations
- [TIPTAP_PERFORMANCE_ANALYSIS.md](./TIPTAP_PERFORMANCE_ANALYSIS.md) - Editor performance

---

**Last Updated**: November 11, 2025

