/**
 * Step 5: Seed Messages and Conversations
 * Creates realistic conversation threads for active matches
 */

import type { Message } from '../types';
import { getAllMatches, saveMatch } from '../lib/storage';
import { conversationTimestamp } from './seedHelpers';
import { GENERATED_IDS } from './seedUserProfiles';
import { MATCH_IDS } from './seedMatches';



/**
 * Create conversation for Match 1 (10 messages)
 */
export async function createMatch1Conversation(): Promise<Message[]> {
    const messages: Omit<Message, 'id'>[] = [
        // Day -5
        {
            matchId: MATCH_IDS.match1Id,
            senderId: GENERATED_IDS.landlordId,
            senderType: 'landlord',
            receiverId: GENERATED_IDS.renterId,
            content: "Hi Emma! Thanks for showing interest in the Duke Street apartment. Happy to answer any questions!",
            timestamp: conversationTimestamp(-5, 0).toISOString(),
            isRead: true,
        },
        {
            matchId: MATCH_IDS.match1Id,
            senderId: GENERATED_IDS.renterId,
            senderType: 'renter',
            receiverId: GENERATED_IDS.landlordId,
            content: "Hi James! The flat looks perfect. Is it still available from now?",
            timestamp: conversationTimestamp(-5, 1).toISOString(),
            isRead: true,
        },
        // Day -4
        {
            matchId: MATCH_IDS.match1Id,
            senderId: GENERATED_IDS.landlordId,
            senderType: 'landlord',
            receiverId: GENERATED_IDS.renterId,
            content: "Yes, it's available immediately. Would you like to arrange a viewing?",
            timestamp: conversationTimestamp(-4, 0).toISOString(),
            isRead: true,
        },
        {
            matchId: MATCH_IDS.match1Id,
            senderId: GENERATED_IDS.renterId,
            senderType: 'renter',
            receiverId: GENERATED_IDS.landlordId,
            content: "That would be great! I'm free this weekend if that works?",
            timestamp: conversationTimestamp(-4, 1).toISOString(),
            isRead: true,
        },
        // Day -3
        {
            matchId: MATCH_IDS.match1Id,
            senderId: GENERATED_IDS.landlordId,
            senderType: 'landlord',
            receiverId: GENERATED_IDS.renterId,
            content: "Perfect! How about Saturday at 2pm?",
            timestamp: conversationTimestamp(-3, 0).toISOString(),
            isRead: true,
        },
        {
            matchId: MATCH_IDS.match1Id,
            senderId: GENERATED_IDS.renterId,
            senderType: 'renter',
            receiverId: GENERATED_IDS.landlordId,
            content: "Saturday 2pm works perfectly. What's the best way to reach the property?",
            timestamp: conversationTimestamp(-3, 1).toISOString(),
            isRead: true,
        },
        // Day -2
        {
            matchId: MATCH_IDS.match1Id,
            senderId: GENERATED_IDS.landlordId,
            senderType: 'landlord',
            receiverId: GENERATED_IDS.renterId,
            content: "Great! The entrance is on Duke Street next to the Costa. I'll meet you there.",
            timestamp: conversationTimestamp(-2, 0).toISOString(),
            isRead: true,
        },
        {
            matchId: MATCH_IDS.match1Id,
            senderId: GENERATED_IDS.renterId,
            senderType: 'renter',
            receiverId: GENERATED_IDS.landlordId,
            content: "Brilliant, see you then! Also, are pets allowed? I might get a cat in future.",
            timestamp: conversationTimestamp(-2, 1).toISOString(),
            isRead: true,
        },
        // Day -1
        {
            matchId: MATCH_IDS.match1Id,
            senderId: GENERATED_IDS.landlordId,
            senderType: 'landlord',
            receiverId: GENERATED_IDS.renterId,
            content: "Unfortunately no pets, sorry. But the building is very modern and well-maintained!",
            timestamp: conversationTimestamp(-1, 0).toISOString(),
            isRead: true,
        },
        {
            matchId: MATCH_IDS.match1Id,
            senderId: GENERATED_IDS.renterId,
            senderType: 'renter',
            receiverId: GENERATED_IDS.landlordId,
            content: "No worries, I understand. Looking forward to seeing it tomorrow!",
            timestamp: conversationTimestamp(-1, 1).toISOString(),
            isRead: true,
        },
    ];

    // Fetch the match and update its messages
    const matches = await getAllMatches();
    const match = matches.find(m => m.id === MATCH_IDS.match1Id);

    if (!match) {
        throw new Error(`Match ${MATCH_IDS.match1Id} not found`);
    }

    // Add IDs to messages and update match
    const messagesWithIds: Message[] = messages.map((msg, idx) => ({
        ...msg,
        id: `${MATCH_IDS.match1Id}-msg-${idx + 1}`,
    }));

    match.messages = messagesWithIds;
    match.lastMessageAt = messagesWithIds[messagesWithIds.length - 1].timestamp;
    match.unreadCount = 0; // All read

    await saveMatch(match);
    return messagesWithIds;
}

/**
 * Create conversation for Match 2 (4 messages)
 */
export async function createMatch2Conversation(): Promise<Message[]> {
    const messages: Omit<Message, 'id'>[] = [
        // Day -3
        {
            matchId: MATCH_IDS.match2Id,
            senderId: GENERATED_IDS.landlordId,
            senderType: 'landlord',
            receiverId: GENERATED_IDS.renterId,
            content: "Hello! Thanks for liking the Bold Street flat. It's a lovely 2-bed with great access to the city.",
            timestamp: conversationTimestamp(-3, 0).toISOString(),
            isRead: true,
        },
        {
            matchId: MATCH_IDS.match2Id,
            senderId: GENERATED_IDS.renterId,
            senderType: 'renter',
            receiverId: GENERATED_IDS.landlordId,
            content: "Hi! It looks great, though slightly over my budget. Is there any flexibility on the rent?",
            timestamp: conversationTimestamp(-3, 1).toISOString(),
            isRead: true,
        },
        // Day -1
        {
            matchId: MATCH_IDS.match2Id,
            senderId: GENERATED_IDS.landlordId,
            senderType: 'landlord',
            receiverId: GENERATED_IDS.renterId,
            content: "I could consider £1,050 for the right tenant. When would you be looking to move?",
            timestamp: conversationTimestamp(-1, 0).toISOString(),
            isRead: false, // Unread message
        },
        {
            matchId: MATCH_IDS.match2Id,
            senderId: GENERATED_IDS.renterId,
            senderType: 'renter',
            receiverId: GENERATED_IDS.landlordId,
            content: "That's more workable! I'm flexible on dates, ideally next month.",
            timestamp: conversationTimestamp(-1, 1).toISOString(),
            isRead: false, // Unread message
        },
    ];

    // Fetch the match and update its messages
    const matches = await getAllMatches();
    const match = matches.find(m => m.id === MATCH_IDS.match2Id);

    if (!match) {
        throw new Error(`Match ${MATCH_IDS.match2Id} not found`);
    }

    // Add IDs to messages and update match
    const messagesWithIds: Message[] = messages.map((msg, idx) => ({
        ...msg,
        id: `${MATCH_IDS.match2Id}-msg-${idx + 1}`,
    }));

    match.messages = messagesWithIds;
    match.lastMessageAt = messagesWithIds[messagesWithIds.length - 1].timestamp;
    match.unreadCount = 2; // Last 2 messages unread

    await saveMatch(match);
    return messagesWithIds;
}

/**
 * Seed all test messages
 * @returns Number of messages created
 */
export async function seedMessages(verbose: boolean = false): Promise<number> {
    if (verbose) console.log('[Seed] Creating test messages...');

    const match1Messages = await createMatch1Conversation();
    const match2Messages = await createMatch2Conversation();

    const totalMessages = match1Messages.length + match2Messages.length;

    if (verbose) {
        console.log(`[Seed] ✓ Created ${totalMessages} messages:`);
        console.log(`  - Match 1: ${match1Messages.length} messages`);
        console.log(`  - Match 2: ${match2Messages.length} messages`);
    }

    return totalMessages;
}
