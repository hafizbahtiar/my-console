'use client';

import { useEffect, useState } from 'react';
import { registerServiceWorker } from '@/lib/service-worker';

/**
 * Service Worker Initialization Component
 * Registers the service worker on app startup
 * Only runs on client-side
 */
export function ServiceWorkerInit() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') {
      return;
    }

    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      console.log('[Service Worker] Not supported in this browser');
      return;
    }

    // Register service worker
    const register = async () => {
      try {
        const registration = await registerServiceWorker({
          enabled: true,
          onUpdateAvailable: () => {
            console.log('[Service Worker] Update available');
            setUpdateAvailable(true);
          },
          onUpdateInstalled: () => {
            console.log('[Service Worker] Update installed');
            // Optionally reload the page to use the new service worker
            // window.location.reload();
          },
          onError: (error) => {
            console.error('[Service Worker] Error:', error);
          },
        });

        if (registration) {
          setIsRegistered(true);
          console.log('[Service Worker] Registered successfully');
        }
      } catch (error) {
        console.error('[Service Worker] Registration error:', error);
      }
    };

    register();

    // Cleanup: Unregister on unmount (optional, usually not needed)
    // return () => {
    //   unregisterServiceWorker();
    // };
  }, []);

  // Optional: Show update notification
  if (updateAvailable && typeof window !== 'undefined') {
    // You can show a toast notification here
    // For now, we'll just log it
    console.log('[Service Worker] New version available. Reload to update.');
  }

  return null; // This component doesn't render anything
}

