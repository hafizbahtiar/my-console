/**
 * Session Manager Initialization Component
 * Automatically initializes and monitors user sessions
 */

'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getSessionManager } from '@/lib/session-manager';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function SessionManagerInit() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const managerRef = useRef<ReturnType<typeof getSessionManager> | null>(null);
  const warningShownRef = useRef(false);

  useEffect(() => {
    if (loading || !user) {
      return;
    }

    // Initialize session manager
    const manager = getSessionManager({
      warningTimeBeforeExpiry: 5 * 60 * 1000, // 5 minutes
      idleTimeout: 30 * 60 * 1000, // 30 minutes
      refreshInterval: 60 * 1000, // 1 minute
      autoRefresh: true,
      onExpiringSoon: (timeRemaining) => {
        if (!warningShownRef.current) {
          const minutes = Math.ceil(timeRemaining / (60 * 1000));
          toast.warning(
            `Your session will expire in ${minutes} minutes. Please save your work.`,
            {
              duration: 10000,
            }
          );
          warningShownRef.current = true;
        }
      },
      onExpired: () => {
        toast.error('Your session has expired. Please log in again.');
        router.push('/');
      },
      onIdleTimeout: () => {
        toast.warning(
          'You have been idle for too long. Your session will expire soon.',
          {
            duration: 10000,
          }
        );
      },
    });

    managerRef.current = manager;

    // Initialize session manager
    manager.initialize().catch((error) => {
      console.error('Failed to initialize session manager:', error);
    });

    // Track activity on user interactions
    const trackActivity = () => {
      manager.trackActivity();
    };

    // Listen for user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => {
      window.addEventListener(event, trackActivity, { passive: true });
    });

    return () => {
      // Cleanup
      events.forEach((event) => {
        window.removeEventListener(event, trackActivity);
      });
      manager.destroy();
      managerRef.current = null;
      warningShownRef.current = false;
    };
  }, [user, loading, router]);

  // Update session when user changes
  useEffect(() => {
    if (user && managerRef.current) {
      managerRef.current.initialize().catch((error) => {
        console.error('Failed to update session:', error);
      });
    }
  }, [user]);

  return null;
}

