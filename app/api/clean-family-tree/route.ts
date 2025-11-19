import { NextRequest, NextResponse } from 'next/server';
import { createProtectedDELETE } from '@/lib/api-protection';
import { DATABASE_ID, PERSONS_COLLECTION_ID, FAMILIES_COLLECTION_ID, RELATIONSHIPS_COLLECTION_ID } from '@/lib/appwrite';
import { tablesDB } from '@/lib/appwrite';
import { APIError } from '@/lib/api-error-handler';

// DELETE /api/clean-family-tree - Clean all family tree data (DANGER!)
export const DELETE = createProtectedDELETE(
  async ({ request }) => {
    console.log('🧹 Starting family tree data cleanup...');

    try {
      // Delete all relationships first (to avoid foreign key issues)
      console.log('📋 Deleting relationships...');
      const relationships = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: RELATIONSHIPS_COLLECTION_ID,
        queries: [] // Get all
      });

      for (const rel of relationships.rows) {
        await tablesDB.deleteRow({
          databaseId: DATABASE_ID,
          tableId: RELATIONSHIPS_COLLECTION_ID,
          rowId: rel.$id
        });
      }
      console.log(`✅ Deleted ${relationships.rows.length} relationships`);

      // Delete all families
      console.log('🏠 Deleting families...');
      const families = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: FAMILIES_COLLECTION_ID,
        queries: [] // Get all
      });

      for (const family of families.rows) {
        await tablesDB.deleteRow({
          databaseId: DATABASE_ID,
          tableId: FAMILIES_COLLECTION_ID,
          rowId: family.$id
        });
      }
      console.log(`✅ Deleted ${families.rows.length} families`);

      // Delete all persons
      console.log('👥 Deleting persons...');
      const persons = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: PERSONS_COLLECTION_ID,
        queries: [] // Get all
      });

      for (const person of persons.rows) {
        await tablesDB.deleteRow({
          databaseId: DATABASE_ID,
          tableId: PERSONS_COLLECTION_ID,
          rowId: person.$id
        });
      }
      console.log(`✅ Deleted ${persons.rows.length} persons`);

      console.log('🎉 Family tree data cleanup completed!');

      return NextResponse.json({
        success: true,
        deleted: {
          persons: persons.rows.length,
          families: families.rows.length,
          relationships: relationships.rows.length
        }
      });

    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      throw APIError.internalServerError('Failed to clean family tree data', error);
    }
  },
  {
    rateLimit: 'api'
  }
);
