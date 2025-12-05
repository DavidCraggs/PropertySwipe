/**
 * Seed Conversations for Test Data
 * Creates landlord and agency conversation threads with test messages
 */

import { supabase } from '../lib/supabase';
import type { Message } from '../types';

/**
 * Create test messages for a conversation
 */
function createTestMessages(
    senderId1: string,
    senderType1: 'renter' | 'landlord' | 'estate_agent' | 'management_agency',
    senderId2: string,
    senderType2: 'renter' | 'landlord' | 'estate_agent' | 'management_agency',
    baseTimestamp: number
): Message[] {
    return [
        {
            id: crypto.randomUUID(),
            matchId: '', // Will be filled by database
            content: senderType1 === 'renter' ? "Hi! I'm very interested in viewing this property." : "Hello! How can I help you today?",
            senderId: senderId1,
            receiverId: senderId2,
            senderType: senderType1,
            timestamp: new Date(baseTimestamp).toISOString(),
            isRead: true
        },
        {
            id: crypto.randomUUID(),
            matchId: '',
            content: senderType2 === 'renter' ? "When would be a good time for a viewing?" : "I'd be happy to arrange a viewing. When are you available?",
            senderId: senderId2,
            receiverId: senderId1,
            senderType: senderType2,
            timestamp: new Date(baseTimestamp + 3600000).toISOString(), // +1 hour
            isRead: true
        },
        {
            id: crypto.randomUUID(),
            matchId: '',
            content: senderType1 === 'renter' ? "I'm available this weekend, Saturday afternoon would be perfect." : "Saturday at 2pm works well for me.",
            senderId: senderId1,
            receiverId: senderId2,
            senderType: senderType1,
            timestamp: new Date(baseTimestamp + 7200000).toISOString(), // +2 hours
            isRead: true
        }
    ];
}

/**
 * Seed conversations for all test matches
 */
export async function seedConversations(verbose: boolean = false): Promise<number> {
    if (verbose) console.log('\n🔄 Seeding conversations...');

    let conversationsCreated = 0;

    try {
        // Get all matches with seed tags (matches from seed scripts)
        const { data: matches, error: matchesError } = await supabase
            .from('matches')
            .select('id, renter_id, landlord_id, managing_agency_id, property_id')
            .like('seed_tag', 'seed-%'); // Changed from .eq('seed_tag', 'test-data')

        if (matchesError) throw matchesError;

        if (!matches || matches.length === 0) {
            if (verbose) console.log('⚠️  No seeded matches found to create conversations for');
            return 0;
        }

        const baseTimestamp = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days ago

        for (const match of matches) {
            // Create landlord conversation
            const landlordMessages = createTestMessages(
                match.renter_id,
                'renter',
                match.landlord_id,
                'landlord',
                baseTimestamp
            );

            const { error: landlordError } = await supabase
                .from('conversations')
                .insert({
                    match_id: match.id,
                    conversation_type: 'landlord',
                    messages: landlordMessages,
                    last_message_at: landlordMessages[landlordMessages.length - 1].timestamp,
                    unread_count_renter: 0,
                    unread_count_other: match.id === matches[2]?.id ? 1 : 0, // 3rd match has unread for landlord
                    seed_tag: `seed-conversation-landlord-${match.id}`
                });

            if (landlordError) {
                if (verbose) console.log(`  ⚠️  Landlord conversation error for match ${match.id.substring(0, 8)}: ${landlordError.message}`);
            } else {
                conversationsCreated++;
                if (verbose) console.log(`  ✅ Created landlord conversation for match ${match.id.substring(0, 8)}`);
            }

            // Create agency conversation if property has managing agency
            if (match.managing_agency_id) {
                const agencyMessages = createTestMessages(
                    match.renter_id,
                    'renter',
                    match.managing_agency_id,
                    'management_agency',
                    baseTimestamp + 24 * 60 * 60 * 1000 // 1 day after landlord conversation
                );

                const { error: agencyError } = await supabase
                    .from('conversations')
                    .insert({
                        match_id: match.id,
                        conversation_type: 'agency',
                        messages: agencyMessages,
                        last_message_at: agencyMessages[agencyMessages.length - 1].timestamp,
                        unread_count_renter: match.id === matches[3]?.id ? 2 : 0, // 4th match has unread for renter
                        unread_count_other: 0,
                        seed_tag: `seed-conversation-agency-${match.id}`
                    });

                if (agencyError) {
                    if (verbose) console.log(`  ⚠️  Agency conversation error for match ${match.id.substring(0, 8)}: ${agencyError.message}`);
                } else {
                    conversationsCreated++;
                    if (verbose) console.log(`  ✅ Created agency conversation for match ${match.id.substring(0, 8)}`);
                }
            }
        }

        if (verbose) {
            console.log(`✅ Seeded ${conversationsCreated} conversations`);
        }

        return conversationsCreated;
    } catch (error) {
        console.error('❌ Error seeding conversations:', error);
        throw error;
    }
}
