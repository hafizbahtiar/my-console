/**
 * Session Management Utility
 * Provides comprehensive session management including expiration, refresh, and activity tracking
 */

import { Models } from 'appwrite';
import { account } from './appwrite';

export interface SessionInfo {
  sessionId: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  provider: string;
  ip: string;
  deviceInfo: string;
}

export interface SessionManagerConfig {
  /** Session expiration warning time in milliseconds (default: 5 minutes) */
  warningTimeBeforeExpiry?: number;
  /** Idle timeout in milliseconds (default: 30 minutes) */
  idleTimeout?: number;
  /** Session refresh interval in milliseconds (default: 1 minute) */
  refreshInterval?: number;
  /** Auto-refresh session before expiration (default: true) */
  autoRefresh?: boolean;
  /** Callback when session is about to expire */
  onExpiringSoon?: (timeRemaining: number) => void;
  /** Callback when session expires */
  onExpired?: () => void;
  /** Callback when idle timeout is reached */
  onIdleTimeout?: () => void;
}

class SessionManager {
  private config: Required<SessionManagerConfig>;
  private currentSession: SessionInfo | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private idleTimer: NodeJS.Timeout | null = null;
  private warningTimer: NodeJS.Timeout | null = null;
  private lastActivityTime: number = Date.now();
  private isInitialized: boolean = false;

  constructor(config: SessionManagerConfig = {}) {
    this.config = {
      warningTimeBeforeExpiry: config.warningTimeBeforeExpiry ?? 5 * 60 * 1000, // 5 minutes
      idleTimeout: config.idleTimeout ?? 30 * 60 * 1000, // 30 minutes
      refreshInterval: config.refreshInterval ?? 60 * 1000, // 1 minute
      autoRefresh: config.autoRefresh ?? true,
      onExpiringSoon: config.onExpiringSoon ?? (() => {}),
      onExpired: config.onExpired ?? (() => {}),
      onIdleTimeout: config.onIdleTimeout ?? (() => {}),
    };
  }

  /**
   * Initialize session manager with current session
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const sessions = await account.listSessions();
      const currentSession = sessions.sessions?.find((s) => s.current);

      if (currentSession) {
        this.currentSession = {
          sessionId: currentSession.$id,
          userId: currentSession.userId,
          expiresAt: new Date(currentSession.expire),
          createdAt: new Date(currentSession.$createdAt),
          provider: currentSession.provider,
          ip: currentSession.ip || 'unknown',
          deviceInfo: `${currentSession.clientName || 'Unknown'} on ${currentSession.osName || 'Unknown'}`,
        };

        this.startMonitoring();
        this.trackActivity();
        this.isInitialized = true;
      }
    } catch (error) {
      console.error('Failed to initialize session manager:', error);
    }
  }

  /**
   * Update current session information
   */
  updateSession(session: Models.Session): void {
    this.currentSession = {
      sessionId: session.$id,
      userId: session.userId,
      expiresAt: new Date(session.expire),
      createdAt: new Date(session.$createdAt),
      provider: session.provider,
      ip: session.ip || 'unknown',
      deviceInfo: `${session.clientName || 'Unknown'} on ${session.osName || 'Unknown'}`,
    };

    this.startMonitoring();
    this.trackActivity();
  }

  /**
   * Start monitoring session expiration and activity
   */
  private startMonitoring(): void {
    this.stopMonitoring();

    if (!this.currentSession) {
      return;
    }

    const now = Date.now();
    const expiresAt = this.currentSession.expiresAt.getTime();
    const timeUntilExpiry = expiresAt - now;
    const timeUntilWarning = timeUntilExpiry - this.config.warningTimeBeforeExpiry;

    // Check if session is already expired
    if (timeUntilExpiry <= 0) {
      this.handleExpired();
      return;
    }

    // Set up warning timer
    if (timeUntilWarning > 0) {
      this.warningTimer = setTimeout(() => {
        const remaining = this.currentSession
          ? this.currentSession.expiresAt.getTime() - Date.now()
          : 0;
        this.config.onExpiringSoon(remaining);
      }, timeUntilWarning);
    }

    // Set up expiration handler
    const expirationTimer = setTimeout(() => {
      this.handleExpired();
    }, timeUntilExpiry);

    // Set up refresh timer if auto-refresh is enabled
    if (this.config.autoRefresh) {
      this.refreshTimer = setInterval(() => {
        this.refreshSessionIfNeeded();
      }, this.config.refreshInterval);
    }

    // Set up idle timeout check
    this.checkIdleTimeout();
  }

  /**
   * Stop all monitoring timers
   */
  private stopMonitoring(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }

    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }

    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }

  /**
   * Refresh session if it's close to expiring
   */
  private async refreshSessionIfNeeded(): Promise<void> {
    if (!this.currentSession) {
      return;
    }

    const now = Date.now();
    const expiresAt = this.currentSession.expiresAt.getTime();
    const timeUntilExpiry = expiresAt - now;
    const refreshThreshold = this.config.warningTimeBeforeExpiry * 2; // Refresh when 10 minutes remain

    // Only refresh if session is close to expiring
    if (timeUntilExpiry > 0 && timeUntilExpiry < refreshThreshold) {
      try {
        // Appwrite automatically refreshes sessions on API calls
        // We just need to verify the session is still valid
        await account.get();
        
        // Update session info
        const sessions = await account.listSessions();
        const updatedSession = sessions.sessions?.find((s) => s.current);
        
        if (updatedSession) {
          this.updateSession(updatedSession);
        }
      } catch (error: any) {
        // Session might be invalid
        if (error.code === 401) {
          this.handleExpired();
        }
      }
    }
  }

  /**
   * Check and handle idle timeout
   */
  private checkIdleTimeout(): void {
    this.idleTimer = setTimeout(() => {
      const idleTime = Date.now() - this.lastActivityTime;
      
      if (idleTime >= this.config.idleTimeout) {
        this.config.onIdleTimeout();
      } else {
        // Check again after remaining time
        const remainingTime = this.config.idleTimeout - idleTime;
        this.idleTimer = setTimeout(() => {
          this.config.onIdleTimeout();
        }, remainingTime);
      }
    }, this.config.idleTimeout);
  }

  /**
   * Track user activity
   */
  trackActivity(): void {
    this.lastActivityTime = Date.now();
    
    // Reset idle timer
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }
    this.checkIdleTimeout();
  }

  /**
   * Handle expired session
   */
  private handleExpired(): void {
    this.stopMonitoring();
    this.currentSession = null;
    this.isInitialized = false;
    this.config.onExpired();
  }

  /**
   * Get current session information
   */
  getCurrentSession(): SessionInfo | null {
    return this.currentSession;
  }

  /**
   * Get time until session expires (in milliseconds)
   */
  getTimeUntilExpiry(): number {
    if (!this.currentSession) {
      return 0;
    }

    const now = Date.now();
    const expiresAt = this.currentSession.expiresAt.getTime();
    return Math.max(0, expiresAt - now);
  }

  /**
   * Check if session is expired
   */
  isExpired(): boolean {
    return this.getTimeUntilExpiry() === 0;
  }

  /**
   * Check if session is expiring soon
   */
  isExpiringSoon(): boolean {
    const timeUntilExpiry = this.getTimeUntilExpiry();
    return timeUntilExpiry > 0 && timeUntilExpiry <= this.config.warningTimeBeforeExpiry;
  }

  /**
   * Get idle time in milliseconds
   */
  getIdleTime(): number {
    return Date.now() - this.lastActivityTime;
  }

  /**
   * Check if user is idle
   */
  isIdle(): boolean {
    return this.getIdleTime() >= this.config.idleTimeout;
  }

  /**
   * Manually refresh session
   */
  async refresh(): Promise<boolean> {
    try {
      await account.get();
      const sessions = await account.listSessions();
      const currentSession = sessions.sessions?.find((s) => s.current);
      
      if (currentSession) {
        this.updateSession(currentSession);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to refresh session:', error);
      this.handleExpired();
      return false;
    }
  }

  /**
   * Clear session and stop monitoring
   */
  clear(): void {
    this.stopMonitoring();
    this.currentSession = null;
    this.isInitialized = false;
    this.lastActivityTime = Date.now();
  }

  /**
   * Destroy session manager (cleanup)
   */
  destroy(): void {
    this.clear();
  }
}

// Singleton instance
let sessionManagerInstance: SessionManager | null = null;

/**
 * Get or create session manager instance
 */
export function getSessionManager(config?: SessionManagerConfig): SessionManager {
  if (!sessionManagerInstance) {
    sessionManagerInstance = new SessionManager(config);
  }
  return sessionManagerInstance;
}

/**
 * Initialize session manager
 */
export async function initializeSessionManager(
  config?: SessionManagerConfig
): Promise<SessionManager> {
  const manager = getSessionManager(config);
  await manager.initialize();
  return manager;
}

