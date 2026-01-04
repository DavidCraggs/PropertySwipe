/**
 * Match Scoring Unit Tests
 * Phase 3: Two-Sided Matching System
 *
 * Tests cover:
 * - Overall compatibility scoring
 * - Affordability scoring (income vs rent ratio)
 * - Location scoring (area matching)
 * - Timing scoring (move-in date alignment)
 * - Property fit scoring (situation, pets, smoking, guarantor)
 * - Tenant history scoring (ratings)
 * - Flag generation
 * - Utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  calculateCompatibility,
  getFlagDescription,
  getFlagType,
  getScoreTier,
  formatScore,
  getBreakdownLabel,
  getBreakdownMax,
} from '../../../src/utils/matchScoring';
import type { RenterProfile, Property, CompatibilityFlag } from '../../../src/types';

// =====================================================
// TEST FIXTURES
// =====================================================

function createMockRenter(overrides: Partial<RenterProfile> = {}): RenterProfile {
  return {
    id: 'renter-test-1',
    names: 'Test Renter',
    email: 'test@example.com',
    phone: '07700900000',
    password: 'hashed',
    userType: 'renter',
    onboardingComplete: true,
    createdAt: new Date(),
    status: 'looking',
    situation: 'Single',
    ages: '25-34',
    renterType: 'Young Professional',
    localArea: 'Liverpool',
    monthlyIncome: 3000,
    employmentStatus: 'Employed Full-Time',
    hasPets: false,
    hasGuarantor: false,
    hasRentalHistory: true,
    smokingStatus: 'Non-Smoker',
    ...overrides,
  };
}

function createMockProperty(overrides: Partial<Property> = {}): Property {
  return {
    id: 'property-test-1',
    landlordId: 'landlord-1',
    address: {
      street: '123 Test Street',
      city: 'Liverpool',
      postcode: 'L1 1AA',
      council: 'Liverpool City Council',
    },
    rentPcm: 1000,
    deposit: 1000,
    maxRentInAdvance: 1,
    bedrooms: 2,
    bathrooms: 1,
    propertyType: 'flat',
    availableFrom: new Date().toISOString(),
    images: [],
    features: [],
    description: 'Test property',
    epcRating: 'C',
    yearBuilt: 2000,
    furnishing: 'unfurnished',
    tenancyType: 'Periodic',
    maxOccupants: 2,
    petsPolicy: {
      willConsiderPets: true,
      preferredPetTypes: ['cat', 'small_caged'],
      requiresPetInsurance: false,
      maxPetsAllowed: 2,
    },
    bills: {
      councilTaxBand: 'B',
      gasElectricIncluded: false,
      waterIncluded: false,
      internetIncluded: false,
    },
    meetsDecentHomesStandard: true,
    awaabsLawCompliant: true,
    prsPropertyRegistrationStatus: 'registered',
    isAvailable: true,
    canBeMarketed: true,
    listingDate: new Date().toISOString(),
    ...overrides,
  };
}

// =====================================================
// OVERALL COMPATIBILITY TESTS
// =====================================================

describe('Match Scoring - calculateCompatibility', () => {
  describe('Overall Score Calculation', () => {
    it('should return a score between 0 and 100', () => {
      const renter = createMockRenter();
      const property = createMockProperty();

      const result = calculateCompatibility(renter, property);

      expect(result.overall).toBeGreaterThanOrEqual(0);
      expect(result.overall).toBeLessThanOrEqual(100);
    });

    it('should return breakdown with all score components', () => {
      const renter = createMockRenter();
      const property = createMockProperty();

      const result = calculateCompatibility(renter, property);

      expect(result.breakdown).toHaveProperty('affordability');
      expect(result.breakdown).toHaveProperty('location');
      expect(result.breakdown).toHaveProperty('timing');
      expect(result.breakdown).toHaveProperty('propertyFit');
      expect(result.breakdown).toHaveProperty('tenantHistory');
    });

    it('should calculate overall as sum of breakdown scores', () => {
      const renter = createMockRenter();
      const property = createMockProperty();

      const result = calculateCompatibility(renter, property);

      const expectedTotal =
        result.breakdown.affordability +
        result.breakdown.location +
        result.breakdown.timing +
        result.breakdown.propertyFit +
        result.breakdown.tenantHistory;

      expect(result.overall).toBe(Math.round(expectedTotal));
    });

    it('should return flags array', () => {
      const renter = createMockRenter();
      const property = createMockProperty();

      const result = calculateCompatibility(renter, property);

      expect(Array.isArray(result.flags)).toBe(true);
    });
  });

  // =====================================================
  // AFFORDABILITY SCORING TESTS
  // =====================================================

  describe('Affordability Scoring', () => {
    it('should give full points (30) when income is 3x+ rent', () => {
      const renter = createMockRenter({ monthlyIncome: 3000 });
      const property = createMockProperty({ rentPcm: 1000 });

      const result = calculateCompatibility(renter, property);

      expect(result.breakdown.affordability).toBe(30);
    });

    it('should give 80-100% points when income is 2.5x-3x rent', () => {
      const renter = createMockRenter({ monthlyIncome: 2750 });
      const property = createMockProperty({ rentPcm: 1000 });

      const result = calculateCompatibility(renter, property);

      expect(result.breakdown.affordability).toBeGreaterThanOrEqual(24); // 80%
      expect(result.breakdown.affordability).toBeLessThanOrEqual(30);
    });

    it('should give 50-80% points when income is 2x-2.5x rent', () => {
      const renter = createMockRenter({ monthlyIncome: 2250 });
      const property = createMockProperty({ rentPcm: 1000 });

      const result = calculateCompatibility(renter, property);

      expect(result.breakdown.affordability).toBeGreaterThanOrEqual(15); // 50%
      expect(result.breakdown.affordability).toBeLessThanOrEqual(24); // 80%
    });

    it('should give reduced points when income is below 2x rent', () => {
      const renter = createMockRenter({ monthlyIncome: 1500 });
      const property = createMockProperty({ rentPcm: 1000 });

      const result = calculateCompatibility(renter, property);

      expect(result.breakdown.affordability).toBeLessThan(15);
    });

    it('should handle zero rent gracefully (free property)', () => {
      const renter = createMockRenter({ monthlyIncome: 3000 });
      const property = createMockProperty({ rentPcm: 0 });

      const result = calculateCompatibility(renter, property);

      expect(result.breakdown.affordability).toBe(30);
    });

    it('should handle zero income', () => {
      const renter = createMockRenter({ monthlyIncome: 0 });
      const property = createMockProperty({ rentPcm: 1000 });

      const result = calculateCompatibility(renter, property);

      expect(result.breakdown.affordability).toBe(0);
    });
  });

  // =====================================================
  // LOCATION SCORING TESTS
  // =====================================================

  describe('Location Scoring', () => {
    it('should give full points (20) for exact city match', () => {
      const renter = createMockRenter({ localArea: 'Liverpool' });
      const property = createMockProperty({
        address: { street: '123 Test St', city: 'Liverpool', postcode: 'L1 1AA', council: 'Liverpool' },
      });

      const result = calculateCompatibility(renter, property);

      expect(result.breakdown.location).toBe(20);
    });

    it('should be case-insensitive for location matching', () => {
      const renter = createMockRenter({ localArea: 'LIVERPOOL' });
      const property = createMockProperty({
        address: { street: '123 Test St', city: 'liverpool', postcode: 'L1 1AA', council: 'Liverpool' },
      });

      const result = calculateCompatibility(renter, property);

      expect(result.breakdown.location).toBe(20);
    });

    it('should give 80% points for same region', () => {
      const renter = createMockRenter({ localArea: 'Southport' });
      const property = createMockProperty({
        address: { street: '123 Test St', city: 'Liverpool', postcode: 'L1 1AA', council: 'Liverpool' },
      });

      const result = calculateCompatibility(renter, property);

      expect(result.breakdown.location).toBe(16); // 80% of 20
    });

    it('should give 50% points for same broader region (North West)', () => {
      const renter = createMockRenter({ localArea: 'Manchester' });
      const property = createMockProperty({
        address: { street: '123 Test St', city: 'Liverpool', postcode: 'L1 1AA', council: 'Liverpool' },
      });

      const result = calculateCompatibility(renter, property);

      expect(result.breakdown.location).toBe(10); // 50% of 20
    });

    it('should give 25% points for no location match', () => {
      const renter = createMockRenter({ localArea: 'London' });
      const property = createMockProperty({
        address: { street: '123 Test St', city: 'Liverpool', postcode: 'L1 1AA', council: 'Liverpool' },
      });

      const result = calculateCompatibility(renter, property);

      expect(result.breakdown.location).toBe(5); // 25% of 20
    });
  });

  // =====================================================
  // TIMING SCORING TESTS
  // =====================================================

  describe('Timing Scoring', () => {
    it('should give full points (15) when no move date preference', () => {
      const renter = createMockRenter({ preferredMoveInDate: undefined });
      const property = createMockProperty();

      const result = calculateCompatibility(renter, property);

      expect(result.breakdown.timing).toBe(15);
    });

    it('should give full points when dates are within 7 days', () => {
      const now = new Date();
      const moveDateIn3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      const renter = createMockRenter({ preferredMoveInDate: moveDateIn3Days });
      const property = createMockProperty({ availableFrom: now.toISOString() });

      const result = calculateCompatibility(renter, property);

      expect(result.breakdown.timing).toBe(15);
    });

    it('should give 70-100% points when dates are 7-30 days apart', () => {
      const now = new Date();
      const moveDateIn20Days = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000);

      const renter = createMockRenter({ preferredMoveInDate: moveDateIn20Days });
      const property = createMockProperty({ availableFrom: now.toISOString() });

      const result = calculateCompatibility(renter, property);

      expect(result.breakdown.timing).toBeGreaterThanOrEqual(10); // ~70%
      expect(result.breakdown.timing).toBeLessThanOrEqual(15);
    });

    it('should give 40-70% points when dates are 30-60 days apart', () => {
      const now = new Date();
      const moveDateIn45Days = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);

      const renter = createMockRenter({ preferredMoveInDate: moveDateIn45Days });
      const property = createMockProperty({ availableFrom: now.toISOString() });

      const result = calculateCompatibility(renter, property);

      expect(result.breakdown.timing).toBeGreaterThanOrEqual(6); // ~40%
      expect(result.breakdown.timing).toBeLessThanOrEqual(11); // ~70%
    });

    it('should give reduced points when dates are over 60 days apart', () => {
      const now = new Date();
      const moveDateIn90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

      const renter = createMockRenter({ preferredMoveInDate: moveDateIn90Days });
      const property = createMockProperty({ availableFrom: now.toISOString() });

      const result = calculateCompatibility(renter, property);

      expect(result.breakdown.timing).toBe(3); // 20% of 15
    });
  });

  // =====================================================
  // PROPERTY FIT SCORING TESTS
  // =====================================================

  describe('Property Fit Scoring', () => {
    it('should give bonus points for non-smoker', () => {
      const smoker = createMockRenter({ smokingStatus: 'Smoker' });
      const nonSmoker = createMockRenter({ smokingStatus: 'Non-Smoker' });
      const property = createMockProperty();

      const smokerResult = calculateCompatibility(smoker, property);
      const nonSmokerResult = calculateCompatibility(nonSmoker, property);

      expect(nonSmokerResult.breakdown.propertyFit).toBeGreaterThan(smokerResult.breakdown.propertyFit);
    });

    it('should give bonus points for having guarantor', () => {
      const withGuarantor = createMockRenter({ hasGuarantor: true });
      const withoutGuarantor = createMockRenter({ hasGuarantor: false });
      const property = createMockProperty();

      const withResult = calculateCompatibility(withGuarantor, property);
      const withoutResult = calculateCompatibility(withoutGuarantor, property);

      expect(withResult.breakdown.propertyFit).toBeGreaterThan(withoutResult.breakdown.propertyFit);
    });

    it('should give bonus points for rental history with reference', () => {
      const withHistory = createMockRenter({
        hasRentalHistory: true,
        previousLandlordReference: { landlordName: 'Test', rating: 5 },
      });
      const withoutHistory = createMockRenter({ hasRentalHistory: false });
      const property = createMockProperty();

      const withResult = calculateCompatibility(withHistory, property);
      const withoutResult = calculateCompatibility(withoutHistory, property);

      expect(withResult.breakdown.propertyFit).toBeGreaterThan(withoutResult.breakdown.propertyFit);
    });

    it('should score higher for no pets', () => {
      const withPets = createMockRenter({ hasPets: true, petDetails: [{ type: 'dog', count: 1, hasInsurance: false }] });
      const withoutPets = createMockRenter({ hasPets: false });
      const property = createMockProperty();

      const withPetsResult = calculateCompatibility(withPets, property);
      const withoutPetsResult = calculateCompatibility(withoutPets, property);

      // No pets should have slightly better pet compatibility score
      expect(withoutPetsResult.breakdown.propertyFit).toBeGreaterThanOrEqual(withPetsResult.breakdown.propertyFit);
    });

    it('should not exceed max property fit score of 20', () => {
      const perfectRenter = createMockRenter({
        situation: 'Couple',
        hasGuarantor: true,
        hasRentalHistory: true,
        previousLandlordReference: { landlordName: 'Test', rating: 5 },
        smokingStatus: 'Non-Smoker',
        hasPets: false,
      });
      const property = createMockProperty({ maxOccupants: 2 });

      const result = calculateCompatibility(perfectRenter, property);

      expect(result.breakdown.propertyFit).toBeLessThanOrEqual(20);
    });
  });

  // =====================================================
  // TENANT HISTORY SCORING TESTS
  // =====================================================

  describe('Tenant History Scoring', () => {
    it('should give 50% points for first-time renter (no ratings)', () => {
      const renter = createMockRenter({ ratingsSummary: undefined });
      const property = createMockProperty();

      const result = calculateCompatibility(renter, property);

      expect(result.breakdown.tenantHistory).toBe(8); // 50% of 15 rounded
    });

    it('should give high points for excellent ratings', () => {
      const renter = createMockRenter({
        ratingsSummary: {
          averageOverallScore: 5.0,
          totalRatings: 5,
          wouldRecommendPercentage: 100,
          paymentReliability: 5,
          propertyCare: 5,
          communication: 5,
          neighbourConsideration: 5,
        },
      });
      const property = createMockProperty();

      const result = calculateCompatibility(renter, property);

      expect(result.breakdown.tenantHistory).toBe(15); // Max score
    });

    it('should give proportional points for average ratings', () => {
      const renter = createMockRenter({
        ratingsSummary: {
          averageOverallScore: 3.0,
          totalRatings: 2,
          wouldRecommendPercentage: 50,
          paymentReliability: 3,
          propertyCare: 3,
          communication: 3,
          neighbourConsideration: 3,
        },
      });
      const property = createMockProperty();

      const result = calculateCompatibility(renter, property);

      // Should be somewhere in the middle
      expect(result.breakdown.tenantHistory).toBeGreaterThan(4);
      expect(result.breakdown.tenantHistory).toBeLessThan(12);
    });

    it('should give experience bonus for many ratings', () => {
      const manyRatings = createMockRenter({
        ratingsSummary: {
          averageOverallScore: 4.0,
          totalRatings: 10,
          wouldRecommendPercentage: 80,
          paymentReliability: 4,
          propertyCare: 4,
          communication: 4,
          neighbourConsideration: 4,
        },
      });
      const fewRatings = createMockRenter({
        ratingsSummary: {
          averageOverallScore: 4.0,
          totalRatings: 1,
          wouldRecommendPercentage: 80,
          paymentReliability: 4,
          propertyCare: 4,
          communication: 4,
          neighbourConsideration: 4,
        },
      });
      const property = createMockProperty();

      const manyResult = calculateCompatibility(manyRatings, property);
      const fewResult = calculateCompatibility(fewRatings, property);

      expect(manyResult.breakdown.tenantHistory).toBeGreaterThan(fewResult.breakdown.tenantHistory);
    });
  });

  // =====================================================
  // FLAG GENERATION TESTS
  // =====================================================

  describe('Flag Generation', () => {
    it('should add income_strong flag when income is 3x+ rent', () => {
      const renter = createMockRenter({ monthlyIncome: 4000 });
      const property = createMockProperty({ rentPcm: 1000 });

      const result = calculateCompatibility(renter, property);

      expect(result.flags).toContain('income_strong');
    });

    it('should add income_marginal flag when income is 2.5x-3x rent', () => {
      const renter = createMockRenter({ monthlyIncome: 2750 });
      const property = createMockProperty({ rentPcm: 1000 });

      const result = calculateCompatibility(renter, property);

      expect(result.flags).toContain('income_marginal');
    });

    it('should add move_date_flexible flag when no move date set', () => {
      const renter = createMockRenter({ preferredMoveInDate: undefined });
      const property = createMockProperty();

      const result = calculateCompatibility(renter, property);

      expect(result.flags).toContain('move_date_flexible');
    });

    it('should add pet_requires_approval flag when renter has pets', () => {
      const renter = createMockRenter({ hasPets: true });
      const property = createMockProperty();

      const result = calculateCompatibility(renter, property);

      expect(result.flags).toContain('pet_requires_approval');
    });

    it('should add first_time_renter flag when no rental history', () => {
      const renter = createMockRenter({ hasRentalHistory: false });
      const property = createMockProperty();

      const result = calculateCompatibility(renter, property);

      expect(result.flags).toContain('first_time_renter');
    });

    it('should add excellent_references flag for 4.5+ rating', () => {
      const renter = createMockRenter({
        hasRentalHistory: true,
        ratingsSummary: {
          averageOverallScore: 4.8,
          totalRatings: 3,
          wouldRecommendPercentage: 100,
          paymentReliability: 5,
          propertyCare: 5,
          communication: 4,
          neighbourConsideration: 5,
        },
      });
      const property = createMockProperty();

      const result = calculateCompatibility(renter, property);

      expect(result.flags).toContain('excellent_references');
    });

    it('should add has_guarantor flag when guarantor present', () => {
      const renter = createMockRenter({ hasGuarantor: true });
      const property = createMockProperty();

      const result = calculateCompatibility(renter, property);

      expect(result.flags).toContain('has_guarantor');
    });
  });
});

// =====================================================
// UTILITY FUNCTION TESTS
// =====================================================

describe('Match Scoring - Utility Functions', () => {
  describe('getFlagDescription', () => {
    it('should return human-readable descriptions for all flags', () => {
      const flags: CompatibilityFlag[] = [
        'income_marginal',
        'income_strong',
        'move_date_mismatch',
        'move_date_flexible',
        'pet_requires_approval',
        'first_time_renter',
        'excellent_references',
        'has_guarantor',
        'verified_income',
        'long_term_seeker',
      ];

      flags.forEach((flag) => {
        const description = getFlagDescription(flag);
        expect(typeof description).toBe('string');
        expect(description.length).toBeGreaterThan(0);
      });
    });

    it('should return the flag itself for unknown flags', () => {
      const unknownFlag = 'unknown_flag' as CompatibilityFlag;
      const description = getFlagDescription(unknownFlag);
      expect(description).toBe('unknown_flag');
    });
  });

  describe('getFlagType', () => {
    it('should return positive for beneficial flags', () => {
      expect(getFlagType('income_strong')).toBe('positive');
      expect(getFlagType('excellent_references')).toBe('positive');
      expect(getFlagType('has_guarantor')).toBe('positive');
      expect(getFlagType('move_date_flexible')).toBe('positive');
    });

    it('should return neutral for neutral flags', () => {
      expect(getFlagType('first_time_renter')).toBe('neutral');
      expect(getFlagType('income_marginal')).toBe('neutral');
    });

    it('should return attention for flags needing attention', () => {
      expect(getFlagType('move_date_mismatch')).toBe('attention');
      expect(getFlagType('pet_requires_approval')).toBe('attention');
    });
  });

  describe('getScoreTier', () => {
    it('should return excellent for scores >= 80', () => {
      expect(getScoreTier(80).tier).toBe('excellent');
      expect(getScoreTier(95).tier).toBe('excellent');
      expect(getScoreTier(100).tier).toBe('excellent');
    });

    it('should return good for scores 60-79', () => {
      expect(getScoreTier(60).tier).toBe('good');
      expect(getScoreTier(70).tier).toBe('good');
      expect(getScoreTier(79).tier).toBe('good');
    });

    it('should return fair for scores 40-59', () => {
      expect(getScoreTier(40).tier).toBe('fair');
      expect(getScoreTier(50).tier).toBe('fair');
      expect(getScoreTier(59).tier).toBe('fair');
    });

    it('should return low for scores < 40', () => {
      expect(getScoreTier(0).tier).toBe('low');
      expect(getScoreTier(20).tier).toBe('low');
      expect(getScoreTier(39).tier).toBe('low');
    });

    it('should return label and color with tier', () => {
      const result = getScoreTier(85);
      expect(result.label).toBe('Excellent Match');
      expect(result.color).toBe('text-success-600');
    });
  });

  describe('formatScore', () => {
    it('should format score as percentage', () => {
      expect(formatScore(75)).toBe('75%');
      expect(formatScore(0)).toBe('0%');
      expect(formatScore(100)).toBe('100%');
    });
  });

  describe('getBreakdownLabel', () => {
    it('should return human-readable labels for breakdown keys', () => {
      expect(getBreakdownLabel('affordability')).toBe('Affordability');
      expect(getBreakdownLabel('location')).toBe('Location');
      expect(getBreakdownLabel('timing')).toBe('Move-in Timing');
      expect(getBreakdownLabel('propertyFit')).toBe('Property Fit');
      expect(getBreakdownLabel('tenantHistory')).toBe('Rental History');
    });
  });

  describe('getBreakdownMax', () => {
    it('should return correct max scores for each category', () => {
      expect(getBreakdownMax('affordability')).toBe(30);
      expect(getBreakdownMax('location')).toBe(20);
      expect(getBreakdownMax('timing')).toBe(15);
      expect(getBreakdownMax('propertyFit')).toBe(20);
      expect(getBreakdownMax('tenantHistory')).toBe(15);
    });

    it('should sum to 100', () => {
      const total =
        getBreakdownMax('affordability') +
        getBreakdownMax('location') +
        getBreakdownMax('timing') +
        getBreakdownMax('propertyFit') +
        getBreakdownMax('tenantHistory');

      expect(total).toBe(100);
    });
  });
});

// =====================================================
// EDGE CASES AND INTEGRATION TESTS
// =====================================================

describe('Match Scoring - Edge Cases', () => {
  it('should handle minimum viable renter profile', () => {
    const minimalRenter: RenterProfile = {
      id: 'min',
      names: 'Min',
      email: 'min@test.com',
      phone: '',
      password: '',
      userType: 'renter',
      onboardingComplete: true,
      createdAt: new Date(),
      status: 'looking',
      situation: 'Single',
      ages: '18-24',
      renterType: 'Young Professional',
      localArea: '',
      monthlyIncome: 0,
      employmentStatus: 'Student',
      hasPets: false,
      hasGuarantor: false,
      hasRentalHistory: false,
      smokingStatus: 'Non-Smoker',
    };
    const property = createMockProperty();

    expect(() => calculateCompatibility(minimalRenter, property)).not.toThrow();
  });

  it('should handle property with missing optional fields', () => {
    const renter = createMockRenter();
    const minimalProperty: Property = {
      id: 'min-prop',
      landlordId: 'landlord-1',
      address: { street: '', city: '', postcode: '', council: '' },
      rentPcm: 1000,
      deposit: 1000,
      maxRentInAdvance: 1,
      bedrooms: 1,
      bathrooms: 1,
      propertyType: 'flat',
      availableFrom: new Date().toISOString(),
      images: [],
      features: [],
      description: '',
      epcRating: 'C',
      yearBuilt: 2000,
      furnishing: 'unfurnished',
      tenancyType: 'Periodic',
      maxOccupants: 2,
      petsPolicy: { willConsiderPets: false, preferredPetTypes: [], requiresPetInsurance: false, maxPetsAllowed: 0 },
      bills: { councilTaxBand: 'A', gasElectricIncluded: false, waterIncluded: false, internetIncluded: false },
      meetsDecentHomesStandard: false,
      awaabsLawCompliant: false,
      prsPropertyRegistrationStatus: 'not_registered',
      isAvailable: true,
      canBeMarketed: false,
      listingDate: new Date().toISOString(),
    };

    expect(() => calculateCompatibility(renter, minimalProperty)).not.toThrow();
  });

  it('should produce consistent results for same inputs', () => {
    const renter = createMockRenter();
    const property = createMockProperty();

    const result1 = calculateCompatibility(renter, property);
    const result2 = calculateCompatibility(renter, property);

    expect(result1.overall).toBe(result2.overall);
    expect(result1.breakdown).toEqual(result2.breakdown);
  });
});
