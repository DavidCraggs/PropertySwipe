import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AuthState,
  LandlordProfile,
  RenterProfile,
  AgencyProfile,
  UserType,
  RenterStatus,
} from '../types';
import {
  saveLandlordProfile,
  saveRenterProfile,
} from '../lib/storage';

interface AuthStore extends AuthState {
  // Actions
  login: (userType: UserType, profile: LandlordProfile | RenterProfile | AgencyProfile) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<LandlordProfile | RenterProfile | AgencyProfile>) => Promise<void>;
  setOnboardingStep: (step: number) => void;
  completeOnboarding: () => void;
  getSessionData: () => AuthState;
}

const STORAGE_KEY = 'get-on-auth';

/**
 * Authentication store for GetOn Rental Platform
 * Manages user authentication, profile data, and onboarding state
 * Updated for landlord/renter roles (RRA 2025 compliant)
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      userType: null,
      currentUser: null,
      onboardingStep: 0,

      // Login action - stores user data and sets authenticated state
      login: async (userType, profile) => {
        // Save to Supabase (or localStorage if not configured)
        try {
          if (userType === 'landlord') {
            await saveLandlordProfile(profile as LandlordProfile);
            console.log(`[Auth] Landlord profile saved to storage`);
          } else if (userType === 'renter') {
            await saveRenterProfile(profile as RenterProfile);
            console.log(`[Auth] Renter profile saved to storage`);
          } else if (userType === 'estate_agent' || userType === 'management_agency') {
            // TODO: Create saveAgencyProfile function in storage.ts
            console.log(`[Auth] Agency profile login (storage pending)`);
          }
        } catch (error) {
          console.error('[Auth] Failed to save profile to storage:', error);
        }

        set({
          isAuthenticated: true,
          userType: userType,
          currentUser: profile,
          onboardingStep: profile.isComplete ? 0 : 1,
        });
      },

      // Logout action - clears all auth data
      logout: () => {
        set({
          isAuthenticated: false,
          userType: null,
          currentUser: null,
          onboardingStep: 0,
        });
      },

      // Update user profile (landlord, renter, or agency)
      updateProfile: async (updates) => {
        const { currentUser, userType } = get();
        if (!currentUser) return;

        const updatedProfile = {
          ...currentUser,
          ...updates,
        };

        // Save to Supabase (or localStorage if not configured)
        try {
          if (userType === 'landlord') {
            await saveLandlordProfile(updatedProfile as LandlordProfile);
            console.log('[Auth] Landlord profile updated');
          } else if (userType === 'renter') {
            await saveRenterProfile(updatedProfile as RenterProfile);
            console.log('[Auth] Renter profile updated');
          } else if (userType === 'estate_agent' || userType === 'management_agency') {
            // TODO: Create saveAgencyProfile function in storage.ts
            console.log('[Auth] Agency profile update (storage pending)');
          }
        } catch (error) {
          console.error('[Auth] Failed to save profile to storage:', error);
        }

        set({
          currentUser: updatedProfile,
        });
      },

      // Set current onboarding step
      setOnboardingStep: (step) => {
        set({ onboardingStep: step });
      },

      // Complete onboarding process
      completeOnboarding: () => {
        const { currentUser } = get();
        if (!currentUser) return;

        set({
          currentUser: {
            ...currentUser,
            isComplete: true,
          },
          onboardingStep: 0,
        });
      },

      // Get session data
      getSessionData: () => {
        const { isAuthenticated, userType, currentUser, onboardingStep } = get();
        return { isAuthenticated, userType, currentUser, onboardingStep };
      },
    }),
    {
      name: STORAGE_KEY,
    }
  )
);

/**
 * Helper function to check if user is authenticated
 */
export const isUserAuthenticated = (): boolean => {
  const state = useAuthStore.getState();
  return state.isAuthenticated && state.currentUser !== null;
};

/**
 * Helper function to get current user type
 */
export const getCurrentUserType = (): UserType | null => {
  return useAuthStore.getState().userType;
};

/**
 * Helper to check if onboarding is complete
 */
export const isOnboardingComplete = (): boolean => {
  const state = useAuthStore.getState();
  return state.currentUser?.isComplete ?? false;
};

/**
 * Role Detection Helpers (Phase 2)
 * Distinguish between different user types and renter statuses
 */

/**
 * Check if current user is a renter (any status)
 */
export const isRenter = (): boolean => {
  const userType = useAuthStore.getState().userType;
  return userType === 'renter';
};

/**
 * Check if current user is a landlord
 */
export const isLandlord = (): boolean => {
  const userType = useAuthStore.getState().userType;
  return userType === 'landlord';
};

/**
 * Check if current user is an agency (estate agent or management agency)
 */
export const isAgency = (): boolean => {
  const userType = useAuthStore.getState().userType;
  return userType === 'estate_agent' || userType === 'management_agency';
};

/**
 * Check if current user is an estate agent specifically
 */
export const isEstateAgent = (): boolean => {
  const userType = useAuthStore.getState().userType;
  return userType === 'estate_agent';
};

/**
 * Check if current user is a management agency specifically
 */
export const isManagementAgency = (): boolean => {
  const userType = useAuthStore.getState().userType;
  return userType === 'management_agency';
};

/**
 * Check if current renter is prospective (searching for properties)
 */
export const isProspectiveRenter = (): boolean => {
  const state = useAuthStore.getState();
  if (state.userType !== 'renter') return false;
  const renterProfile = state.currentUser as RenterProfile;
  return renterProfile?.status === 'prospective';
};

/**
 * Check if current renter is current (actively in a tenancy)
 */
export const isCurrentRenter = (): boolean => {
  const state = useAuthStore.getState();
  if (state.userType !== 'renter') return false;
  const renterProfile = state.currentUser as RenterProfile;
  return renterProfile?.status === 'current';
};

/**
 * Check if current renter is former (previous tenant)
 */
export const isFormerRenter = (): boolean => {
  const state = useAuthStore.getState();
  if (state.userType !== 'renter') return false;
  const renterProfile = state.currentUser as RenterProfile;
  return renterProfile?.status === 'former';
};

/**
 * Get the current renter's status (if applicable)
 */
export const getRenterStatus = (): RenterStatus | null => {
  const state = useAuthStore.getState();
  if (state.userType !== 'renter') return null;
  const renterProfile = state.currentUser as RenterProfile;
  return renterProfile?.status ?? null;
};

/**
 * Get the agency profile (if user is an agency)
 */
export const getAgencyProfile = (): AgencyProfile | null => {
  const state = useAuthStore.getState();
  if (state.userType !== 'estate_agent' && state.userType !== 'management_agency') {
    return null;
  }
  return state.currentUser as AgencyProfile;
};
