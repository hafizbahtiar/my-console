# Database Migration System

## Overview

This migration system provides a structured approach to managing Appwrite database schema changes. Since Appwrite doesn't support traditional SQL migrations, this system tracks schema versions and provides scripts to apply changes programmatically.

## Features

- **Version Tracking**: Track schema versions and migration history
- **Migration Scripts**: TypeScript scripts for applying schema changes
- **Rollback Support**: Ability to rollback migrations (when possible)
- **Migration History**: Track which migrations have been applied
- **Dry Run Mode**: Test migrations without applying changes

## Directory Structure

```
scripts/migrations/
├── README.md              # This file
├── config.ts              # Migration configuration
├── runner.ts              # Migration execution engine
├── types.ts               # TypeScript types
├── migrations/            # Migration scripts
│   ├── 001_initial_schema.ts
│   ├── 002_add_blog_views.ts
│   └── ...
└── history/              # Migration history (auto-generated)
    └── applied.json
```

## Usage

### Running Migrations

```bash
# Run all pending migrations
bun run migrations:up

# Run specific migration
bun run migrations:up --migration=002_add_blog_views

# Dry run (test without applying)
bun run migrations:up --dry-run

# Rollback last migration
bun run migrations:down

# Rollback specific migration
bun run migrations:down --migration=002_add_blog_views

# Check migration status
bun run migrations:status
```

### Creating a New Migration

```bash
# Generate migration template
bun run migrations:create --name=add_new_field
```

This creates a new migration file in `scripts/migrations/migrations/` with a template.

## Migration Script Structure

Each migration file exports:
- `up()`: Function to apply the migration
- `down()`: Function to rollback the migration (optional)
- `description`: Human-readable description
- `version`: Migration version number

Example:

```typescript
import { Migration } from '../types';
import { tablesDB, DATABASE_ID } from '@/lib/appwrite';

export const migration: Migration = {
  version: '003',
  description: 'Add new field to blog_posts',
  
  async up() {
    // Apply migration
    // Note: Appwrite doesn't support direct schema modification via API
    // This would need to be done manually in Appwrite Console or via SDK
    // This script serves as documentation and validation
    
    console.log('Migration 003: Adding new field to blog_posts');
    // Validation and documentation only
    return { success: true, message: 'Migration documented. Apply manually in Appwrite Console.' };
  },
  
  async down() {
    // Rollback migration
    console.log('Rolling back migration 003');
    return { success: true, message: 'Rollback documented. Apply manually in Appwrite Console.' };
  }
};
```

## Important Notes

### Appwrite Limitations

Appwrite doesn't support programmatic schema modifications via API. Therefore:

1. **Migrations are primarily documentation**: They document what changes need to be made
2. **Manual Application Required**: Changes must be applied manually in Appwrite Console
3. **Validation**: Migrations can validate that changes have been applied correctly
4. **History Tracking**: The system tracks which migrations have been "applied" (validated)

### Best Practices

1. **Always test in development first**
2. **Backup before migrations**: Use the backup system before applying changes
3. **Document changes**: Include detailed descriptions in migration files
4. **Version control**: Commit migration files to version control
5. **Review before applying**: Review migration scripts before running

## Migration History

Migration history is stored in `scripts/migrations/history/applied.json`:

```json
{
  "applied": [
    {
      "version": "001",
      "description": "Initial schema",
      "appliedAt": "2025-01-15T10:00:00Z",
      "appliedBy": "system"
    }
  ]
}
```

## Integration with Backup System

Migrations automatically trigger backups before applying changes (when possible):

```typescript
// Automatic backup before migration
await backupDatabase('pre-migration-backup');
```

## Troubleshooting

### Migration Fails

1. Check Appwrite Console for errors
2. Verify environment variables are set correctly
3. Check migration history for conflicts
4. Review migration script for issues

### Rollback Issues

Some migrations cannot be fully rolled back (e.g., data loss). Always:
1. Backup before migrations
2. Test rollback in development
3. Document rollback limitations

## Future Enhancements

- [ ] Automated schema diff generation
- [ ] Migration conflict detection
- [ ] Schema validation utilities
- [ ] Integration with Appwrite SDK for programmatic changes (when available)

