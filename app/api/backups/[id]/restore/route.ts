import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { createProtectedPOST } from '@/lib/api-protection';
import { tablesDB, DATABASE_ID } from '@/lib/appwrite';
import { TablesDB } from 'appwrite';
import * as XLSX from 'xlsx';
import { BSON } from 'bson';
import { auditLogger } from '@/lib/audit-log';
import { validateBackupFileSize, FileSizeError, formatFileSize } from '@/lib/file-validation';

interface RestoreOptions {
  format?: 'sql' | 'bson' | 'excel';
  collectionId?: string; // Restore specific collection only
  overwrite?: boolean; // Whether to overwrite existing data
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  return createProtectedPOST(
    async ({ body }) => {
      if (!resolvedParams || !resolvedParams.id) {
        return NextResponse.json({ error: 'Backup ID is required' }, { status: 400 });
      }

      const backupId = resolvedParams.id;
      const options: RestoreOptions = body || {};

      const backupDir = path.join(process.cwd(), 'backup');
      const dailyDir = path.join(backupDir, 'daily');
      const logsDir = path.join(backupDir, 'logs');

      // Find backup log file
      const timestamp = backupId.replace('backup_', '');
      const logFile = path.join(logsDir, `${backupId}.json`);

      if (!fs.existsSync(logFile)) {
        return NextResponse.json({ error: 'Backup log not found' }, { status: 404 });
      }

      // Read backup metadata
      const backupMetadata = JSON.parse(fs.readFileSync(logFile, 'utf-8'));

      const restoreResults: Array<{
        collection: string;
        records: number;
        status: 'success' | 'error';
        error?: string;
      }> = [];

      // Determine which collections to restore
      const collectionsToRestore = options.collectionId
        ? [options.collectionId]
        : backupMetadata.exports?.map((exp: any) => exp.collection) || [];

      // Restore each collection
      for (const collectionId of collectionsToRestore) {
        try {
          // Find backup files for this collection
          const files = fs.readdirSync(dailyDir).filter(file =>
            file.includes(collectionId) && file.includes(timestamp)
          );

          if (files.length === 0) {
            restoreResults.push({
              collection: collectionId,
              records: 0,
              status: 'error',
              error: 'Backup files not found',
            });
            continue;
          }

          // Determine format to use
          let format = options.format;
          if (!format) {
            // Auto-detect format
            if (files.some(f => f.endsWith('.xlsx'))) format = 'excel';
            else if (files.some(f => f.endsWith('.bson.gz'))) format = 'bson';
            else format = 'sql';
          }

          let recordsRestored = 0;

          // Restore based on format
          if (format === 'excel') {
            const excelFile = files.find(f => f.endsWith('.xlsx'));
            if (excelFile) {
              const filePath = path.join(dailyDir, excelFile);
              // Validate file size before processing
              const fileStats = fs.statSync(filePath);
              try {
                validateBackupFileSize(fileStats.size);
              } catch (error) {
                if (error instanceof FileSizeError) {
                  logger.warn('Backup file size validation failed', 'api/backups/restore', error, {
                    file: excelFile,
                    actualSize: error.actualSize,
                    maxSize: error.maxSize,
                  });
                  restoreResults.push({
                    collection: collectionId,
                    records: 0,
                    status: 'error',
                    error: error.message,
                  });
                  continue;
                }
                throw error;
              }
              recordsRestored = await restoreFromExcel(
                filePath,
                collectionId,
                DATABASE_ID,
                tablesDB,
                options.overwrite || false
              );
            }
          } else if (format === 'bson') {
            const bsonFile = files.find(f => f.endsWith('.bson.gz'));
            if (bsonFile) {
              const filePath = path.join(dailyDir, bsonFile);
              // Validate file size before processing
              const fileStats = fs.statSync(filePath);
              try {
                validateBackupFileSize(fileStats.size);
              } catch (error) {
                if (error instanceof FileSizeError) {
                  logger.warn('Backup file size validation failed', 'api/backups/restore', error, {
                    file: bsonFile,
                    actualSize: error.actualSize,
                    maxSize: error.maxSize,
                  });
                  restoreResults.push({
                    collection: collectionId,
                    records: 0,
                    status: 'error',
                    error: error.message,
                  });
                  continue;
                }
                throw error;
              }
              recordsRestored = await restoreFromBSON(
                filePath,
                collectionId,
                DATABASE_ID,
                tablesDB,
                options.overwrite || false
              );
            }
          } else {
            // SQL format
            const sqlFile = files.find(f => f.endsWith('.sql.gz'));
            if (sqlFile) {
              const filePath = path.join(dailyDir, sqlFile);
              // Validate file size before processing
              const fileStats = fs.statSync(filePath);
              try {
                validateBackupFileSize(fileStats.size);
              } catch (error) {
                if (error instanceof FileSizeError) {
                  logger.warn('Backup file size validation failed', 'api/backups/restore', error, {
                    file: sqlFile,
                    actualSize: error.actualSize,
                    maxSize: error.maxSize,
                  });
                  restoreResults.push({
                    collection: collectionId,
                    records: 0,
                    status: 'error',
                    error: error.message,
                  });
                  continue;
                }
                throw error;
              }
              recordsRestored = await restoreFromSQL(
                filePath,
                collectionId,
                DATABASE_ID,
                tablesDB,
                options.overwrite || false
              );
            }
          }

          restoreResults.push({
            collection: collectionId,
            records: recordsRestored,
            status: 'success',
          });
        } catch (error) {
          logger.error(`Failed to restore collection ${collectionId}`, 'api/backups/restore', error, { collectionId });
          restoreResults.push({
            collection: collectionId,
            records: 0,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Log restore event
      try {
        await auditLogger.logSystemEvent(
          'BACKUP_RESTORED',
          'backup',
          {
            backupId,
            collections: restoreResults.length,
            totalRecords: restoreResults.reduce((sum, r) => sum + r.records, 0),
            timestamp: new Date().toISOString(),
          }
        );
      } catch (error) {
        logger.warn('Failed to log restore event', 'api/backups/restore', error);
      }

      return NextResponse.json({
        success: true,
        message: 'Restore completed',
        data: {
          backupId,
          collections: restoreResults.length,
          totalRecords: restoreResults.reduce((sum, r) => sum + r.records, 0),
          results: restoreResults,
        },
      });
    },
    {
      rateLimit: 'api',
    }
  )(request);
}

// Restore from Excel file
async function restoreFromExcel(
  filePath: string,
  collectionId: string,
  databaseId: string,
  tablesDB: TablesDB,
  overwrite: boolean
): Promise<number> {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  let restored = 0;

  // If overwrite, delete existing data first
  if (overwrite) {
    try {
      const existing = await tablesDB.listRows({
        databaseId,
        tableId: collectionId,
      });
      for (const row of existing.rows) {
        await tablesDB.deleteRow({
          databaseId,
          tableId: collectionId,
          rowId: row.$id,
        });
      }
    } catch (error) {
      logger.warn(`Could not clear existing data for ${collectionId}`, 'api/backups/restore', error, { collectionId });
    }
  }

  // Restore data
  for (const row of data) {
    try {
      const { _id, $id, id, createdAt, updatedAt, ...cleanData } = row as any;
      const rowId = _id || $id || id || `unique()`;

      await tablesDB.createRow({
        databaseId,
        tableId: collectionId,
        rowId: rowId === 'unique()' ? 'unique()' : rowId,
        data: cleanData,
      });
      restored++;
    } catch (error) {
      logger.warn(`Failed to restore row in ${collectionId}`, 'api/backups/restore', error, { collectionId });
    }
  }

  return restored;
}

// Restore from BSON file
async function restoreFromBSON(
  filePath: string,
  collectionId: string,
  databaseId: string,
  tablesDB: TablesDB,
  overwrite: boolean
): Promise<number> {
  // Read and decompress
  const compressed = fs.readFileSync(filePath);
  const decompressed = zlib.gunzipSync(compressed);
  const bsonData = BSON.deserialize(decompressed) as { data: any[] };

  let restored = 0;

  // If overwrite, delete existing data first
  if (overwrite) {
    try {
      const existing = await tablesDB.listRows({
        databaseId,
        tableId: collectionId,
      });
      for (const row of existing.rows) {
        await tablesDB.deleteRow({
          databaseId,
          tableId: collectionId,
          rowId: row.$id,
        });
      }
    } catch (error) {
      logger.warn(`Could not clear existing data for ${collectionId}`, 'api/backups/restore', error, { collectionId });
    }
  }

  // Restore data
  for (const row of bsonData.data) {
    try {
      const { _id, createdAt, updatedAt, ...cleanData } = row;
      const rowId = _id || 'unique()';

      await tablesDB.createRow({
        databaseId,
        tableId: collectionId,
        rowId: rowId === 'unique()' ? 'unique()' : rowId,
        data: cleanData,
      });
      restored++;
    } catch (error) {
      logger.warn(`Failed to restore row in ${collectionId}`, 'api/backups/restore', error, { collectionId });
    }
  }

  return restored;
}

// Restore from SQL file (simplified - parse INSERT statements)
async function restoreFromSQL(
  filePath: string,
  collectionId: string,
  databaseId: string,
  tablesDB: TablesDB,
  overwrite: boolean
): Promise<number> {
  // Read and decompress
  const compressed = fs.readFileSync(filePath);
  const decompressed = zlib.gunzipSync(compressed);
  const sql = decompressed.toString('utf-8');

  let restored = 0;

  // If overwrite, delete existing data first
  if (overwrite) {
    try {
      const existing = await tablesDB.listRows({
        databaseId,
        tableId: collectionId,
      });
      for (const row of existing.rows) {
        await tablesDB.deleteRow({
          databaseId,
          tableId: collectionId,
          rowId: row.$id,
        });
      }
    } catch (error) {
      logger.warn(`Could not clear existing data for ${collectionId}`, 'api/backups/restore', error, { collectionId });
    }
  }

  // Parse INSERT statements (simplified parser)
  const insertRegex = /INSERT INTO\s+"?(\w+)"?\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/gi;
  let match;

  while ((match = insertRegex.exec(sql)) !== null) {
    try {
      const columns = match[2].split(',').map(c => c.trim().replace(/"/g, ''));
      const values = match[3].split(',').map(v => {
        const val = v.trim();
        if (val === 'NULL') return null;
        if (val.startsWith("'") && val.endsWith("'")) {
          return val.slice(1, -1).replace(/''/g, "'");
        }
        return val;
      });

      const data: Record<string, any> = {};
      columns.forEach((col, idx) => {
        if (values[idx] !== undefined) {
          // Try to parse JSON if it looks like JSON
          if (values[idx] && typeof values[idx] === 'string' && values[idx].startsWith('{')) {
            try {
              data[col] = JSON.parse(values[idx]);
            } catch {
              data[col] = values[idx];
            }
          } else {
            data[col] = values[idx];
          }
        }
      });

      const { id, $id, ...cleanData } = data;
      const rowId = id || $id || 'unique()';

      await tablesDB.createRow({
        databaseId,
        tableId: collectionId,
        rowId: rowId === 'unique()' ? 'unique()' : rowId,
        data: cleanData,
      });
      restored++;
    } catch (error) {
      console.warn(`Failed to restore row from SQL in ${collectionId}:`, error);
    }
  }

  return restored;
}

