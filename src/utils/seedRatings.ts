/**
 * Step 8: Seed Ratings and Reviews
 * Creates past tenancy ratings for demonstration
 */

import type { Rating } from '../types';
import { saveRating } from '../lib/storage';
import { daysAgo } from './seedHelpers';
import { GENERATED_IDS } from './seedUserProfiles';
import { PROPERTY_IDS } from './seedProperties';
import { MATCH_IDS } from './seedMatches';


/**
 * Create Rating 1: Renter rates previous landlord
 */
export async function createRating1(): Promise<Rating> {
    const rating: any = {
        seed_tag: 'seed-rating-001',
        matchId: MATCH_IDS.match1Id,
        fromUserId: GENERATED_IDS.renterId,
        toUserId: GENERATED_IDS.landlordId,
        fromUserType: 'renter',
        toUserType: 'landlord',
        propertyId: PROPERTY_IDS.property1Id,
        overallScore: 4.5,
        categoryScores: {
            communication: 5,
            property_condition: 5,
            reliability: 4,
            cleanliness: 5,
        },
        review: "Great landlord, very responsive to any issues. Property was exactly as described and well-maintained throughout my tenancy. Would definitely rent from again.",
        wouldRecommend: true,
        isHidden: false,
        createdAt: daysAgo(30),
        tenancyStartDate: daysAgo(395),
        tenancyEndDate: daysAgo(30),
        isVerified: true,
    };

    return await saveRating(rating);
}

/**
 * Create Rating 2: Landlord rates previous renter
 */
export async function createRating2(): Promise<Rating> {
    const rating: any = {
        seed_tag: 'seed-rating-002',
        matchId: MATCH_IDS.match1Id,
        fromUserId: GENERATED_IDS.landlordId,
        toUserId: GENERATED_IDS.renterId,
        fromUserType: 'landlord',
        toUserType: 'renter',
        propertyId: PROPERTY_IDS.property1Id,
        overallScore: 5,
        categoryScores: {
            respect_for_property: 5,
            communication: 5,
            reliability: 5,
            cleanliness: 5,
        },
        review: "Excellent tenant. Property was kept in immaculate condition and all rent paid on time. Highly recommend.",
        wouldRecommend: true,
        isHidden: false,
        createdAt: daysAgo(30),
        tenancyStartDate: daysAgo(395),
        tenancyEndDate: daysAgo(30),
        isVerified: true,
    };

    return await saveRating(rating);
}

/**
 * Seed all test ratings
 * @returns Number of ratings created
 */
export async function seedRatings(verbose: boolean = false): Promise<number> {
    if (verbose) console.log('[Seed] Creating test ratings...');

    const ratings = await Promise.all([
        createRating1(),
        createRating2(),
    ]);

    if (verbose) {
        console.log(`[Seed] ✓ Created ${ratings.length} ratings:`);
        ratings.forEach(r => console.log(`  - ${r.id}: ${r.overallScore} stars`));
    }

    return ratings.length;
}
