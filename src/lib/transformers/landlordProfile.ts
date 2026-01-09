/**
 * Landlord Profile Transformer
 * Handles conversion between Supabase snake_case and TypeScript camelCase
 */

import type { LandlordProfile, PropertyType, FurnishingType, RenterType, PRSRegistrationStatus, OmbudsmanScheme } from '../../types';
import type { DbRecord } from './index';

/**
 * Transform a Supabase landlord_profiles record to a TypeScript LandlordProfile object
 */
export const transformLandlordProfile = (d: DbRecord): LandlordProfile => ({
  id: d.id as string,
  email: (d.email as string) || '',
  passwordHash: (d.password_hash as string) || '',
  names: (d.names as string) || '',
  propertyType: (d.property_type as PropertyType) || 'house',

  // Preferences
  furnishingPreference: (d.furnishing_preference as FurnishingType) || 'flexible',
  preferredTenantTypes: (d.preferred_tenant_types as RenterType[]) || [],

  // Pets policy
  defaultPetsPolicy: {
    willConsiderPets: true,
    requiresPetInsurance: (d.requires_pet_insurance as boolean) || false,
    preferredPetTypes: (d.preferred_pet_types as ('cat' | 'dog' | 'small_caged' | 'fish')[]) || [],
    maxPetsAllowed: (d.max_pets_allowed as number) || 2,
  },

  // RRA 2025: PRS Database Registration
  prsRegistrationNumber: d.prs_registration_number as string | undefined,
  prsRegistrationStatus: (d.prs_registration_status as PRSRegistrationStatus) || 'not_registered',
  prsRegistrationDate: d.prs_registration_date ? new Date(d.prs_registration_date as string) : undefined,
  prsRegistrationExpiryDate: d.prs_registration_expiry_date ? new Date(d.prs_registration_expiry_date as string) : undefined,

  // RRA 2025: Ombudsman Membership
  ombudsmanScheme: (d.ombudsman_scheme as OmbudsmanScheme) || 'none',
  ombudsmanMembershipNumber: d.ombudsman_membership_number as string | undefined,

  // Compliance
  isFullyCompliant: (d.is_fully_compliant as boolean) || false,
  depositScheme: (d.deposit_scheme as string) || 'DPS',
  isRegisteredLandlord: (d.is_registered_landlord as boolean) || false,

  estateAgentLink: (d.estate_agent_link as string) || '',
  // Map legacy property_id to propertyIds array for backward compatibility
  propertyIds: d.property_id ? [d.property_id as string] : undefined,
  createdAt: new Date(d.created_at as string),
  onboardingComplete: (d.onboarding_complete as boolean) || false,

  // Agency relationships
  managementAgencyId: d.management_agency_id as string | undefined,
  estateAgentId: d.estate_agent_id as string | undefined,
  agentCommissionRate: d.agent_commission_rate as number | undefined,

  // Contact preferences
  preferredContactMethod: d.preferred_contact_method as 'in_app' | 'email' | 'both' | undefined,
  notificationEmail: d.notification_email as string | undefined,

  // Rating summary
  ratingsSummary: d.ratings_summary as LandlordProfile['ratingsSummary'],
});

/**
 * Transform a TypeScript LandlordProfile object to Supabase format for saving
 */
export const transformLandlordProfileToDb = (
  profile: Partial<LandlordProfile>
): Record<string, unknown> => ({
  id: profile.id,
  email: profile.email,
  password_hash: profile.passwordHash,
  names: profile.names,
  property_type: profile.propertyType,

  // Preferences
  furnishing_preference: profile.furnishingPreference,
  preferred_tenant_types: profile.preferredTenantTypes,

  // Pets policy
  requires_pet_insurance: profile.defaultPetsPolicy?.requiresPetInsurance,
  preferred_pet_types: profile.defaultPetsPolicy?.preferredPetTypes,
  max_pets_allowed: profile.defaultPetsPolicy?.maxPetsAllowed,

  // RRA 2025: PRS Database Registration
  prs_registration_number: profile.prsRegistrationNumber,
  prs_registration_status: profile.prsRegistrationStatus,
  prs_registration_date: profile.prsRegistrationDate?.toISOString(),
  prs_registration_expiry_date: profile.prsRegistrationExpiryDate?.toISOString(),

  // RRA 2025: Ombudsman Membership
  ombudsman_scheme: profile.ombudsmanScheme,
  ombudsman_membership_number: profile.ombudsmanMembershipNumber,

  // Compliance
  is_fully_compliant: profile.isFullyCompliant,
  deposit_scheme: profile.depositScheme,
  is_registered_landlord: profile.isRegisteredLandlord,

  estate_agent_link: profile.estateAgentLink,
  // Store first propertyId for backward compatibility with database column
  property_id: profile.propertyIds?.[0] || null,
  onboarding_complete: profile.onboardingComplete,

  // Agency relationships
  management_agency_id: profile.managementAgencyId,
  estate_agent_id: profile.estateAgentId,
  agent_commission_rate: profile.agentCommissionRate,

  // Contact preferences
  preferred_contact_method: profile.preferredContactMethod,
  notification_email: profile.notificationEmail,

  // Rating summary
  ratings_summary: profile.ratingsSummary,
});
