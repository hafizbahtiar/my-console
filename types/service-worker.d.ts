/**
 * TypeScript declarations for Service Worker
 */

interface ServiceWorkerMessageEvent extends MessageEvent {
  data: {
    type: 'SKIP_WAITING' | 'CLEAR_CACHE' | 'GET_CACHE_SIZE';
    [key: string]: unknown;
  };
}

interface ServiceWorkerRegistrationEvent extends Event {
  registration: ServiceWorkerRegistration;
}

interface ServiceWorkerStateChangeEvent extends Event {
  target: ServiceWorker | null;
}

declare global {
  interface ServiceWorkerGlobalScope {
    skipWaiting(): Promise<void>;
    clients: Clients;
  }

  interface Window {
    serviceWorkerManager?: {
      register(): Promise<ServiceWorkerRegistration | null>;
      unregister(): Promise<boolean>;
      clearCache(): Promise<boolean>;
      getCacheInfo(): Promise<Array<{ name: string; size: number }>>;
    };
  }
}

export {};

