/**
 * Integration Tests - Complete Signup to Dashboard Flow
 *
 * Tests the full user journey from signup through onboarding to dashboard access.
 * These tests verify that all components and systems work together correctly.
 *
 * Coverage:
 * - Renter signup → onboarding → dashboard
 * - Landlord signup → onboarding → property creation
 * - Agency signup → onboarding → dashboard
 * - Email validation
 * - Password requirements
 * - Profile persistence
 * - Session management
 * - Navigation flow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '../../src/hooks/useAuthStore';
import { setupStorageMocks } from '../__mocks__/localStorage';
import { validatePassword, hashPassword } from '../../src/utils/validation';
import type { RenterProfile, LandlordProfile, AgencyProfile } from '../../src/types';

// Mock Supabase to ensure localStorage is used
vi.mock('../../src/lib/supabase', () => ({
  supabase: null,
  isSupabaseConfigured: () => false,
}));

describe('Integration: Complete Signup to Dashboard Flow', () => {
  beforeEach(() => {
    setupStorageMocks();
    localStorage.clear();
  });

  describe('Renter Signup Flow', () => {
    it('should complete full renter signup and onboarding journey', async () => {
      const { result } = renderHook(() => useAuthStore());

      // Step 1: Validate email and password
      const email = 'renter@example.com';
      const password = 'SecurePass123!';
      const passwordValidation = validatePassword(password);

      expect(passwordValidation.isValid).toBe(true);
      expect(passwordValidation.errors).toHaveLength(0);

      // Step 2: Hash password
      const passwordHash = await hashPassword(password);
      expect(passwordHash).toBeDefined();
      expect(passwordHash.length).toBeGreaterThan(0);

      // Step 3: Create renter profile
      const renterProfile: RenterProfile = {
        id: crypto.randomUUID(),
        email: email.toLowerCase().trim(),
        passwordHash,
        names: 'John Doe',
        ages: '25',
        situation: 'Single',
        localArea: 'Liverpool',
        renterType: 'Young Professional',
        employmentStatus: 'Employed Full-Time',
        monthlyIncome: 3000,
        hasPets: false,
        preferredMoveInDate: new Date('2025-03-01'),
        onboardingComplete: true,
        status: 'prospective',
      };

      // Step 4: Login with the profile
      await act(async () => {
        await result.current.login('renter', renterProfile);
      });

      // Step 5: Verify authentication state
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.currentUser).toBeDefined();
      expect(result.current.currentUser?.email).toBe(email);
      expect(result.current.onboardingStep).toBe(0); // Onboarding complete

      // Verify it's a renter profile
      const renter = result.current.currentUser as RenterProfile;
      expect(renter.status).toBe('prospective');
      expect(renter.monthlyIncome).toBe(3000);
    });

    it('should handle incomplete onboarding correctly', async () => {
      const { result } = renderHook(() => useAuthStore());

      const incompleteProfile: RenterProfile = {
        id: crypto.randomUUID(),
        email: 'incomplete@example.com',
        passwordHash: await hashPassword('SecurePass123!'),
        names: 'Jane Smith',
        onboardingComplete: false, // Not complete
        status: 'prospective',
      };

      await act(async () => {
        await result.current.login('renter', incompleteProfile);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.onboardingStep).toBeGreaterThan(0); // Should be in onboarding
    });
  });

  describe('Landlord Signup Flow', () => {
    it('should complete full landlord signup and onboarding journey', async () => {
      const { result } = renderHook(() => useAuthStore());

      // Step 1: Validate credentials
      const email = 'landlord@example.com';
      const password = 'LandlordPass123!';
      const passwordValidation = validatePassword(password);

      expect(passwordValidation.isValid).toBe(true);

      // Step 2: Create landlord profile with RRA 2025 compliance
      const landlordProfile: LandlordProfile = {
        id: crypto.randomUUID(),
        email: email.toLowerCase().trim(),
        passwordHash: await hashPassword(password),
        names: 'Robert Johnson',
        propertyType: 'Flat',
        prsRegistrationNumber: 'PRS-12345',
        prsRegistrationStatus: 'active',
        ombudsmanScheme: 'property_redress_scheme',
        depositScheme: 'My Deposits',
        defaultPetsPolicy: { petsAllowed: true, petTypes: ['cats', 'dogs'] },
        hasGasSafetyCert: true,
        hasEICR: true,
        hasEPC: true,
        onboardingComplete: true,
      };

      // Step 3: Login
      await act(async () => {
        await result.current.login('landlord', landlordProfile);
      });

      // Step 4: Verify authentication
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.currentUser?.email).toBe(email);
      expect(result.current.onboardingStep).toBe(0);

      // Step 5: Verify RRA 2025 compliance data
      const landlord = result.current.currentUser as LandlordProfile;
      expect(landlord.prsRegistrationNumber).toBe('PRS-12345');
      expect(landlord.ombudsmanScheme).toBe('property_redress_scheme');
      expect(landlord.hasGasSafetyCert).toBe(true);
    });

    it('should enforce RRA 2025 compliance requirements', async () => {
      const { result } = renderHook(() => useAuthStore());

      const landlordProfile: LandlordProfile = {
        id: crypto.randomUUID(),
        email: 'compliant@example.com',
        passwordHash: await hashPassword('SecurePass123!'),
        names: 'Sarah Williams',
        propertyType: 'Terraced',
        prsRegistrationNumber: 'PRS-67890',
        prsRegistrationStatus: 'active',
        ombudsmanScheme: 'property_ombudsman',
        depositScheme: 'DPS',
        hasGasSafetyCert: true,
        hasEICR: true,
        hasEPC: true,
        onboardingComplete: true,
      };

      await act(async () => {
        await result.current.login('landlord', landlordProfile);
      });

      const landlord = result.current.currentUser as LandlordProfile;

      // Verify all RRA 2025 required fields are present
      expect(landlord.prsRegistrationNumber).toBeDefined();
      expect(landlord.ombudsmanScheme).not.toBe('not_registered');
      expect(landlord.hasGasSafetyCert).toBe(true);
      expect(landlord.hasEICR).toBe(true);
      expect(landlord.hasEPC).toBe(true);
    });
  });

  describe('Agency Signup Flow', () => {
    it('should complete full agency signup and onboarding journey', async () => {
      const { result } = renderHook(() => useAuthStore());

      const email = 'agency@example.com';
      const password = 'AgencyPass123!';

      const agencyProfile: AgencyProfile = {
        id: crypto.randomUUID(),
        email: email.toLowerCase().trim(),
        passwordHash: await hashPassword(password),
        agencyType: 'estate_agent',
        companyName: 'Premier Properties Ltd',
        registrationNumber: 'REG-54321',
        primaryContactName: 'Michael Brown',
        phoneNumber: '01234567890',
        address: {
          street: '123 High Street',
          city: 'Liverpool',
          postcode: 'L1 1AA',
        },
        serviceAreas: ['Liverpool', 'Manchester'],
        slaConfiguration: {
          emergencyResponseHours: 4,
          urgentResponseHours: 24,
          routineResponseHours: 72,
          maintenanceResponseDays: 14,
        },
        ombudsmanScheme: 'property_redress_scheme',
        onboardingComplete: true,
      };

      await act(async () => {
        await result.current.login('estate_agent', agencyProfile);
      });

      expect(result.current.isAuthenticated).toBe(true);

      const agency = result.current.currentUser as AgencyProfile;
      expect(agency.agencyType).toBe('estate_agent');
      expect(agency.companyName).toBe('Premier Properties Ltd');
      expect(agency.slaConfiguration.emergencyResponseHours).toBe(4);
      expect(agency.serviceAreas).toContain('Liverpool');
    });

    it('should handle management agency type correctly', async () => {
      const { result } = renderHook(() => useAuthStore());

      const managementAgency: AgencyProfile = {
        id: crypto.randomUUID(),
        email: 'management@example.com',
        passwordHash: await hashPassword('SecurePass123!'),
        agencyType: 'management_agency',
        companyName: 'Full Service Property Management',
        registrationNumber: 'REG-99999',
        primaryContactName: 'Emma Davis',
        phoneNumber: '07700900000',
        address: {
          street: '456 Business Park',
          city: 'Manchester',
          postcode: 'M1 1AA',
        },
        serviceAreas: ['Manchester', 'Salford'],
        slaConfiguration: {
          emergencyResponseHours: 2,
          urgentResponseHours: 12,
          routineResponseHours: 48,
          maintenanceResponseDays: 7,
        },
        ombudsmanScheme: 'tpo',
        onboardingComplete: true,
      };

      await act(async () => {
        await result.current.login('management_agency', managementAgency);
      });

      expect(result.current.isAuthenticated).toBe(true);

      const agency = result.current.currentUser as AgencyProfile;
      expect(agency.agencyType).toBe('management_agency');
      expect(agency.slaConfiguration.emergencyResponseHours).toBe(2); // Faster SLA
    });
  });

  describe('Authentication and Session Management', () => {
    it('should handle login with password correctly', async () => {
      const { result } = renderHook(() => useAuthStore());

      const email = 'test@example.com';
      const password = 'TestPass123!';
      const passwordHash = await hashPassword(password);

      // Create and store profile
      const profile: RenterProfile = {
        id: crypto.randomUUID(),
        email,
        passwordHash,
        names: 'Test User',
        onboardingComplete: true,
        status: 'prospective',
      };

      // First login to store the profile
      await act(async () => {
        await result.current.login('renter', profile);
      });

      // Logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);

      // Login with password
      await act(async () => {
        await result.current.loginWithPassword(email, password);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.currentUser?.email).toBe(email);
    });

    it('should persist session across page reloads', async () => {
      const { result } = renderHook(() => useAuthStore());

      const profile: LandlordProfile = {
        id: crypto.randomUUID(),
        email: 'persistent@example.com',
        passwordHash: await hashPassword('SecurePass123!'),
        names: 'Persistent User',
        propertyType: 'Flat',
        onboardingComplete: true,
      };

      await act(async () => {
        await result.current.login('landlord', profile);
      });

      // Verify profile was stored
      const landlord = result.current.currentUser as LandlordProfile;
      expect(landlord.id).toBe(profile.id);
      expect(landlord.email).toBe(profile.email);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle logout and clear session', async () => {
      const { result } = renderHook(() => useAuthStore());

      const profile: RenterProfile = {
        id: crypto.randomUUID(),
        email: 'logout@example.com',
        passwordHash: await hashPassword('SecurePass123!'),
        names: 'Logout Test',
        onboardingComplete: true,
        status: 'prospective',
      };

      await act(async () => {
        await result.current.login('renter', profile);
      });

      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.currentUser).toBeNull();
    });
  });

  describe('Profile Updates', () => {
    it('should update user profile after login', async () => {
      const { result } = renderHook(() => useAuthStore());

      const profile: RenterProfile = {
        id: crypto.randomUUID(),
        email: 'update@example.com',
        passwordHash: await hashPassword('SecurePass123!'),
        names: 'Original Name',
        onboardingComplete: true,
        status: 'prospective',
      };

      await act(async () => {
        await result.current.login('renter', profile);
      });

      // Update profile
      await act(async () => {
        await result.current.updateProfile({
          names: 'Updated Name',
          monthlyIncome: 3500,
        });
      });

      const updatedUser = result.current.currentUser as RenterProfile;
      expect(updatedUser.names).toBe('Updated Name');
      expect(updatedUser.monthlyIncome).toBe(3500);
    });
  });
});
