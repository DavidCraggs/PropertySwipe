/**
 * Agency Profile Transformer
 * Handles conversion between Supabase snake_case and TypeScript camelCase
 */

import type { AgencyProfile } from '../../types';
import type { DbRecord } from './index';

/**
 * Transform a Supabase agency_profiles record to a TypeScript AgencyProfile object
 */
export const transformAgencyProfile = (d: DbRecord): AgencyProfile => ({
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

  // Company info
  companyName: d.company_name as string,
  companyAddress: d.company_address as string,
  companyRegistrationNumber: d.company_registration_number as string,
  redasMemberId: d.redas_member_id as string,

  // Agency type
  agencyType: d.agency_type as AgencyProfile['agencyType'],

  // Managed entities
  managedPropertyIds: (d.managed_property_ids as string[]) || [],
  landlordClientIds: (d.landlord_client_ids as string[]) || [],

  // SLA Settings
  targetResponseTimeHours: (d.target_response_time_hours as number) || 24,
  escalationEmailAddress: d.escalation_email_address as string,

  // Stats
  averageSlaPerformance: d.average_sla_performance as number,
  totalIssuesManaged: (d.total_issues_managed as number) || 0,
  totalIssuesResolved: (d.total_issues_resolved as number) || 0,

  // Rating
  averageRating: d.average_rating as number,
  totalRatings: (d.total_ratings as number) || 0,

  // Tags
  seedTag: d.seed_tag as string | undefined,
});

/**
 * Transform a TypeScript AgencyProfile object to Supabase format for saving
 */
export const transformAgencyProfileToDb = (
  profile: Partial<AgencyProfile>
): Record<string, unknown> => ({
  id: profile.id,
  full_name: profile.fullName,
  email: profile.email,
  phone_number: profile.phoneNumber,
  is_verified: profile.isVerified,

  // Profile completeness
  profile_complete: profile.profileComplete,
  onboarding_complete: profile.onboardingComplete,

  // Company info
  company_name: profile.companyName,
  company_address: profile.companyAddress,
  company_registration_number: profile.companyRegistrationNumber,
  redas_member_id: profile.redasMemberId,

  // Agency type
  agency_type: profile.agencyType,

  // Managed entities
  managed_property_ids: profile.managedPropertyIds,
  landlord_client_ids: profile.landlordClientIds,

  // SLA Settings
  target_response_time_hours: profile.targetResponseTimeHours,
  escalation_email_address: profile.escalationEmailAddress,

  // Stats
  average_sla_performance: profile.averageSlaPerformance,
  total_issues_managed: profile.totalIssuesManaged,
  total_issues_resolved: profile.totalIssuesResolved,

  // Rating
  average_rating: profile.averageRating,
  total_ratings: profile.totalRatings,

  // Tags
  seed_tag: profile.seedTag,
});
