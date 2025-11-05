# Database Administration Guide

This guide covers the database administration features available in the My Console application, including **real-time monitoring** with live data, automated backup management with replacement strategy, and comprehensive data export capabilities.

## Table of Contents

- [Overview](#overview)
- [Database Dashboard](#database-dashboard)
- [Backup Management](#backup-management)
- [Manual Backups](#manual-backups)
- [Backup History & Deletion](#backup-history--deletion)
- [API Endpoints](#api-endpoints)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

## Overview

The database administration interface provides comprehensive tools for monitoring and managing your Appwrite database. Located at `/auth/admin/database`, it offers:

- **Real-time Statistics**: Live collection counts, document counts, and storage usage
- **Activity Monitoring**: Recent database operations and audit events
- **Backup Management**: Automated and manual backup creation
- **Backup History**: Complete backup history with download and delete options
- **Data Export**: Multiple format support (PostgreSQL, MongoDB, Excel)

## Database Dashboard

### Access
Navigate to `/auth/admin/database` in your authenticated admin session.

### Key Metrics

The dashboard displays four primary metrics with **real-time data**:

1. **Total Collections**: Live count of accessible database collections
2. **Total Documents**: Real-time total documents across all collections
3. **Database Size**: Calculated storage usage from actual collection data
4. **Backup Status**: Dynamic status based on recent backup history
   - **Healthy**: Backups within last 24 hours
   - **Warning**: Backups within last 3 days
   - **Critical**: Backups older than 3 days
   - **No Backups**: No backup history found

### System Health

The dashboard includes a system health section with **dynamic metrics**:
- **CPU Usage**: Real-time CPU utilization (15-35% normal range)
- **Memory Usage**: Current memory consumption (40-70% normal range)
- **Storage Usage**: Database storage utilization (25-40% normal range)
- **Connection Pool**: Active database connections (8-15/20 normal range)

### Recent Activity

Displays the latest database operations including:
- User login/logout events
- Profile updates
- Security events
- System operations

## Backup Management

### Automated Backups

The system supports three automated backup schedules:

- **Daily**: Runs at 2:00 AM daily (replaces previous day's backup)
- **Weekly**: Runs at 3:00 AM every Sunday
- **Monthly**: Runs at 4:00 AM on the 1st of each month

#### Daily Backup Behavior

Daily automated backups follow a "replace" strategy:

- **Single Backup Per Day**: Only one daily backup exists per day
- **Automatic Cleanup**: Previous day's daily backup is automatically deleted
- **Space Efficient**: Prevents accumulation of daily backups
- **Manual Preservation**: Manual backups are never automatically deleted

#### Configuration

Backups can be configured via environment variables:

```bash
# Retention settings (weekly and monthly only - daily is always 1)
BACKUP_RETENTION_DAILY=1       # Always 1 (replaced daily)
BACKUP_RETENTION_WEEKLY=4      # Keep 4 weekly backups
BACKUP_RETENTION_MONTHLY=12    # Keep 12 monthly backups

# Schedule settings
BACKUP_CRON_DAILY_ENABLED=true
BACKUP_CRON_DAILY="0 2 * * *"          # Daily at 2:00 AM
BACKUP_CRON_WEEKLY="0 3 * * 0"        # Weekly on Sunday at 3:00 AM
BACKUP_CRON_MONTHLY="0 4 1 * *"       # Monthly on 1st at 4:00 AM
```

> **Note**: `BACKUP_RETENTION_DAILY=1` is recommended since daily backups are automatically replaced each day.

### Manual Backups

#### Creating Manual Backups

1. Navigate to the Database Admin page
2. Click the **"Manual Backup"** button in the top-right corner
3. Wait for the backup process to complete
4. Receive confirmation notification

#### What Gets Backed Up

Manual backups include all accessible collections and export data in three formats:

- **PostgreSQL** (`.sql.gz`): Compressed SQL INSERT statements
- **MongoDB** (`.bson.gz`): Compressed BSON data
- **Excel** (`.xlsx`): Human-readable spreadsheets with metadata

#### File Naming Convention

Manual backups use the prefix `manual_` to distinguish them from automated backups:

```
backup/daily/
├── manual_audit_logs_2025-11-05T14-30-25.sql.gz
├── manual_audit_logs_2025-11-05T14-30-25.bson.gz
├── manual_audit_logs_2025-11-05T14-30-25.xlsx
└── ...
```

#### Manual vs Automated Backup Differences

| Feature | Manual Backups | Automated Daily | Automated Weekly/Monthly |
|---------|---------------|-----------------|-------------------------|
| **Naming** | `manual_` prefix | No prefix | No prefix |
| **Trigger** | User-initiated | Cron job | Cron job |
| **Replacement** | Never auto-deleted | Replaced daily | Retention policy |
| **Storage** | Accumulates | Single per day | Retention limit |

## Backup History & Deletion

### Viewing Backup History

The **"Backups"** tab displays a complete history of all backups:

- **Backup ID**: Unique identifier for each backup
- **Type**: `manual` or `auto` (automated)
- **Status**: Current status (`completed`, `failed`, etc.)
- **Size**: Estimated backup size
- **Collections**: Number of collections backed up
- **Created**: Timestamp of backup creation
- **Actions**: Available operations

### Deleting Backups

#### Process

1. Locate the backup in the history table
2. Click the **red trash icon** in the Actions column
3. Confirm deletion in the dialog box
4. Backup files are permanently removed

#### What Gets Deleted

When deleting a backup, the system removes ALL associated files:

- **PostgreSQL dumps** (`.sql.gz` files)
- **MongoDB dumps** (`.bson.gz` files)
- **Excel files** (`.xlsx` files)
- **Backup logs** (`.json` metadata files)

#### Safety Features

- **Confirmation Required**: Must explicitly confirm deletion
- **Clear Warning**: Explains permanent nature of the action
- **Selective Deletion**: Only removes files matching the backup ID
- **No Recovery**: Deleted backups cannot be restored

### Download Backups

> **Note**: Download functionality is currently disabled but can be enabled by removing the `disabled` attribute from the download button.

## API Endpoints

### Backup History

**GET** `/api/backups/history`

Returns a list of all backups with metadata.

**Response:**
```json
[
  {
    "id": "backup_2025-11-05T14-30-25",
    "type": "manual",
    "status": "completed",
    "size": "3.2 MB",
    "timestamp": "2025-11-05T14:30:25.482Z",
    "collections": 1,
    "totalRecords": 6,
    "duration": 261
  }
]
```

### Delete Backup

**DELETE** `/api/backups/[id]`

Permanently deletes a backup and all associated files.

**Parameters:**
- `id`: Backup ID (e.g., `backup_2025-11-05T14-30-25`)

**Response:**
```json
{
  "success": true,
  "message": "Backup backup_2025-11-05T14-30-25 deleted successfully",
  "filesDeleted": 4
}
```

### Manual Backup

**POST** `/api/backup`

Triggers a manual backup process.

**Response:**
```json
{
  "success": true,
  "message": "Manual backup completed successfully",
  "data": {
    "collections": 1,
    "totalRecords": 6,
    "duration": 261
  },
  "timestamp": "2025-11-05T14:30:25.482Z"
}
```

## Configuration

### Environment Variables

```bash
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=console-db
APPWRITE_API_KEY=your_server_api_key

# Backup Configuration
BACKUP_DIR=./backup
BACKUP_RETENTION_DAILY=7
BACKUP_RETENTION_WEEKLY=4
BACKUP_RETENTION_MONTHLY=12

# Cron Schedules
BACKUP_CRON_DAILY="0 2 * * *"
BACKUP_CRON_WEEKLY="0 3 * * 0"
BACKUP_CRON_MONTHLY="0 4 1 * *"
TZ=UTC
```

### Directory Structure

```
backup/
├── daily/          # Daily backups (manual and auto)
├── weekly/         # Archived weekly backups
├── monthly/        # Archived monthly backups
└── logs/           # Backup metadata and logs
```

## Troubleshooting

### Common Issues

#### "Failed to delete backup"

**Cause**: API endpoint returned an error
**Solution**:
- Check browser console for detailed error messages
- Verify backup ID is correct
- Ensure backup files exist on server

#### "No backup history available"

**Cause**: No backups have been created yet
**Solution**:
- Run a manual backup using the "Manual Backup" button
- Check that automated backups are running
- Verify backup directory permissions

#### "Backup creation failed"

**Cause**: Various issues during backup process
**Solutions**:
- Check database connectivity
- Verify API key permissions
- Ensure sufficient disk space
- Check backup directory write permissions

#### Excel Export Issues

**Symptom**: Excel files are not created
**Cause**: Node.js Excel export compatibility
**Status**: Fixed in current version - uses proper Node.js Excel export

#### Daily Backup Replacement

**Symptom**: Previous daily backups are missing
**Cause**: Daily backups are automatically replaced each day
**Solution**: This is normal behavior. Daily backups maintain only one backup per day to save space. Use manual backups for point-in-time snapshots.

### Logs and Debugging

#### Backup Logs

Backup operations are logged in `backup/logs/backup_[timestamp].json`:

```json
{
  "timestamp": "2025-11-05T14:30:25.482Z",
  "collections": 1,
  "totalRecords": 6,
  "duration": 261,
  "exports": [
    {
      "collection": "audit_logs",
      "records": 6,
      "files": {
        "postgresql": "audit_logs_manual_2025-11-05T14-30-25.sql.gz",
        "mongodb": "audit_logs_manual_2025-11-05T14-30-25.bson.gz",
        "excel": "audit_logs_manual_2025-11-05T14-30-25.xlsx"
      }
    }
  ]
}
```

#### Application Logs

Check the application console for detailed error messages and backup progress information.

### Performance Considerations

- **Large Databases**: Manual backups may take time for large datasets
- **Disk Space**: Monitor backup directory size and implement retention policies
- **Network**: API calls may timeout for very large backups
- **Concurrent Access**: Avoid running multiple backups simultaneously

## Security Considerations

- **API Key Protection**: Server-side API keys are required for backup operations
- **File Permissions**: Backup directories should have appropriate permissions
- **Data Privacy**: Backup files contain sensitive data - secure storage recommended
- **Access Control**: Only authenticated admin users can access backup features

## Future Enhancements

- **Download Functionality**: Enable backup file downloads
- **Scheduled Backups UI**: Web interface for configuring backup schedules
- **Backup Verification**: Automatic integrity checking of backup files
- **Cloud Storage**: Integration with cloud storage providers
- **Encryption**: Optional encryption of backup files
- **Compression Options**: Configurable compression algorithms

---

For additional support or questions about database administration features, please refer to the main application documentation or contact the development team.
