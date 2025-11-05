import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function GET() {
  try {
    const logsDir = path.join(process.cwd(), 'backup', 'logs');

    // Check if logs directory exists
    if (!fs.existsSync(logsDir)) {
      return NextResponse.json([]);
    }

    // Read all log files
    const logFiles = fs.readdirSync(logsDir)
      .filter(file => file.startsWith('backup_') && file.endsWith('.json'))
      .sort()
      .reverse(); // Most recent first

    const backupHistory = [];

    for (const logFile of logFiles.slice(0, 20)) { // Limit to last 20 backups
      try {
        const logPath = path.join(logsDir, logFile);
        const logContent = fs.readFileSync(logPath, 'utf-8');
        const logData = JSON.parse(logContent);

        // Extract backup information
        const backupInfo = {
          id: `backup_${logFile.replace('backup_', '').replace('.json', '').replace(/[:.]/g, '-')}`,
          type: logData.exports?.[0]?.files?.postgresql?.includes('manual') ? 'manual' : 'auto',
          status: 'completed',
          size: logData.totalRecords ? `${(logData.totalRecords * 0.5).toFixed(1)} MB` : 'Unknown',
          createdAt: logData.timestamp,
          timestamp: logData.timestamp,
          collections: logData.collections || 0,
          totalRecords: logData.totalRecords || 0,
          duration: logData.duration || 0,
          exports: logData.exports || []
        };

        backupHistory.push(backupInfo);
      } catch (error) {
        console.warn(`Failed to parse backup log ${logFile}:`, error);
        // Skip corrupted log files
      }
    }

    return NextResponse.json(backupHistory);

  } catch (error) {
    console.error('Failed to read backup history:', error);
    return NextResponse.json(
      { error: 'Failed to read backup history' },
      { status: 500 }
    );
  }
}
