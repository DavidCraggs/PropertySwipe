/**
 * useAuthStore Tests
 * CRITICAL: Authentication state management and session handling
 *
 * Tests cover:
 * - Login with password flow
 * - User authentication state
 * - Profile creation and updates
 * - Session persistence
 * - Logout functionality
 * - Role detection helpers
 * - Onboarding state management
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useAuthStore,
  isUserAuthenticated,
  getCurrentUserType,
  isOnboardingComplete,
  isRenter,
  isLandlord,
  isAgency,
  isEstateAgent,
  isManagementAgency,
  isProspectiveRenter,
  isCurrentRenter,
  isFormerRenter,
  getRenterStatus,
  getAgencyProfile,
} from '../../../src/hooks/useAuthStore';
import { hashPassword } from '../../../src/utils/validation';
import type { LandlordProfile, RenterProfile, AgencyProfile } from '../../../src/types';
import { setupStorageMocks, clearAllStorage } from '../../__mocks__/localStorage';

// Mock the storage module to prevent real Supabase calls
vi.mock('../../../src/lib/storage', () => ({
  saveLandlordProfile: vi.fn(async (profile: LandlordProfile) => {
    // Simulate Supabase UUID generation - replace temp IDs with real UUIDs
    const isValidUUID = profile.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profile.id);
    const savedProfile = {
      ...profile,
      id: isValidUUID ? profile.id : crypto.randomUUID(),
    };

    // Save to localStorage for testing
    const key = 'get-on-landlord-profiles';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const index = existing.findIndex((p: LandlordProfile) => p.id === savedProfile.id);

    if (index >= 0) {
      existing[index] = savedProfile;
    } else {
      existing.push(savedProfile);
    }

    localStorage.setItem(key, JSON.stringify(existing));
    return savedProfile;
  }),

  saveRenterProfile: vi.fn(async (profile: RenterProfile) => {
    const isValidUUID = profile.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profile.id);
    const savedProfile = {
      ...profile,
      id: isValidUUID ? profile.id : crypto.randomUUID(),
    };

    const key = 'get-on-renter-profiles';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const index = existing.findIndex((p: RenterProfile) => p.id === savedProfile.id);

    if (index >= 0) {
      existing[index] = savedProfile;
    } else {
      existing.push(savedProfile);
    }

    localStorage.setItem(key, JSON.stringify(existing));
    return savedProfile;
  }),

  saveAgencyProfile: vi.fn(async (profile: AgencyProfile) => {
    const isValidUUID = profile.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profile.id);
    const savedProfile = {
      ...profile,
      id: isValidUUID ? profile.id : crypto.randomUUID(),
    };

    const key = 'get-on-agency-profiles';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const index = existing.findIndex((p: AgencyProfile) => p.id === savedProfile.id);

    if (index >= 0) {
      existing[index] = savedProfile;
    } else {
      existing.push(savedProfile);
    }

    localStorage.setItem(key, JSON.stringify(existing));
    return savedProfile;
  }),
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    setupStorageMocks();
    // Reset Zustand store state
    useAuthStore.setState({
      isAuthenticated: false,
      userType: null,
      currentUser: null,
      onboardingStep: 0,
    });
  });

  afterEach(() => {
    clearAllStorage();
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state when not authenticated', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.userType).toBeNull();
      expect(result.current.currentUser).toBeNull();
      expect(result.current.onboardingStep).toBe(0);
    });

    it('should provide all required actions', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(typeof result.current.login).toBe('function');
      expect(typeof result.current.loginWithPassword).toBe('function');
      expect(typeof result.current.logout).toBe('function');
      expect(typeof result.current.updateProfile).toBe('function');
      expect(typeof result.current.setOnboardingStep).toBe('function');
      expect(typeof result.current.completeOnboarding).toBe('function');
      expect(typeof result.current.getSessionData).toBe('function');
    });
  });

  describe('Login Action', () => {
    it('should login landlord and set authenticated state', async () => {
      const { result } = renderHook(() => useAuthStore());

      const landlordProfile: LandlordProfile = {
        id: 'temp-id',
        email: 'landlord@test.com',
        passwordHash: await hashPassword('Test123!'),
        names: 'John Landlord',
        propertyType: ['house'],
        furnishingPreference: 'furnished',
        preferredTenantTypes: ['professional'],
        defaultPetsPolicy: 'no',
        prsRegistrationNumber: 'PRS12345',
        prsRegistrationStatus: 'active',
        prsRegistrationDate: '2024-01-01',
        prsRegistrationExpiryDate: '2027-01-01',
        ombudsmanScheme: 'PRS',
        ombudsmanMembershipNumber: 'OMB12345',
        depositScheme: 'MyDeposits',
        estateAgentLink: null,
        propertyId: null,
        onboardingComplete: true,
      };

      await act(async () => {
        await result.current.login('landlord', landlordProfile);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.userType).toBe('landlord');
      expect(result.current.currentUser).toBeDefined();
      expect(result.current.currentUser?.email).toBe('landlord@test.com');
      // UUID should be generated by storage layer
      expect(result.current.currentUser?.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should login renter and set authenticated state', async () => {
      const { result } = renderHook(() => useAuthStore());

      const renterProfile: RenterProfile = {
        id: 'temp-id',
        email: 'renter@test.com',
        passwordHash: await hashPassword('Test123!'),
        names: 'Jane Renter',
        status: 'prospective',
        situation: 'employed',
        employmentStatus: 'full-time',
        preferredPropertyTypes: ['flat'],
        preferredFurnishing: 'furnished',
        maxRent: 1500,
        moveInDate: '2024-03-01',
        hasPets: false,
        petDetails: null,
        hasGuarantor: false,
        guarantorDetails: null,
        onboardingComplete: true,
      };

      await act(async () => {
        await result.current.login('renter', renterProfile);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.userType).toBe('renter');
      expect(result.current.currentUser?.email).toBe('renter@test.com');
      expect(result.current.currentUser?.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should login estate agent and set authenticated state', async () => {
      const { result } = renderHook(() => useAuthStore());

      const agencyProfile: AgencyProfile = {
        id: 'temp-id',
        email: 'agent@test.com',
        passwordHash: await hashPassword('Test123!'),
        names: 'Estate Agency Ltd',
        agencyType: 'estate_agent',
        companyRegistrationNumber: 'REG123456',
        address: '123 High Street, London',
        phoneNumber: '020 1234 5678',
        website: 'https://agency.com',
        servicesOffered: ['property_management', 'lettings'],
        defaultCommissionRate: 10,
        prsRegistrationNumber: 'PRS-AGENCY-123',
        ombudsmanScheme: 'TPO',
        clientMoneyProtection: 'CMP Scheme',
        onboardingComplete: true,
      };

      await act(async () => {
        await result.current.login('estate_agent', agencyProfile);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.userType).toBe('estate_agent');
      expect(result.current.currentUser?.email).toBe('agent@test.com');
    });

    it('should set onboarding step to 1 for incomplete profiles', async () => {
      const { result } = renderHook(() => useAuthStore());

      const incompleteProfile: LandlordProfile = {
        id: 'temp-id',
        email: 'incomplete@test.com',
        passwordHash: await hashPassword('Test123!'),
        names: 'Incomplete User',
        propertyType: [],
        furnishingPreference: 'unfurnished',
        preferredTenantTypes: [],
        defaultPetsPolicy: 'no',
        prsRegistrationNumber: null,
        prsRegistrationStatus: 'not_registered',
        prsRegistrationDate: null,
        prsRegistrationExpiryDate: null,
        ombudsmanScheme: null,
        ombudsmanMembershipNumber: null,
        depositScheme: null,
        estateAgentLink: null,
        propertyId: null,
        onboardingComplete: false,
      };

      await act(async () => {
        await result.current.login('landlord', incompleteProfile);
      });

      expect(result.current.onboardingStep).toBe(1);
    });

    it('should set onboarding step to 0 for complete profiles', async () => {
      const { result } = renderHook(() => useAuthStore());

      const completeProfile: RenterProfile = {
        id: 'temp-id',
        email: 'complete@test.com',
        passwordHash: await hashPassword('Test123!'),
        names: 'Complete User',
        status: 'prospective',
        situation: 'employed',
        employmentStatus: 'full-time',
        preferredPropertyTypes: ['flat'],
        preferredFurnishing: 'furnished',
        maxRent: 1500,
        moveInDate: '2024-03-01',
        hasPets: false,
        petDetails: null,
        hasGuarantor: false,
        guarantorDetails: null,
        onboardingComplete: true,
      };

      await act(async () => {
        await result.current.login('renter', completeProfile);
      });

      expect(result.current.onboardingStep).toBe(0);
    });
  });

  describe('Login with Password', () => {
    beforeEach(async () => {
      // Create test users with hashed passwords
      const landlordHash = await hashPassword('Landlord123!');
      const renterHash = await hashPassword('Renter123!');
      const agencyHash = await hashPassword('Agency123!');

      const landlordProfiles: LandlordProfile[] = [{
        id: crypto.randomUUID(),
        email: 'landlord@test.com',
        passwordHash: landlordHash,
        names: 'John Landlord',
        propertyType: ['house'],
        furnishingPreference: 'furnished',
        preferredTenantTypes: ['professional'],
        defaultPetsPolicy: 'no',
        prsRegistrationNumber: 'PRS12345',
        prsRegistrationStatus: 'active',
        prsRegistrationDate: '2024-01-01',
        prsRegistrationExpiryDate: '2027-01-01',
        ombudsmanScheme: 'PRS',
        ombudsmanMembershipNumber: 'OMB12345',
        depositScheme: 'MyDeposits',
        estateAgentLink: null,
        propertyId: null,
        onboardingComplete: true,
      }];

      const renterProfiles: RenterProfile[] = [{
        id: crypto.randomUUID(),
        email: 'renter@test.com',
        passwordHash: renterHash,
        names: 'Jane Renter',
        status: 'prospective',
        situation: 'employed',
        employmentStatus: 'full-time',
        preferredPropertyTypes: ['flat'],
        preferredFurnishing: 'furnished',
        maxRent: 1500,
        moveInDate: '2024-03-01',
        hasPets: false,
        petDetails: null,
        hasGuarantor: false,
        guarantorDetails: null,
        onboardingComplete: true,
      }];

      const agencyProfiles: AgencyProfile[] = [{
        id: crypto.randomUUID(),
        email: 'agency@test.com',
        passwordHash: agencyHash,
        names: 'Estate Agency Ltd',
        agencyType: 'estate_agent',
        companyRegistrationNumber: 'REG123456',
        address: '123 High Street, London',
        phoneNumber: '020 1234 5678',
        website: 'https://agency.com',
        servicesOffered: ['property_management'],
        defaultCommissionRate: 10,
        prsRegistrationNumber: 'PRS-AGENCY-123',
        ombudsmanScheme: 'TPO',
        clientMoneyProtection: 'CMP Scheme',
        onboardingComplete: true,
      }];

      localStorage.setItem('get-on-landlord-profiles', JSON.stringify(landlordProfiles));
      localStorage.setItem('get-on-renter-profiles', JSON.stringify(renterProfiles));
      localStorage.setItem('get-on-agency-profiles', JSON.stringify(agencyProfiles));
    });

    it('should successfully login landlord with correct password', async () => {
      const { result } = renderHook(() => useAuthStore());

      let loginSuccess = false;
      await act(async () => {
        loginSuccess = await result.current.loginWithPassword('landlord@test.com', 'Landlord123!');
      });

      expect(loginSuccess).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.userType).toBe('landlord');
      expect(result.current.currentUser?.email).toBe('landlord@test.com');
    });

    it('should successfully login renter with correct password', async () => {
      const { result } = renderHook(() => useAuthStore());

      let loginSuccess = false;
      await act(async () => {
        loginSuccess = await result.current.loginWithPassword('renter@test.com', 'Renter123!');
      });

      expect(loginSuccess).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.userType).toBe('renter');
    });

    it('should successfully login agency with correct password', async () => {
      const { result } = renderHook(() => useAuthStore());

      let loginSuccess = false;
      await act(async () => {
        loginSuccess = await result.current.loginWithPassword('agency@test.com', 'Agency123!');
      });

      expect(loginSuccess).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.userType).toBe('estate_agent');
    });

    it('should reject login with incorrect password', async () => {
      const { result } = renderHook(() => useAuthStore());

      let loginSuccess = true;
      await act(async () => {
        loginSuccess = await result.current.loginWithPassword('landlord@test.com', 'WrongPassword123!');
      });

      expect(loginSuccess).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.currentUser).toBeNull();
    });

    it('should reject login with non-existent email', async () => {
      const { result } = renderHook(() => useAuthStore());

      let loginSuccess = true;
      await act(async () => {
        loginSuccess = await result.current.loginWithPassword('nonexistent@test.com', 'Password123!');
      });

      expect(loginSuccess).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle email case-insensitively', async () => {
      const { result } = renderHook(() => useAuthStore());

      let loginSuccess = false;
      await act(async () => {
        loginSuccess = await result.current.loginWithPassword('LANDLORD@TEST.COM', 'Landlord123!');
      });

      expect(loginSuccess).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should be case-sensitive for passwords', async () => {
      const { result } = renderHook(() => useAuthStore());

      let loginSuccess = true;
      await act(async () => {
        loginSuccess = await result.current.loginWithPassword('landlord@test.com', 'landlord123!');
      });

      expect(loginSuccess).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Logout Action', () => {
    it('should clear all authentication state on logout', async () => {
      const { result } = renderHook(() => useAuthStore());

      // First login
      const landlordProfile: LandlordProfile = {
        id: crypto.randomUUID(),
        email: 'landlord@test.com',
        passwordHash: await hashPassword('Test123!'),
        names: 'John Landlord',
        propertyType: ['house'],
        furnishingPreference: 'furnished',
        preferredTenantTypes: ['professional'],
        defaultPetsPolicy: 'no',
        prsRegistrationNumber: 'PRS12345',
        prsRegistrationStatus: 'active',
        prsRegistrationDate: '2024-01-01',
        prsRegistrationExpiryDate: '2027-01-01',
        ombudsmanScheme: 'PRS',
        ombudsmanMembershipNumber: 'OMB12345',
        depositScheme: 'MyDeposits',
        estateAgentLink: null,
        propertyId: null,
        onboardingComplete: true,
      };

      await act(async () => {
        await result.current.login('landlord', landlordProfile);
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Then logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.userType).toBeNull();
      expect(result.current.currentUser).toBeNull();
      expect(result.current.onboardingStep).toBe(0);
    });

    it('should allow re-login after logout', async () => {
      const { result } = renderHook(() => useAuthStore());

      const landlordProfile: LandlordProfile = {
        id: crypto.randomUUID(),
        email: 'landlord@test.com',
        passwordHash: await hashPassword('Test123!'),
        names: 'John Landlord',
        propertyType: ['house'],
        furnishingPreference: 'furnished',
        preferredTenantTypes: ['professional'],
        defaultPetsPolicy: 'no',
        prsRegistrationNumber: 'PRS12345',
        prsRegistrationStatus: 'active',
        prsRegistrationDate: '2024-01-01',
        prsRegistrationExpiryDate: '2027-01-01',
        ombudsmanScheme: 'PRS',
        ombudsmanMembershipNumber: 'OMB12345',
        depositScheme: 'MyDeposits',
        estateAgentLink: null,
        propertyId: null,
        onboardingComplete: true,
      };

      // Login
      await act(async () => {
        await result.current.login('landlord', landlordProfile);
      });

      // Logout
      act(() => {
        result.current.logout();
      });

      // Login again
      await act(async () => {
        await result.current.login('landlord', landlordProfile);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.userType).toBe('landlord');
    });
  });

  describe('Update Profile', () => {
    it('should update landlord profile', async () => {
      const { result } = renderHook(() => useAuthStore());

      const landlordProfile: LandlordProfile = {
        id: crypto.randomUUID(),
        email: 'landlord@test.com',
        passwordHash: await hashPassword('Test123!'),
        names: 'John Landlord',
        propertyType: ['house'],
        furnishingPreference: 'furnished',
        preferredTenantTypes: ['professional'],
        defaultPetsPolicy: 'no',
        prsRegistrationNumber: 'PRS12345',
        prsRegistrationStatus: 'active',
        prsRegistrationDate: '2024-01-01',
        prsRegistrationExpiryDate: '2027-01-01',
        ombudsmanScheme: 'PRS',
        ombudsmanMembershipNumber: 'OMB12345',
        depositScheme: 'MyDeposits',
        estateAgentLink: null,
        propertyId: null,
        onboardingComplete: false,
      };

      await act(async () => {
        await result.current.login('landlord', landlordProfile);
      });

      // Update profile
      await act(async () => {
        await result.current.updateProfile({ names: 'John Updated Landlord', onboardingComplete: true });
      });

      expect(result.current.currentUser?.names).toBe('John Updated Landlord');
      expect(result.current.currentUser?.onboardingComplete).toBe(true);
    });

    it('should not update if user is not logged in', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.updateProfile({ names: 'Should Not Update' });
      });

      expect(result.current.currentUser).toBeNull();
    });
  });

  describe('Onboarding Management', () => {
    it('should set onboarding step', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setOnboardingStep(3);
      });

      expect(result.current.onboardingStep).toBe(3);
    });

    it('should complete onboarding and update profile', async () => {
      const { result } = renderHook(() => useAuthStore());

      const incompleteProfile: LandlordProfile = {
        id: crypto.randomUUID(),
        email: 'incomplete@test.com',
        passwordHash: await hashPassword('Test123!'),
        names: 'Incomplete User',
        propertyType: ['house'],
        furnishingPreference: 'furnished',
        preferredTenantTypes: ['professional'],
        defaultPetsPolicy: 'no',
        prsRegistrationNumber: null,
        prsRegistrationStatus: 'not_registered',
        prsRegistrationDate: null,
        prsRegistrationExpiryDate: null,
        ombudsmanScheme: null,
        ombudsmanMembershipNumber: null,
        depositScheme: null,
        estateAgentLink: null,
        propertyId: null,
        onboardingComplete: false,
      };

      await act(async () => {
        await result.current.login('landlord', incompleteProfile);
        result.current.setOnboardingStep(5);
      });

      expect(result.current.onboardingStep).toBe(5);

      act(() => {
        result.current.completeOnboarding();
      });

      expect(result.current.currentUser?.onboardingComplete).toBe(true);
      expect(result.current.onboardingStep).toBe(0);
    });
  });

  describe('Session Data', () => {
    it('should return current session data', async () => {
      const { result } = renderHook(() => useAuthStore());

      const landlordProfile: LandlordProfile = {
        id: crypto.randomUUID(),
        email: 'landlord@test.com',
        passwordHash: await hashPassword('Test123!'),
        names: 'John Landlord',
        propertyType: ['house'],
        furnishingPreference: 'furnished',
        preferredTenantTypes: ['professional'],
        defaultPetsPolicy: 'no',
        prsRegistrationNumber: 'PRS12345',
        prsRegistrationStatus: 'active',
        prsRegistrationDate: '2024-01-01',
        prsRegistrationExpiryDate: '2027-01-01',
        ombudsmanScheme: 'PRS',
        ombudsmanMembershipNumber: 'OMB12345',
        depositScheme: 'MyDeposits',
        estateAgentLink: null,
        propertyId: null,
        onboardingComplete: true,
      };

      await act(async () => {
        await result.current.login('landlord', landlordProfile);
      });

      const sessionData = result.current.getSessionData();

      expect(sessionData.isAuthenticated).toBe(true);
      expect(sessionData.userType).toBe('landlord');
      expect(sessionData.currentUser).toBeDefined();
      expect(sessionData.onboardingStep).toBe(0);
    });
  });

  describe('Role Detection Helpers', () => {
    it('isUserAuthenticated should return true when logged in', async () => {
      const { result } = renderHook(() => useAuthStore());

      const landlordProfile: LandlordProfile = {
        id: crypto.randomUUID(),
        email: 'landlord@test.com',
        passwordHash: await hashPassword('Test123!'),
        names: 'John Landlord',
        propertyType: ['house'],
        furnishingPreference: 'furnished',
        preferredTenantTypes: ['professional'],
        defaultPetsPolicy: 'no',
        prsRegistrationNumber: 'PRS12345',
        prsRegistrationStatus: 'active',
        prsRegistrationDate: '2024-01-01',
        prsRegistrationExpiryDate: '2027-01-01',
        ombudsmanScheme: 'PRS',
        ombudsmanMembershipNumber: 'OMB12345',
        depositScheme: 'MyDeposits',
        estateAgentLink: null,
        propertyId: null,
        onboardingComplete: true,
      };

      await act(async () => {
        await result.current.login('landlord', landlordProfile);
      });

      expect(isUserAuthenticated()).toBe(true);
    });

    it('getCurrentUserType should return correct user type', async () => {
      const { result } = renderHook(() => useAuthStore());

      const renterProfile: RenterProfile = {
        id: crypto.randomUUID(),
        email: 'renter@test.com',
        passwordHash: await hashPassword('Test123!'),
        names: 'Jane Renter',
        status: 'prospective',
        situation: 'employed',
        employmentStatus: 'full-time',
        preferredPropertyTypes: ['flat'],
        preferredFurnishing: 'furnished',
        maxRent: 1500,
        moveInDate: '2024-03-01',
        hasPets: false,
        petDetails: null,
        hasGuarantor: false,
        guarantorDetails: null,
        onboardingComplete: true,
      };

      await act(async () => {
        await result.current.login('renter', renterProfile);
      });

      expect(getCurrentUserType()).toBe('renter');
    });

    it('isOnboardingComplete should return true for complete profiles', async () => {
      const { result } = renderHook(() => useAuthStore());

      const completeProfile: RenterProfile = {
        id: crypto.randomUUID(),
        email: 'complete@test.com',
        passwordHash: await hashPassword('Test123!'),
        names: 'Complete User',
        status: 'prospective',
        situation: 'employed',
        employmentStatus: 'full-time',
        preferredPropertyTypes: ['flat'],
        preferredFurnishing: 'furnished',
        maxRent: 1500,
        moveInDate: '2024-03-01',
        hasPets: false,
        petDetails: null,
        hasGuarantor: false,
        guarantorDetails: null,
        onboardingComplete: true,
      };

      await act(async () => {
        await result.current.login('renter', completeProfile);
      });

      expect(isOnboardingComplete()).toBe(true);
    });

    it('isLandlord should return true for landlord users', async () => {
      const { result } = renderHook(() => useAuthStore());

      const landlordProfile: LandlordProfile = {
        id: crypto.randomUUID(),
        email: 'landlord@test.com',
        passwordHash: await hashPassword('Test123!'),
        names: 'John Landlord',
        propertyType: ['house'],
        furnishingPreference: 'furnished',
        preferredTenantTypes: ['professional'],
        defaultPetsPolicy: 'no',
        prsRegistrationNumber: 'PRS12345',
        prsRegistrationStatus: 'active',
        prsRegistrationDate: '2024-01-01',
        prsRegistrationExpiryDate: '2027-01-01',
        ombudsmanScheme: 'PRS',
        ombudsmanMembershipNumber: 'OMB12345',
        depositScheme: 'MyDeposits',
        estateAgentLink: null,
        propertyId: null,
        onboardingComplete: true,
      };

      await act(async () => {
        await result.current.login('landlord', landlordProfile);
      });

      expect(isLandlord()).toBe(true);
      expect(isRenter()).toBe(false);
      expect(isAgency()).toBe(false);
    });

    it('isRenter should return true for renter users', async () => {
      const { result } = renderHook(() => useAuthStore());

      const renterProfile: RenterProfile = {
        id: crypto.randomUUID(),
        email: 'renter@test.com',
        passwordHash: await hashPassword('Test123!'),
        names: 'Jane Renter',
        status: 'prospective',
        situation: 'employed',
        employmentStatus: 'full-time',
        preferredPropertyTypes: ['flat'],
        preferredFurnishing: 'furnished',
        maxRent: 1500,
        moveInDate: '2024-03-01',
        hasPets: false,
        petDetails: null,
        hasGuarantor: false,
        guarantorDetails: null,
        onboardingComplete: true,
      };

      await act(async () => {
        await result.current.login('renter', renterProfile);
      });

      expect(isRenter()).toBe(true);
      expect(isLandlord()).toBe(false);
      expect(isAgency()).toBe(false);
    });

    it('isEstateAgent should return true for estate agent users', async () => {
      const { result } = renderHook(() => useAuthStore());

      const agencyProfile: AgencyProfile = {
        id: crypto.randomUUID(),
        email: 'agent@test.com',
        passwordHash: await hashPassword('Test123!'),
        names: 'Estate Agency Ltd',
        agencyType: 'estate_agent',
        companyRegistrationNumber: 'REG123456',
        address: '123 High Street, London',
        phoneNumber: '020 1234 5678',
        website: 'https://agency.com',
        servicesOffered: ['property_management'],
        defaultCommissionRate: 10,
        prsRegistrationNumber: 'PRS-AGENCY-123',
        ombudsmanScheme: 'TPO',
        clientMoneyProtection: 'CMP Scheme',
        onboardingComplete: true,
      };

      await act(async () => {
        await result.current.login('estate_agent', agencyProfile);
      });

      expect(isEstateAgent()).toBe(true);
      expect(isManagementAgency()).toBe(false);
      expect(isAgency()).toBe(true);
    });

    it('isManagementAgency should return true for management agency users', async () => {
      const { result } = renderHook(() => useAuthStore());

      const agencyProfile: AgencyProfile = {
        id: crypto.randomUUID(),
        email: 'management@test.com',
        passwordHash: await hashPassword('Test123!'),
        names: 'Management Agency Ltd',
        agencyType: 'management_agency',
        companyRegistrationNumber: 'REG123456',
        address: '123 High Street, London',
        phoneNumber: '020 1234 5678',
        website: 'https://management.com',
        servicesOffered: ['property_management'],
        defaultCommissionRate: 15,
        prsRegistrationNumber: 'PRS-MGMT-123',
        ombudsmanScheme: 'TPO',
        clientMoneyProtection: 'CMP Scheme',
        onboardingComplete: true,
      };

      await act(async () => {
        await result.current.login('management_agency', agencyProfile);
      });

      expect(isManagementAgency()).toBe(true);
      expect(isEstateAgent()).toBe(false);
      expect(isAgency()).toBe(true);
    });

    it('isProspectiveRenter should return true for prospective renters', async () => {
      const { result } = renderHook(() => useAuthStore());

      const prospectiveRenter: RenterProfile = {
        id: crypto.randomUUID(),
        email: 'prospective@test.com',
        passwordHash: await hashPassword('Test123!'),
        names: 'Prospective Renter',
        status: 'prospective',
        situation: 'employed',
        employmentStatus: 'full-time',
        preferredPropertyTypes: ['flat'],
        preferredFurnishing: 'furnished',
        maxRent: 1500,
        moveInDate: '2024-03-01',
        hasPets: false,
        petDetails: null,
        hasGuarantor: false,
        guarantorDetails: null,
        onboardingComplete: true,
      };

      await act(async () => {
        await result.current.login('renter', prospectiveRenter);
      });

      expect(isProspectiveRenter()).toBe(true);
      expect(isCurrentRenter()).toBe(false);
      expect(isFormerRenter()).toBe(false);
      expect(getRenterStatus()).toBe('prospective');
    });

    it('isCurrentRenter should return true for current renters', async () => {
      const { result } = renderHook(() => useAuthStore());

      const currentRenter: RenterProfile = {
        id: crypto.randomUUID(),
        email: 'current@test.com',
        passwordHash: await hashPassword('Test123!'),
        names: 'Current Renter',
        status: 'current',
        situation: 'employed',
        employmentStatus: 'full-time',
        preferredPropertyTypes: ['flat'],
        preferredFurnishing: 'furnished',
        maxRent: 1500,
        moveInDate: '2024-01-01',
        hasPets: false,
        petDetails: null,
        hasGuarantor: false,
        guarantorDetails: null,
        onboardingComplete: true,
      };

      await act(async () => {
        await result.current.login('renter', currentRenter);
      });

      expect(isCurrentRenter()).toBe(true);
      expect(isProspectiveRenter()).toBe(false);
      expect(getRenterStatus()).toBe('current');
    });

    it('getAgencyProfile should return agency profile for agency users', async () => {
      const { result } = renderHook(() => useAuthStore());

      const agencyProfile: AgencyProfile = {
        id: crypto.randomUUID(),
        email: 'agency@test.com',
        passwordHash: await hashPassword('Test123!'),
        names: 'Test Agency',
        agencyType: 'estate_agent',
        companyRegistrationNumber: 'REG123456',
        address: '123 High Street, London',
        phoneNumber: '020 1234 5678',
        website: 'https://agency.com',
        servicesOffered: ['property_management'],
        defaultCommissionRate: 10,
        prsRegistrationNumber: 'PRS-AGENCY-123',
        ombudsmanScheme: 'TPO',
        clientMoneyProtection: 'CMP Scheme',
        onboardingComplete: true,
      };

      await act(async () => {
        await result.current.login('estate_agent', agencyProfile);
      });

      const profile = getAgencyProfile();
      expect(profile).toBeDefined();
      expect(profile?.agencyType).toBe('estate_agent');
      expect(profile?.names).toBe('Test Agency');
    });

    it('getAgencyProfile should return null for non-agency users', async () => {
      const { result } = renderHook(() => useAuthStore());

      const landlordProfile: LandlordProfile = {
        id: crypto.randomUUID(),
        email: 'landlord@test.com',
        passwordHash: await hashPassword('Test123!'),
        names: 'John Landlord',
        propertyType: ['house'],
        furnishingPreference: 'furnished',
        preferredTenantTypes: ['professional'],
        defaultPetsPolicy: 'no',
        prsRegistrationNumber: 'PRS12345',
        prsRegistrationStatus: 'active',
        prsRegistrationDate: '2024-01-01',
        prsRegistrationExpiryDate: '2027-01-01',
        ombudsmanScheme: 'PRS',
        ombudsmanMembershipNumber: 'OMB12345',
        depositScheme: 'MyDeposits',
        estateAgentLink: null,
        propertyId: null,
        onboardingComplete: true,
      };

      await act(async () => {
        await result.current.login('landlord', landlordProfile);
      });

      expect(getAgencyProfile()).toBeNull();
    });
  });
});
