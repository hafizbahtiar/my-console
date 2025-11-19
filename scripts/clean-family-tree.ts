#!/usr/bin/env bun

/**
 * Clean Family Tree Data Script
 *
 * Deletes all persons, families, and relationships from the database
 * Use with caution - this will permanently delete all family tree data!
 */

import { tablesDB, DATABASE_ID, PERSONS_COLLECTION_ID, FAMILIES_COLLECTION_ID, RELATIONSHIPS_COLLECTION_ID } from '../lib/appwrite';

async function cleanFamilyTreeData() {
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
        console.log('📊 Summary:');
        console.log(`   - Persons: ${persons.rows.length}`);
        console.log(`   - Families: ${families.rows.length}`);
        console.log(`   - Relationships: ${relationships.rows.length}`);

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        process.exit(1);
    }
}

// Confirm before running
if (process.argv.includes('--yes') || process.argv.includes('-y')) {
    cleanFamilyTreeData();
} else {
    console.log('⚠️  WARNING: This will permanently delete ALL family tree data!');
    console.log('   This includes all persons, families, and relationships.');
    console.log('');
    console.log('   To proceed, run: bun scripts/clean-family-tree.ts --yes');
    console.log('   Or: bunx scripts/clean-family-tree.ts --yes');
}
