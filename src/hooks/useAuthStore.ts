import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, VendorProfile, BuyerProfile, UserType } from '../types';

interface AuthStore extends AuthState {
  // Actions
  login: (userType: UserType, profile: VendorProfile | BuyerProfile) => void;
  logout: () => void;
  updateProfile: (updates: Partial<VendorProfile | BuyerProfile>) => void;
  setOnboardingStep: (step: number) => void;
  completeOnboarding: () => void;
  getSessionData: () => AuthState;
}

const STORAGE_KEY = 'get-on-auth';

/**
 * Authentication store for Get On application
 * Manages user authentication, profile data, and onboarding state
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
      login: (userType, profile) => {
        set({
          isAuthenticated: true,
          userType,
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

      // Update user profile
      updateProfile: (updates) => {
        const { currentUser } = get();
        if (!currentUser) return;

        set({
          currentUser: {
            ...currentUser,
            ...updates,
          },
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
