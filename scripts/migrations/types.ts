/**
 * Migration System Types
 * 
 * Type definitions for the database migration system
 */

export interface Migration {
  /** Migration version (e.g., '001', '002') */
  version: string;
  
  /** Human-readable description */
  description: string;
  
  /** Function to apply the migration */
  up: () => Promise<MigrationResult>;
  
  /** Function to rollback the migration (optional) */
  down?: () => Promise<MigrationResult>;
  
  /** Dependencies on other migrations (versions that must be applied first) */
  dependencies?: string[];
}

export interface MigrationResult {
  success: boolean;
  message: string;
  data?: any;
  warnings?: string[];
  errors?: string[];
}

export interface AppliedMigration {
  version: string;
  description: string;
  appliedAt: string;
  appliedBy: string;
  result?: MigrationResult;
}

export interface MigrationHistory {
  applied: AppliedMigration[];
  lastUpdated: string;
}

export interface MigrationStatus {
  version: string;
  description: string;
  applied: boolean;
  appliedAt?: string;
  pending: boolean;
  canRollback: boolean;
}

export interface MigrationConfig {
  /** Directory containing migration files */
  migrationsDir: string;
  
  /** Path to migration history file */
  historyFile: string;
  
  /** Whether to create backups before migrations */
  autoBackup: boolean;
  
  /** Whether to validate migrations before applying */
  validateBeforeApply: boolean;
}

