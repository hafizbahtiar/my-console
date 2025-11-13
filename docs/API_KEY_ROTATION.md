# API Key Rotation Procedure

## Overview

This document outlines the procedure for rotating API keys used in the My Console application. Regular key rotation is a critical security practice that limits the impact of compromised credentials and ensures compliance with security best practices.

## API Keys Used in My Console

The application uses the following API keys:

### 1. OpenRouter API Key
- **Purpose**: AI-powered content assistance (excerpt generation, title generation, SEO suggestions, content improvement)
- **Environment Variable**: `OPENROUTER_API_KEY`
- **Location**: Server-side only (not exposed to client)
- **Rotation Frequency**: Every 90 days (recommended) or immediately if compromised

### 2. Appwrite Server API Key
- **Purpose**: Server-side database operations (backups, migrations, admin operations)
- **Environment Variable**: `APPWRITE_API_KEY`
- **Location**: Server-side only (not exposed to client)
- **Rotation Frequency**: Every 180 days (recommended) or immediately if compromised

### 3. Appwrite Project Configuration
- **Purpose**: Client-side Appwrite SDK initialization
- **Environment Variables**: 
  - `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
  - `NEXT_PUBLIC_APPWRITE_ENDPOINT`
  - `NEXT_PUBLIC_APPWRITE_DATABASE_ID`
- **Location**: Client-side (public variables)
- **Rotation Frequency**: Only when project is recreated (rare)

## Rotation Schedule

### Recommended Rotation Intervals

| API Key | Rotation Frequency | Priority |
|---------|-------------------|----------|
| OpenRouter API Key | Every 90 days | High |
| Appwrite Server API Key | Every 180 days | Medium |
| Appwrite Project Config | Only when needed | Low |

### Rotation Triggers

Rotate API keys immediately if:
- Key is suspected to be compromised
- Key is exposed in logs, code, or public repositories
- Employee with key access leaves the organization
- Security audit identifies key exposure
- Provider recommends rotation (security incident)

## Rotation Procedures

### OpenRouter API Key Rotation

#### Prerequisites
1. Access to OpenRouter dashboard: https://openrouter.ai/
2. Access to application environment variables
3. Backup of current configuration

#### Steps

1. **Generate New Key**
   - Log in to OpenRouter dashboard
   - Navigate to **API Keys** section
   - Click **Create API Key**
   - Copy the new API key immediately (it won't be shown again)
   - Set appropriate permissions and rate limits

2. **Update Environment Variables**
   ```bash
   # Update .env.local (development)
   OPENROUTER_API_KEY=sk-or-v1-<new_key_here>
   
   # Update production environment variables
   # (Platform-specific: Vercel, Railway, etc.)
   ```

3. **Test New Key**
   - Test AI features in development environment:
     - Generate excerpt
     - Generate title
     - Get SEO suggestions
     - Improve content
   - Verify all AI endpoints work correctly
   - Check for any error messages

4. **Deploy to Production**
   - Update production environment variables
   - Deploy application
   - Monitor for errors in first 24 hours
   - Check application logs for API errors

5. **Revoke Old Key**
   - Wait 24-48 hours after deployment
   - Verify no errors in production
   - Revoke old key in OpenRouter dashboard
   - Document rotation in security log

#### Rollback Procedure
If issues occur after rotation:
1. Revert to previous key in environment variables
2. Redeploy application
3. Investigate issue with new key
4. Fix issue before attempting rotation again

### Appwrite Server API Key Rotation

#### Prerequisites
1. Access to Appwrite Console: https://cloud.appwrite.io/
2. Admin access to Appwrite project
3. Access to application environment variables
4. Backup of current configuration

#### Steps

1. **Create New API Key**
   - Log in to Appwrite Console
   - Navigate to **Settings** → **API Keys**
   - Click **Create API Key**
   - Set appropriate scopes:
     - `databases.read`
     - `databases.write`
     - `collections.read`
     - `collections.write`
   - Copy the new API key immediately

2. **Update Environment Variables**
   ```bash
   # Update .env.local (development)
   APPWRITE_API_KEY=<new_key_here>
   
   # Update production environment variables
   ```

3. **Test New Key**
   - Test backup functionality:
     ```bash
     # Run backup script
     bun run scripts/backup/backup.ts
     ```
   - Verify database operations work
   - Test migration scripts if applicable
   - Check for permission errors

4. **Deploy to Production**
   - Update production environment variables
   - Deploy application
   - Monitor backup operations
   - Check application logs for errors

5. **Revoke Old Key**
   - Wait 24-48 hours after deployment
   - Verify all operations work correctly
   - Revoke old key in Appwrite Console
   - Document rotation in security log

#### Rollback Procedure
If issues occur after rotation:
1. Revert to previous key in environment variables
2. Redeploy application
3. Verify backup operations work
4. Investigate permission issues
5. Fix before attempting rotation again

## Best Practices

### Key Storage

1. **Never Commit Keys to Version Control**
   - Use `.env.local` for local development
   - Add `.env*` to `.gitignore`
   - Use platform-specific secret management (Vercel, Railway, etc.)

2. **Use Environment Variables**
   - Store keys in environment variables only
   - Never hardcode keys in source code
   - Use different keys for development and production

3. **Limit Key Permissions**
   - Grant minimum required permissions
   - Use separate keys for different environments
   - Review permissions regularly

### Key Monitoring

1. **Monitor API Usage**
   - Set up alerts for unusual API usage patterns
   - Monitor for unexpected errors
   - Track API call volumes

2. **Audit Log Review**
   - Review audit logs for API key access
   - Check for unauthorized usage
   - Monitor for suspicious patterns

3. **Error Monitoring**
   - Set up alerts for API authentication errors
   - Monitor for "Invalid API key" errors
   - Track failed authentication attempts

### Documentation

1. **Maintain Rotation Log**
   - Document each rotation date
   - Record who performed rotation
   - Note any issues encountered
   - Keep record of old keys (for troubleshooting)

2. **Update Documentation**
   - Update this document after each rotation
   - Document any process improvements
   - Share lessons learned with team

## Emergency Rotation

If an API key is compromised:

1. **Immediate Actions**
   - Revoke compromised key immediately
   - Generate new key
   - Update environment variables
   - Deploy immediately (don't wait for testing window)

2. **Investigation**
   - Review audit logs for unauthorized access
   - Check for data breaches
   - Identify how key was compromised
   - Document incident

3. **Post-Incident**
   - Review security practices
   - Update rotation schedule if needed
   - Implement additional security measures
   - Conduct security audit

## Automation (Future Enhancement)

Consider implementing automated key rotation:

1. **Scheduled Rotation**
   - Set up cron jobs for key rotation
   - Automate key generation
   - Automated testing before deployment

2. **Secret Management Services**
   - Use services like AWS Secrets Manager
   - Implement automatic rotation
   - Centralized key management

3. **Monitoring Integration**
   - Integrate with monitoring systems
   - Automated alerts for key expiration
   - Usage anomaly detection

## Checklist

### Pre-Rotation
- [ ] Review current key usage
- [ ] Backup current configuration
- [ ] Notify team of planned rotation
- [ ] Schedule maintenance window if needed
- [ ] Prepare rollback plan

### During Rotation
- [ ] Generate new API key
- [ ] Update environment variables
- [ ] Test in development environment
- [ ] Deploy to production
- [ ] Monitor for errors

### Post-Rotation
- [ ] Verify all features work correctly
- [ ] Monitor for 24-48 hours
- [ ] Revoke old key
- [ ] Update rotation log
- [ ] Document any issues

## Troubleshooting

### Common Issues

**Issue**: API errors after rotation
- **Solution**: Verify new key is correctly set in environment variables
- **Solution**: Check key permissions in provider dashboard
- **Solution**: Verify key format is correct

**Issue**: Features not working
- **Solution**: Check application logs for specific errors
- **Solution**: Verify key has required permissions
- **Solution**: Test key directly with API provider

**Issue**: Old key still working
- **Solution**: Verify old key was actually revoked
- **Solution**: Check for cached credentials
- **Solution**: Clear application cache if needed

## Related Documentation

- [Security Audit](./SECURITY_AUDIT.md) - Security best practices
- [Appwrite Setup](./APPWRITE_SETUP.md) - Appwrite configuration
- [Environment Variables](./APPWRITE_SETUP.md#environment-variables) - Environment setup

## Security Contacts

- **Security Team**: [To be defined]
- **Incident Response**: [To be defined]
- **Emergency Contact**: [To be defined]

---

**Last Updated**: January 2025  
**Next Review**: February 2025  
**Rotation Schedule**: See rotation intervals above

*This document should be reviewed and updated quarterly or after any security incidents.*

