# Appwrite Database Backup System

A comprehensive backup solution for Appwrite databases that exports data to multiple formats compatible with PostgreSQL, MongoDB, and Excel.

## Features

- ✅ **Multiple Export Formats**: PostgreSQL (.sql.gz), MongoDB (.bson.gz), Excel (.xlsx)
- ✅ **Automated Scheduling**: Cron-based daily, weekly, and monthly backups
- ✅ **Retention Management**: Automatic cleanup of old backups
- ✅ **Comprehensive Logging**: Detailed backup logs and error tracking
- ✅ **Configurable**: Environment variable-based configuration
- ✅ **Cross-Platform**: Works on Linux, macOS, and Windows
- ✅ **TypeScript**: Full type safety with comprehensive interfaces and strict error handling
- ✅ **Bun Support**: Optimized for Bun runtime with automatic detection and compatibility
- ✅ **Proper Error Handling**: Type-safe error handling with instanceof checks

## Quick Start

### 1. Environment Setup

Copy the example environment file and configure it:

```bash
cp scripts/backup/env.backup.example .env.backup
# Edit .env.backup with your values, then rename to .env.local
```

Or manually create a `.env.local` file in your project root:

```env
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=console-db
APPWRITE_API_KEY=your_server_api_key

# Backup Configuration (optional)
BACKUP_DIR=./backup
TZ=UTC
```

### 2. Manual Backup

Run a one-time backup:

```bash
# Run backup (recommended)
bun run backup

# Or with npm
npm run backup

# Or directly with bun (recommended)
bun scripts/backup/backup.ts

# Or with Node.js + ts-node
npx ts-node scripts/backup/backup.ts
```

### 3. Start Automated Backups

Start the cronjob scheduler:

```bash
# Start cronjobs
bun run backup:cron

# Or directly with node
node scripts/backup/cronjob.js
```

## Backup Formats

### PostgreSQL Compatible (.sql.gz)

- **Format**: PostgreSQL INSERT statements with table creation
- **Compression**: Gzip compressed
- **Usage**: Can be imported directly into PostgreSQL databases
- **File Pattern**: `{collection}_{timestamp}.sql.gz`

```sql
-- Example PostgreSQL import
gunzip audit_logs_2024-01-15T02-00-00.sql.gz
psql -d mydatabase -f audit_logs_2024-01-15T02-00-00.sql
```

### MongoDB Compatible (.bson.gz)

- **Format**: BSON serialized data with MongoDB document structure
- **Compression**: Gzip compressed
- **Usage**: Compatible with mongorestore and MongoDB imports
- **File Pattern**: `{collection}_{timestamp}.bson.gz`

```bash
# Example MongoDB import
mongorestore --db mydatabase --collection audit_logs audit_logs_2024-01-15T02-00-00.bson.gz
```

### Excel Format (.xlsx)

- **Format**: Excel spreadsheet with data sheets and metadata
- **Compression**: None (Excel files are already compressed)
- **Usage**: Human-readable format for analysis and reporting
- **File Pattern**: `{collection}_{timestamp}.xlsx`

## Directory Structure

```
backup/
├── daily/           # Daily backups (last 7 days)
│   ├── audit_logs_2024-01-15T02-00-00.sql.gz
│   ├── audit_logs_2024-01-15T02-00-00.bson.gz
│   └── audit_logs_2024-01-15T02-00-00.xlsx
├── weekly/          # Weekly backups (last 4 weeks)
├── monthly/         # Monthly backups (last 12 months)
└── logs/            # Backup execution logs
    └── backup_2024-01-15T02-00-00.json
```

## Cronjob Options

### 1. Node.js Cron (Default)
The current implementation uses `node-cron` library, which keeps a Node.js process running constantly.

**Pros:** Easy setup, same environment as your app
**Cons:** Requires keeping a Node.js process alive

```bash
# Start cronjobs (recommended)
bun run backup:cron

# Or with npm
npm run backup:cron

# Or directly with bun (recommended)
bun scripts/backup/cronjob.ts

# Or with Node.js + ts-node
npx ts-node scripts/backup/cronjob.ts
```

### 2. System Cron (Linux/Mac)
Use the OS-level cron daemon for scheduling.

**Pros:** No long-running Node.js process, system-level reliability
**Cons:** Requires cron access, different environment setup

```bash
# Show system cron setup commands
node scripts/backup/cronjob.js --system-cron

# Example output:
# crontab -e
# Add these lines:
# 0 2 * * * cd /path/to/project && /usr/bin/node scripts/backup/backup.js
# 0 3 * * 0 cd /path/to/project && /usr/bin/node scripts/backup/backup.js
# 0 4 1 * * cd /path/to/project && /usr/bin/node scripts/backup/backup.js
```

### 3. Docker Cron
Run cron inside a Docker container.

**Pros:** Isolated environment, scalable
**Cons:** More complex setup, requires Docker

```bash
# Show Docker cron setup
node scripts/backup/cronjob.js --docker-cron
```

### 4. Cloud Cron Services

#### GitHub Actions
```yaml
# .github/workflows/backup.yml
name: Database Backup
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2:00 UTC
    - cron: '0 3 * * 0'  # Weekly (Sunday) at 3:00 UTC
    - cron: '0 4 1 * *'  # Monthly (1st) at 4:00 UTC
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: node scripts/backup/backup.js
        env:
          NEXT_PUBLIC_APPWRITE_ENDPOINT: ${{ secrets.APPWRITE_ENDPOINT }}
          NEXT_PUBLIC_APPWRITE_PROJECT_ID: ${{ secrets.APPWRITE_PROJECT_ID }}
          APPWRITE_API_KEY: ${{ secrets.APPWRITE_API_KEY }}
```

#### Vercel Cron (if deploying to Vercel)
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/backup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### Cronjob Schedules

| Type | Schedule | Timezone | Description |
|------|----------|----------|-------------|
| Daily | `0 2 * * *` | UTC | Every day at 2:00 AM |
| Weekly | `0 3 * * 0` | UTC | Every Sunday at 3:00 AM |
| Monthly | `0 4 1 * *` | UTC | First day of month at 4:00 AM |

### Customizing Schedules

Override default schedules with environment variables:

```env
# Custom cron schedules
BACKUP_CRON_DAILY=0 6 * * *     # Daily at 6:00 AM
BACKUP_CRON_WEEKLY=0 7 * * 1    # Weekly on Monday at 7:00 AM
BACKUP_CRON_MONTHLY=0 8 15 * *  # Monthly on 15th at 8:00 AM

# Disable specific schedules
BACKUP_CRON_WEEKLY_ENABLED=false
```

## Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKUP_DIR` | `./backup` | Base directory for backups |
| `TZ` | `UTC` | Timezone for cronjobs |
| `BACKUP_RETENTION_DAILY` | `7` | Days to keep daily backups |
| `BACKUP_RETENTION_WEEKLY` | `4` | Weeks to keep weekly backups |
| `BACKUP_RETENTION_MONTHLY` | `12` | Months to keep monthly backups |
| `BACKUP_EXCLUDE_COLLECTIONS` | `""` | Comma-separated collections to exclude |
| `BACKUP_INCLUDE_COLLECTIONS` | `""` | Comma-separated collections to include (overrides exclude) |

### Format-Specific Options

```env
# Enable/disable specific formats
BACKUP_FORMAT_POSTGRESQL=true
BACKUP_FORMAT_MONGODB=true
BACKUP_FORMAT_EXCEL=true
```

## CLI Commands

### Backup Script

```bash
# Basic backup
node scripts/backup/backup.js

# Backup specific collections
node scripts/backup/backup.js --collections audit_logs,user_profiles

# Backup with specific format only
node scripts/backup/backup.js --format postgresql

# Dry run (show what would be backed up)
node scripts/backup/backup.js --dry-run

# Help
node scripts/backup/backup.js --help
```

### Cronjob Manager

```bash
# Start Node.js cronjobs (keeps process running)
bun scripts/backup/cronjob.ts

# Manual triggers
bun scripts/backup/cronjob.ts --trigger-daily
bun scripts/backup/cronjob.ts --trigger-weekly
bun scripts/backup/cronjob.ts --trigger-monthly

# Show alternative cron setups
bun scripts/backup/cronjob.ts --system-cron    # Linux/Mac system cron
bun scripts/backup/cronjob.ts --docker-cron    # Docker container cron

# Check status
bun scripts/backup/cronjob.ts --status

# Stop cronjobs
bun scripts/backup/cronjob.ts --stop

# Help
bun scripts/backup/cronjob.ts --help
```

## API Usage

### Programmatic Backup

```javascript
const { performBackup } = require('./scripts/backup/backup');

async function customBackup() {
  try {
    const result = await performBackup();
    console.log('Backup completed:', result);
  } catch (error) {
    console.error('Backup failed:', error);
  }
}
```

### Custom Cronjob Integration

```javascript
const { startCronjobs, stopCronjobs } = require('./scripts/backup/cronjob');

// Start automated backups
startCronjobs();

// Stop when needed
stopCronjobs();
```

## Monitoring & Logging

### Backup Logs

Each backup creates a detailed log file in `backup/logs/`:

```json
{
  "timestamp": "2024-01-15T02:00:00.000Z",
  "collections": 2,
  "totalRecords": 1250,
  "duration": 4500,
  "exports": [
    {
      "collection": "audit_logs",
      "records": 1000,
      "files": {
        "postgresql": "audit_logs_2024-01-15T02-00-00.sql.gz",
        "mongodb": "audit_logs_2024-01-15T02-00-00.bson.gz",
        "excel": "audit_logs_2024-01-15T02-00-00.xlsx"
      }
    }
  ]
}
```

### Error Handling

- Backup failures are logged but don't stop the process
- Individual collection failures are recorded and reported
- Automatic retry logic for transient network issues
- Comprehensive error messages for troubleshooting

## Troubleshooting

### Common Issues

**"APPWRITE_API_KEY not set"**
- Server-side API key is required for database access
- Create an API key in Appwrite console with database permissions

**"Collection not found"**
- Verify collection exists in your database
- Check APPWRITE_DATABASE_ID configuration

**"Permission denied"**
- Ensure API key has read access to collections
- Check Appwrite project permissions

**"Disk space full"**
- Monitor backup directory size
- Adjust retention policies
- Implement off-site backup rotation

### Performance Tips

1. **Large Datasets**: Use pagination for collections with >10k records
2. **Network Issues**: Implement retry logic with exponential backoff
3. **Storage**: Monitor disk usage and implement compression
4. **Scheduling**: Avoid peak hours for large backups

## Security Considerations

- **API Keys**: Store server API keys securely (not in version control)
- **File Permissions**: Restrict backup file access to authorized users
- **Encryption**: Consider encrypting backup files for sensitive data
- **Network**: Use HTTPS for all Appwrite communications
- **Access Control**: Limit who can run backup operations

## Advanced Usage

### Custom Export Formats

Extend the backup script to add new formats:

```javascript
// In backup.js, add new export function
async function exportToCustomFormat(data, collectionId, timestamp) {
  // Your custom export logic here
}

// Add to main export loop
const customFile = await exportToCustomFormat(exportData.data, collection.$id, timestamp);
```

### Integration with Cloud Storage

Upload backups to cloud storage automatically:

```javascript
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

async function uploadToS3(filePath, bucket, key) {
  const s3Client = new S3Client({ region: process.env.AWS_REGION });
  const fileStream = fs.createReadStream(filePath);

  const uploadParams = {
    Bucket: bucket,
    Key: key,
    Body: fileStream
  };

  return s3Client.send(new PutObjectCommand(uploadParams));
}
```

## Contributing

1. Test backup scripts thoroughly before production use
2. Add comprehensive error handling for new features
3. Update documentation for configuration changes
4. Follow existing code patterns and style
5. Add tests for new functionality

## License

This backup system is part of the My Console project.
