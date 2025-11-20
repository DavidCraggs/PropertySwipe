#!/usr/bin/env tsx
/**
 * Verify Test Data Script
 * Run with: npm run seed:verify
 */

import { verifySeedData, checkSupabaseConnection } from '../utils/seedTestData';

async function main() {
    console.log('🔍 Verifying test data...\n');

    try {
        await checkSupabaseConnection();

        const { isValid, counts, errors } = await verifySeedData(true);

        console.log('\n📊 Verification Summary:');
        console.log('═'.repeat(50));

        for (const [table, count] of Object.entries(counts)) {
            const status = count > 0 ? '✓' : '✗';
            console.log(`${status} ${table.padEnd(25)} ${count} records`);
        }

        console.log('═'.repeat(50));

        const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);
        console.log(`Total seed records: ${totalRecords}`);

        if (errors.length > 0) {
            console.log('\n⚠️  Errors found:');
            errors.forEach(error => console.log(`  - ${error}`));
        }

        if (isValid) {
            console.log('\n✅ Test data verification passed!');
            process.exit(0);
        } else {
            console.log('\n❌ Test data verification failed');
            process.exit(1);
        }
    } catch (error) {
        console.error('\n❌ Error verifying test data:', error);
        process.exit(1);
    }
}

main();
