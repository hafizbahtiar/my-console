#!/usr/bin/env node

/**
 * Cronjob Scheduler for Appwrite Database Backups
 *
 * Schedules automated backups:
 * - Daily: Every day at 2:00 AM
 * - Weekly: Every Sunday at 3:00 AM
 * - Monthly: First day of month at 4:00 AM
 *
 * Usage: bun scripts/backup/cronjob.ts
 */

import * as cron from 'node-cron';
import * as fs from 'fs';
import * as path from 'path';
import { performBackup, BackupSummary } from './backup';
import config from './config';

// Use configuration from config file
const cronConfig = config.cron;

// Move daily backup to weekly folder (for retention)
function archiveWeeklyBackup(): void {
  const backupDir = path.join(process.cwd(), 'backup');
  const dailyDir = path.join(backupDir, 'daily');
  const weeklyDir = path.join(backupDir, 'weekly');

  if (!fs.existsSync(dailyDir)) return;

  const files = fs.readdirSync(dailyDir)
    .filter(file => file.endsWith('.sql.gz') || file.endsWith('.bson.gz') || file.endsWith('.xlsx'))
    .sort()
    .reverse(); // Get newest files first

  if (files.length === 0) return;

  // Move the most recent daily backup to weekly
  const latestFile = files[0];
  const sourcePath = path.join(dailyDir, latestFile);
  const destPath = path.join(weeklyDir, latestFile.replace('_', '_weekly_'));

  try {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`📁 Archived weekly backup: ${latestFile} -> ${path.basename(destPath)}`);
  } catch (error) {
    console.error('Failed to archive weekly backup:', error instanceof Error ? error.message : String(error));
  }
}

// Move weekly backup to monthly folder (for retention)
function archiveMonthlyBackup(): void {
  const backupDir = path.join(process.cwd(), 'backup');
  const weeklyDir = path.join(backupDir, 'weekly');
  const monthlyDir = path.join(backupDir, 'monthly');

  if (!fs.existsSync(weeklyDir)) return;

  const files = fs.readdirSync(weeklyDir)
    .filter(file => file.endsWith('.sql.gz') || file.endsWith('.bson.gz') || file.endsWith('.xlsx'))
    .sort()
    .reverse(); // Get newest files first

  if (files.length === 0) return;

  // Move the most recent weekly backup to monthly
  const latestFile = files[0];
  const sourcePath = path.join(weeklyDir, latestFile);
  const destPath = path.join(monthlyDir, latestFile.replace('_weekly_', '_monthly_'));

  try {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`📁 Archived monthly backup: ${latestFile} -> ${path.basename(destPath)}`);
  } catch (error) {
    console.error('Failed to archive monthly backup:', error instanceof Error ? error.message : String(error));
  }
}

// Enhanced backup functions with archiving
async function dailyBackup(): Promise<BackupSummary> {
  console.log('🕐 Starting scheduled DAILY backup...');
  try {
    const result = await performBackup();
    console.log('✅ Daily backup completed successfully');
    return result;
  } catch (error) {
    console.error('❌ Daily backup failed:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

async function weeklyBackup(): Promise<BackupSummary> {
  console.log('📅 Starting scheduled WEEKLY backup...');
  try {
    // First archive the latest daily backup to weekly
    archiveWeeklyBackup();

    // Then perform a fresh weekly backup
    const result = await performBackup();
    console.log('✅ Weekly backup completed successfully');
    return result;
  } catch (error) {
    console.error('❌ Weekly backup failed:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

async function monthlyBackup(): Promise<BackupSummary> {
  console.log('📊 Starting scheduled MONTHLY backup...');
  try {
    // First archive the latest weekly backup to monthly
    archiveMonthlyBackup();

    // Then perform a fresh monthly backup
    const result = await performBackup();
    console.log('✅ Monthly backup completed successfully');
    return result;
  } catch (error) {
    console.error('❌ Monthly backup failed:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// Initialize cronjobs
function startCronjobs() {
  console.log('🚀 Starting Appwrite backup cronjobs...');
  console.log(`⏰ Timezone: ${cronConfig.timezone}`);

  // Daily backup
  if (cronConfig.schedules.daily.enabled) {
    cron.schedule(cronConfig.schedules.daily.cron, dailyBackup, {
      timezone: cronConfig.timezone
    });
    console.log(`✅ ${cronConfig.schedules.daily.description}`);
  }

  // Weekly backup
  if (cronConfig.schedules.weekly.enabled) {
    cron.schedule(cronConfig.schedules.weekly.cron, weeklyBackup, {
      timezone: cronConfig.timezone
    });
    console.log(`✅ ${cronConfig.schedules.weekly.description}`);
  }

  // Monthly backup
  if (cronConfig.schedules.monthly.enabled) {
    cron.schedule(cronConfig.schedules.monthly.cron, monthlyBackup, {
      timezone: cronConfig.timezone
    });
    console.log(`✅ ${cronConfig.schedules.monthly.description}`);
  }

  console.log('\n⏳ Cronjobs are now running. Press Ctrl+C to stop.');
}

// Stop all cronjobs gracefully
function stopCronjobs() {
  console.log('\n🛑 Stopping cronjobs...');
  cron.getTasks().forEach(task => task.stop());
}

// Manual trigger functions for testing
async function triggerBackup(type = 'manual') {
  console.log(`🔧 Triggering ${type} backup...`);
  try {
    const result = await performBackup();
    console.log(`✅ ${type} backup completed successfully`);
    return result;
  } catch (error) {
    console.error(`❌ ${type} backup failed:`, error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// Alternative: System Cron (Linux/Mac)
function generateSystemCronCommands(): { daily: string; weekly: string; monthly: string; cronLines: string[] } {
  const projectRoot = process.cwd();

  // Check if running under bun, fallback to node
  const runtime = process.versions.bun ? 'bun' : 'node';

  return {
    daily: `${runtime} ${projectRoot}/scripts/backup/backup.ts`,
    weekly: `${runtime} ${projectRoot}/scripts/backup/backup.ts`,
    monthly: `${runtime} ${projectRoot}/scripts/backup/backup.ts`,
    cronLines: [
      `# My Console Database Backups`,
      `# Daily backup at 2:00 AM`,
      `0 2 * * * cd ${projectRoot} && ${runtime} scripts/backup/backup.ts`,
      `# Weekly backup (Sunday) at 3:00 AM`,
      `0 3 * * 0 cd ${projectRoot} && ${runtime} scripts/backup/backup.ts`,
      `# Monthly backup (1st) at 4:00 AM`,
      `0 4 1 * * cd ${projectRoot} && ${runtime} scripts/backup/backup.ts`
    ]
  };
}

// Alternative: Docker Cron
function generateDockerCronCommands(): { dockerfile: string; cronSetup: string } {
  // Check if running under bun, fallback to node
  const runtime = process.versions.bun ? 'bun' : 'node';

  return {
    dockerfile: `
# Add to your Dockerfile
RUN apt-get update && apt-get install -y cron
COPY scripts/backup/cron-setup.sh /cron-setup.sh
RUN chmod +x /cron-setup.sh
RUN /cron-setup.sh

# Add to docker-compose.yml
command: ["cron", "-f"]
    `,
    cronSetup: `# cron-setup.sh
#!/bin/bash
# Add cron jobs
echo "0 2 * * * root cd /app && ${runtime} scripts/backup/backup.ts" >> /etc/cron.d/my-console-backup
echo "0 3 * * 0 root cd /app && ${runtime} scripts/backup/backup.ts" >> /etc/cron.d/my-console-backup
echo "0 4 1 * * root cd /app && ${runtime} scripts/backup/backup.ts" >> /etc/cron.d/my-console-backup
chmod 0644 /etc/cron.d/my-console-backup
crontab /etc/cron.d/my-console-backup
`
  };
}

// CLI interface
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Appwrite Backup Cronjob Manager

Usage: bun scripts/backup/cronjob.ts [options]

Options:
  --help, -h          Show this help message
  --start             Start cronjobs (default)
  --stop              Stop running cronjobs
  --trigger-daily     Run daily backup manually
  --trigger-weekly    Run weekly backup manually
  --trigger-monthly   Run monthly backup manually
  --status            Show cronjob status
  --system-cron       Show system cron (crontab) commands
  --docker-cron       Show Docker cron setup commands

Environment Variables:
  TZ                     Timezone for cronjobs (default: UTC)

Examples:
  bun scripts/backup/cronjob.ts                    # Start Node.js cronjobs
  bun scripts/backup/cronjob.ts --trigger-daily    # Manual daily backup
  bun scripts/backup/cronjob.ts --system-cron      # Show system cron setup
  bun scripts/backup/cronjob.ts --docker-cron      # Show Docker cron setup

Current Cron Schedules:
  Daily:   ${cronConfig.schedules.daily.cron} (${cronConfig.schedules.daily.description})
  Weekly:  ${cronConfig.schedules.weekly.cron} (${cronConfig.schedules.weekly.description})
  Monthly: ${cronConfig.schedules.monthly.cron} (${cronConfig.schedules.monthly.description})

Alternative Cron Methods:
  1. Node.js Cron (current): Keeps Node.js process running
  2. System Cron: Uses OS crontab (Linux/Mac)
  3. Docker Cron: Container-based cron
  4. Cloud Cron: Vercel, GitHub Actions, etc.
    `);
    return;
  }

  if (args.includes('--stop')) {
    stopCronjobs();
    return;
  }

  if (args.includes('--trigger-daily')) {
    await triggerBackup('daily');
    return;
  }

  if (args.includes('--trigger-weekly')) {
    await triggerBackup('weekly');
    return;
  }

  if (args.includes('--trigger-monthly')) {
    await triggerBackup('monthly');
    return;
  }

  if (args.includes('--status')) {
    const tasks = cron.getTasks();
    console.log(`Active cronjobs: ${tasks.size}`);
    let index = 1;
    tasks.forEach((task) => {
      console.log(`  ${index}. ${task.name || 'Unnamed task'}`);
      index++;
    });
    return;
  }

  if (args.includes('--system-cron')) {
    const systemCron = generateSystemCronCommands();
    console.log('🔧 System Cron (crontab) Setup:');
    console.log('');
    console.log('1. Open crontab editor:');
    console.log('   crontab -e');
    console.log('');
    console.log('2. Add these lines:');
    systemCron.cronLines.forEach(line => console.log(`   ${line}`));
    console.log('');
    console.log('3. Save and exit (usually Ctrl+X, then Y, then Enter)');
    console.log('');
    console.log('Alternative: Save to file and load:');
    console.log(`   echo "${systemCron.cronLines.slice(1).join('\\n')}" | crontab -`);
    return;
  }

  if (args.includes('--docker-cron')) {
    const dockerCron = generateDockerCronCommands();
    console.log('🐳 Docker Cron Setup:');
    console.log('');
    console.log('1. Create cron-setup.sh:');
    console.log(dockerCron.cronSetup);
    console.log('');
    console.log('2. Update Dockerfile:');
    console.log(dockerCron.dockerfile);
    console.log('');
    console.log('3. Alternative: Use a separate cron container');
    console.log('   - Use docker-compose with a cron service');
    console.log('   - Use a cron-based image like alpine with cron');
    return;
  }

  // Default: start cronjobs
  startCronjobs();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    stopCronjobs();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    stopCronjobs();
    process.exit(0);
  });
}

// Export for use as module
export {
  startCronjobs,
  stopCronjobs,
  dailyBackup,
  weeklyBackup,
  monthlyBackup,
  triggerBackup,
  cronConfig,
  generateSystemCronCommands,
  generateDockerCronCommands
};

// Run if called directly
if (require.main === module) {
  main();
}
