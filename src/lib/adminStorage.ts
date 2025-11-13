import type { AdminProfile, AdminSession } from '../types';
import { hashPassword } from '../utils/validation';

const ADMIN_PROFILE_KEY = 'get-on-admin-profile';
const ADMIN_SESSION_KEY = 'get-on-admin-session';

/**
 * Initialize the admin profile (run once on first load)
 * In production, this would be in a secure backend
 */
export const initializeAdminProfile = async (): Promise<void> => {
  const existing = localStorage.getItem(ADMIN_PROFILE_KEY);
  if (existing) {
    console.log('[Admin] Admin profile already exists');
    return;
  }

  // Create default admin profile
  // In production: use environment variables and secure backend
  const adminProfile: AdminProfile = {
    id: 'admin-001',
    email: import.meta.env.VITE_ADMIN_EMAIL || 'admin@geton.com',
    passwordHash: await hashPassword(import.meta.env.VITE_ADMIN_PASSWORD || 'Admin1234!'),
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
