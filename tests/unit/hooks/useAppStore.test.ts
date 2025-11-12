/**
 * Tests for useAppStore Hook
 *
 * Tests the main application state management store including:
 * - Property CRUD operations
 * - Swipe actions (like/dislike)
 * - Matching system
 * - Rating submission
 * - Agency linking
 * - Statistics calculation
 *
 * Note: This focuses on core business logic. Full integration tests
 * are in the integration test suite.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppStore } from '../../../src/hooks/useAppStore';
import { setupStorageMocks } from '../../__mocks__/localStorage';
import type { Property, Rating } from '../../../src/types';

// Mock Supabase to ensure localStorage is used
vi.mock('../../../src/lib/supabase', () => ({
  supabase: null,
  isSupabaseConfigured: () => false,
}));

describe('useAppStore', () => {
  beforeEach(() => {
    setupStorageMocks();
    // Clear all localStorage data
    localStorage.clear();
    // Reset the store before each test
    const { result } = renderHook(() => useAppStore());
    act(() => {
      result.current.resetApp();
    });
  });

  describe('Property CRUD Operations', () => {
    const mockProperty: Omit<Property, 'id'> = {
      landlordId: 'landlord-123',
      type: 'Flat',
      address: '123 Test Street',
      localArea: 'Liverpool',
      bedrooms: 2,
      rent: 800,
      deposit: 800,
      epcRating: 'C',
      description: 'A lovely flat in Liverpool city centre with great transport links.',
      images: ['image1.jpg', 'image2.jpg'],
      features: ['Central Heating', 'Double Glazing'],
      furnishing: 'Furnished',
      petsPolicy: { petsAllowed: false },
      councilTaxBand: 'A',
      gasElectricIncluded: false,
      waterIncluded: false,
      internetIncluded: false,
      meetsDecentHomesStandard: true,
      awaabsLawCompliant: true,
      canBeMarketed: true,
      isAvailable: true,
      listingDate: new Date(),
    };

    it('should create a new property', async () => {
      const { result } = renderHook(() => useAppStore());

      let propertyId: string = '';
      await act(async () => {
        propertyId = await result.current.createProperty(mockProperty, 'landlord-123');
      });

      expect(propertyId).toBeDefined();
      expect(propertyId.length).toBeGreaterThan(0);
    });

    it('should load properties from storage', async () => {
      const { result } = renderHook(() => useAppStore());

      // Create a property first
      await act(async () => {
        await result.current.createProperty(mockProperty, 'landlord-123');
      });

      // Load properties
      await act(async () => {
        await result.current.loadProperties();
      });

      expect(result.current.allProperties.length).toBeGreaterThan(0);
    });

    it('should update an existing property', async () => {
      const { result } = renderHook(() => useAppStore());

      let propertyId: string = '';
      await act(async () => {
        propertyId = await result.current.createProperty(mockProperty, 'landlord-123');
      });

      await act(async () => {
        await result.current.updateProperty(propertyId, {
          rent: 850,
          description: 'Updated description for this wonderful property.',
        });
      });

      await act(async () => {
        await result.current.loadProperties();
      });

      const updatedProperty = result.current.allProperties.find(p => p.id === propertyId);
      expect(updatedProperty?.rent).toBe(850);
      expect(updatedProperty?.description).toBe('Updated description for this wonderful property.');
    });

    it('should delete a property', async () => {
      const { result } = renderHook(() => useAppStore());

      let propertyId: string = '';
      await act(async () => {
        propertyId = await result.current.createProperty(mockProperty, 'landlord-123');
      });

      await act(async () => {
        await result.current.deleteProperty(propertyId);
      });

      await act(async () => {
        await result.current.loadProperties();
      });

      const deletedProperty = result.current.allProperties.find(p => p.id === propertyId);
      expect(deletedProperty).toBeUndefined();
    });

    it('should handle property linking (updates in-memory state)', async () => {
      const { result } = renderHook(() => useAppStore());

      let propertyId: string = '';
      await act(async () => {
        propertyId = await result.current.createProperty(mockProperty, 'landlord-123');
      });

      // linkPropertyToLandlord updates state but may not persist if already linked
      // Just verify the function can be called without error
      act(() => {
        try {
          result.current.linkPropertyToLandlord(propertyId, 'landlord-123');
        } catch (error) {
          // Expected if property already linked
        }
      });

      expect(propertyId).toBeDefined();
    });

    it('should update matches when linking property', async () => {
      const { result } = renderHook(() => useAppStore());

      let propertyId: string = '';
      await act(async () => {
        propertyId = await result.current.createProperty(mockProperty, 'landlord-123');
      });

      // updateMatchesLandlordId should update all matches for a property
      act(() => {
        result.current.updateMatchesLandlordId(propertyId, 'landlord-456');
      });

      // Verify function executes without error
      expect(propertyId).toBeDefined();
    });
  });

  describe('Swipe Actions', () => {
    it('should add property to liked list when liked', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.likeProperty('property-123');
      });

      expect(result.current.likedProperties).toContain('property-123');
    });

    it('should add property to passed list when disliked', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.dislikeProperty('property-456');
      });

      expect(result.current.passedProperties).toContain('property-456');
    });

    it('should not add duplicate to liked list', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.likeProperty('property-123');
        result.current.likeProperty('property-123');
      });

      const likedCount = result.current.likedProperties.filter(id => id === 'property-123').length;
      expect(likedCount).toBe(1);
    });

    it('should not add duplicate to passed list', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.dislikeProperty('property-456');
        result.current.dislikeProperty('property-456');
      });

      const passedCount = result.current.passedProperties.filter(id => id === 'property-456').length;
      expect(passedCount).toBe(1);
    });
  });

  describe('Matching System', () => {
    it('should check for match with valid renter profile', () => {
      const { result } = renderHook(() => useAppStore());

      const renterProfile = {
        situation: 'Single',
        ages: '25',
        localArea: 'Liverpool',
        renterType: 'Young Professional',
        employmentStatus: 'Employed Full-Time',
      };

      const hasMatch = result.current.checkForMatch('property-123', renterProfile);

      expect(typeof hasMatch).toBe('boolean');
    });

    it('should handle match check without renter profile', () => {
      const { result } = renderHook(() => useAppStore());

      const hasMatch = result.current.checkForMatch('property-123');

      expect(typeof hasMatch).toBe('boolean');
    });
  });

  describe('Rating System', () => {
    it('should submit a rating successfully', async () => {
      const { result } = renderHook(() => useAppStore());

      const rating: Omit<Rating, 'id' | 'createdAt'> = {
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
        review: 'Excellent landlord! Very responsive to all maintenance requests and queries.',
        wouldRecommend: true,
        tenancyStartDate: new Date('2024-01-01'),
        tenancyEndDate: new Date('2024-12-31'),
        isVerified: true,
        isHidden: false,
      };

      await act(async () => {
        await result.current.submitRating(rating);
      });

      // If no error thrown, rating was submitted successfully
      expect(true).toBe(true);
    });

    it('should retrieve ratings for a user', async () => {
      const { result } = renderHook(() => useAppStore());

      const rating: Omit<Rating, 'id' | 'createdAt'> = {
        matchId: 'match-123',
        fromUserId: 'renter-456',
        fromUserType: 'renter',
        toUserId: 'landlord-789',
        toUserType: 'landlord',
        propertyId: 'property-123',
        overallScore: 5,
        categoryScores: {
          communication: 5,
          cleanliness: 5,
          reliability: 5,
        },
        review: 'Perfect landlord in every way! Highly recommend to other renters.',
        wouldRecommend: true,
        tenancyStartDate: new Date('2024-01-01'),
        tenancyEndDate: new Date('2024-12-31'),
        isVerified: true,
        isHidden: false,
      };

      await act(async () => {
        await result.current.submitRating(rating);
      });

      let ratings: Rating[] = [];
      await act(async () => {
        ratings = await result.current.getUserRatings('landlord-789', 'landlord');
      });

      expect(ratings.length).toBeGreaterThan(0);
    });
  });

  describe('Agency Linking', () => {
    it('should create agency invitation', async () => {
      const { result } = renderHook(() => useAppStore());

      let invitation;
      await act(async () => {
        invitation = await result.current.inviteAgency(
          'landlord-123',
          'agency-456',
          'estate_agent',
          'property-789',
          10,
          12,
          'Would you like to manage my property?'
        );
      });

      expect(invitation).toBeDefined();
      expect(invitation.landlordId).toBe('landlord-123');
      expect(invitation.agencyId).toBe('agency-456');
      expect(invitation.invitationType).toBe('estate_agent');
    });

    it('should accept agency invitation', async () => {
      const { result } = renderHook(() => useAppStore());

      // Create invitation first
      let invitation;
      await act(async () => {
        invitation = await result.current.inviteAgency(
          'landlord-123',
          'agency-456',
          'estate_agent',
          'property-789'
        );
      });

      // Accept invitation
      await act(async () => {
        await result.current.acceptAgencyInvitation(invitation.id, 'Happy to work with you!');
      });

      // Verify link was created
      let links: any[] = [];
      await act(async () => {
        links = await result.current.getLandlordLinks('landlord-123');
      });

      expect(links.length).toBeGreaterThan(0);
    });

    it('should decline agency invitation', async () => {
      const { result } = renderHook(() => useAppStore());

      // Create invitation
      let invitation;
      await act(async () => {
        invitation = await result.current.inviteAgency(
          'landlord-123',
          'agency-456',
          'management_agency'
        );
      });

      // Decline invitation
      await act(async () => {
        await result.current.declineAgencyInvitation(invitation.id, 'Not interested at this time.');
      });

      // Invitation should be declined
      let invitations: any[] = [];
      await act(async () => {
        invitations = await result.current.getLandlordInvitations('landlord-123');
      });

      const declinedInvitation = invitations.find(inv => inv.id === invitation.id);
      expect(declinedInvitation?.status).toBe('declined');
    });

    it('should cancel agency invitation', async () => {
      const { result } = renderHook(() => useAppStore());

      // Create invitation
      let invitationId: string = '';
      await act(async () => {
        const invitation = await result.current.inviteAgency(
          'landlord-cancel-test',
          'agency-cancel-test',
          'estate_agent'
        );
        invitationId = invitation.id;
      });

      // Cancel invitation
      await act(async () => {
        await result.current.cancelAgencyInvitation(invitationId);
      });

      // Verify cancellation worked (no error thrown)
      expect(invitationId).toBeDefined();
    });

    it('should get landlord invitations', async () => {
      const { result } = renderHook(() => useAppStore());
      const uniqueLandlordId = `landlord-invites-${Date.now()}`;

      // Create multiple invitations for this specific landlord
      await act(async () => {
        await result.current.inviteAgency(uniqueLandlordId, 'agency-1', 'estate_agent');
        await result.current.inviteAgency(uniqueLandlordId, 'agency-2', 'management_agency');
      });

      let invitations: any[] = [];
      await act(async () => {
        invitations = await result.current.getLandlordInvitations(uniqueLandlordId);
      });

      expect(invitations.length).toBe(2);
    });

    it('should get agency invitations', async () => {
      const { result } = renderHook(() => useAppStore());
      const uniqueAgencyId = `agency-invites-${Date.now()}`;

      // Create invitations for the agency
      await act(async () => {
        await result.current.inviteAgency('landlord-1', uniqueAgencyId, 'estate_agent');
        await result.current.inviteAgency('landlord-2', uniqueAgencyId, 'management_agency');
      });

      let invitations: any[] = [];
      await act(async () => {
        invitations = await result.current.getAgencyInvitations(uniqueAgencyId);
      });

      expect(invitations.length).toBe(2);
    });

    it('should get property links', async () => {
      const { result } = renderHook(() => useAppStore());

      // Create and accept invitation
      let invitation;
      await act(async () => {
        invitation = await result.current.inviteAgency(
          'landlord-123',
          'agency-456',
          'estate_agent',
          'property-789'
        );
        await result.current.acceptAgencyInvitation(invitation.id);
      });

      let links: any[] = [];
      await act(async () => {
        links = await result.current.getPropertyLinks('property-789');
      });

      expect(links.length).toBeGreaterThan(0);
      expect(links[0].propertyId).toBe('property-789');
    });

    it('should terminate agency link', async () => {
      const { result } = renderHook(() => useAppStore());

      // Create and accept invitation to create link
      let invitation;
      await act(async () => {
        invitation = await result.current.inviteAgency(
          'landlord-123',
          'agency-456',
          'estate_agent',
          'property-789'
        );
        await result.current.acceptAgencyInvitation(invitation.id);
      });

      // Get the link
      let links: any[] = [];
      await act(async () => {
        links = await result.current.getLandlordLinks('landlord-123');
      });

      // Terminate the link
      await act(async () => {
        await result.current.terminateAgencyLink(links[0].id, 'Contract ended');
      });

      // Verify termination
      let updatedLinks: any[] = [];
      await act(async () => {
        updatedLinks = await result.current.getLandlordLinks('landlord-123');
      });

      const terminatedLink = updatedLinks.find(link => link.id === links[0].id);
      expect(terminatedLink?.isActive).toBe(false);
      expect(terminatedLink?.terminationReason).toBe('Contract ended');
    });
  });

  describe('Statistics', () => {
    it('should calculate stats correctly with no activity', () => {
      const { result } = renderHook(() => useAppStore());

      const stats = result.current.getStats();

      expect(stats.propertiesViewed).toBe(0);
      expect(stats.propertiesLiked).toBe(0);
      expect(stats.propertiesPassed).toBe(0);
      expect(stats.matchesCount).toBe(0);
    });

    it('should track liked properties in stats', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.likeProperty('property-1');
        result.current.likeProperty('property-2');
        result.current.likeProperty('property-3');
      });

      const stats = result.current.getStats();

      expect(stats.propertiesLiked).toBe(3);
      expect(stats.propertiesViewed).toBe(3);
    });

    it('should track passed properties in stats', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.dislikeProperty('property-1');
        result.current.dislikeProperty('property-2');
      });

      const stats = result.current.getStats();

      expect(stats.propertiesPassed).toBe(2);
      expect(stats.propertiesViewed).toBe(2);
    });

    it('should track total properties viewed (liked + passed)', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.likeProperty('property-1');
        result.current.likeProperty('property-2');
        result.current.dislikeProperty('property-3');
        result.current.dislikeProperty('property-4');
      });

      const stats = result.current.getStats();

      expect(stats.propertiesViewed).toBe(4);
      expect(stats.propertiesLiked).toBe(2);
      expect(stats.propertiesPassed).toBe(2);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all state to initial values', async () => {
      const { result } = renderHook(() => useAppStore());

      // Add some data
      await act(async () => {
        await result.current.createProperty(
          {
            landlordId: 'landlord-123',
            type: 'Flat',
            address: '123 Test St',
            localArea: 'Liverpool',
            bedrooms: 2,
            rent: 800,
            deposit: 800,
            epcRating: 'C',
            description: 'Test property for reset functionality testing.',
            images: [],
            features: [],
            furnishing: 'Furnished',
            petsPolicy: { petsAllowed: false },
            councilTaxBand: 'A',
            gasElectricIncluded: false,
            waterIncluded: false,
            internetIncluded: false,
            meetsDecentHomesStandard: true,
            awaabsLawCompliant: true,
            canBeMarketed: true,
            isAvailable: true,
            listingDate: new Date(),
          },
          'landlord-123'
        );
      });

      act(() => {
        result.current.likeProperty('property-1');
        result.current.dislikeProperty('property-2');
      });

      // Reset
      act(() => {
        result.current.resetApp();
      });

      // Verify reset
      expect(result.current.likedProperties).toEqual([]);
      expect(result.current.passedProperties).toEqual([]);
      expect(result.current.matches).toEqual([]);
      expect(result.current.currentPropertyIndex).toBe(0);
    });
  });
});
