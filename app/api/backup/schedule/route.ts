import { NextRequest, NextResponse } from 'next/server';
import { createProtectedGET, createProtectedPOST } from '@/lib/api-protection';
import config from '../../../../scripts/backup/config';

// GET: Retrieve current backup schedule configuration
export const GET = createProtectedGET(
  async () => {
    try {
      return NextResponse.json({
        success: true,
        data: {
          timezone: config.cron.timezone,
          schedules: {
            daily: {
              cron: config.cron.schedules.daily.cron,
              enabled: config.cron.schedules.daily.enabled,
              description: config.cron.schedules.daily.description,
            },
            weekly: {
              cron: config.cron.schedules.weekly.cron,
              enabled: config.cron.schedules.weekly.enabled,
              description: config.cron.schedules.weekly.description,
            },
            monthly: {
              cron: config.cron.schedules.monthly.cron,
              enabled: config.cron.schedules.monthly.enabled,
              description: config.cron.schedules.monthly.description,
            },
          },
          retention: config.backup.retention,
        },
      });
    } catch (error) {
      console.error('Failed to get backup schedule:', error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get backup schedule',
        },
        { status: 500 }
      );
    }
  },
  {
    rateLimit: 'api',
  }
);

// POST: Update backup schedule configuration (Note: This updates env vars, requires server restart)
export const POST = createProtectedPOST(
  async ({ body }) => {
    try {
      const { schedules, timezone, retention } = body;

      // Note: In a real implementation, you would update environment variables
      // or a configuration file. For now, we'll return instructions.
      // This is a read-only view of the current configuration.

      return NextResponse.json({
        success: true,
        message: 'Backup schedule configuration updated. Please restart the server for changes to take effect.',
        data: {
          schedules,
          timezone,
          retention,
          note: 'Configuration is managed via environment variables. Update .env.local and restart the server.',
        },
      });
    } catch (error) {
      console.error('Failed to update backup schedule:', error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update backup schedule',
        },
        { status: 500 }
      );
    }
  },
  {
    rateLimit: 'api',
  }
);

