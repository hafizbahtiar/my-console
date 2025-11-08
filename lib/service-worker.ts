/**
 * Service Worker Registration and Management
 * Handles service worker registration, updates, and cache management
 */

export interface ServiceWorkerRegistrationOptions {
  enabled?: boolean;
  onUpdateAvailable?: () => void;
  onUpdateInstalled?: () => void;
  onError?: (error: Error) => void;
}

export interface CacheInfo {
  name: string;
  size: number;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private options: ServiceWorkerRegistrationOptions;
  private isSupported: boolean;

  constructor(options: ServiceWorkerRegistrationOptions = {}) {
    this.options = {
      enabled: true,
      ...options,
    };
    this.isSupported =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'caches' in window;
  }

  /**
   * Register the service worker
   */
  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported || !this.options.enabled) {
      console.log('[Service Worker] Not supported or disabled');
      return null;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[Service Worker] Registered:', this.registration.scope);

      // Handle updates
      this.setupUpdateHandlers();

      return this.registration;
    } catch (error) {
      console.error('[Service Worker] Registration failed:', error);
      if (this.options.onError) {
        this.options.onError(error as Error);
      }
      return null;
    }
  }

  /**
   * Setup handlers for service worker updates
   */
  private setupUpdateHandlers() {
    if (!this.registration) return;

    // Check for updates immediately
    this.registration.update();

    // Handle service worker updates
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration?.installing;
      if (!newWorker) return;

      console.log('[Service Worker] New version found');

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New service worker is waiting
            console.log('[Service Worker] New version installed, waiting to activate');
            if (this.options.onUpdateAvailable) {
              this.options.onUpdateAvailable();
            }
          } else {
            // First time installation
            console.log('[Service Worker] Installed for the first time');
            if (this.options.onUpdateInstalled) {
              this.options.onUpdateInstalled();
            }
          }
        }
      });
    });

    // Handle controller change (service worker activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[Service Worker] New version activated');
      // Reload page to use new service worker
      if (this.options.onUpdateInstalled) {
        this.options.onUpdateInstalled();
      }
    });
  }

  /**
   * Unregister the service worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const unregistered = await this.registration.unregister();
      if (unregistered) {
        console.log('[Service Worker] Unregistered');
        this.registration = null;
      }
      return unregistered;
    } catch (error) {
      console.error('[Service Worker] Unregister failed:', error);
      return false;
    }
  }

  /**
   * Skip waiting and activate the new service worker
   */
  async skipWaiting(): Promise<void> {
    if (!this.registration?.waiting) {
      return;
    }

    try {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } catch (error) {
      console.error('[Service Worker] Skip waiting failed:', error);
    }
  }

  /**
   * Clear all caches
   */
  async clearCache(): Promise<boolean> {
    if (!this.isSupported) {
      return false;
    }

    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      console.log('[Service Worker] All caches cleared');
      return true;
    } catch (error) {
      console.error('[Service Worker] Clear cache failed:', error);
      return false;
    }
  }

  /**
   * Get cache information
   */
  async getCacheInfo(): Promise<CacheInfo[]> {
    if (!this.isSupported) {
      return [];
    }

    try {
      const cacheNames = await caches.keys();
      const cacheInfo = await Promise.all(
        cacheNames.map(async (name) => {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          return {
            name,
            size: keys.length,
          };
        })
      );
      return cacheInfo;
    } catch (error) {
      console.error('[Service Worker] Get cache info failed:', error);
      return [];
    }
  }

  /**
   * Check if service worker is supported
   */
  isServiceWorkerSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Get current registration
   */
  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }
}

// Singleton instance
let serviceWorkerManager: ServiceWorkerManager | null = null;

/**
 * Get or create service worker manager instance
 */
export function getServiceWorkerManager(
  options?: ServiceWorkerRegistrationOptions
): ServiceWorkerManager {
  if (!serviceWorkerManager) {
    serviceWorkerManager = new ServiceWorkerManager(options);
  }
  return serviceWorkerManager;
}

/**
 * Register service worker (convenience function)
 */
export async function registerServiceWorker(
  options?: ServiceWorkerRegistrationOptions
): Promise<ServiceWorkerRegistration | null> {
  const manager = getServiceWorkerManager(options);
  return manager.register();
}

/**
 * Unregister service worker (convenience function)
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  const manager = getServiceWorkerManager();
  return manager.unregister();
}

/**
 * Clear all caches (convenience function)
 */
export async function clearServiceWorkerCache(): Promise<boolean> {
  const manager = getServiceWorkerManager();
  return manager.clearCache();
}

/**
 * Get cache information (convenience function)
 */
export async function getServiceWorkerCacheInfo(): Promise<CacheInfo[]> {
  const manager = getServiceWorkerManager();
  return manager.getCacheInfo();
}

