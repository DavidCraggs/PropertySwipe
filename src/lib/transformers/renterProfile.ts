/**
 * Renter Profile Transformer
 * Handles conversion between Supabase snake_case and TypeScript camelCase
 */

import type { RenterProfile, RentalPreferences, RenterBio } from '../../types';
import type { DbRecord } from './index';

/**
 * Transform a Supabase renter_profiles record to a TypeScript RenterProfile object
 */
export const transformRenterProfile = (d: DbRecord): RenterProfile => ({
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

  // Bio
  bio: (d.bio as RenterBio) || undefined,

  // Rental preferences
  rentalPreferences: (d.rental_preferences as RentalPreferences) || undefined,

  // Employment
  employmentStatus: d.employment_status as RenterProfile['employmentStatus'],
  employerName: d.employer_name as string,
  jobTitle: d.job_title as string,
  annualIncome: d.annual_income as number,
  incomeVerified: (d.income_verified as boolean) || false,

  // References
  references: d.references as RenterProfile['references'],

  // Current tenancy (for current renters)
  currentTenancyId: d.current_tenancy_id as string | undefined,
  currentPropertyId: d.current_property_id as string | undefined,
  currentLandlordId: d.current_landlord_id as string | undefined,
  currentAgencyId: d.current_agency_id as string | undefined,

  // Identification
  hasProvidedId: (d.has_provided_id as boolean) || false,
  idType: d.id_type as string,
  idVerified: (d.id_verified as boolean) || false,

  // Rating
  averageRating: d.average_rating as number,
  totalRatings: (d.total_ratings as number) || 0,
  ratingHistory: (d.rating_history as string[]) || [],

  // Tags
  seedTag: d.seed_tag as string | undefined,
});

/**
 * Transform a TypeScript RenterProfile object to Supabase format for saving
 */
export const transformRenterProfileToDb = (
  profile: Partial<RenterProfile>
): Record<string, unknown> => ({
  id: profile.id,
  full_name: profile.fullName,
  email: profile.email,
  phone_number: profile.phoneNumber,
  is_verified: profile.isVerified,

  // Profile completeness
  profile_complete: profile.profileComplete,
  onboarding_complete: profile.onboardingComplete,

  // Bio
  bio: profile.bio,

  // Rental preferences
  rental_preferences: profile.rentalPreferences,

  // Employment
  employment_status: profile.employmentStatus,
  employer_name: profile.employerName,
  job_title: profile.jobTitle,
  annual_income: profile.annualIncome,
  income_verified: profile.incomeVerified,

  // References
  references: profile.references,

  // Current tenancy
  current_tenancy_id: profile.currentTenancyId,
  current_property_id: profile.currentPropertyId,
  current_landlord_id: profile.currentLandlordId,
  current_agency_id: profile.currentAgencyId,

  // Identification
  has_provided_id: profile.hasProvidedId,
  id_type: profile.idType,
  id_verified: profile.idVerified,

  // Rating
  average_rating: profile.averageRating,
  total_ratings: profile.totalRatings,
  rating_history: profile.ratingHistory,

  // Tags
  seed_tag: profile.seedTag,
});
