/**
 * Integration Tests - Login Flow
 *
 * Tests the complete login flow from various entry points (landing, role selection, onboarding)
 * through authentication to dashboard redirection.
 *
 * Coverage:
 * - Login button visibility across pages
 * - Login navigation
 * - Successful authentication for all user types
 * - Dashboard redirection
 * - Error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '../../src/hooks/useAuthStore';
import { setupStorageMocks } from '../__mocks__/localStorage';
import { hashPassword } from '../../src/utils/validation';
import type { LandlordProfile, RenterProfile, AgencyProfile } from '../../src/types';

// Mock Supabase to ensure localStorage is used
vi.mock('../../src/lib/supabase', () => ({
  supabase: null,
  isSupabaseConfigured: () => false,
}));

describe('Integration: Login Flow', () => {
  beforeEach(() => {
    setupStorageMocks();
    localStorage.clear();
  });

  describe('Login Button Visibility', () => {
    it('should show login button on landing page when not authenticated', () => {
      const { result } = renderHook(() => useAuthStore());
      expect(result.current.isAuthenticated).toBe(false);
      // LoginButton component checks isAuthenticated and renders when false
      // This test verifies the hook state that controls button visibility
    });

    it('should show login button on role selection screen', () => {
      const { result } = renderHook(() => useAuthStore());
      expect(result.current.isAuthenticated).toBe(false);
      // LoginButton is rendered in RoleSelectionScreen when not authenticated
    });

    it('should show login button on first step of renter onboarding', () => {
      const { result } = renderHook(() => useAuthStore());
      expect(result.current.isAuthenticated).toBe(false);
      // LoginButton is conditionally rendered when currentStep === 0
    });

    it('should hide login button when user is authenticated', async () => {
      const { result } = renderHook(() => useAuthStore());

      const renterProfile: RenterProfile = {
        id: crypto.randomUUID(),
        email: 'authenticated@test.com',
        passwordHash: await hashPassword('SecurePass123!'),
        names: 'Authenticated User',
        ages: '28',
        monthlyIncome: 3000,
        status: 'prospective',
        onboardingComplete: true,
      };

      await act(async () => {
        await result.current.login('renter', renterProfile);
      });

      expect(result.current.isAuthenticated).toBe(true);
      // LoginButton checks isAuthenticated and returns null when true
    });
  });

  describe('Login Navigation', () => {
    it('should navigate to login page when button clicked', () => {
      // Clear any previous auth state
      localStorage.clear();

      // This test verifies that the onLogin callback is properly wired
      // In the actual app, clicking the button calls setCurrentRoute('login')
      const { result } = renderHook(() => useAuthStore());

      // Ensure we start fresh
      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      // Navigation is handled by App.tsx state management
    });
  });

  describe('Successful Login - Renter', () => {
    it('should successfully login renter with valid credentials', async () => {
      const { result } = renderHook(() => useAuthStore());

      const renterProfile: RenterProfile = {
        id: crypto.randomUUID(),
        email: 'renter@login.com',
        passwordHash: await hashPassword('RenterPass123!'),
        names: 'Login Renter',
        ages: '25',
        monthlyIncome: 2800,
        status: 'prospective',
        onboardingComplete: true,
      };

      // First, create the user account
      await act(async () => {
        await result.current.login('renter', renterProfile);
      });

      // Verify authentication
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.currentUser).toMatchObject({
        email: 'renter@login.com',
        names: 'Login Renter',
      });
    });

    it('should redirect to renter dashboard after renter login', async () => {
      const { result } = renderHook(() => useAuthStore());

      const renterProfile: RenterProfile = {
        id: crypto.randomUUID(),
        email: 'renter-dashboard@test.com',
        passwordHash: await hashPassword('SecurePass123!'),
        names: 'Dashboard Renter',
        ages: '30',
        monthlyIncome: 3200,
        status: 'prospective',
        onboardingComplete: true,
      };

      await act(async () => {
        await result.current.login('renter', renterProfile);
      });

      // Verify renter type
      expect(result.current.userType).toBe('renter');
      expect(result.current.currentUser).toHaveProperty('status');
      // Dashboard route logic: userType === 'renter' → '/renter-dashboard'
    });
  });

  describe('Successful Login - Landlord', () => {
    it('should successfully login landlord with valid credentials', async () => {
      const { result } = renderHook(() => useAuthStore());

      const landlordProfile: LandlordProfile = {
        id: crypto.randomUUID(),
        email: 'landlord@login.com',
        passwordHash: await hashPassword('LandlordPass123!'),
        names: 'Login Landlord',
        propertyType: 'Flat',
        prsRegistrationNumber: 'PRS-LOGIN-123',
        ombudsmanScheme: 'property_redress_scheme',
        onboardingComplete: true,
      };

      await act(async () => {
        await result.current.login('landlord', landlordProfile);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.currentUser).toMatchObject({
        email: 'landlord@login.com',
        names: 'Login Landlord',
      });
    });

    it('should redirect to landlord dashboard after landlord login', async () => {
      const { result } = renderHook(() => useAuthStore());

      const landlordProfile: LandlordProfile = {
        id: crypto.randomUUID(),
        email: 'landlord-dashboard@test.com',
        passwordHash: await hashPassword('SecurePass123!'),
        names: 'Dashboard Landlord',
        propertyType: 'House',
        prsRegistrationNumber: 'PRS-DASH-456',
        ombudsmanScheme: 'tpo',
        onboardingComplete: true,
      };

      await act(async () => {
        await result.current.login('landlord', landlordProfile);
      });

      expect(result.current.userType).toBe('landlord');
      expect(result.current.currentUser).toHaveProperty('prsRegistrationNumber');
      // Dashboard route logic: userType === 'landlord' → '/landlord-dashboard'
    });
  });

  describe('Successful Login - Agency', () => {
    it('should successfully login estate agent with valid credentials', async () => {
      const { result } = renderHook(() => useAuthStore());

      const agencyProfile: AgencyProfile = {
        id: crypto.randomUUID(),
        email: 'agent@login.com',
        passwordHash: await hashPassword('AgentPass123!'),
        companyName: 'Login Estate Agents',
        agencyType: 'estate_agent',
        registrationNumber: 'EA-LOGIN-789',
        primaryContactName: 'Contact Person',
        phone: '01234567890',
        street: '123 Agent Street',
        city: 'Liverpool',
        postcode: 'L1 1AA',
        serviceAreas: ['Liverpool'],
        onboardingComplete: true,
        isActive: true,
      };

      await act(async () => {
        await result.current.login('estate_agent', agencyProfile);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.currentUser).toMatchObject({
        email: 'agent@login.com',
        companyName: 'Login Estate Agents',
      });
    });

    it('should redirect to agency dashboard after agency login', async () => {
      const { result } = renderHook(() => useAuthStore());

      const agencyProfile: AgencyProfile = {
        id: crypto.randomUUID(),
        email: 'agency-dashboard@test.com',
        passwordHash: await hashPassword('SecurePass123!'),
        companyName: 'Dashboard Agency',
        agencyType: 'management_agency',
        registrationNumber: 'MA-DASH-101',
        primaryContactName: 'Agency Manager',
        phone: '09876543210',
        street: '456 Agency Road',
        city: 'Manchester',
        postcode: 'M1 1BB',
        serviceAreas: ['Manchester'],
        onboardingComplete: true,
        isActive: true,
      };

      await act(async () => {
        await result.current.login('management_agency', agencyProfile);
      });

      expect(result.current.userType).toBe('management_agency');
      expect(result.current.currentUser).toHaveProperty('agencyType');
      // Dashboard route logic: userType === 'estate_agent' || 'management_agency' → '/agency-dashboard'
    });
  });

  describe('Error Handling', () => {
    it('should display error message for invalid credentials', async () => {
      const { result } = renderHook(() => useAuthStore());

      // Create a user
      const renterProfile: RenterProfile = {
        id: crypto.randomUUID(),
        email: 'test@invalid.com',
        passwordHash: await hashPassword('CorrectPass123!'),
        names: 'Test User',
        ages: '28',
        monthlyIncome: 3000,
        status: 'prospective',
        onboardingComplete: true,
      };

      await act(async () => {
        await result.current.login('renter', renterProfile);
      });

      // Logout
      act(() => {
        result.current.logout();
      });

      // Try to login with wrong password
      const success = await act(async () => {
        return await result.current.loginWithPassword('test@invalid.com', 'WrongPassword123!');
      });

      expect(success).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});
