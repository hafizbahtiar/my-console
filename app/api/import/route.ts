import { NextRequest, NextResponse } from 'next/server';
import { createProtectedPOST } from '@/lib/api-protection';
import { tablesDB, DATABASE_ID } from '@/lib/appwrite';
import * as XLSX from 'xlsx';
import { auditLogger } from '@/lib/audit-log';

interface ImportOptions {
  collectionId: string;
  format: 'csv' | 'json' | 'excel';
  overwrite?: boolean;
  skipErrors?: boolean;
}

export const POST = createProtectedPOST(
  async ({ body }) => {
    const { data, options }: { data: string | ArrayBuffer; options: ImportOptions } = body;

    if (!data || !options.collectionId) {
      return NextResponse.json(
        { error: 'Data and collection ID are required' },
        { status: 400 }
      );
    }


    let parsedData: any[] = [];
    let errors: string[] = [];

    try {
      // Parse data based on format
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

      // If overwrite, delete existing data
      if (options.overwrite) {
        try {
          const existing = await tablesDB.listRows({
            databaseId: DATABASE_ID,
            tableId: options.collectionId,
          });
          for (const row of existing.rows) {
          await tablesDB.deleteRow({
            databaseId: DATABASE_ID,
            tableId: options.collectionId,
            rowId: row.$id,
          });
          }
        } catch (error) {
          console.warn(`Could not clear existing data:`, error);
        }
      }

      // Import data
      let imported = 0;
      for (const row of parsedData) {
        try {
          const { id, $id, _id, ...cleanData } = row;
          const rowId = id || $id || _id || 'unique()';

          await tablesDB.createRow({
            databaseId: DATABASE_ID,
            tableId: options.collectionId,
            rowId: rowId === 'unique()' ? 'unique()' : String(rowId),
            data: cleanData,
          });
          imported++;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Row ${imported + 1}: ${errorMsg}`);
          if (!options.skipErrors) {
            throw error;
          }
        }
      }

      // Log import event
      try {
        await auditLogger.logSystemEvent(
          'DATA_IMPORTED',
          'database',
          {
            collectionId: options.collectionId,
            format: options.format,
            records: imported,
            errors: errors.length,
            timestamp: new Date().toISOString(),
          }
        );
      } catch (error) {
        console.warn('Failed to log import event:', error);
      }

      return NextResponse.json({
        success: true,
        message: 'Import completed',
        data: {
          imported,
          total: parsedData.length,
          errors: errors.length,
          errorDetails: errors,
        },
      });
    } catch (error) {
      console.error('Import failed:', error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Import failed',
          data: {
            imported: 0,
            total: parsedData.length,
            errors: errors.length,
            errorDetails: errors,
          },
        },
        { status: 500 }
      );
    }
  },
  {
    rateLimit: 'api',
  }
);

// Simple CSV parser
function parseCSV(csvText: string): any[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const data: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: any = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    data.push(row);
  }

  return data;
}

