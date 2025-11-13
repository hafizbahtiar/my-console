# Audit Log Retention Policy

## Overview

This document outlines the audit log retention policy for My Console. The retention policy ensures compliance with security requirements while managing storage efficiently.

## Retention Periods

### Default Retention
- **Default**: 90 days for all audit logs
- **Security Events**: 365 days (1 year)
- **System Events**: 30 days
- **User Activity**: 90 days

### Configuration

Retention periods can be configured in two ways:

#### 1. UI Configuration (Recommended)

The audit logs page (`/auth/audit`) includes a **Retention** tab where administrators can configure retention settings through a user-friendly interface:

- Navigate to `/auth/audit` and select the **Retention** tab
- Configure retention periods for:
  - Default retention (all logs)
  - Security events retention
  - System events retention
  - User activity retention
- Enable/disable archiving before deletion
- Set archive location (if archiving is enabled)
- Settings are saved immediately and take effect for future cleanup operations

**API Endpoints:**
- `GET /api/audit/retention` - Retrieve current retention configuration
- `POST /api/audit/retention` - Update retention configuration

#### 2. Environment Variables

Retention periods can also be configured via environment variables (used as defaults):

```env
# Default retention (days)
AUDIT_LOG_RETENTION_DAYS=90

# Security events retention (days)
AUDIT_LOG_SECURITY_RETENTION_DAYS=365

# System events retention (days)
AUDIT_LOG_SYSTEM_RETENTION_DAYS=30

# User activity retention (days)
AUDIT_LOG_USER_RETENTION_DAYS=90

# Enable archiving before deletion
AUDIT_LOG_ARCHIVE_ENABLED=false

# Archive location (if archiving is enabled)
AUDIT_LOG_ARCHIVE_LOCATION=./backup/audit-archive
```

## Log Categorization

Logs are automatically categorized based on their properties:

### Security Events
- Resource: `security`
- Action contains: `SECURITY`
- Metadata eventType: `security`

**Retention**: 365 days

### System Events
- Resource: `system`
- Action contains: `SYSTEM`
- Metadata eventType: `system`
- UserId: `system`

**Retention**: 30 days

### User Activity
- All other audit logs

**Retention**: 90 days

## Automatic Cleanup

### Manual Cleanup

You can manually trigger cleanup via the API:

```bash
POST /api/audit/cleanup
```

**Response:**
```json
{
  "success": true,
  "message": "Audit log cleanup completed",
  "data": {
    "deleted": 150,
    "archived": 0,
    "errors": 0
  }
}
```

### Scheduled Cleanup

To set up automatic cleanup, add a cron job or scheduled task:

```bash
# Run cleanup daily at 2 AM
0 2 * * * curl -X POST https://your-domain.com/api/audit/cleanup
```

Or use a Node.js script:

```javascript
import { cleanupAuditLogs, DEFAULT_RETENTION_CONFIG } from '@/lib/audit-retention'

// Run cleanup
const result = await cleanupAuditLogs(DEFAULT_RETENTION_CONFIG)
console.log(`Deleted ${result.deleted} logs, archived ${result.archived}`)
```

## Archiving

If archiving is enabled (`AUDIT_LOG_ARCHIVE_ENABLED=true`), logs are archived before deletion. Archived logs are stored in the configured archive location.

**Note**: Archiving functionality is currently a placeholder. Full implementation would require:
- File system or cloud storage integration
- Compression of archived logs
- Indexing for retrieval

## Statistics

Get audit log statistics:

```bash
GET /api/audit/cleanup
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total": 1000,
      "byAge": {
        "lessThan30Days": 500,
        "between30And90Days": 300,
        "between90And365Days": 150,
        "moreThan365Days": 50
      },
      "byType": {
        "security": 100,
        "system": 50,
        "userActivity": 850
      }
    },
    "retentionConfig": {
      "defaultDays": 90,
      "securityEventsDays": 365,
      "systemEventsDays": 30,
      "userActivityDays": 90
    }
  }
}
```

## Compliance Considerations

### GDPR
- User data can be deleted on request
- Audit logs are retained for security and compliance purposes
- Retention periods can be adjusted based on organizational requirements

### Security Standards
- Security events are retained longer (365 days) for incident investigation
- System events have shorter retention (30 days) as they are less critical
- User activity logs balance privacy and security needs (90 days)

## Best Practices

1. **Regular Cleanup**: Run cleanup at least weekly to prevent storage issues
2. **Monitor Statistics**: Check audit log statistics regularly to understand growth patterns
3. **Adjust Retention**: Adjust retention periods based on organizational needs and compliance requirements
4. **Archive Important Logs**: Enable archiving for critical security events if needed
5. **Test Cleanup**: Test cleanup in development before running in production

## Implementation

The retention policy is implemented in:
- `lib/audit-retention.ts` - Core retention logic with runtime configuration support
- `app/api/audit/cleanup/route.ts` - API endpoints for cleanup and statistics
- `app/api/audit/retention/route.ts` - API endpoints for retention configuration management
- `components/app/auth/audit/retention-settings.tsx` - UI component for retention configuration

## Troubleshooting

### Cleanup Not Running
- Check API endpoint is accessible
- Verify authentication is working
- Check logs for errors

### Too Many Logs Deleted
- Review retention configuration
- Check log categorization logic
- Verify date calculations

### Storage Issues
- Run cleanup more frequently
- Reduce retention periods
- Enable archiving for older logs

## Analytics and Insights

The audit logs page (`/auth/audit`) includes an **Analytics** tab that provides comprehensive insights:

- **Activity Trends**: Daily activity charts showing log volume over time
- **Hourly Distribution**: 24-hour activity patterns
- **Top Actions**: Most common actions with percentages
- **Top Resources**: Most frequently accessed resources
- **Top Users**: Most active users by log count
- **Security Events**: Summary of security events with breakdown by type

**API Endpoint:**
- `GET /api/audit/analytics?days=30` - Retrieve analytics data for specified time period (7, 30, 90, or 365 days)

## Future Enhancements

- [ ] Automatic scheduled cleanup via cron
- [ ] Cloud storage integration for archiving
- [ ] Compression of archived logs
- [ ] Search and retrieval of archived logs
- [ ] Email notifications for cleanup results
- [ ] Alert rules for specific audit events

