/**
 * Renter Profile Transformer
 * Handles conversion between Supabase snake_case and TypeScript camelCase
 */

import type { RenterProfile, RenterSituation, LocalArea, RenterType, EmploymentStatus, RenterStatus } from '../../types';
import type { DbRecord } from './index';

/**
 * Transform a Supabase renter_profiles record to a TypeScript RenterProfile object
 */
export const transformRenterProfile = (d: DbRecord): RenterProfile => ({
  id: d.id as string,
  email: (d.email as string) || '',
  passwordHash: (d.password_hash as string) || '',
  situation: (d.situation as RenterSituation) || 'Looking to move',
  names: (d.names as string) || '',
  ages: (d.ages as string) || '',
  localArea: (d.local_area as LocalArea) || '',
  renterType: (d.renter_type as RenterType) || 'single',
  employmentStatus: (d.employment_status as EmploymentStatus) || 'employed',
  monthlyIncome: (d.monthly_income as number) || 0,

  // Additional rental info
  hasPets: (d.has_pets as boolean) || false,
  petDetails: d.pet_details as RenterProfile['petDetails'],
  smokingStatus: (d.smoking_status as RenterProfile['smokingStatus']) || 'Non-Smoker',
  hasGuarantor: (d.has_guarantor as boolean) || false,
  preferredMoveInDate: d.preferred_move_in_date ? new Date(d.preferred_move_in_date as string) : undefined,
  currentRentalSituation: (d.current_rental_situation as RenterProfile['currentRentalSituation']) || 'Living with Parents',

  // Rental history
  hasRentalHistory: (d.has_rental_history as boolean) || false,
  previousLandlordReference: (d.previous_landlord_reference as boolean) || false,

  // Protected characteristics (tracked but CANNOT be used for discrimination per RRA 2025)
  receivesHousingBenefit: (d.receives_housing_benefit as boolean) || false,
  receivesUniversalCredit: (d.receives_universal_credit as boolean) || false,
  numberOfChildren: d.number_of_children as number | undefined,

  createdAt: new Date(d.created_at as string),
  onboardingComplete: (d.onboarding_complete as boolean) || false,

  // Current tenancy tracking
  status: (d.status as RenterStatus) || 'prospective',
  currentTenancyId: d.current_tenancy_id as string | undefined,
  currentPropertyId: d.current_property_id as string | undefined,
  currentLandlordId: d.current_landlord_id as string | undefined,
  currentAgencyId: d.current_agency_id as string | undefined,
  moveInDate: d.move_in_date ? new Date(d.move_in_date as string) : undefined,

  // Rating summary
  ratingsSummary: d.ratings_summary as RenterProfile['ratingsSummary'],
});

/**
 * Transform a TypeScript RenterProfile object to Supabase format for saving
 */
export const transformRenterProfileToDb = (
  profile: Partial<RenterProfile>
): Record<string, unknown> => ({
  id: profile.id,
  email: profile.email,
  password_hash: profile.passwordHash,
  situation: profile.situation,
  names: profile.names,
  ages: profile.ages,
  local_area: profile.localArea,
  renter_type: profile.renterType,
  employment_status: profile.employmentStatus,
  monthly_income: profile.monthlyIncome,

  // Additional rental info
  has_pets: profile.hasPets,
  pet_details: profile.petDetails,
  smoking_status: profile.smokingStatus,
  has_guarantor: profile.hasGuarantor,
  preferred_move_in_date: profile.preferredMoveInDate?.toISOString(),
  current_rental_situation: profile.currentRentalSituation,

  // Rental history
  has_rental_history: profile.hasRentalHistory,
  previous_landlord_reference: profile.previousLandlordReference,

  // Protected characteristics
  receives_housing_benefit: profile.receivesHousingBenefit,
  receives_universal_credit: profile.receivesUniversalCredit,
  number_of_children: profile.numberOfChildren,

  onboarding_complete: profile.onboardingComplete,

  // Current tenancy tracking
  status: profile.status,
  current_tenancy_id: profile.currentTenancyId,
  current_property_id: profile.currentPropertyId,
  current_landlord_id: profile.currentLandlordId,
  current_agency_id: profile.currentAgencyId,
  move_in_date: profile.moveInDate?.toISOString(),

  // Rating summary
  ratings_summary: profile.ratingsSummary,
});
