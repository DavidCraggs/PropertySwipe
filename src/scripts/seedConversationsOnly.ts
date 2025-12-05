// Load environment variables FIRST before any other imports
import '../lib/loadEnv';
import { seedConversations } from '../utils/seedConversations';

async function seedMissingConversations() {
    console.log('=== Seeding Conversations for Existing Matches ===\n');

    try {
        const count = await seedConversations(true);

        console.log(`\n✅ Successfully seeded ${count} conversations!`);
        console.log('\nYou can now verify in the UI:');
        console.log('1. Log in as test.renter@test.geton.com / TestUser123!');
        console.log('2. Go to Matches page');
        console.log('3. Click on a match');
        console.log('4. You should see "Landlord" and "Managing Agency" tabs with messages');
    } catch (error) {
        console.error('\n❌ Failed to seed conversations:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
            console.error('Stack:', error.stack);
        }
    }
}

seedMissingConversations().catch(console.error);
