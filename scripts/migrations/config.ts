/**
 * Migration Configuration
 * 
 * Configuration settings for the migration system
 */

import { MigrationConfig } from './types';
import path from 'path';

export const migrationConfig: MigrationConfig = {
  migrationsDir: path.join(process.cwd(), 'scripts', 'migrations', 'migrations'),
  historyFile: path.join(process.cwd(), 'scripts', 'migrations', 'history', 'applied.json'),
  autoBackup: true,
  validateBeforeApply: true,
};

/**
 * Get migration history file path
 */
export function getHistoryFilePath(): string {
  return migrationConfig.historyFile;
}

/**
 * Get migrations directory path
 */
export function getMigrationsDir(): string {
  return migrationConfig.migrationsDir;
}

