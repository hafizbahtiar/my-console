import { NextResponse } from 'next/server';
import { createProtectedGET } from '@/lib/api-protection';
import { tablesDB, DATABASE_ID, CUSTOMERS_COLLECTION_ID, account } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { APIError } from '@/lib/api-error-handler';
import * as XLSX from 'xlsx';

// GET /api/customers/export - Export customers data
export const GET = createProtectedGET(
  async ({ request }) => {
    const user = await account.get();
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'json'; // json, csv, excel

    if (!['json', 'csv', 'excel'].includes(format)) {
      throw APIError.badRequest('Invalid format. Supported formats: json, csv, excel');
    }

    // Get all customers for the authenticated user (self-service model)
    const customers = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: CUSTOMERS_COLLECTION_ID,
      queries: [
        Query.equal('userId', user.$id),
      ],
    });

    // Transform data for export (remove Appwrite-specific fields, parse JSON fields)
    const exportData = customers.rows.map((customer: any) => {
      const { $id, $createdAt, $updatedAt, ...rest } = customer;
      const parsed: any = {
        id: $id,
        createdAt: $createdAt,
        updatedAt: $updatedAt,
        ...rest,
      };

      // Parse JSON fields
      if (parsed.notes && typeof parsed.notes === 'string') {
        try {
          parsed.notes = JSON.parse(parsed.notes);
        } catch {
          // Keep as string if not valid JSON
        }
      }

      if (parsed.metadata && typeof parsed.metadata === 'string') {
        try {
          parsed.metadata = JSON.parse(parsed.metadata);
        } catch {
          // Keep as string if not valid JSON
        }
      }

      return parsed;
    });

    // Generate export based on format
    if (format === 'json') {
      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="customers-${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    } else if (format === 'csv') {
      const csv = convertToCSV(exportData);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="customers-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else if (format === 'excel') {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="customers-${new Date().toISOString().split('T')[0]}.xlsx"`,
        },
      });
    }

    throw APIError.badRequest('Unsupported format');
  },
  {
    rateLimit: 'api',
  }
);

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  // Flatten nested objects and arrays
  const flattened = data.map(item => {
    const flat: any = {};
    for (const [key, value] of Object.entries(item)) {
      if (value === null || value === undefined) {
        flat[key] = '';
      } else if (typeof value === 'object') {
        flat[key] = JSON.stringify(value);
      } else {
        flat[key] = String(value);
      }
    }
    return flat;
  });

  const headers = Object.keys(flattened[0]);
  const rows = flattened.map(item => headers.map(header => {
    const value = item[header] || '';
    // Escape quotes and wrap in quotes if contains comma, newline, or quote
    if (typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }));

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

