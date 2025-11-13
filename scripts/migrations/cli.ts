#!/usr/bin/env bun
/**
 * Migration CLI
 * 
 * Command-line interface for running database migrations
 */

import { runMigrations, rollbackMigrations, getMigrationStatus } from './runner';

const command = process.argv[2];
const args = process.argv.slice(3);

async function main() {
  try {
    switch (command) {
      case 'up': {
        const dryRun = args.includes('--dry-run');
        const migrationArg = args.find(arg => arg.startsWith('--migration='));
        const migration = migrationArg ? migrationArg.split('=')[1] : undefined;
        
        const result = await runMigrations({ dryRun, migration });
        
        if (result.success) {
          console.log(`\n✅ Successfully applied ${result.applied.length} migration(s)`);
          process.exit(0);
        } else {
          console.error(`\n❌ Migration failed`);
          result.errors.forEach(error => console.error(`  ${error}`));
          process.exit(1);
        }
      }
      
      case 'down': {
        const migrationArg = args.find(arg => arg.startsWith('--migration='));
        const countArg = args.find(arg => arg.startsWith('--count='));
        const migration = migrationArg ? migrationArg.split('=')[1] : undefined;
        const count = countArg ? parseInt(countArg.split('=')[1], 10) : undefined;
        
        const result = await rollbackMigrations({ migration, count });
        
        if (result.success) {
          console.log(`\n✅ Successfully rolled back ${result.rolledBack.length} migration(s)`);
          process.exit(0);
        } else {
          console.error(`\n❌ Rollback failed`);
          result.errors.forEach(error => console.error(`  ${error}`));
          process.exit(1);
        }
      }
      
      case 'status': {
        const status = await getMigrationStatus();
        
        console.log('\n📊 Migration Status\n');
        console.log('Version | Description                    | Status  | Applied At');
        console.log('--------|-------------------------------|---------|-------------------');
        
        for (const s of status) {
          const statusIcon = s.applied ? '✅' : '⏳';
          const statusText = s.applied ? 'Applied' : 'Pending';
          const appliedAt = s.appliedAt ? new Date(s.appliedAt).toLocaleString() : '-';
          const desc = s.description.length > 30 ? s.description.substring(0, 27) + '...' : s.description;
          
          console.log(`${s.version.padEnd(7)} | ${desc.padEnd(30)} | ${statusIcon} ${statusText.padEnd(5)} | ${appliedAt}`);
        }
        
        const appliedCount = status.filter(s => s.applied).length;
        const pendingCount = status.filter(s => s.pending).length;
        
        console.log(`\nTotal: ${status.length} | Applied: ${appliedCount} | Pending: ${pendingCount}`);
        
        process.exit(0);
      }
      
      case 'create': {
        const nameArg = args.find(arg => arg.startsWith('--name='));
        if (!nameArg) {
          console.error('❌ Error: --name= is required');
          console.log('Usage: bun scripts/migrations/cli.ts create --name=migration_name');
          process.exit(1);
        }
        
        const name = nameArg.split('=')[1];
        const timestamp = Date.now();
        const version = String(Math.floor(timestamp / 1000)).slice(-6); // Last 6 digits of timestamp
        
        const template = `/**
 * Migration ${version}: ${name}
 * 
 * Description: [Add description here]
 * 
 * Created: ${new Date().toISOString()}
 */

import { Migration } from '../types';
import { tablesDB, DATABASE_ID } from '@/lib/appwrite';

export const migration: Migration = {
  version: '${version}',
  description: '${name.replace(/_/g, ' ')}',
  
  async up() {
    console.log('Migration ${version}: ${name}');
    
    // TODO: Implement migration logic
    // Note: Appwrite doesn't support programmatic schema changes
    // This migration serves as documentation and validation
    
    return {
      success: true,
      message: 'Migration ${version} completed',
    };
  },
  
  async down() {
    // TODO: Implement rollback logic (if applicable)
    return {
      success: true,
      message: 'Migration ${version} rolled back',
    };
  },
};
`;
        
        const fs = await import('fs/promises');
        const path = await import('path');
        const migrationsDir = path.join(process.cwd(), 'scripts', 'migrations', 'migrations');
        const fileName = `${version}_${name}.ts`;
        const filePath = path.join(migrationsDir, fileName);
        
        await fs.mkdir(migrationsDir, { recursive: true });
        await fs.writeFile(filePath, template, 'utf-8');
        
        console.log(`✅ Created migration: ${fileName}`);
        console.log(`   Path: ${filePath}`);
        
        process.exit(0);
      }
      
      default:
        console.log('Database Migration CLI\n');
        console.log('Usage:');
        console.log('  bun scripts/migrations/cli.ts up [--dry-run] [--migration=version]');
        console.log('  bun scripts/migrations/cli.ts down [--migration=version] [--count=N]');
        console.log('  bun scripts/migrations/cli.ts status');
        console.log('  bun scripts/migrations/cli.ts create --name=migration_name');
        console.log('\nCommands:');
        console.log('  up       Apply pending migrations');
        console.log('  down     Rollback migrations');
        console.log('  status   Show migration status');
        console.log('  create   Create a new migration file');
        process.exit(1);
    }
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();

