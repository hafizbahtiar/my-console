/**
 * Backup Configuration
 *
 * Centralized configuration for the Appwrite backup system
 */

interface AppwriteConfig {
  endpoint: string;
  projectId: string | undefined;
  databaseId: string;
  apiKey: string | undefined;
}

interface BackupConfig {
  baseDir: string;
  retention: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  excludeCollections: string[];
  includeCollections: string[];
}

interface FormatConfig {
  enabled: boolean;
  compression?: string;
  extension: string;
}

interface FormatsConfig {
  postgresql: FormatConfig;
  mongodb: FormatConfig;
  excel: FormatConfig;
}

interface CronSchedule {
  cron: string;
  enabled: boolean;
  description: string;
}

interface CronSchedules {
  daily: CronSchedule;
  weekly: CronSchedule;
  monthly: CronSchedule;
}

interface CronConfig {
  timezone: string;
  schedules: CronSchedules;
}

interface NotificationConfig {
  enabled: boolean;
  email?: string;
  webhook?: string;
}

interface LoggingConfig {
  level: string;
  file: string;
  maxSize: string;
  maxFiles: number;
}

interface BackupSystemConfig {
  appwrite: AppwriteConfig;
  backup: BackupConfig;
  formats: FormatsConfig;
  cron: CronConfig;
  notifications: NotificationConfig;
  logging: LoggingConfig;
}

const config: BackupSystemConfig = {
  // Appwrite configuration
  appwrite: {
    endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
    projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
    databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'console-db',
    apiKey: process.env.APPWRITE_API_KEY // Server-side API key required for backups
  },

  // Backup configuration
  backup: {
    baseDir: process.env.BACKUP_DIR || './backup',
    retention: {
      daily: parseInt(process.env.BACKUP_RETENTION_DAILY || '7'),     // Keep 7 daily backups
      weekly: parseInt(process.env.BACKUP_RETENTION_WEEKLY || '4'),   // Keep 4 weekly backups
      monthly: parseInt(process.env.BACKUP_RETENTION_MONTHLY || '12') // Keep 12 monthly backups
    },
    // Collections to exclude from backup (optional)
    excludeCollections: (process.env.BACKUP_EXCLUDE_COLLECTIONS || '').split(',').filter(Boolean),
    // Collections to include (if specified, only these will be backed up)
    includeCollections: (process.env.BACKUP_INCLUDE_COLLECTIONS || '').split(',').filter(Boolean)
  },

  // Export formats configuration
  formats: {
    postgresql: {
      enabled: process.env.BACKUP_FORMAT_POSTGRESQL !== 'false',
      compression: 'gzip',
      extension: '.sql.gz'
    },
    mongodb: {
      enabled: process.env.BACKUP_FORMAT_MONGODB !== 'false',
      compression: 'gzip',
      extension: '.bson.gz'
    },
    excel: {
      enabled: process.env.BACKUP_FORMAT_EXCEL !== 'false',
      extension: '.xlsx'
    }
  },

  // Cronjob configuration
  cron: {
    timezone: process.env.TZ || 'UTC',
    schedules: {
      daily: {
        cron: process.env.BACKUP_CRON_DAILY || '0 2 * * *',
        enabled: process.env.BACKUP_CRON_DAILY_ENABLED !== 'false',
        description: 'Daily backup at 2:00 AM'
      },
      weekly: {
        cron: process.env.BACKUP_CRON_WEEKLY || '0 3 * * 0',
        enabled: process.env.BACKUP_CRON_WEEKLY_ENABLED !== 'false',
        description: 'Weekly backup (Sunday) at 3:00 AM'
      },
      monthly: {
        cron: process.env.BACKUP_CRON_MONTHLY || '0 4 1 * *',
        enabled: process.env.BACKUP_CRON_MONTHLY_ENABLED !== 'false',
        description: 'Monthly backup (1st of month) at 4:00 AM'
      }
    }
  },

  // Notification settings (for future implementation)
  notifications: {
    enabled: process.env.BACKUP_NOTIFICATIONS_ENABLED === 'true',
    email: process.env.BACKUP_NOTIFICATION_EMAIL,
    webhook: process.env.BACKUP_NOTIFICATION_WEBHOOK
  },

  // Logging configuration
  logging: {
    level: process.env.BACKUP_LOG_LEVEL || 'info', // error, warn, info, debug
    file: process.env.BACKUP_LOG_FILE || './backup/logs/backup.log',
    maxSize: process.env.BACKUP_LOG_MAX_SIZE || '10m',
    maxFiles: parseInt(process.env.BACKUP_LOG_MAX_FILES || '5')
  }
};

export default config;
