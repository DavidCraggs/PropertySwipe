/**
 * Step 6: Seed Viewing Requests
 * Creates viewing preferences and scheduled viewings
 */

import type { ViewingPreference } from '../types';
import { createViewingRequest } from '../lib/storage';
import { daysFromNow, daysAgo, dateAtTime } from './seedHelpers';
import { GENERATED_IDS } from './seedUserProfiles';
import { PROPERTY_IDS } from './seedProperties';
import { MATCH_IDS } from './seedMatches';



/**
 * Create Viewing 1: Confirmed viewing for tomorrow
 */
export async function createViewing1(): Promise<ViewingPreference> {
    const viewing: ViewingPreference = {
        id: 'seed-viewing-001',
        matchId: MATCH_IDS.match1Id,
        renterId: GENERATED_IDS.renterId,
        landlordId: GENERATED_IDS.landlordId,
        propertyId: PROPERTY_IDS.property1Id,
        status: 'confirmed',
        specificDateTime: dateAtTime(daysFromNow(1), 14, 0), // Tomorrow at 2pm
        flexibility: 'Specific',
        additionalNotes: "First viewing - excited to see the parking space!",
        landlordResponse: "Looking forward to showing you around",
        createdAt: daysAgo(2),
        updatedAt: daysAgo(1),
    };

    return await createViewingRequest(viewing);
}

/**
 * Create Viewing 2: Pending viewing request
 */
export async function createViewing2(): Promise<ViewingPreference> {
    const viewing: ViewingPreference = {
        id: 'seed-viewing-002',
        matchId: MATCH_IDS.match2Id,
        renterId: GENERATED_IDS.renterId,
        landlordId: GENERATED_IDS.landlordId,
        propertyId: PROPERTY_IDS.property2Id,
        status: 'pending',
        preferredTimes: [{ dayType: 'Any Day', timeOfDay: 'Afternoon' }],
        flexibility: 'Flexible',
        additionalNotes: "Available after 3pm on weekdays",
        createdAt: daysAgo(1),
        updatedAt: daysAgo(1),
    };

    return await createViewingRequest(viewing);
}

/**
 * Create Viewing 3: Completed past viewing
 */
export async function createViewing3(): Promise<ViewingPreference> {
    const viewing: ViewingPreference = {
        id: 'seed-viewing-003',
        matchId: MATCH_IDS.match1Id,
        renterId: GENERATED_IDS.renterId,
        landlordId: GENERATED_IDS.landlordId,
        propertyId: PROPERTY_IDS.property1Id,
        status: 'completed',
        specificDateTime: dateAtTime(daysAgo(2), 14, 0), // 2 days ago at 2pm
        flexibility: 'Specific',
        additionalNotes: "Initial viewing",
        completedAt: daysAgo(2),
        createdAt: daysAgo(3),
        updatedAt: daysAgo(2),
    };

    return await createViewingRequest(viewing);
}

/**
 * Seed all test viewing requests
 * @returns Number of viewings created
 */
export async function seedViewingRequests(verbose: boolean = false): Promise<number> {
    if (verbose) console.log('[Seed] Creating test viewing requests...');

    const viewings = await Promise.all([
        createViewing1(),
        createViewing2(),
        createViewing3(),
    ]);

    if (verbose) {
        console.log(`[Seed] ✓ Created ${viewings.length} viewing requests:`);
        viewings.forEach(v => console.log(`  - ${v.id}: ${v.status}`));
    }

    return viewings.length;
}
