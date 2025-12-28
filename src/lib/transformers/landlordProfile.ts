/**
 * Landlord Profile Transformer
 * Handles conversion between Supabase snake_case and TypeScript camelCase
 */

import type { LandlordProfile } from '../../types';
import type { DbRecord } from './index';

/**
 * Transform a Supabase landlord_profiles record to a TypeScript LandlordProfile object
 */
export const transformLandlordProfile = (d: DbRecord): LandlordProfile => ({
  id: d.id as string,
  fullName: d.full_name as string,
  email: d.email as string,
  phoneNumber: d.phone_number as string,
  isVerified: (d.is_verified as boolean) || false,
  createdAt: d.created_at as string,
  updatedAt: d.updated_at as string,

  // Profile completeness
  profileComplete: (d.profile_complete as boolean) || false,
  onboardingComplete: (d.onboarding_complete as boolean) || false,

  // Properties
  propertyIds: (d.property_ids as string[]) || [],

  // Agency relationship
  managingAgencyId: d.managing_agency_id as string | undefined,
  hasAgencyManagement: (d.has_agency_management as boolean) || false,

  // Rating
  averageRating: d.average_rating as number,
  totalRatings: (d.total_ratings as number) || 0,
  ratingHistory: (d.rating_history as string[]) || [],

  // Compliance
  registeredWithPrs: (d.registered_with_prs as boolean) || false,
  prsRegistrationNumber: d.prs_registration_number as string | undefined,

  // Tags
  seedTag: d.seed_tag as string | undefined,
});

/**
 * Transform a TypeScript LandlordProfile object to Supabase format for saving
 */
export const transformLandlordProfileToDb = (
  profile: Partial<LandlordProfile>
): Record<string, unknown> => ({
  id: profile.id,
  full_name: profile.fullName,
  email: profile.email,
  phone_number: profile.phoneNumber,
  is_verified: profile.isVerified,

  // Profile completeness
  profile_complete: profile.profileComplete,
  onboarding_complete: profile.onboardingComplete,

  // Properties
  property_ids: profile.propertyIds,

  // Agency relationship
  managing_agency_id: profile.managingAgencyId,
  has_agency_management: profile.hasAgencyManagement,

  // Rating
  average_rating: profile.averageRating,
  total_ratings: profile.totalRatings,
  rating_history: profile.ratingHistory,

  // Compliance
  registered_with_prs: profile.registeredWithPrs,
  prs_registration_number: profile.prsRegistrationNumber,

  // Tags
  seed_tag: profile.seedTag,
});
