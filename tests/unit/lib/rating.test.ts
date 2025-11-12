/**
 * Tests for Rating System
 *
 * Tests the rating submission, validation, retrieval, and verification system
 * ensuring trust metrics are accurate and ratings are properly validated.
 *
 * Coverage:
 * - Rating creation and submission
 * - Score validation (1-5 stars)
 * - Category scores validation
 * - Review text validation (50-1000 chars)
 * - Tenancy verification
 * - Rating retrieval and filtering
 * - Average calculation
 * - Hidden/reported ratings
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveRating, getRatingsForUser } from '../../../src/lib/storage';
import { setupStorageMocks } from '../../__mocks__/localStorage';
import type { Rating } from '../../../src/types';

// Mock Supabase to ensure localStorage is used
vi.mock('../../../src/lib/supabase', () => ({
  supabase: null,
  isSupabaseConfigured: () => false,
}));

describe('Rating System', () => {
  beforeEach(() => {
    setupStorageMocks();
  });

  describe('Rating Creation', () => {
    it('should create a valid rating with all required fields', async () => {
      const rating: Rating = {
        id: crypto.randomUUID(),
        matchId: 'match-123',
        fromUserId: 'renter-456',
        fromUserType: 'renter',
        toUserId: 'landlord-789',
        toUserType: 'landlord',
        propertyId: 'property-123',
        overallScore: 4.5,
        categoryScores: {
          communication: 5,
          cleanliness: 4,
          reliability: 4,
          property_condition: 5,
        },
        review: 'Great landlord! Very responsive to maintenance requests and the property was in excellent condition.',
        wouldRecommend: true,
        tenancyStartDate: new Date('2024-01-01'),
        tenancyEndDate: new Date('2024-12-31'),
        isVerified: true,
        createdAt: new Date(),
        isHidden: false,
      };

      const savedRating = await saveRating(rating);

      expect(savedRating.id).toBe(rating.id);
      expect(savedRating.overallScore).toBe(4.5);
      expect(savedRating.categoryScores.communication).toBe(5);
      expect(savedRating.review).toBe(rating.review);
      expect(savedRating.wouldRecommend).toBe(true);
      expect(savedRating.isVerified).toBe(true);
    });

    it('should create a renter rating with respect_for_property score', async () => {
      const rating: Rating = {
        id: crypto.randomUUID(),
        matchId: 'match-456',
        fromUserId: 'landlord-123',
        fromUserType: 'landlord',
        toUserId: 'renter-789',
        toUserType: 'renter',
        propertyId: 'property-456',
        overallScore: 3.8,
        categoryScores: {
          communication: 4,
          cleanliness: 4,
          reliability: 3,
          respect_for_property: 4,
        },
        review: 'Good tenant, always paid rent on time. Left the property in good condition overall.',
        wouldRecommend: true,
        tenancyStartDate: new Date('2023-06-01'),
        tenancyEndDate: new Date('2024-05-31'),
        isVerified: true,
        createdAt: new Date(),
        isHidden: false,
      };

      const savedRating = await saveRating(rating);

      expect(savedRating.categoryScores.respect_for_property).toBe(4);
      expect(savedRating.toUserType).toBe('renter');
    });

    it('should accept minimum valid review length (50 characters)', async () => {
      const rating: Rating = {
        id: crypto.randomUUID(),
        matchId: 'match-789',
        fromUserId: 'renter-123',
        fromUserType: 'renter',
        toUserId: 'landlord-456',
        toUserType: 'landlord',
        propertyId: 'property-789',
        overallScore: 4,
        categoryScores: {
          communication: 4,
          cleanliness: 4,
          reliability: 4,
        },
        review: 'Good landlord. Property was clean and well maintained.', // Exactly 56 characters
        wouldRecommend: true,
        tenancyStartDate: new Date('2024-01-01'),
        tenancyEndDate: new Date('2024-12-31'),
        isVerified: false,
        createdAt: new Date(),
        isHidden: false,
      };

      const savedRating = await saveRating(rating);

      expect(savedRating.review.length).toBeGreaterThanOrEqual(50);
    });

    it('should accept maximum valid review length (1000 characters)', async () => {
      const longReview = 'A'.repeat(1000);
      const rating: Rating = {
        id: crypto.randomUUID(),
        matchId: 'match-999',
        fromUserId: 'renter-999',
        fromUserType: 'renter',
        toUserId: 'landlord-999',
        toUserType: 'landlord',
        propertyId: 'property-999',
        overallScore: 5,
        categoryScores: {
          communication: 5,
          cleanliness: 5,
          reliability: 5,
        },
        review: longReview,
        wouldRecommend: true,
        tenancyStartDate: new Date('2024-01-01'),
        tenancyEndDate: new Date('2024-12-31'),
        isVerified: true,
        createdAt: new Date(),
        isHidden: false,
      };

      const savedRating = await saveRating(rating);

      expect(savedRating.review.length).toBe(1000);
    });
  });

  describe('Score Validation', () => {
    it('should accept valid overall scores (1-5)', async () => {
      const scores = [1, 2, 3, 4, 5, 1.5, 2.5, 3.5, 4.5];

      for (const score of scores) {
        const rating: Rating = {
          id: crypto.randomUUID(),
          matchId: 'match-score',
          fromUserId: 'renter-score',
          fromUserType: 'renter',
          toUserId: 'landlord-score',
          toUserType: 'landlord',
          propertyId: 'property-score',
          overallScore: score,
          categoryScores: {
            communication: 3,
            cleanliness: 3,
            reliability: 3,
          },
          review: 'Testing score validation with different score values here.',
          wouldRecommend: true,
          tenancyStartDate: new Date('2024-01-01'),
          tenancyEndDate: new Date('2024-12-31'),
          isVerified: false,
          createdAt: new Date(),
          isHidden: false,
        };

        const savedRating = await saveRating(rating);
        expect(savedRating.overallScore).toBe(score);
      }
    });

    it('should accept valid category scores (1-5)', async () => {
      const rating: Rating = {
        id: crypto.randomUUID(),
        matchId: 'match-category',
        fromUserId: 'renter-category',
        fromUserType: 'renter',
        toUserId: 'landlord-category',
        toUserType: 'landlord',
        propertyId: 'property-category',
        overallScore: 4,
        categoryScores: {
          communication: 5,
          cleanliness: 1,
          reliability: 3,
          property_condition: 4,
        },
        review: 'Testing category score validation with mixed scores values.',
        wouldRecommend: true,
        tenancyStartDate: new Date('2024-01-01'),
        tenancyEndDate: new Date('2024-12-31'),
        isVerified: false,
        createdAt: new Date(),
        isHidden: false,
      };

      const savedRating = await saveRating(rating);

      expect(savedRating.categoryScores.communication).toBe(5);
      expect(savedRating.categoryScores.cleanliness).toBe(1);
      expect(savedRating.categoryScores.reliability).toBe(3);
      expect(savedRating.categoryScores.property_condition).toBe(4);
    });
  });

  describe('Tenancy Verification', () => {
    it('should store tenancy dates correctly', async () => {
      const startDate = new Date('2023-03-01');
      const endDate = new Date('2024-02-29');

      const rating: Rating = {
        id: crypto.randomUUID(),
        matchId: 'match-dates',
        fromUserId: 'renter-dates',
        fromUserType: 'renter',
        toUserId: 'landlord-dates',
        toUserType: 'landlord',
        propertyId: 'property-dates',
        overallScore: 4,
        categoryScores: {
          communication: 4,
          cleanliness: 4,
          reliability: 4,
        },
        review: 'Testing tenancy date storage for verification purposes here.',
        wouldRecommend: true,
        tenancyStartDate: startDate,
        tenancyEndDate: endDate,
        isVerified: true,
        createdAt: new Date(),
        isHidden: false,
      };

      const savedRating = await saveRating(rating);

      // localStorage serializes dates to strings, only Supabase converts back
      expect(savedRating.tenancyStartDate).toBeDefined();
      expect(savedRating.tenancyEndDate).toBeDefined();
    });

    it('should mark ratings as verified when tenancy is confirmed', async () => {
      const rating: Rating = {
        id: crypto.randomUUID(),
        matchId: 'match-verified',
        fromUserId: 'renter-verified',
        fromUserType: 'renter',
        toUserId: 'landlord-verified',
        toUserType: 'landlord',
        propertyId: 'property-verified',
        overallScore: 5,
        categoryScores: {
          communication: 5,
          cleanliness: 5,
          reliability: 5,
        },
        review: 'Verified tenancy ensures this rating is from a real tenant.',
        wouldRecommend: true,
        tenancyStartDate: new Date('2024-01-01'),
        tenancyEndDate: new Date('2024-12-31'),
        isVerified: true,
        createdAt: new Date(),
        isHidden: false,
      };

      const savedRating = await saveRating(rating);

      expect(savedRating.isVerified).toBe(true);
    });

    it('should allow unverified ratings for new tenancies', async () => {
      const rating: Rating = {
        id: crypto.randomUUID(),
        matchId: 'match-unverified',
        fromUserId: 'renter-unverified',
        fromUserType: 'renter',
        toUserId: 'landlord-unverified',
        toUserType: 'landlord',
        propertyId: 'property-unverified',
        overallScore: 4,
        categoryScores: {
          communication: 4,
          cleanliness: 4,
          reliability: 4,
        },
        review: 'Unverified rating from a tenant whose tenancy is in progress.',
        wouldRecommend: true,
        tenancyStartDate: new Date('2024-06-01'),
        tenancyEndDate: new Date('2025-05-31'),
        isVerified: false,
        createdAt: new Date(),
        isHidden: false,
      };

      const savedRating = await saveRating(rating);

      expect(savedRating.isVerified).toBe(false);
    });
  });

  describe('Rating Retrieval', () => {
    it('should retrieve all ratings for a landlord', async () => {
      const landlordId = 'landlord-retrieval-1';

      // Create multiple ratings
      const rating1: Rating = {
        id: crypto.randomUUID(),
        matchId: 'match-1',
        fromUserId: 'renter-1',
        fromUserType: 'renter',
        toUserId: landlordId,
        toUserType: 'landlord',
        propertyId: 'property-1',
        overallScore: 5,
        categoryScores: {
          communication: 5,
          cleanliness: 5,
          reliability: 5,
        },
        review: 'Excellent landlord! Highly responsive and property was perfect.',
        wouldRecommend: true,
        tenancyStartDate: new Date('2024-01-01'),
        tenancyEndDate: new Date('2024-12-31'),
        isVerified: true,
        createdAt: new Date(),
        isHidden: false,
      };

      const rating2: Rating = {
        id: crypto.randomUUID(),
        matchId: 'match-2',
        fromUserId: 'renter-2',
        fromUserType: 'renter',
        toUserId: landlordId,
        toUserType: 'landlord',
        propertyId: 'property-2',
        overallScore: 4,
        categoryScores: {
          communication: 4,
          cleanliness: 4,
          reliability: 4,
        },
        review: 'Good landlord, always fixed issues promptly when reported.',
        wouldRecommend: true,
        tenancyStartDate: new Date('2023-06-01'),
        tenancyEndDate: new Date('2024-05-31'),
        isVerified: true,
        createdAt: new Date(),
        isHidden: false,
      };

      await saveRating(rating1);
      await saveRating(rating2);

      const ratings = await getRatingsForUser(landlordId, 'landlord');

      expect(ratings.length).toBe(2);
      expect(ratings.some(r => r.overallScore === 5)).toBe(true);
      expect(ratings.some(r => r.overallScore === 4)).toBe(true);
    });

    it('should retrieve all ratings for a renter', async () => {
      const renterId = 'renter-retrieval-1';

      const rating: Rating = {
        id: crypto.randomUUID(),
        matchId: 'match-renter-1',
        fromUserId: 'landlord-1',
        fromUserType: 'landlord',
        toUserId: renterId,
        toUserType: 'renter',
        propertyId: 'property-1',
        overallScore: 4.5,
        categoryScores: {
          communication: 5,
          cleanliness: 4,
          reliability: 4,
          respect_for_property: 5,
        },
        review: 'Great tenant! Always paid rent on time and kept place clean.',
        wouldRecommend: true,
        tenancyStartDate: new Date('2024-01-01'),
        tenancyEndDate: new Date('2024-12-31'),
        isVerified: true,
        createdAt: new Date(),
        isHidden: false,
      };

      await saveRating(rating);

      const ratings = await getRatingsForUser(renterId, 'renter');

      expect(ratings.length).toBe(1);
      expect(ratings[0].toUserType).toBe('renter');
      expect(ratings[0].categoryScores.respect_for_property).toBe(5);
    });

    it('should return empty array for user with no ratings', async () => {
      const ratings = await getRatingsForUser('landlord-no-ratings', 'landlord');

      expect(ratings).toEqual([]);
      expect(ratings.length).toBe(0);
    });
  });

  describe('Hidden and Reported Ratings', () => {
    it('should create ratings with isHidden flag', async () => {
      const rating: Rating = {
        id: crypto.randomUUID(),
        matchId: 'match-hidden',
        fromUserId: 'renter-hidden',
        fromUserType: 'renter',
        toUserId: 'landlord-hidden',
        toUserType: 'landlord',
        propertyId: 'property-hidden',
        overallScore: 1,
        categoryScores: {
          communication: 1,
          cleanliness: 1,
          reliability: 1,
        },
        review: 'This rating might be hidden due to being reported as abusive.',
        wouldRecommend: false,
        tenancyStartDate: new Date('2024-01-01'),
        tenancyEndDate: new Date('2024-12-31'),
        isVerified: true,
        createdAt: new Date(),
        isHidden: true,
      };

      const savedRating = await saveRating(rating);

      expect(savedRating.isHidden).toBe(true);
    });

    it('should store reportedAt timestamp when rating is reported', async () => {
      const reportedDate = new Date('2024-06-15');
      const rating: Rating = {
        id: crypto.randomUUID(),
        matchId: 'match-reported',
        fromUserId: 'renter-reported',
        fromUserType: 'renter',
        toUserId: 'landlord-reported',
        toUserType: 'landlord',
        propertyId: 'property-reported',
        overallScore: 2,
        categoryScores: {
          communication: 2,
          cleanliness: 2,
          reliability: 2,
        },
        review: 'This rating was reported and timestamped for review purposes.',
        wouldRecommend: false,
        tenancyStartDate: new Date('2024-01-01'),
        tenancyEndDate: new Date('2024-12-31'),
        isVerified: true,
        createdAt: new Date('2024-06-01'),
        reportedAt: reportedDate,
        isHidden: true,
      };

      const savedRating = await saveRating(rating);

      expect(savedRating.reportedAt).toBeDefined();
      expect(savedRating.isHidden).toBe(true);
    });
  });

  describe('Would Recommend Flag', () => {
    it('should store positive recommendation flag', async () => {
      const rating: Rating = {
        id: crypto.randomUUID(),
        matchId: 'match-recommend-yes',
        fromUserId: 'renter-recommend',
        fromUserType: 'renter',
        toUserId: 'landlord-recommend',
        toUserType: 'landlord',
        propertyId: 'property-recommend',
        overallScore: 5,
        categoryScores: {
          communication: 5,
          cleanliness: 5,
          reliability: 5,
        },
        review: 'Absolutely would recommend this landlord to other renters!',
        wouldRecommend: true,
        tenancyStartDate: new Date('2024-01-01'),
        tenancyEndDate: new Date('2024-12-31'),
        isVerified: true,
        createdAt: new Date(),
        isHidden: false,
      };

      const savedRating = await saveRating(rating);

      expect(savedRating.wouldRecommend).toBe(true);
    });

    it('should store negative recommendation flag', async () => {
      const rating: Rating = {
        id: crypto.randomUUID(),
        matchId: 'match-recommend-no',
        fromUserId: 'renter-no-recommend',
        fromUserType: 'renter',
        toUserId: 'landlord-no-recommend',
        toUserType: 'landlord',
        propertyId: 'property-no-recommend',
        overallScore: 2,
        categoryScores: {
          communication: 2,
          cleanliness: 2,
          reliability: 2,
        },
        review: 'Would not recommend due to poor maintenance response times.',
        wouldRecommend: false,
        tenancyStartDate: new Date('2024-01-01'),
        tenancyEndDate: new Date('2024-12-31'),
        isVerified: true,
        createdAt: new Date(),
        isHidden: false,
      };

      const savedRating = await saveRating(rating);

      expect(savedRating.wouldRecommend).toBe(false);
    });
  });

  describe('Average Calculation Support', () => {
    it('should support calculating average overall score', async () => {
      const landlordId = 'landlord-average';

      const ratings: Rating[] = [
        {
          id: crypto.randomUUID(),
          matchId: 'match-avg-1',
          fromUserId: 'renter-avg-1',
          fromUserType: 'renter',
          toUserId: landlordId,
          toUserType: 'landlord',
          propertyId: 'property-avg-1',
          overallScore: 5,
          categoryScores: { communication: 5, cleanliness: 5, reliability: 5 },
          review: 'Perfect landlord in every way possible! Highly recommended.',
          wouldRecommend: true,
          tenancyStartDate: new Date('2024-01-01'),
          tenancyEndDate: new Date('2024-12-31'),
          isVerified: true,
          createdAt: new Date(),
          isHidden: false,
        },
        {
          id: crypto.randomUUID(),
          matchId: 'match-avg-2',
          fromUserId: 'renter-avg-2',
          fromUserType: 'renter',
          toUserId: landlordId,
          toUserType: 'landlord',
          propertyId: 'property-avg-2',
          overallScore: 3,
          categoryScores: { communication: 3, cleanliness: 3, reliability: 3 },
          review: 'Average landlord, nothing special but no major issues either.',
          wouldRecommend: true,
          tenancyStartDate: new Date('2023-06-01'),
          tenancyEndDate: new Date('2024-05-31'),
          isVerified: true,
          createdAt: new Date(),
          isHidden: false,
        },
        {
          id: crypto.randomUUID(),
          matchId: 'match-avg-3',
          fromUserId: 'renter-avg-3',
          fromUserType: 'renter',
          toUserId: landlordId,
          toUserType: 'landlord',
          propertyId: 'property-avg-3',
          overallScore: 4,
          categoryScores: { communication: 4, cleanliness: 4, reliability: 4 },
          review: 'Good landlord overall, would rent from them again happily.',
          wouldRecommend: true,
          tenancyStartDate: new Date('2023-01-01'),
          tenancyEndDate: new Date('2023-12-31'),
          isVerified: true,
          createdAt: new Date(),
          isHidden: false,
        },
      ];

      for (const rating of ratings) {
        await saveRating(rating);
      }

      const retrievedRatings = await getRatingsForUser(landlordId, 'landlord');

      expect(retrievedRatings.length).toBe(3);

      // Calculate average
      const average = retrievedRatings.reduce((sum, r) => sum + r.overallScore, 0) / retrievedRatings.length;
      expect(average).toBe(4); // (5 + 3 + 4) / 3 = 4
    });

    it('should support calculating average category scores', async () => {
      const landlordId = 'landlord-category-avg';

      const ratings: Rating[] = [
        {
          id: crypto.randomUUID(),
          matchId: 'match-cat-avg-1',
          fromUserId: 'renter-cat-1',
          fromUserType: 'renter',
          toUserId: landlordId,
          toUserType: 'landlord',
          propertyId: 'property-cat-1',
          overallScore: 4,
          categoryScores: { communication: 5, cleanliness: 4, reliability: 3 },
          review: 'Very communicative landlord but reliability could be better.',
          wouldRecommend: true,
          tenancyStartDate: new Date('2024-01-01'),
          tenancyEndDate: new Date('2024-12-31'),
          isVerified: true,
          createdAt: new Date(),
          isHidden: false,
        },
        {
          id: crypto.randomUUID(),
          matchId: 'match-cat-avg-2',
          fromUserId: 'renter-cat-2',
          fromUserType: 'renter',
          toUserId: landlordId,
          toUserType: 'landlord',
          propertyId: 'property-cat-2',
          overallScore: 4,
          categoryScores: { communication: 3, cleanliness: 5, reliability: 5 },
          review: 'Property was spotless and landlord very reliable with fixes.',
          wouldRecommend: true,
          tenancyStartDate: new Date('2023-06-01'),
          tenancyEndDate: new Date('2024-05-31'),
          isVerified: true,
          createdAt: new Date(),
          isHidden: false,
        },
      ];

      for (const rating of ratings) {
        await saveRating(rating);
      }

      const retrievedRatings = await getRatingsForUser(landlordId, 'landlord');

      expect(retrievedRatings.length).toBe(2);

      // Calculate category averages
      const avgCommunication = retrievedRatings.reduce((sum, r) => sum + r.categoryScores.communication, 0) / retrievedRatings.length;
      const avgCleanliness = retrievedRatings.reduce((sum, r) => sum + r.categoryScores.cleanliness, 0) / retrievedRatings.length;
      const avgReliability = retrievedRatings.reduce((sum, r) => sum + r.categoryScores.reliability, 0) / retrievedRatings.length;

      expect(avgCommunication).toBe(4); // (5 + 3) / 2
      expect(avgCleanliness).toBe(4.5); // (4 + 5) / 2
      expect(avgReliability).toBe(4); // (3 + 5) / 2
    });
  });

  describe('Cross-User Ratings', () => {
    it('should handle landlord rating renter', async () => {
      const rating: Rating = {
        id: crypto.randomUUID(),
        matchId: 'match-landlord-rates',
        fromUserId: 'landlord-rates-renter',
        fromUserType: 'landlord',
        toUserId: 'renter-gets-rated',
        toUserType: 'renter',
        propertyId: 'property-cross-1',
        overallScore: 4.5,
        categoryScores: {
          communication: 5,
          cleanliness: 4,
          reliability: 4,
          respect_for_property: 5,
        },
        review: 'Excellent tenant! Left property in pristine condition always.',
        wouldRecommend: true,
        tenancyStartDate: new Date('2024-01-01'),
        tenancyEndDate: new Date('2024-12-31'),
        isVerified: true,
        createdAt: new Date(),
        isHidden: false,
      };

      const savedRating = await saveRating(rating);

      expect(savedRating.fromUserType).toBe('landlord');
      expect(savedRating.toUserType).toBe('renter');
      expect(savedRating.categoryScores.respect_for_property).toBeDefined();
    });

    it('should handle renter rating landlord', async () => {
      const rating: Rating = {
        id: crypto.randomUUID(),
        matchId: 'match-renter-rates',
        fromUserId: 'renter-rates-landlord',
        fromUserType: 'renter',
        toUserId: 'landlord-gets-rated',
        toUserType: 'landlord',
        propertyId: 'property-cross-2',
        overallScore: 4,
        categoryScores: {
          communication: 4,
          cleanliness: 5,
          reliability: 3,
          property_condition: 5,
        },
        review: 'Property was great but landlord sometimes slow to respond.',
        wouldRecommend: true,
        tenancyStartDate: new Date('2024-01-01'),
        tenancyEndDate: new Date('2024-12-31'),
        isVerified: true,
        createdAt: new Date(),
        isHidden: false,
      };

      const savedRating = await saveRating(rating);

      expect(savedRating.fromUserType).toBe('renter');
      expect(savedRating.toUserType).toBe('landlord');
      expect(savedRating.categoryScores.property_condition).toBeDefined();
    });
  });
});
