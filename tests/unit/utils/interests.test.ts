/**
 * Two-Sided Matching (Interests) Unit Tests
 * Phase 3: Landlord-Renter Matching System
 *
 * Tests cover:
 * - Interest creation when renter likes property
 * - Interest status transitions
 * - Pending interests count
 * - Match creation from confirmed interest
 * - Interest decline flow
 * - Interest expiration logic (conceptual)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useAppStore } from '../../../src/hooks/useAppStore';
import type { RenterProfile, Property, Interest } from '../../../src/types';

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
    landlordId: 'landlord-test-1',
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
      preferredPetTypes: ['cat'],
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

// Helper to get fresh store reference
const getStore = () => useAppStore.getState();

// =====================================================
// SETUP AND TEARDOWN
// =====================================================

describe('Two-Sided Matching - Interests', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Reset only state, not actions - merge mode (no second parameter)
    useAppStore.setState({
      user: null,
      allProperties: [],
      availableProperties: [],
      currentPropertyIndex: 0,
      likedProperties: [],
      passedProperties: [],
      matches: [],
      viewingPreferences: [],
      interests: [],
      isOnboarded: false,
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  // =====================================================
  // CREATE INTEREST TESTS
  // =====================================================

  describe('createInterest', () => {
    it('should create a new interest with pending status', async () => {
      const renter = createMockRenter();
      const property = createMockProperty();

      useAppStore.setState({ allProperties: [property] });

      const interest = await getStore().createInterest(property.id, renter.id, renter);

      expect(interest).not.toBeNull();
      expect(interest!.status).toBe('pending');
      expect(interest!.renterId).toBe(renter.id);
      expect(interest!.landlordId).toBe(property.landlordId);
      expect(interest!.propertyId).toBe(property.id);
    });

    it('should calculate compatibility score for interest', async () => {
      const renter = createMockRenter({ monthlyIncome: 4000 });
      const property = createMockProperty({ rentPcm: 1000 });

      useAppStore.setState({ allProperties: [property] });

      const interest = await getStore().createInterest(property.id, renter.id, renter);

      expect(interest).not.toBeNull();
      expect(interest!.compatibilityScore).toBeGreaterThan(0);
      expect(interest!.compatibilityScore).toBeLessThanOrEqual(100);
    });

    it('should set expiration 30 days in the future', async () => {
      const renter = createMockRenter();
      const property = createMockProperty();

      useAppStore.setState({ allProperties: [property] });

      const before = Date.now();
      const interest = await getStore().createInterest(property.id, renter.id, renter);
      const after = Date.now();

      const expectedExpiry = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

      expect(interest).not.toBeNull();
      const expiryTime = new Date(interest!.expiresAt).getTime();
      expect(expiryTime).toBeGreaterThanOrEqual(before + expectedExpiry);
      expect(expiryTime).toBeLessThanOrEqual(after + expectedExpiry + 1000);
    });

    it('should return null if property has no landlord', async () => {
      const renter = createMockRenter();
      const property = createMockProperty({ landlordId: '' });

      useAppStore.setState({ allProperties: [property] });

      const interest = await getStore().createInterest(property.id, renter.id, renter);

      expect(interest).toBeNull();
    });

    it('should return null if property does not exist', async () => {
      const renter = createMockRenter();

      useAppStore.setState({ allProperties: [] });

      const interest = await getStore().createInterest('non-existent', renter.id, renter);

      expect(interest).toBeNull();
    });

    it('should return existing interest if duplicate', async () => {
      const renter = createMockRenter();
      const property = createMockProperty();

      useAppStore.setState({ allProperties: [property] });

      const interest1 = await getStore().createInterest(property.id, renter.id, renter);
      const interest2 = await getStore().createInterest(property.id, renter.id, renter);

      expect(interest1).not.toBeNull();
      expect(interest2).not.toBeNull();
      expect(interest1!.id).toBe(interest2!.id);
    });
  });

  // =====================================================
  // PENDING INTERESTS COUNT TESTS
  // =====================================================

  describe('getPendingInterestsCount', () => {
    it('should return 0 when no interests exist', () => {
      useAppStore.setState({ interests: [] });

      const count = getStore().getPendingInterestsCount('landlord-1');

      expect(count).toBe(0);
    });

    it('should count only pending interests for specific landlord', async () => {
      const property1 = createMockProperty({ id: 'prop-1', landlordId: 'landlord-1' });
      const property2 = createMockProperty({ id: 'prop-2', landlordId: 'landlord-2' });
      const renter = createMockRenter();

      useAppStore.setState({ allProperties: [property1, property2] });

      await getStore().createInterest(property1.id, renter.id, renter);
      await getStore().createInterest(property2.id, renter.id, renter);

      const count = getStore().getPendingInterestsCount('landlord-1');

      expect(count).toBe(1);
    });

    it('should not count confirmed/declined interests', async () => {
      const property = createMockProperty();
      const renter1 = createMockRenter({ id: 'renter-1' });
      const renter2 = createMockRenter({ id: 'renter-2' });

      useAppStore.setState({ allProperties: [property] });

      const interest1 = await getStore().createInterest(property.id, renter1.id, renter1);
      await getStore().createInterest(property.id, renter2.id, renter2);

      // Decline first interest
      if (interest1) {
        await getStore().declineInterest(interest1.id);
      }

      const count = getStore().getPendingInterestsCount(property.landlordId);

      expect(count).toBe(1); // Only renter2's interest remains pending
    });
  });

  // =====================================================
  // CONFIRM MATCH TESTS
  // =====================================================

  describe('confirmMatch', () => {
    it('should create a match from pending interest', async () => {
      const property = createMockProperty();
      const renter = createMockRenter();

      useAppStore.setState({
        allProperties: [property],
        matches: [],
      });

      localStorage.setItem('get-on-renters', JSON.stringify([renter]));

      const interest = await getStore().createInterest(property.id, renter.id, renter);

      expect(interest).not.toBeNull();

      const match = await getStore().confirmMatch(interest!.id);

      expect(match).not.toBeNull();
      expect(match!.propertyId).toBe(property.id);
      expect(match!.renterId).toBe(renter.id);
      expect(match!.landlordId).toBe(property.landlordId);
    });

    it('should update interest status to matched', async () => {
      const property = createMockProperty();
      const renter = createMockRenter();

      useAppStore.setState({
        allProperties: [property],
        matches: [],
      });

      localStorage.setItem('get-on-renters', JSON.stringify([renter]));

      const interest = await getStore().createInterest(property.id, renter.id, renter);

      await getStore().confirmMatch(interest!.id);

      const state = getStore();
      const updatedInterest = state.interests.find((i) => i.id === interest!.id);

      expect(updatedInterest?.status).toBe('landlord_liked');
    });

    it('should include welcome message in new match', async () => {
      const property = createMockProperty();
      const renter = createMockRenter();

      useAppStore.setState({
        allProperties: [property],
        matches: [],
      });

      localStorage.setItem('get-on-renters', JSON.stringify([renter]));

      const interest = await getStore().createInterest(property.id, renter.id, renter);
      const match = await getStore().confirmMatch(interest!.id);

      expect(match).not.toBeNull();
      expect(match!.messages).toHaveLength(1);
      expect(match!.messages[0].senderType).toBe('landlord');
    });

    it('should return null for non-existent interest', async () => {
      const match = await getStore().confirmMatch('non-existent-interest');

      expect(match).toBeNull();
    });
  });

  // =====================================================
  // DECLINE INTEREST TESTS
  // =====================================================

  describe('declineInterest', () => {
    it('should update interest status to landlord_passed', async () => {
      const property = createMockProperty();
      const renter = createMockRenter();

      useAppStore.setState({ allProperties: [property] });

      const interest = await getStore().createInterest(property.id, renter.id, renter);

      await getStore().declineInterest(interest!.id);

      const state = getStore();
      const updatedInterest = state.interests.find((i) => i.id === interest!.id);

      expect(updatedInterest?.status).toBe('landlord_passed');
    });

    it('should set landlordReviewedAt timestamp', async () => {
      const property = createMockProperty();
      const renter = createMockRenter();

      useAppStore.setState({ allProperties: [property] });

      const interest = await getStore().createInterest(property.id, renter.id, renter);

      const before = Date.now();
      await getStore().declineInterest(interest!.id);
      const after = Date.now();

      const state = getStore();
      const updatedInterest = state.interests.find((i) => i.id === interest!.id);

      expect(updatedInterest?.landlordReviewedAt).toBeDefined();
      const reviewedAt = new Date(updatedInterest!.landlordReviewedAt!).getTime();
      expect(reviewedAt).toBeGreaterThanOrEqual(before);
      expect(reviewedAt).toBeLessThanOrEqual(after);
    });

    it('should not create a match when declining', async () => {
      const property = createMockProperty();
      const renter = createMockRenter();

      useAppStore.setState({
        allProperties: [property],
        matches: [],
      });

      const interest = await getStore().createInterest(property.id, renter.id, renter);

      await getStore().declineInterest(interest!.id);

      const state = getStore();

      expect(state.matches).toHaveLength(0);
    });
  });

  // =====================================================
  // INTEGRATION TESTS
  // =====================================================

  describe('Two-Sided Matching Flow', () => {
    it('should handle complete matching flow: like -> interest -> confirm -> match', async () => {
      const property = createMockProperty();
      const renter = createMockRenter();

      useAppStore.setState({
        allProperties: [property],
        matches: [],
        interests: [],
      });

      localStorage.setItem('get-on-renters', JSON.stringify([renter]));

      // Step 1: Renter creates interest (simulates swiping right)
      const interest = await getStore().createInterest(property.id, renter.id, renter);

      expect(interest).not.toBeNull();
      expect(interest!.status).toBe('pending');

      // Step 2: Verify pending count for landlord
      let pendingCount = getStore().getPendingInterestsCount(property.landlordId);
      expect(pendingCount).toBe(1);

      // Step 3: Landlord confirms interest
      const match = await getStore().confirmMatch(interest!.id);

      expect(match).not.toBeNull();

      // Step 4: Verify interest is no longer pending
      pendingCount = getStore().getPendingInterestsCount(property.landlordId);
      expect(pendingCount).toBe(0);

      // Step 5: Verify match exists
      const state = getStore();
      expect(state.matches).toHaveLength(1);
      expect(state.matches[0].id).toBe(match!.id);
    });

    it('should handle decline flow: like -> interest -> decline', async () => {
      const property = createMockProperty();
      const renter = createMockRenter();

      useAppStore.setState({
        allProperties: [property],
        matches: [],
        interests: [],
      });

      // Renter creates interest
      const interest = await getStore().createInterest(property.id, renter.id, renter);

      expect(interest).not.toBeNull();

      // Landlord declines
      await getStore().declineInterest(interest!.id);

      // Verify no match created
      const state = getStore();
      expect(state.matches).toHaveLength(0);

      // Verify interest is declined
      const updatedInterest = state.interests.find((i) => i.id === interest!.id);
      expect(updatedInterest?.status).toBe('landlord_passed');
    });

    it('should handle multiple interests from different renters', async () => {
      // Use unique IDs for this test to avoid collisions
      const property = createMockProperty({ id: 'prop-multi', landlordId: 'landlord-multi' });
      const renter1 = createMockRenter({ id: 'multi-renter-1', names: 'Renter One' });
      const renter2 = createMockRenter({ id: 'multi-renter-2', names: 'Renter Two' });
      const renter3 = createMockRenter({ id: 'multi-renter-3', names: 'Renter Three' });

      useAppStore.setState({
        allProperties: [property],
        matches: [],
        interests: [],
      });

      localStorage.setItem('get-on-renters', JSON.stringify([renter1, renter2, renter3]));

      // Create interests from all renters
      const interest1 = await getStore().createInterest(property.id, renter1.id, renter1);
      const interest2 = await getStore().createInterest(property.id, renter2.id, renter2);
      const interest3 = await getStore().createInterest(property.id, renter3.id, renter3);

      // All should be pending
      let pendingCount = getStore().getPendingInterestsCount(property.landlordId);
      expect(pendingCount).toBe(3);

      // Landlord confirms one
      await getStore().confirmMatch(interest1!.id);

      // Landlord declines another
      await getStore().declineInterest(interest2!.id);

      // Only one should remain pending (interest3)
      pendingCount = getStore().getPendingInterestsCount(property.landlordId);
      expect(pendingCount).toBe(1);

      // One match should exist
      const state = getStore();
      expect(state.matches).toHaveLength(1);
    });
  });
});
