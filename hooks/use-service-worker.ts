'use client';

import { useEffect, useState } from 'react';
import {
  getServiceWorkerManager,
  getServiceWorkerCacheInfo,
  clearServiceWorkerCache,
  type CacheInfo,
} from '@/lib/service-worker';

/**
 * React hook for service worker management
 * Provides service worker status and cache management functions
 */
export function useServiceWorker() {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [cacheInfo, setCacheInfo] = useState<CacheInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if service worker is supported
    const supported =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'caches' in window;
    setIsSupported(supported);

    if (!supported) {
      setIsLoading(false);
      return;
    }

    // Check registration status
    const checkRegistration = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        setIsRegistered(!!registration);

        // Check for updates
        if (registration) {
          registration.addEventListener('updatefound', () => {
            setIsUpdateAvailable(true);
          });
        }

        // Load cache info
        await refreshCacheInfo();
      } catch (error) {
        console.error('[useServiceWorker] Error checking registration:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkRegistration();

    // Listen for service worker controller changes
    const handleControllerChange = () => {
      setIsUpdateAvailable(false);
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener(
      'controllerchange',
      handleControllerChange
    );

    return () => {
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        handleControllerChange
      );
    };
  }, []);

  /**
   * Refresh cache information
   */
  const refreshCacheInfo = async () => {
    try {
      const info = await getServiceWorkerCacheInfo();
      setCacheInfo(info);
    } catch (error) {
      console.error('[useServiceWorker] Error getting cache info:', error);
    }
  };

  /**
   * Clear all caches
   */
  const clearCache = async () => {
    try {
      const success = await clearServiceWorkerCache();
      if (success) {
        await refreshCacheInfo();
      }
      return success;
    } catch (error) {
      console.error('[useServiceWorker] Error clearing cache:', error);
      return false;
    }
  };

  /**
   * Skip waiting and activate new service worker
   */
  const skipWaiting = async () => {
    try {
      const manager = getServiceWorkerManager();
      await manager.skipWaiting();
      return true;
    } catch (error) {
      console.error('[useServiceWorker] Error skipping waiting:', error);
      return false;
    }
  };

  /**
   * Unregister service worker
   */
  const unregister = async () => {
    try {
      const manager = getServiceWorkerManager();
      const success = await manager.unregister();
      if (success) {
        setIsRegistered(false);
        await refreshCacheInfo();
      }
      return success;
    } catch (error) {
      console.error('[useServiceWorker] Error unregistering:', error);
      return false;
    }
  };

  return {
    isSupported,
    isRegistered,
    isUpdateAvailable,
    cacheInfo,
    isLoading,
    refreshCacheInfo,
    clearCache,
    skipWaiting,
    unregister,
  };
}

