import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AuthState,
  LandlordProfile,
  RenterProfile,
  AgencyProfile,
  AdminSession,
  UserType,
  RenterStatus,
} from '../types';
import {
  saveLandlordProfile,
  saveRenterProfile,
  saveAgencyProfile,
} from '../lib/storage';

interface AuthStore extends AuthState {
  // Actions
  login: (userType: UserType, profile: LandlordProfile | RenterProfile | AgencyProfile) => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<LandlordProfile | RenterProfile | AgencyProfile>) => Promise<void>;
  setOnboardingStep: (step: number) => void;
  completeOnboarding: () => void;
  getSessionData: () => AuthState;

  // Admin methods
  loginAsAdmin: (email: string, password: string) => Promise<boolean>;
  switchToRole: (userType: Exclude<UserType, 'admin'>) => Promise<void>;
  exitRoleSwitch: () => void;
  isAdmin: () => boolean;
  getAdminSession: () => AdminSession | null;
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
        // Save to Supabase (or localStorage if not configured) and get back the profile with correct UUID
        let savedProfile = profile;
        try {
          if (userType === 'landlord') {
            savedProfile = await saveLandlordProfile(profile as LandlordProfile);
            console.log(`[Auth] Landlord profile saved to storage with ID:`, savedProfile.id);
          } else if (userType === 'renter') {
            savedProfile = await saveRenterProfile(profile as RenterProfile);
            console.log(`[Auth] Renter profile saved to storage with ID:`, savedProfile.id);
          } else if (userType === 'estate_agent' || userType === 'management_agency') {
            savedProfile = await saveAgencyProfile(profile as AgencyProfile);
            console.log(`[Auth] Agency profile saved to storage with ID:`, savedProfile.id);
          }
        } catch (error) {
          console.error('[Auth] Failed to save profile to storage:', error);
          throw error; // Prevent login with invalid data
        }

        set({
          isAuthenticated: true,
          userType: userType,
          currentUser: savedProfile, // CRITICAL: Use savedProfile not profile
          onboardingStep: savedProfile.onboardingComplete ? 0 : 1,
        });
      },

      // Login with password - finds user by email and verifies password
      loginWithPassword: async (email, password) => {
        try {
          // Import password verification and storage functions
          const { verifyPassword } = await import('../utils/validation');
          const { isSupabaseConfigured } = await import('../lib/supabase');
          const { supabase } = await import('../lib/supabase');
          const { getRenterProfile, getLandlordProfile, getAgencyProfile } = await import('../lib/storage');

          // Try to find user in each collection
          let user: LandlordProfile | RenterProfile | AgencyProfile | null = null;

          if (isSupabaseConfigured()) {
            console.log('[Auth] Querying Supabase for profiles');

            // Query landlord profiles
            const { data: landlordData } = await supabase
              .from('landlord_profiles')
              .select('id')
              .eq('email', email.toLowerCase())
              .maybeSingle();

            if (landlordData) {
              user = await getLandlordProfile(landlordData.id);
            }

            // Query renter profiles if not found
            if (!user) {
              const { data: renterData } = await supabase
                .from('renter_profiles')
                .select('id')
                .eq('email', email.toLowerCase())
                .maybeSingle();

              if (renterData) {
                user = await getRenterProfile(renterData.id);
              }
            }

            // Query agency profiles if not found
            if (!user) {
              const { data: agencyData } = await supabase
                .from('agency_profiles')
                .select('id')
                .eq('email', email.toLowerCase())
                .maybeSingle();

              if (agencyData) {
                user = await getAgencyProfile(agencyData.id);
              }
            }
          } else {
            // Fall back to localStorage
            console.log('[Auth] Using localStorage for profiles');
            const allProfiles: Array<LandlordProfile | RenterProfile | AgencyProfile> = [];

            const landlordProfilesJson = localStorage.getItem('get-on-landlord-profiles');
            const renterProfilesJson = localStorage.getItem('get-on-renter-profiles');
            const agencyProfilesJson = localStorage.getItem('get-on-agency-profiles');

            if (landlordProfilesJson) {
              const landlordProfiles: LandlordProfile[] = JSON.parse(landlordProfilesJson);
              allProfiles.push(...landlordProfiles);
            }
            if (renterProfilesJson) {
              const renterProfiles: RenterProfile[] = JSON.parse(renterProfilesJson);
              allProfiles.push(...renterProfiles);
            }
            if (agencyProfilesJson) {
              const agencyProfiles: AgencyProfile[] = JSON.parse(agencyProfilesJson);
              allProfiles.push(...agencyProfiles);
            }

            user = allProfiles.find(p => p.email.toLowerCase() === email.toLowerCase()) || null;
          }

          if (!user) {
            console.log('[Auth] No user found with email:', email);
            return false;
          }

          // Verify password
          const isValid = await verifyPassword(password, user.passwordHash);

          if (!isValid) {
            console.log('[Auth] Invalid password for:', email);
            return false;
          }

          // Determine user type
          let userType: UserType;
          if ('situation' in user) {
            userType = 'renter';
          } else if ('agencyType' in user) {
            userType = user.agencyType;
          } else {
            userType = 'landlord';
          }

          // Set authenticated state
          set({
            isAuthenticated: true,
            userType,
            currentUser: user,
            onboardingStep: user.onboardingComplete ? 0 : 1,
          });

          console.log('[Auth] Login successful for:', email);
          return true;
        } catch (error) {
          console.error('[Auth] Login error:', error);
          return false;
        }
      },

      // Logout action - clears all auth data
      logout: () => {
        const state = get();

        // Clear admin session if in admin mode
        if (state.isAdminMode) {
          try {
            localStorage.removeItem('get-on-admin-session');
          } catch (error) {
            console.error('[Auth] Failed to clear admin session:', error);
          }
        }

        // Clear visit flag
        localStorage.removeItem('get-on-has-visited');

        set({
          isAuthenticated: false,
          userType: null,
          currentUser: null,
          onboardingStep: 0,
          isAdminMode: false,
          adminProfile: undefined,
          impersonatedRole: undefined,
        });

        console.log('[Auth] Logged out successfully');
      },

      // Update user profile (landlord, renter, or agency)
      updateProfile: async (updates) => {
        const { currentUser, userType } = get();
        if (!currentUser) return;

        const updatedProfile = {
          ...currentUser,
          ...updates,
        };

        // Save to Supabase (or localStorage if not configured) and get back the profile with correct UUID
        let savedProfile = updatedProfile;
        try {
          if (userType === 'landlord') {
            savedProfile = await saveLandlordProfile(updatedProfile as LandlordProfile);
            console.log('[Auth] Landlord profile saved to storage with ID:', savedProfile.id);
          } else if (userType === 'renter') {
            savedProfile = await saveRenterProfile(updatedProfile as RenterProfile);
            console.log('[Auth] Renter profile saved to storage with ID:', savedProfile.id);
          } else if (userType === 'estate_agent' || userType === 'management_agency') {
            savedProfile = await saveAgencyProfile(updatedProfile as AgencyProfile);
            console.log('[Auth] Agency profile saved to storage with ID:', savedProfile.id);
          }
        } catch (error) {
          console.error('[Auth] Failed to save profile to storage:', error);
          throw error; // Re-throw to prevent state update with invalid data
        }

        // Update state with the saved profile (includes the UUID from Supabase)
        set({
          currentUser: savedProfile as typeof currentUser,
        });
      },

      // Set current onboarding step
      setOnboardingStep: (step) => {
        set({ onboardingStep: step });
      },

      // Complete onboarding process
      completeOnboarding: () => {
        const { currentUser } = get();
        if (!currentUser || !('onboardingComplete' in currentUser)) return;

        set({
          currentUser: {
            ...currentUser,
            onboardingComplete: true,
          },
          onboardingStep: 0,
        });
      },

      // Get session data
      getSessionData: () => {
        const { isAuthenticated, userType, currentUser, onboardingStep } = get();
        return { isAuthenticated, userType, currentUser, onboardingStep };
      },

      // =====================================================
      // ADMIN METHODS
      // =====================================================

      /**
       * Login as admin user
       */
      loginAsAdmin: async (email: string, password: string) => {
        try {
          const { verifyPassword } = await import('../utils/validation');
          const { getAdminProfile, saveAdminSession } = await import('../lib/adminStorage');
          const { initializeTestProfiles } = await import('../utils/adminTestProfiles');

          // Get admin profile
          const adminProfile = getAdminProfile();
          if (!adminProfile) {
            console.error('[Auth] Admin profile not found');
            return false;
          }

          // Verify credentials
          if (adminProfile.email.toLowerCase() !== email.toLowerCase()) {
            console.error('[Auth] Admin email mismatch');
            return false;
          }

          const isValid = await verifyPassword(password, adminProfile.passwordHash);
          if (!isValid) {
            console.error('[Auth] Admin password incorrect');
            return false;
          }

          // Initialize test profiles if not exists
          await initializeTestProfiles();

          // Update last login
          adminProfile.lastLogin = new Date().toISOString();
          localStorage.setItem('get-on-admin-profile', JSON.stringify(adminProfile));

          // Create admin session
          const session: AdminSession = {
            adminId: adminProfile.id,
            adminProfile,
            impersonatedRole: null,
            impersonatedProfile: null,
            sessionStarted: new Date().toISOString(),
          };
          saveAdminSession(session);

          // Set auth state
          set({
            isAuthenticated: true,
            userType: 'admin',
            currentUser: adminProfile,
            isAdminMode: true,
            adminProfile,
            impersonatedRole: undefined,
            onboardingStep: 0,
          });

          console.log('[Auth] Admin login successful');
          return true;
        } catch (error) {
          console.error('[Auth] Admin login error:', error);
          return false;
        }
      },

      /**
       * Switch to a specific user role (admin impersonation)
       */
      switchToRole: async (userType: Exclude<UserType, 'admin'>) => {
        const state = get();

        if (!state.isAdminMode || !state.adminProfile) {
          console.error('[Auth] Must be in admin mode to switch roles');
          return;
        }

        try {
          const { getTestProfile } = await import('../utils/adminTestProfiles');
          const { saveAdminSession } = await import('../lib/adminStorage');

          // Get test profile for this role
          const testProfile = getTestProfile(userType);
          if (!testProfile) {
            console.error(`[Auth] No test profile found for role: ${userType}`);
            return;
          }

          // Update session
          const session: AdminSession = {
            adminId: state.adminProfile.id,
            adminProfile: state.adminProfile,
            impersonatedRole: userType,
            impersonatedProfile: testProfile,
            sessionStarted: state.adminProfile.lastLogin || new Date().toISOString(),
          };
          saveAdminSession(session);

          // Update state
          set({
            userType,
            currentUser: testProfile,
            impersonatedRole: userType,
            onboardingStep: 0,
          });

          console.log(`[Auth] Switched to role: ${userType}`);
        } catch (error) {
          console.error('[Auth] Role switch error:', error);
        }
      },

      /**
       * Exit role impersonation and return to admin view
       */
      exitRoleSwitch: () => {
        const state = get();

        if (!state.isAdminMode || !state.adminProfile) {
          console.error('[Auth] Not in admin mode');
          return;
        }

        try {
          const session: AdminSession = {
            adminId: state.adminProfile.id,
            adminProfile: state.adminProfile,
            impersonatedRole: null,
            impersonatedProfile: null,
            sessionStarted: state.adminProfile.lastLogin || new Date().toISOString(),
          };
          localStorage.setItem('get-on-admin-session', JSON.stringify(session));

          set({
            userType: 'admin',
            currentUser: state.adminProfile,
            impersonatedRole: undefined,
          });

          console.log('[Auth] Exited role impersonation');
        } catch (error) {
          console.error('[Auth] Exit role switch error:', error);
        }
      },

      /**
       * Check if current user is admin (non-reactive)
       */
      isAdmin: () => {
        const state = get();
        return state.isAdminMode === true || state.userType === 'admin';
      },

      /**
       * Get admin session data
       */
      getAdminSession: () => {
        const sessionJson = localStorage.getItem('get-on-admin-session');
        if (!sessionJson) return null;
        return JSON.parse(sessionJson);
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
  const user = state.currentUser;
  if (!user || !('onboardingComplete' in user)) return false;
  return user.onboardingComplete ?? false;
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
