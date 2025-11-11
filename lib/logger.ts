/**
 * Structured Logging Utility
 * Provides log levels and structured logging for server-side code
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  userId?: string;
  requestId?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string | number;
  };
  metadata?: Record<string, any>;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  /**
   * Sanitize error object to prevent sensitive data leakage
   */
  private sanitizeError(error: unknown): LogEntry['error'] | undefined {
    if (!error) return undefined;

    if (error instanceof Error) {
      return {
        name: error.name,
        message: this.sanitizeMessage(error.message),
        stack: this.isDevelopment ? error.stack : undefined,
        code: (error as any).code,
      };
    }

    if (typeof error === 'object') {
      const errorObj = error as any;
      return {
        name: errorObj.name || 'UnknownError',
        message: this.sanitizeMessage(errorObj.message || String(error)),
        code: errorObj.code,
      };
    }

    return {
      name: 'UnknownError',
      message: this.sanitizeMessage(String(error)),
    };
  }

  /**
   * Sanitize message to remove sensitive information
   */
  private sanitizeMessage(message: string): string {
    if (!message) return '';

    // Remove potential sensitive patterns
    let sanitized = message
      // Remove API keys (basic pattern)
      .replace(/api[_-]?key["\s:=]+([a-zA-Z0-9_-]{20,})/gi, 'api_key=[REDACTED]')
      // Remove tokens
      .replace(/token["\s:=]+([a-zA-Z0-9_-]{20,})/gi, 'token=[REDACTED]')
      // Remove passwords
      .replace(/password["\s:=]+([^\s"']+)/gi, 'password=[REDACTED]')
      // Remove secrets
      .replace(/secret["\s:=]+([a-zA-Z0-9_-]{20,})/gi, 'secret=[REDACTED]');

    return sanitized;
  }

  /**
   * Create structured log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: string,
    error?: unknown,
    metadata?: Record<string, any>
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message: this.sanitizeMessage(message),
      timestamp: new Date().toISOString(),
    };

    if (context) entry.context = context;
    if (error) entry.error = this.sanitizeError(error);
    if (metadata) entry.metadata = this.sanitizeMetadata(metadata);

    return entry;
  }

  /**
   * Sanitize metadata to remove sensitive fields
   */
  private sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'api_key', 'authorization', 'auth'];
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(metadata)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeMetadata(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Write log entry
   */
  private writeLog(entry: LogEntry): void {
    const logString = JSON.stringify(entry);

    // In development, also log to console with colors
    if (this.isDevelopment) {
      const colors = {
        [LogLevel.DEBUG]: '\x1b[36m', // Cyan
        [LogLevel.INFO]: '\x1b[32m',  // Green
        [LogLevel.WARN]: '\x1b[33m',  // Yellow
        [LogLevel.ERROR]: '\x1b[31m', // Red
        [LogLevel.FATAL]: '\x1b[35m', // Magenta
      };
      const reset = '\x1b[0m';
      const color = colors[entry.level] || reset;

      console.log(`${color}[${entry.level.toUpperCase()}]${reset} ${entry.message}`);
      if (entry.error) {
        console.error(`  Error: ${entry.error.name}: ${entry.error.message}`);
        if (entry.error.stack) {
          console.error(`  Stack: ${entry.error.stack}`);
        }
      }
      if (entry.metadata) {
        console.log(`  Metadata:`, entry.metadata);
      }
    }

    // In production, you would send to a logging service
    // Example: sendToLoggingService(entry)
    // For now, we'll use console in production but with structured format
    if (this.isProduction && entry.level >= LogLevel.ERROR) {
      console.error(logString);
    } else if (this.isProduction && entry.level === LogLevel.WARN) {
      console.warn(logString);
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: string, metadata?: Record<string, any>): void {
    if (this.isDevelopment) {
      this.writeLog(this.createLogEntry(LogLevel.DEBUG, message, context, undefined, metadata));
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: string, metadata?: Record<string, any>): void {
    this.writeLog(this.createLogEntry(LogLevel.INFO, message, context, undefined, metadata));
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: string, error?: unknown, metadata?: Record<string, any>): void {
    this.writeLog(this.createLogEntry(LogLevel.WARN, message, context, error, metadata));
  }

  /**
   * Log error message
   */
  error(message: string, context?: string, error?: unknown, metadata?: Record<string, any>): void {
    this.writeLog(this.createLogEntry(LogLevel.ERROR, message, context, error, metadata));
  }

  /**
   * Log fatal error
   */
  fatal(message: string, context?: string, error?: unknown, metadata?: Record<string, any>): void {
    this.writeLog(this.createLogEntry(LogLevel.FATAL, message, context, error, metadata));
  }
}

// Export singleton instance
export const logger = new Logger();

