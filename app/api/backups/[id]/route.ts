import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { createProtectedDELETE } from '@/lib/api-protection';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return createProtectedDELETE(
    async ({ params: routeParams }) => {
      if (!routeParams || !routeParams.id) {
        return NextResponse.json({ error: 'Backup ID is required' }, { status: 400 });
      }

      const backupId = routeParams.id;

      const backupDir = path.join(process.cwd(), 'backup');
      const dailyDir = path.join(backupDir, 'daily');
      const logsDir = path.join(backupDir, 'logs');

      // Find all files related to this backup
      const filesToDelete: string[] = [];

      // Extract timestamp from backup ID (e.g., "backup_2025-11-05T14-50-00" -> "2025-11-05T14-50-00")
      const timestamp = backupId.replace('backup_', '');

      // Check daily directory for backup files
      if (fs.existsSync(dailyDir)) {
        const dailyFiles = fs.readdirSync(dailyDir);
        dailyFiles.forEach((file) => {
          // Match files that contain the timestamp (works for both manual and auto backups)
          if (file.includes(timestamp)) {
            filesToDelete.push(path.join(dailyDir, file));
          }
        });
      }

      // Check logs directory for backup log
      if (fs.existsSync(logsDir)) {
        const logFiles = fs.readdirSync(logsDir);
        logFiles.forEach((file) => {
          if (file.includes(timestamp)) {
            filesToDelete.push(path.join(logsDir, file));
          }
        });
      }

      if (filesToDelete.length === 0) {
        return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
      }

      // Delete all related files
      let deletedCount = 0;
      for (const filePath of filesToDelete) {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            deletedCount++;
            console.log(`Deleted backup file: ${filePath}`);
          }
        } catch (error) {
          console.warn(`Failed to delete file ${filePath}:`, error);
        }
      }

      console.log(`Successfully deleted ${deletedCount} backup files for ${backupId}`);

      return NextResponse.json({
        success: true,
        message: `Backup ${backupId} deleted successfully`,
        filesDeleted: deletedCount,
      });
    },
    {
      rateLimit: 'api',
    }
  )(request, { params });
}
