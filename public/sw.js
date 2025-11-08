// Service Worker for My Console
// Version: 1.0.0
// Caching strategy: Cache First for static assets, Network First for API calls

const CACHE_NAME = 'my-console-v1.0.0';
const STATIC_CACHE_NAME = 'my-console-static-v1.0.0';
const API_CACHE_NAME = 'my-console-api-v1.0.0';
const RUNTIME_CACHE_NAME = 'my-console-runtime-v1.0.0';

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/favicon.ico',
  '/favicon.svg',
  '/manifest.json',
  '/locales/en/common.json',
  '/locales/ms/common.json',
];

// API routes that should be cached
const API_ROUTES_TO_CACHE = [
  '/api/health',
  '/api/monitoring',
];

// Maximum cache age (in seconds)
const MAX_CACHE_AGE = {
  static: 7 * 24 * 60 * 60, // 7 days
  api: 5 * 60, // 5 minutes
  runtime: 24 * 60 * 60, // 24 hours
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Delete old caches that don't match current version
            return (
              cacheName.startsWith('my-console-') &&
              cacheName !== CACHE_NAME &&
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== API_CACHE_NAME &&
              cacheName !== RUNTIME_CACHE_NAME
            );
          })
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  // Take control of all pages immediately
  return self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests (except same-origin)
  if (url.origin !== location.origin) {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle different types of requests with different strategies
  if (isStaticAsset(url.pathname)) {
    // Static assets: Cache First strategy
    event.respondWith(cacheFirst(request, STATIC_CACHE_NAME));
  } else if (isAPIRoute(url.pathname)) {
    // API routes: Network First with cache fallback
    event.respondWith(networkFirst(request, API_CACHE_NAME, MAX_CACHE_AGE.api));
  } else if (isPageRoute(url.pathname)) {
    // Pages: Network First with cache fallback
    event.respondWith(networkFirst(request, RUNTIME_CACHE_NAME, MAX_CACHE_AGE.runtime));
  } else {
    // Other resources: Stale While Revalidate
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE_NAME));
  }
});

// Check if URL is a static asset
function isStaticAsset(pathname) {
  return (
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/favicons/') ||
    pathname.startsWith('/locales/') ||
    pathname.startsWith('/_next/static/') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.ttf') ||
    pathname.endsWith('.eot') ||
    pathname.endsWith('.json')
  );
}

// Check if URL is an API route
function isAPIRoute(pathname) {
  return pathname.startsWith('/api/');
}

// Check if URL is a page route
function isPageRoute(pathname) {
  return (
    !pathname.startsWith('/api/') &&
    !pathname.startsWith('/_next/') &&
    !pathname.startsWith('/favicon') &&
    !pathname.includes('.')
  );
}

// Cache First strategy: Check cache first, fallback to network
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[Service Worker] Cache First error:', error);
    // Return a basic offline response if available
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Network First strategy: Try network first, fallback to cache
async function networkFirst(request, cacheName, maxAge = 0) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);

    if (response.ok) {
      // Check if cached response is still fresh
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        const cachedDate = cachedResponse.headers.get('date');
        if (cachedDate && maxAge > 0) {
          const age = (Date.now() - new Date(cachedDate).getTime()) / 1000;
          if (age < maxAge) {
            // Cache is still fresh, update in background
            cache.put(request, response.clone());
            return cachedResponse;
          }
        }
      }
      // Cache the fresh response
      cache.put(request, response.clone());
      return response;
    }

    // Network failed, try cache
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }

    return response;
  } catch (error) {
    console.error('[Service Worker] Network First error:', error);
    // Network failed, try cache
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    // Return offline response
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Stale While Revalidate: Return cached version immediately, update in background
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Fetch fresh version in background
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });

  // Return cached version if available, otherwise wait for network
  if (cached) {
    // Don't await fetchPromise, return cached immediately
    fetchPromise.catch((error) => {
      console.error('[Service Worker] Background fetch error:', error);
    });
    return cached;
  }

  // No cache, wait for network
  return fetchPromise;
}

// Message handler for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }

  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map(async (cacheName) => {
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();
            return { name: cacheName, size: keys.length };
          })
        ).then((sizes) => {
          event.ports[0].postMessage(sizes);
        });
      })
    );
  }
});

