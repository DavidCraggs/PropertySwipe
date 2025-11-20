#!/usr/bin/env tsx
/**
 * Clear Test Data Script
 * Run with: npm run seed:clear
 */

import { clearSeedData, checkSupabaseConnection } from '../utils/seedTestData';

async function main() {
    console.log('🧹 Clearing test data...\n');

    try {
        await checkSupabaseConnection();

        const deletedCount = await clearSeedData(true);

        console.log(`\n✅ Successfully cleared ${deletedCount} test records`);
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error clearing test data:', error);
        process.exit(1);
    }
}

main();
