import type { AdminProfile, AdminSession } from '../types';
import { hashPassword } from '../utils/validation';

const ADMIN_PROFILE_KEY = 'get-on-admin-profile';
const ADMIN_SESSION_KEY = 'get-on-admin-session';

/**
 * Initialize the admin profile (run once on first load)
 * In production, this would be in a secure backend
 * 
 * IMPORTANT: This function now detects when credentials change
 * and automatically updates the profile in localStorage
 */
export const initializeAdminProfile = async (): Promise<void> => {
  const expectedEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@geton.com';
  const expectedPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'Admin1234!';

  const existing = localStorage.getItem(ADMIN_PROFILE_KEY);

  // Check if credentials have changed
  if (existing) {
    try {
      const existingProfile = JSON.parse(existing) as AdminProfile;

      // If email changed, recreate profile with new credentials
      if (existingProfile.email !== expectedEmail) {
        console.log('[Admin] Credentials changed - updating profile');
        // Security: Do not log actual email values
        localStorage.removeItem(ADMIN_PROFILE_KEY);
        // Continue to create new profile below
      } else {
        console.log('[Admin] Admin profile already exists');
        return;
      }
    } catch (error) {
      console.error('[Admin] Error parsing existing profile, recreating:', error);
      localStorage.removeItem(ADMIN_PROFILE_KEY);
      // Continue to create new profile below
    }
  }

  // Create or recreate admin profile
  const adminProfile: AdminProfile = {
    id: 'admin-001',
    email: expectedEmail,
    passwordHash: await hashPassword(expectedPassword),
    name: 'Admin User',
    role: 'admin',
    permissions: ['role_switching', 'view_all_users', 'modify_users', 'system_settings'],
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(adminProfile));
  console.log('[Admin] Admin profile initialized');
};

/**
 * Get admin profile
 */
export const getAdminProfile = (): AdminProfile | null => {
  const profileJson = localStorage.getItem(ADMIN_PROFILE_KEY);
  if (!profileJson) return null;
  return JSON.parse(profileJson);
};

/**
 * Save admin session
 */
export const saveAdminSession = (session: AdminSession): void => {
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
};

/**
 * Get current admin session
 */
export const getAdminSession = (): AdminSession | null => {
  const sessionJson = localStorage.getItem(ADMIN_SESSION_KEY);
  if (!sessionJson) return null;
  return JSON.parse(sessionJson);
};

/**
 * Clear admin session (logout)
 */
export const clearAdminSession = (): void => {
  localStorage.removeItem(ADMIN_SESSION_KEY);
};

/**
 * Check if user has admin permission
 */
export const hasAdminPermission = (
  profile: AdminProfile,
  permission: 'role_switching' | 'view_all_users' | 'modify_users' | 'system_settings'
): boolean => {
  return profile.permissions.includes(permission);
};
