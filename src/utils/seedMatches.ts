/**
 * Step 4: Seed Matches and Match History
 * Creates match relationships between test renter and properties
 */

import type { Match } from '../types';
import { saveMatch, getAllProperties, getLandlordProfile, getRenterProfile } from '../lib/storage';
import { SEED_CONSTANTS, daysAgo } from './seedHelpers';
import { GENERATED_IDS } from './seedUserProfiles';
import { PROPERTY_IDS } from './seedProperties';

/**
 * Match IDs generated during seeding
 */
export const MATCH_IDS = {
    match1Id: '',
    match2Id: '',
    match3Id: '',
    match4Id: '',
};

/**
 * Helper to create a complete match with all required fields
 */
async function createCompleteMatch(matchData: Partial<Match> & { seed_tag: string }): Promise<Match> {
    // Fetch property
    const properties = await getAllProperties();
    const property = properties.find(p => p.id === matchData.propertyId);
    if (!property) {
        throw new Error(`Property ${matchData.propertyId} not found`);
    }

    // Fetch landlord name
    const landlordProfile = await getLandlordProfile(matchData.landlordId!);
    const landlordName = landlordProfile?.names || 'Unknown Landlord';

    // Fetch renter name
    const renterProfile = await getRenterProfile(matchData.renterId!);
    const renterName = renterProfile?.names || 'Unknown Renter';

    // Create complete match object with agency IDs
    const completeMatch: Match = {
        ...matchData,
        property,
        landlordName,
        renterName,
        renterProfile,
        managingAgencyId: GENERATED_IDS.managementAgencyId,
        marketingAgentId: GENERATED_IDS.estateAgentId,
    } as Match;

    return await saveMatch(completeMatch);
}

/**
 * Create Match 1: Active match with Property 1
 * Mutual match 5 days ago
 */
export async function createMatch1(): Promise<Match> {
    const saved = await createCompleteMatch({
        seed_tag: SEED_CONSTANTS.MATCH_1_TAG,
        renterId: GENERATED_IDS.renterId,
        landlordId: GENERATED_IDS.landlordId,
        propertyId: PROPERTY_IDS.property1Id,
        timestamp: daysAgo(5).toISOString(),
        messages: [],
        lastMessageAt: daysAgo(2).toISOString(),
        unreadCount: 0,
        hasViewingScheduled: false,
        applicationStatus: 'pending',
        tenancyStatus: 'prospective',
        isUnderEvictionProceedings: false,
        rentArrears: {
            totalOwed: 0,
            monthsMissed: 0,
            consecutiveMonthsMissed: 0,
        },
        canRate: false,
        hasLandlordRated: false,
        hasRenterRated: false,
        activeIssueIds: [],
        totalIssuesRaised: 0,
        totalIssuesResolved: 0,
    });
    MATCH_IDS.match1Id = saved.id;
    return saved;
}

/**
 * Create Match 2: Active match with Property 2
 * Mutual match 3 days ago
 */
export async function createMatch2(): Promise<Match> {
    const saved = await createCompleteMatch({
        seed_tag: SEED_CONSTANTS.MATCH_2_TAG,
        renterId: GENERATED_IDS.renterId,
        landlordId: GENERATED_IDS.landlordId,
        propertyId: PROPERTY_IDS.property2Id,
        timestamp: daysAgo(3).toISOString(),
        messages: [],
        lastMessageAt: daysAgo(1).toISOString(),
        unreadCount: 0,
        hasViewingScheduled: false,
        applicationStatus: 'viewing_requested',
        tenancyStatus: 'prospective',
        isUnderEvictionProceedings: false,
        rentArrears: {
            totalOwed: 0,
            monthsMissed: 0,
            consecutiveMonthsMissed: 0,
        },
        canRate: false,
        hasLandlordRated: false,
        hasRenterRated: false,
        activeIssueIds: [],
        totalIssuesRaised: 0,
        totalIssuesResolved: 0,
    });
    MATCH_IDS.match2Id = saved.id;
    return saved;
}

/**
 * Create Match 3: Pending match with Property 3
 * Renter liked, landlord hasn't responded yet
 */
export async function createMatch3(): Promise<Match> {
    const saved = await createCompleteMatch({
        seed_tag: SEED_CONSTANTS.MATCH_3_TAG,
        renterId: GENERATED_IDS.renterId,
        landlordId: GENERATED_IDS.landlordId,
        propertyId: PROPERTY_IDS.property3Id,
        timestamp: daysAgo(2).toISOString(),
        messages: [],
        unreadCount: 0,
        hasViewingScheduled: false,
        applicationStatus: 'pending',
        tenancyStatus: 'prospective',
        isUnderEvictionProceedings: false,
        rentArrears: {
            totalOwed: 0,
            monthsMissed: 0,
            consecutiveMonthsMissed: 0,
        },
        canRate: false,
        hasLandlordRated: false,
        hasRenterRated: false,
        activeIssueIds: [],
        totalIssuesRaised: 0,
        totalIssuesResolved: 0,
    });
    MATCH_IDS.match3Id = saved.id;
    return saved;
}

/**
 * Create Match 4: Declined match with Property 4
 * Application was declined
 */
export async function createMatch4(): Promise<Match> {
    const saved = await createCompleteMatch({
        seed_tag: SEED_CONSTANTS.MATCH_4_TAG,
        renterId: GENERATED_IDS.renterId,
        landlordId: GENERATED_IDS.landlordId,
        propertyId: PROPERTY_IDS.property4Id,
        timestamp: daysAgo(1).toISOString(),
        messages: [],
        unreadCount: 0,
        hasViewingScheduled: false,
        applicationStatus: 'declined',
        tenancyStatus: 'prospective',
        isUnderEvictionProceedings: false,
        rentArrears: {
            totalOwed: 0,
            monthsMissed: 0,
            consecutiveMonthsMissed: 0,
        },
        canRate: true, // Can rate after declined
        hasLandlordRated: false,
        hasRenterRated: false,
        activeIssueIds: [],
        totalIssuesRaised: 0,
        totalIssuesResolved: 0,
    });
    MATCH_IDS.match4Id = saved.id;
    return saved;
}

/**
 * Seed all test matches
 * @returns Number of matches created
 */
export async function seedMatches(verbose: boolean = false): Promise<number> {
    if (verbose) console.log('[Seed] Creating test matches...');

    const matches = await Promise.all([
        createMatch1(),
        createMatch2(),
        createMatch3(),
        createMatch4(),
    ]);

    if (verbose) {
        console.log(`[Seed] ✓ Created ${matches.length} matches:`);
        matches.forEach(m => console.log(`  - ${m.id}: ${m.applicationStatus}`));
        console.log(`[Seed] Match IDs:`, MATCH_IDS);
    }

    return matches.length;
}
