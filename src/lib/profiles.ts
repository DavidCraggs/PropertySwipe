import { supabase, isSupabaseConfigured } from './supabase';
import type { SupabaseProfile, UserType } from '../types';

/** Fetch the unified profile for a given user ID */
export async function getProfile(userId: string): Promise<SupabaseProfile | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('[Profiles] getProfile error:', error);
    return null;
  }

  return data ? mapRowToProfile(data) : null;
}

/**
 * Fetch profile with a retry — the handle_new_user() trigger runs async,
 * so the profile may not exist immediately after signup.
 */
export async function getProfileWithRetry(
  userId: string,
  retries = 3,
  delayMs = 500,
): Promise<SupabaseProfile | null> {
  for (let i = 0; i < retries; i++) {
    const profile = await getProfile(userId);
    if (profile) return profile;
    if (i < retries - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return null;
}

/** Set the user's role (called from RoleSelectionScreen) */
export async function setProfileRole(
  userId: string,
  role: UserType,
): Promise<SupabaseProfile | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('[Profiles] setProfileRole error:', error);
    throw error;
  }

  return mapRowToProfile(data);
}

/** Link a role-specific profile ID to the unified profile */
export async function linkRoleProfile(
  userId: string,
  roleProfileId: string,
  roleType: 'landlord' | 'renter' | 'estate_agent' | 'management_agency',
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const column =
    roleType === 'landlord'
      ? 'landlord_profile_id'
      : roleType === 'renter'
        ? 'renter_profile_id'
        : 'agency_profile_id';

  const { error } = await supabase
    .from('profiles')
    .update({ [column]: roleProfileId, onboarding_complete: true })
    .eq('id', userId);

  if (error) {
    console.error('[Profiles] linkRoleProfile error:', error);
    throw error;
  }
}

/** Update last_sign_in_at timestamp */
export async function touchSignIn(userId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  await supabase
    .from('profiles')
    .update({ last_sign_in_at: new Date().toISOString() })
    .eq('id', userId);
}

/** Map snake_case DB row to the SupabaseProfile interface */
function mapRowToProfile(row: Record<string, unknown>): SupabaseProfile {
  return {
    id: row.id as string,
    email: row.email as string,
    role: row.role as SupabaseProfile['role'],
    display_name: row.display_name as string | null,
    avatar_url: row.avatar_url as string | null,
    landlord_profile_id: row.landlord_profile_id as string | null,
    renter_profile_id: row.renter_profile_id as string | null,
    agency_profile_id: row.agency_profile_id as string | null,
    auth_provider: row.auth_provider as SupabaseProfile['auth_provider'],
    onboarding_complete: row.onboarding_complete as boolean,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    last_sign_in_at: row.last_sign_in_at as string | null,
  };
}
