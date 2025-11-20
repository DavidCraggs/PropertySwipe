#!/usr/bin/env tsx
/**
 * Seed Test Data Script
 * Run with: npm run seed:data
 */

import { seedAllTestData } from '../utils/seedTestData';

async function main() {
    console.log('🌱 Starting test data seeding...\n');

    try {
        const result = await seedAllTestData({
            clearExisting: true,
            verbose: true,
        });

        if (result.success) {
            console.log('\n✅ Test data seeding completed successfully!');
            process.exit(0);
        } else {
            console.error('\n❌ Test data seeding failed');
            if (result.errors) {
                console.error('Errors:', result.errors);
            }
            process.exit(1);
        }
    } catch (error) {
        console.error('\n❌ Fatal error during seeding:', error);
        process.exit(1);
    }
}

main();
