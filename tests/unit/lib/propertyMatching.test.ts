import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { saveMatch, getAllMatches } from '../../../src/lib/storage';
import { setupStorageMocks, clearAllStorage } from '../../__mocks__/localStorage';
import type { Match, Property, Message } from '../../../src/types';

// Mock Supabase
vi.mock('../../../src/lib/supabase', () => ({
  supabase: null,
  isSupabaseConfigured: () => false, // Always use localStorage for tests
}));

describe('Property Matching System', () => {
  const mockProperty: Property = {
    id: 'property-123',
    landlordId: 'landlord-456',
    address: {
      street: '123 Test Street',
      city: 'Liverpool',
      postcode: 'L1 1AA',
      council: 'Liverpool City Council',
    },
    rentPcm: 1200,
    deposit: 1200,
    bedrooms: 2,
    bathrooms: 1,
    propertyType: 'Flat',
    description: 'Modern flat',
    epcRating: 'B',
    images: [],
    features: [],
    furnishing: 'Furnished',
    tenancyType: 'Periodic',
    petsPolicy: 'No Pets',
    isAvailable: true,
  };

  beforeEach(() => {
    setupStorageMocks();
  });

  afterEach(() => {
    clearAllStorage();
  });

  describe('Match Creation', () => {
    it('should create a new match between renter and landlord', async () => {
      const match: Match = {
        id: 'match-123',
        propertyId: 'property-123',
        property: mockProperty,
        landlordId: 'landlord-456',
        landlordName: 'Test Landlord',
        renterId: 'renter-789',
        renterName: 'Test Renter',
        timestamp: new Date().toISOString(),
        messages: [],
        unreadCount: 0,
        hasViewingScheduled: false,
        applicationStatus: 'pending',
        canRate: false,
        tenancyStatus: 'prospective',
        activeIssueIds: [],
        totalIssuesRaised: 0,
        totalIssuesResolved: 0,
      };

      const savedMatch = await saveMatch(match);

      expect(savedMatch.id).toBe('match-123');
      expect(savedMatch.propertyId).toBe('property-123');
      expect(savedMatch.landlordId).toBe('landlord-456');
      expect(savedMatch.renterId).toBe('renter-789');
      expect(savedMatch.applicationStatus).toBe('pending');
    });

    it('should store match with empty messages array', async () => {
      const match: Match = {
        id: 'match-123',
        propertyId: 'property-123',
        property: mockProperty,
        landlordId: 'landlord-456',
        landlordName: 'Test Landlord',
        renterId: 'renter-789',
        renterName: 'Test Renter',
        timestamp: new Date().toISOString(),
        messages: [],
        unreadCount: 0,
        hasViewingScheduled: false,
        applicationStatus: 'pending',
        canRate: false,
        tenancyStatus: 'prospective',
        activeIssueIds: [],
        totalIssuesRaised: 0,
        totalIssuesResolved: 0,
      };

      const savedMatch = await saveMatch(match);

      expect(savedMatch.messages).toEqual([]);
    });

    it('should create match with renter profile information', async () => {
      const match: Match = {
        id: 'match-123',
        propertyId: 'property-123',
        property: mockProperty,
        landlordId: 'landlord-456',
        landlordName: 'Test Landlord',
        renterId: 'renter-789',
        renterName: 'Test Renter',
        renterProfile: {
          id: 'renter-789',
          email: 'renter@test.com',
          passwordHash: 'hash',
          status: 'prospective',
          names: 'Test Renter',
          monthlyIncome: 3000,
          isComplete: true,
        },
        timestamp: new Date().toISOString(),
        messages: [],
        unreadCount: 0,
        hasViewingScheduled: false,
        applicationStatus: 'pending',
        canRate: false,
        tenancyStatus: 'prospective',
        activeIssueIds: [],
        totalIssuesRaised: 0,
        totalIssuesResolved: 0,
      };

      const savedMatch = await saveMatch(match);

      expect(savedMatch.renterProfile).toBeDefined();
      expect(savedMatch.renterProfile?.monthlyIncome).toBe(3000);
    });
  });

  describe('Match Retrieval', () => {
    it('should retrieve all matches', async () => {
      const match1: Match = {
        id: 'match-1',
        propertyId: 'property-123',
        property: mockProperty,
        landlordId: 'landlord-456',
        landlordName: 'Test Landlord',
        renterId: 'renter-1',
        renterName: 'Renter One',
        timestamp: new Date().toISOString(),
        messages: [],
        unreadCount: 0,
        hasViewingScheduled: false,
        applicationStatus: 'pending',
        canRate: false,
        tenancyStatus: 'prospective',
        activeIssueIds: [],
        totalIssuesRaised: 0,
        totalIssuesResolved: 0,
      };

      const match2: Match = {
        id: 'match-2',
        propertyId: 'property-456',
        property: mockProperty,
        landlordId: 'landlord-456',
        landlordName: 'Test Landlord',
        renterId: 'renter-2',
        renterName: 'Renter Two',
        timestamp: new Date().toISOString(),
        messages: [],
        unreadCount: 0,
        hasViewingScheduled: false,
        applicationStatus: 'viewing_requested',
        canRate: false,
        tenancyStatus: 'prospective',
        activeIssueIds: [],
        totalIssuesRaised: 0,
        totalIssuesResolved: 0,
      };

      await saveMatch(match1);
      await saveMatch(match2);

      const matches = await getAllMatches();

      expect(matches).toHaveLength(2);
      expect(matches[0].id).toBe('match-1');
      expect(matches[1].id).toBe('match-2');
    });

    it('should return empty array when no matches exist', async () => {
      const matches = await getAllMatches();

      expect(matches).toEqual([]);
    });
  });

  describe('Match Updates', () => {
    it('should update existing match', async () => {
      const match: Match = {
        id: 'match-123',
        propertyId: 'property-123',
        property: mockProperty,
        landlordId: 'landlord-456',
        landlordName: 'Test Landlord',
        renterId: 'renter-789',
        renterName: 'Test Renter',
        timestamp: new Date().toISOString(),
        messages: [],
        unreadCount: 0,
        hasViewingScheduled: false,
        applicationStatus: 'pending',
        canRate: false,
        tenancyStatus: 'prospective',
        activeIssueIds: [],
        totalIssuesRaised: 0,
        totalIssuesResolved: 0,
      };

      await saveMatch(match);

      const updatedMatch = {
        ...match,
        applicationStatus: 'viewing_requested' as const,
        hasViewingScheduled: true,
        confirmedViewingDate: new Date('2025-03-15'),
      };

      await saveMatch(updatedMatch);

      const matches = await getAllMatches();
      expect(matches).toHaveLength(1);
      expect(matches[0].applicationStatus).toBe('viewing_requested');
      expect(matches[0].hasViewingScheduled).toBe(true);
    });

    it('should update match with messages', async () => {
      const match: Match = {
        id: 'match-123',
        propertyId: 'property-123',
        property: mockProperty,
        landlordId: 'landlord-456',
        landlordName: 'Test Landlord',
        renterId: 'renter-789',
        renterName: 'Test Renter',
        timestamp: new Date().toISOString(),
        messages: [],
        unreadCount: 0,
        hasViewingScheduled: false,
        applicationStatus: 'pending',
        canRate: false,
        tenancyStatus: 'prospective',
        activeIssueIds: [],
        totalIssuesRaised: 0,
        totalIssuesResolved: 0,
      };

      await saveMatch(match);

      const message: Message = {
        id: 'msg-1',
        senderId: 'renter-789',
        senderType: 'renter',
        text: 'I am interested in viewing this property',
        timestamp: new Date().toISOString(),
        isRead: false,
      };

      const updatedMatch = {
        ...match,
        messages: [message],
        unreadCount: 1,
        lastMessageAt: message.timestamp,
      };

      await saveMatch(updatedMatch);

      const matches = await getAllMatches();
      expect(matches[0].messages).toHaveLength(1);
      expect(matches[0].messages[0].text).toBe('I am interested in viewing this property');
      expect(matches[0].unreadCount).toBe(1);
    });

    it('should update application status through lifecycle', async () => {
      const match: Match = {
        id: 'match-123',
        propertyId: 'property-123',
        property: mockProperty,
        landlordId: 'landlord-456',
        landlordName: 'Test Landlord',
        renterId: 'renter-789',
        renterName: 'Test Renter',
        timestamp: new Date().toISOString(),
        messages: [],
        unreadCount: 0,
        hasViewingScheduled: false,
        applicationStatus: 'pending',
        canRate: false,
        tenancyStatus: 'prospective',
        activeIssueIds: [],
        totalIssuesRaised: 0,
        totalIssuesResolved: 0,
      };

      await saveMatch(match);

      // Progress through application lifecycle
      await saveMatch({ ...match, applicationStatus: 'viewing_requested' });
      let matches = await getAllMatches();
      expect(matches[0].applicationStatus).toBe('viewing_requested');

      await saveMatch({ ...match, applicationStatus: 'viewing_completed' });
      matches = await getAllMatches();
      expect(matches[0].applicationStatus).toBe('viewing_completed');

      await saveMatch({ ...match, applicationStatus: 'application_submitted', applicationSubmittedAt: new Date() });
      matches = await getAllMatches();
      expect(matches[0].applicationStatus).toBe('application_submitted');

      await saveMatch({ ...match, applicationStatus: 'offer_accepted' });
      matches = await getAllMatches();
      expect(matches[0].applicationStatus).toBe('offer_accepted');

      await saveMatch({ ...match, applicationStatus: 'tenancy_signed', tenancyStartDate: new Date('2025-04-01') });
      matches = await getAllMatches();
      expect(matches[0].applicationStatus).toBe('tenancy_signed');
    });
  });

  describe('Viewing Management', () => {
    it('should schedule a viewing', async () => {
      const match: Match = {
        id: 'match-123',
        propertyId: 'property-123',
        property: mockProperty,
        landlordId: 'landlord-456',
        landlordName: 'Test Landlord',
        renterId: 'renter-789',
        renterName: 'Test Renter',
        timestamp: new Date().toISOString(),
        messages: [],
        unreadCount: 0,
        hasViewingScheduled: false,
        applicationStatus: 'pending',
        canRate: false,
        tenancyStatus: 'prospective',
        activeIssueIds: [],
        totalIssuesRaised: 0,
        totalIssuesResolved: 0,
      };

      await saveMatch(match);

      const viewingDate = new Date('2025-03-20T14:00:00');
      const updatedMatch = {
        ...match,
        hasViewingScheduled: true,
        confirmedViewingDate: viewingDate,
        applicationStatus: 'viewing_requested' as const,
      };

      await saveMatch(updatedMatch);

      const matches = await getAllMatches();
      expect(matches[0].hasViewingScheduled).toBe(true);
      // localStorage serializes dates to strings - only Supabase converts them back
      expect(matches[0].confirmedViewingDate).toBeDefined();
    });

    it('should track viewing preference', async () => {
      const match: Match = {
        id: 'match-123',
        propertyId: 'property-123',
        property: mockProperty,
        landlordId: 'landlord-456',
        landlordName: 'Test Landlord',
        renterId: 'renter-789',
        renterName: 'Test Renter',
        timestamp: new Date().toISOString(),
        messages: [],
        unreadCount: 0,
        hasViewingScheduled: false,
        viewingPreference: {
          preferredDays: ['weekday_morning', 'weekend_afternoon'],
          availableFrom: new Date('2025-03-10'),
          availableUntil: new Date('2025-03-25'),
          notes: 'Prefer morning viewings',
        },
        applicationStatus: 'pending',
        canRate: false,
        tenancyStatus: 'prospective',
        activeIssueIds: [],
        totalIssuesRaised: 0,
        totalIssuesResolved: 0,
      };

      await saveMatch(match);

      const matches = await getAllMatches();
      expect(matches[0].viewingPreference).toBeDefined();
      expect(matches[0].viewingPreference?.preferredDays).toEqual(['weekday_morning', 'weekend_afternoon']);
      expect(matches[0].viewingPreference?.notes).toBe('Prefer morning viewings');
    });
  });

  describe('Tenancy Management (RRA 2025)', () => {
    it('should start a periodic tenancy', async () => {
      const match: Match = {
        id: 'match-123',
        propertyId: 'property-123',
        property: mockProperty,
        landlordId: 'landlord-456',
        landlordName: 'Test Landlord',
        renterId: 'renter-789',
        renterName: 'Test Renter',
        timestamp: new Date().toISOString(),
        messages: [],
        unreadCount: 0,
        hasViewingScheduled: false,
        applicationStatus: 'tenancy_signed',
        tenancyStartDate: new Date('2025-04-01'),
        tenancyStatus: 'active',
        canRate: false,
        activeIssueIds: [],
        totalIssuesRaised: 0,
        totalIssuesResolved: 0,
      };

      await saveMatch(match);

      const matches = await getAllMatches();
      // localStorage serializes dates to strings - only Supabase converts them back
      expect(matches[0].tenancyStartDate).toBeDefined();
      expect(matches[0].tenancyStatus).toBe('active');
    });

    it('should handle tenant notice (RRA 2025: 2 months minimum)', async () => {
      const match: Match = {
        id: 'match-123',
        propertyId: 'property-123',
        property: mockProperty,
        landlordId: 'landlord-456',
        landlordName: 'Test Landlord',
        renterId: 'renter-789',
        renterName: 'Test Renter',
        timestamp: new Date().toISOString(),
        messages: [],
        unreadCount: 0,
        hasViewingScheduled: false,
        applicationStatus: 'tenancy_signed',
        tenancyStartDate: new Date('2025-04-01'),
        tenancyNoticedDate: new Date('2025-10-01'),
        tenancyStatus: 'notice_period',
        tenancyEndReason: 'tenant_notice',
        canRate: false,
        activeIssueIds: [],
        totalIssuesRaised: 0,
        totalIssuesResolved: 0,
      };

      await saveMatch(match);

      const matches = await getAllMatches();
      // localStorage serializes dates to strings - only Supabase converts them back
      expect(matches[0].tenancyNoticedDate).toBeDefined();
      expect(matches[0].tenancyEndReason).toBe('tenant_notice');
    });

    it('should track eviction proceedings', async () => {
      const match: Match = {
        id: 'match-123',
        propertyId: 'property-123',
        property: mockProperty,
        landlordId: 'landlord-456',
        landlordName: 'Test Landlord',
        renterId: 'renter-789',
        renterName: 'Test Renter',
        timestamp: new Date().toISOString(),
        messages: [],
        unreadCount: 0,
        hasViewingScheduled: false,
        applicationStatus: 'tenancy_signed',
        tenancyStartDate: new Date('2025-04-01'),
        tenancyStatus: 'eviction',
        isUnderEvictionProceedings: true,
        canRate: false,
        activeIssueIds: [],
        totalIssuesRaised: 0,
        totalIssuesResolved: 0,
      };

      await saveMatch(match);

      const matches = await getAllMatches();
      expect(matches[0].isUnderEvictionProceedings).toBe(true);
      expect(matches[0].tenancyStatus).toBe('eviction');
    });

    it('should track rent arrears', async () => {
      const match: Match = {
        id: 'match-123',
        propertyId: 'property-123',
        property: mockProperty,
        landlordId: 'landlord-456',
        landlordName: 'Test Landlord',
        renterId: 'renter-789',
        renterName: 'Test Renter',
        timestamp: new Date().toISOString(),
        messages: [],
        unreadCount: 0,
        hasViewingScheduled: false,
        applicationStatus: 'tenancy_signed',
        tenancyStartDate: new Date('2025-04-01'),
        tenancyStatus: 'arrears',
        rentArrears: {
          totalOwed: 2400,
          monthsMissed: 2,
          consecutiveMonthsMissed: 2,
        },
        canRate: false,
        activeIssueIds: [],
        totalIssuesRaised: 0,
        totalIssuesResolved: 0,
      };

      await saveMatch(match);

      const matches = await getAllMatches();
      expect(matches[0].rentArrears).toBeDefined();
      expect(matches[0].rentArrears?.totalOwed).toBe(2400);
      expect(matches[0].rentArrears?.consecutiveMonthsMissed).toBe(2);
    });
  });

  describe('Rating System', () => {
    it('should enable rating after tenancy completion', async () => {
      const match: Match = {
        id: 'match-123',
        propertyId: 'property-123',
        property: mockProperty,
        landlordId: 'landlord-456',
        landlordName: 'Test Landlord',
        renterId: 'renter-789',
        renterName: 'Test Renter',
        timestamp: new Date().toISOString(),
        messages: [],
        unreadCount: 0,
        hasViewingScheduled: false,
        applicationStatus: 'tenancy_signed',
        tenancyStartDate: new Date('2025-04-01'),
        tenancyCompletedAt: new Date('2026-04-01'),
        tenancyStatus: 'completed',
        canRate: true,
        hasLandlordRated: false,
        hasRenterRated: false,
        activeIssueIds: [],
        totalIssuesRaised: 0,
        totalIssuesResolved: 0,
      };

      await saveMatch(match);

      const matches = await getAllMatches();
      expect(matches[0].canRate).toBe(true);
      expect(matches[0].hasLandlordRated).toBe(false);
      expect(matches[0].hasRenterRated).toBe(false);
    });

    it('should track rating completion', async () => {
      const match: Match = {
        id: 'match-123',
        propertyId: 'property-123',
        property: mockProperty,
        landlordId: 'landlord-456',
        landlordName: 'Test Landlord',
        renterId: 'renter-789',
        renterName: 'Test Renter',
        timestamp: new Date().toISOString(),
        messages: [],
        unreadCount: 0,
        hasViewingScheduled: false,
        applicationStatus: 'tenancy_signed',
        tenancyStartDate: new Date('2025-04-01'),
        tenancyCompletedAt: new Date('2026-04-01'),
        tenancyStatus: 'completed',
        canRate: true,
        hasLandlordRated: true,
        hasRenterRated: true,
        landlordRatingId: 'rating-landlord-1',
        renterRatingId: 'rating-renter-1',
        activeIssueIds: [],
        totalIssuesRaised: 0,
        totalIssuesResolved: 0,
      };

      await saveMatch(match);

      const matches = await getAllMatches();
      expect(matches[0].hasLandlordRated).toBe(true);
      expect(matches[0].hasRenterRated).toBe(true);
      expect(matches[0].landlordRatingId).toBe('rating-landlord-1');
      expect(matches[0].renterRatingId).toBe('rating-renter-1');
    });
  });

  describe('Issue Tracking (Awaab\'s Law)', () => {
    it('should track active issues', async () => {
      const match: Match = {
        id: 'match-123',
        propertyId: 'property-123',
        property: mockProperty,
        landlordId: 'landlord-456',
        landlordName: 'Test Landlord',
        renterId: 'renter-789',
        renterName: 'Test Renter',
        timestamp: new Date().toISOString(),
        messages: [],
        unreadCount: 0,
        hasViewingScheduled: false,
        applicationStatus: 'tenancy_signed',
        tenancyStartDate: new Date('2025-04-01'),
        tenancyStatus: 'active',
        activeIssueIds: ['issue-1', 'issue-2'],
        totalIssuesRaised: 5,
        totalIssuesResolved: 3,
        canRate: false,
      };

      await saveMatch(match);

      const matches = await getAllMatches();
      expect(matches[0].activeIssueIds).toEqual(['issue-1', 'issue-2']);
      expect(matches[0].totalIssuesRaised).toBe(5);
      expect(matches[0].totalIssuesResolved).toBe(3);
    });
  });

  describe('Multiple Matches Management', () => {
    it('should handle multiple renters interested in same property', async () => {
      const match1: Match = {
        id: 'match-1',
        propertyId: 'property-123',
        property: mockProperty,
        landlordId: 'landlord-456',
        landlordName: 'Test Landlord',
        renterId: 'renter-1',
        renterName: 'Renter One',
        timestamp: new Date().toISOString(),
        messages: [],
        unreadCount: 0,
        hasViewingScheduled: false,
        applicationStatus: 'pending',
        canRate: false,
        tenancyStatus: 'prospective',
        activeIssueIds: [],
        totalIssuesRaised: 0,
        totalIssuesResolved: 0,
      };

      const match2: Match = {
        id: 'match-2',
        propertyId: 'property-123',
        property: mockProperty,
        landlordId: 'landlord-456',
        landlordName: 'Test Landlord',
        renterId: 'renter-2',
        renterName: 'Renter Two',
        timestamp: new Date().toISOString(),
        messages: [],
        unreadCount: 0,
        hasViewingScheduled: false,
        applicationStatus: 'viewing_requested',
        canRate: false,
        tenancyStatus: 'prospective',
        activeIssueIds: [],
        totalIssuesRaised: 0,
        totalIssuesResolved: 0,
      };

      await saveMatch(match1);
      await saveMatch(match2);

      const matches = await getAllMatches();
      expect(matches).toHaveLength(2);
      expect(matches.filter(m => m.propertyId === 'property-123')).toHaveLength(2);
    });

    it('should handle one renter interested in multiple properties', async () => {
      const property2: Property = { ...mockProperty, id: 'property-456' };

      const match1: Match = {
        id: 'match-1',
        propertyId: 'property-123',
        property: mockProperty,
        landlordId: 'landlord-1',
        landlordName: 'Landlord One',
        renterId: 'renter-789',
        renterName: 'Test Renter',
        timestamp: new Date().toISOString(),
        messages: [],
        unreadCount: 0,
        hasViewingScheduled: false,
        applicationStatus: 'pending',
        canRate: false,
        tenancyStatus: 'prospective',
        activeIssueIds: [],
        totalIssuesRaised: 0,
        totalIssuesResolved: 0,
      };

      const match2: Match = {
        id: 'match-2',
        propertyId: 'property-456',
        property: property2,
        landlordId: 'landlord-2',
        landlordName: 'Landlord Two',
        renterId: 'renter-789',
        renterName: 'Test Renter',
        timestamp: new Date().toISOString(),
        messages: [],
        unreadCount: 0,
        hasViewingScheduled: false,
        applicationStatus: 'viewing_requested',
        canRate: false,
        tenancyStatus: 'prospective',
        activeIssueIds: [],
        totalIssuesRaised: 0,
        totalIssuesResolved: 0,
      };

      await saveMatch(match1);
      await saveMatch(match2);

      const matches = await getAllMatches();
      expect(matches).toHaveLength(2);
      expect(matches.filter(m => m.renterId === 'renter-789')).toHaveLength(2);
    });
  });

  describe('Application Decline/Withdrawal', () => {
    it('should decline an application', async () => {
      const match: Match = {
        id: 'match-123',
        propertyId: 'property-123',
        property: mockProperty,
        landlordId: 'landlord-456',
        landlordName: 'Test Landlord',
        renterId: 'renter-789',
        renterName: 'Test Renter',
        timestamp: new Date().toISOString(),
        messages: [],
        unreadCount: 0,
        hasViewingScheduled: false,
        applicationStatus: 'pending',
        canRate: false,
        tenancyStatus: 'prospective',
        activeIssueIds: [],
        totalIssuesRaised: 0,
        totalIssuesResolved: 0,
      };

      await saveMatch(match);

      const declinedMatch = {
        ...match,
        applicationStatus: 'declined' as const,
      };

      await saveMatch(declinedMatch);

      const matches = await getAllMatches();
      expect(matches[0].applicationStatus).toBe('declined');
    });

    it('should withdraw an application', async () => {
      const match: Match = {
        id: 'match-123',
        propertyId: 'property-123',
        property: mockProperty,
        landlordId: 'landlord-456',
        landlordName: 'Test Landlord',
        renterId: 'renter-789',
        renterName: 'Test Renter',
        timestamp: new Date().toISOString(),
        messages: [],
        unreadCount: 0,
        hasViewingScheduled: false,
        applicationStatus: 'viewing_requested',
        canRate: false,
        tenancyStatus: 'prospective',
        activeIssueIds: [],
        totalIssuesRaised: 0,
        totalIssuesResolved: 0,
      };

      await saveMatch(match);

      const withdrawnMatch = {
        ...match,
        applicationStatus: 'withdrawn' as const,
      };

      await saveMatch(withdrawnMatch);

      const matches = await getAllMatches();
      expect(matches[0].applicationStatus).toBe('withdrawn');
    });
  });
});
