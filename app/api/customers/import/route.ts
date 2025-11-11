import { NextRequest } from 'next/server';
import { createProtectedPOST } from '@/lib/api-protection';
import { tablesDB, DATABASE_ID, CUSTOMERS_COLLECTION_ID, account } from '@/lib/appwrite';
import { Query, ID } from 'appwrite';
import { auditLogger } from '@/lib/audit-log';
import { logger } from '@/lib/logger';
import { APIError, createSuccessResponse } from '@/lib/api-error-handler';
import { validateImportFileSize, FileSizeError, formatFileSize } from '@/lib/file-validation';
import * as XLSX from 'xlsx';

interface ImportOptions {
  format: 'csv' | 'json' | 'excel';
  overwrite?: boolean;
  skipErrors?: boolean;
}

// POST /api/customers/import - Import customers data
export async function POST(request: NextRequest) {
  return createProtectedPOST(
    async ({ body }) => {
      const user = await account.get();
      const { data, options }: { data: string | ArrayBuffer; options: ImportOptions } = body;

      if (!data || !options?.format) {
        throw APIError.badRequest('Data and format are required');
      }

      // Validate file size
      try {
        const dataSize = typeof data === 'string'
          ? new Blob([data]).size
          : data.byteLength;

        validateImportFileSize(dataSize);
      } catch (error) {
        if (error instanceof FileSizeError) {
          logger.warn('Customer import file size validation failed', 'api/customers/import', error, {
            actualSize: error.actualSize,
            maxSize: error.maxSize,
          });
          throw APIError.payloadTooLarge(error.message);
        }
        throw error;
      }

      // Parse data based on format
      let parsedData: any[] = [];
      try {
        if (options.format === 'json') {
          parsedData = typeof data === 'string' ? JSON.parse(data) : JSON.parse(Buffer.from(data).toString('utf-8'));
          if (!Array.isArray(parsedData)) {
            parsedData = [parsedData];
          }
        } else if (options.format === 'csv') {
          const csvText = typeof data === 'string' ? data : Buffer.from(data).toString('utf-8');
          parsedData = parseCSV(csvText);
        } else if (options.format === 'excel') {
          const buffer = data instanceof ArrayBuffer ? Buffer.from(data) : Buffer.from(data as string, 'base64');
          const workbook = XLSX.read(buffer, { type: 'buffer' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          parsedData = XLSX.utils.sheet_to_json(worksheet);
        }
      } catch (error) {
        logger.error('Failed to parse import data', 'api/customers/import', error);
        throw APIError.badRequest('Failed to parse import data. Please check the file format.');
      }

      // If overwrite, delete existing customer records for this user
      if (options.overwrite) {
        try {
          const existing = await tablesDB.listRows({
            databaseId: DATABASE_ID,
            tableId: CUSTOMERS_COLLECTION_ID,
            queries: [
              Query.equal('userId', user.$id),
            ],
          });
          for (const row of existing.rows) {
            await tablesDB.deleteRow({
              databaseId: DATABASE_ID,
              tableId: CUSTOMERS_COLLECTION_ID,
              rowId: row.$id,
            });
          }
        } catch (error) {
          logger.warn('Could not clear existing customers', 'api/customers/import', error);
        }
      }

      // Import customers
      let imported = 0;
      let errors: string[] = [];

      for (const row of parsedData) {
        try {
          // Remove ID fields and Appwrite-specific fields
          const { id, $id, _id, createdAt, updatedAt, ...cleanData } = row;

          // Ensure userId matches authenticated user (self-service model)
          cleanData.userId = user.$id;

          // Convert JSON fields back to strings if needed
          if (cleanData.notes && typeof cleanData.notes === 'object') {
            cleanData.notes = JSON.stringify(cleanData.notes);
          }
          if (cleanData.metadata && typeof cleanData.metadata === 'object') {
            cleanData.metadata = JSON.stringify(cleanData.metadata);
          }

          // Set defaults for required fields
          if (!cleanData.status) cleanData.status = 'active';
          if (!cleanData.customerType) cleanData.customerType = 'individual';
          if (cleanData.totalRevenue === undefined) cleanData.totalRevenue = 0;
          if (cleanData.totalInvoices === undefined) cleanData.totalInvoices = 0;

          // Set createdBy
          cleanData.createdBy = user.$id;

          await tablesDB.createRow({
            databaseId: DATABASE_ID,
            tableId: CUSTOMERS_COLLECTION_ID,
            rowId: ID.unique(),
            data: cleanData,
          });

          imported++;
        } catch (error: any) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Row ${imported + errors.length + 1}: ${errorMsg}`);
          logger.warn(`Failed to import customer row ${imported + errors.length + 1}`, 'api/customers/import', error);
          if (!options.skipErrors) {
            throw error;
          }
        }
      }

      // Log import event
      await auditLogger.logSystemEvent(
        'CUSTOMER_DATA_IMPORTED',
        'customers',
        {
          userId: user.$id,
          format: options.format,
          records: imported,
          errors: errors.length,
        }
      ).catch(() => {});

      return createSuccessResponse({
        imported,
        total: parsedData.length,
        errors: errors.length,
        errorDetails: errors,
      });
    },
    {
      rateLimit: 'api',
      requireCSRF: true,
    }
  )(request);
}

// Simple CSV parser
function parseCSV(csvText: string): any[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) continue;

    const row: any = {};
    headers.forEach((header, index) => {
      let value = values[index]?.trim() || '';
      // Remove surrounding quotes
      value = value.replace(/^"|"$/g, '').replace(/""/g, '"');
      
      // Try to parse as JSON if it looks like JSON
      if (value.startsWith('{') || value.startsWith('[')) {
        try {
          row[header] = JSON.parse(value);
        } catch {
          row[header] = value;
        }
      } else {
        row[header] = value;
      }
    });
    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

