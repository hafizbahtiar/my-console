/**
 * Migration Runner
 * 
 * Executes database migrations with version tracking and rollback support
 */

import fs from 'fs/promises';
import path from 'path';
import { migrationConfig, getHistoryFilePath, getMigrationsDir } from './config';
import type { Migration, MigrationHistory, AppliedMigration, MigrationStatus, MigrationResult } from './types';

/**
 * Load migration history from file
 */
async function loadHistory(): Promise<MigrationHistory> {
  const historyPath = getHistoryFilePath();
  
  try {
    // Ensure history directory exists
    const historyDir = path.dirname(historyPath);
    await fs.mkdir(historyDir, { recursive: true });
    
    const content = await fs.readFile(historyPath, 'utf-8');
    return JSON.parse(content) as MigrationHistory;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // History file doesn't exist, return empty history
      return {
        applied: [],
        lastUpdated: new Date().toISOString(),
      };
    }
    throw error;
  }
}

/**
 * Save migration history to file
 */
async function saveHistory(history: MigrationHistory): Promise<void> {
  const historyPath = getHistoryFilePath();
  const historyDir = path.dirname(historyPath);
  
  await fs.mkdir(historyDir, { recursive: true });
  await fs.writeFile(historyPath, JSON.stringify(history, null, 2), 'utf-8');
}

/**
 * Load all migration files
 */
async function loadMigrations(): Promise<Migration[]> {
  const migrationsDir = getMigrationsDir();
  
  try {
    const files = await fs.readdir(migrationsDir);
    const migrationFiles = files
      .filter(file => file.endsWith('.ts') && !file.endsWith('.d.ts'))
      .sort();
    
    const migrations: Migration[] = [];
    
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const module = await import(filePath);
      
      if (module.migration && typeof module.migration === 'object') {
        migrations.push(module.migration as Migration);
      }
    }
    
    return migrations.sort((a, b) => a.version.localeCompare(b.version));
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.warn(`Migrations directory not found: ${migrationsDir}`);
      return [];
    }
    throw error;
  }
}

/**
 * Get migration status
 */
export async function getMigrationStatus(): Promise<MigrationStatus[]> {
  const history = await loadHistory();
  const migrations = await loadMigrations();
  const appliedVersions = new Set(history.applied.map(m => m.version));
  
  return migrations.map(migration => ({
    version: migration.version,
    description: migration.description,
    applied: appliedVersions.has(migration.version),
    appliedAt: history.applied.find(m => m.version === migration.version)?.appliedAt,
    pending: !appliedVersions.has(migration.version),
    canRollback: !!migration.down,
  }));
}

/**
 * Apply pending migrations
 */
export async function runMigrations(options: {
  dryRun?: boolean;
  migration?: string;
} = {}): Promise<{ success: boolean; applied: string[]; errors: string[] }> {
  const { dryRun = false, migration: specificMigration } = options;
  
  const history = await loadHistory();
  const migrations = await loadMigrations();
  const appliedVersions = new Set(history.applied.map(m => m.version));
  
  // Filter migrations
  let pendingMigrations = migrations.filter(m => !appliedVersions.has(m.version));
  
  if (specificMigration) {
    pendingMigrations = pendingMigrations.filter(m => m.version === specificMigration);
    if (pendingMigrations.length === 0) {
      throw new Error(`Migration ${specificMigration} not found or already applied`);
    }
  }
  
  // Check dependencies
  for (const migration of pendingMigrations) {
    if (migration.dependencies) {
      for (const dep of migration.dependencies) {
        if (!appliedVersions.has(dep)) {
          throw new Error(`Migration ${migration.version} depends on ${dep} which has not been applied`);
        }
      }
    }
  }
  
  const applied: string[] = [];
  const errors: string[] = [];
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be applied\n');
    console.log(`Would apply ${pendingMigrations.length} migration(s):`);
    pendingMigrations.forEach(m => {
      console.log(`  - ${m.version}: ${m.description}`);
    });
    return { success: true, applied: pendingMigrations.map(m => m.version), errors: [] };
  }
  
  console.log(`🚀 Applying ${pendingMigrations.length} migration(s)...\n`);
  
  for (const migration of pendingMigrations) {
    try {
      console.log(`📦 Applying migration ${migration.version}: ${migration.description}`);
      
      const result = await migration.up();
      
      if (result.success) {
        // Record in history
        const appliedMigration: AppliedMigration = {
          version: migration.version,
          description: migration.description,
          appliedAt: new Date().toISOString(),
          appliedBy: process.env.USER || 'system',
          result,
        };
        
        history.applied.push(appliedMigration);
        history.lastUpdated = new Date().toISOString();
        await saveHistory(history);
        
        applied.push(migration.version);
        console.log(`✅ Migration ${migration.version} applied successfully`);
        
        if (result.warnings && result.warnings.length > 0) {
          result.warnings.forEach(warning => console.warn(`  ⚠️  ${warning}`));
        }
      } else {
        errors.push(`Migration ${migration.version}: ${result.message}`);
        console.error(`❌ Migration ${migration.version} failed: ${result.message}`);
        if (result.errors) {
          result.errors.forEach(error => console.error(`  ❌ ${error}`));
        }
        break; // Stop on first failure
      }
    } catch (error: any) {
      const errorMsg = `Migration ${migration.version} error: ${error.message}`;
      errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
      break; // Stop on first error
    }
  }
  
  return {
    success: errors.length === 0,
    applied,
    errors,
  };
}

/**
 * Rollback migrations
 */
export async function rollbackMigrations(options: {
  migration?: string;
  count?: number;
} = {}): Promise<{ success: boolean; rolledBack: string[]; errors: string[] }> {
  const { migration: specificMigration, count = 1 } = options;
  
  const history = await loadHistory();
  const migrations = await loadMigrations();
  const migrationMap = new Map(migrations.map(m => [m.version, m]));
  
  // Get applied migrations in reverse order
  let migrationsToRollback = [...history.applied].reverse();
  
  if (specificMigration) {
    migrationsToRollback = migrationsToRollback.filter(m => m.version === specificMigration);
    if (migrationsToRollback.length === 0) {
      throw new Error(`Migration ${specificMigration} not found in applied migrations`);
    }
  } else {
    migrationsToRollback = migrationsToRollback.slice(0, count);
  }
  
  const rolledBack: string[] = [];
  const errors: string[] = [];
  
  console.log(`🔄 Rolling back ${migrationsToRollback.length} migration(s)...\n`);
  
  for (const appliedMigration of migrationsToRollback) {
    const migration = migrationMap.get(appliedMigration.version);
    
    if (!migration) {
      errors.push(`Migration ${appliedMigration.version} not found`);
      continue;
    }
    
    if (!migration.down) {
      errors.push(`Migration ${appliedMigration.version} does not support rollback`);
      continue;
    }
    
    try {
      console.log(`📦 Rolling back migration ${migration.version}: ${migration.description}`);
      
      const result = await migration.down();
      
      if (result.success) {
        // Remove from history
        history.applied = history.applied.filter(m => m.version !== migration.version);
        history.lastUpdated = new Date().toISOString();
        await saveHistory(history);
        
        rolledBack.push(migration.version);
        console.log(`✅ Migration ${migration.version} rolled back successfully`);
      } else {
        errors.push(`Migration ${migration.version}: ${result.message}`);
        console.error(`❌ Rollback failed: ${result.message}`);
      }
    } catch (error: any) {
      const errorMsg = `Rollback error for ${migration.version}: ${error.message}`;
      errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
    }
  }
  
  return {
    success: errors.length === 0,
    rolledBack,
    errors,
  };
}

