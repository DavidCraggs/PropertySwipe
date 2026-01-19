/**
 * Agency Profile Transformer
 * Handles conversion between Supabase snake_case and TypeScript camelCase
 */

import type { AgencyProfile, LocalArea } from '../../types';
import type { DbRecord } from './index';

/**
 * Transform a Supabase agency_profiles record to a TypeScript AgencyProfile object
 */
export const transformAgencyProfile = (d: DbRecord): AgencyProfile => ({
  id: d.id as string,
  agencyType: (d.agency_type as AgencyProfile['agencyType']) || 'estate_agent',

  // Basic Info
  companyName: (d.company_name as string) || '',
  registrationNumber: (d.registration_number as string) || '',
  tradingName: d.trading_name as string | undefined,

  // Contact
  primaryContactName: (d.primary_contact_name as string) || '',
  email: (d.email as string) || '',
  passwordHash: (d.password_hash as string) || '',
  phone: (d.phone as string) || '',
  address: {
    line1: (d.address_street as string) || (d.address_line1 as string) || '',
    line2: d.address_line2 as string | undefined,
    city: (d.address_city as string) || '',
    county: d.address_county as string | undefined,
    postcode: (d.address_postcode as string) || '',
    country: (d.address_country as string) || 'United Kingdom',
  },

  // Service Areas
  serviceAreas: (d.service_areas as LocalArea[]) || [],

  // Portfolio
  managedPropertyIds: (d.managed_property_ids as string[]) || [],
  landlordClientIds: (d.landlord_client_ids as string[]) || [],
  activeTenantsCount: (d.active_tenants_count as number) || 0,
  totalPropertiesManaged: (d.total_properties_managed as number) || 0,

  // SLA Configuration
  slaConfiguration: {
    emergencyResponseHours: (d.sla_emergency_response_hours as number) || 4,
    urgentResponseHours: (d.sla_urgent_response_hours as number) || 24,
    routineResponseHours: (d.sla_routine_response_hours as number) || 72,
    maintenanceResponseDays: (d.sla_maintenance_response_days as number) || 14,
  },

  // Performance Tracking
  performanceMetrics: {
    averageResponseTimeHours: (d.avg_response_time_hours as number) || 0,
    slaComplianceRate: (d.sla_compliance_rate as number) || 0,
    totalIssuesResolved: (d.total_issues_resolved as number) || 0,
    totalIssuesRaised: (d.total_issues_raised as number) || 0,
    currentOpenIssues: (d.current_open_issues as number) || 0,
  },

  // Compliance
  propertyOmbudsmanMember: (d.property_ombudsman_member as boolean) || false,
  insuranceDetails: d.insurance_provider ? {
    provider: d.insurance_provider as string,
    policyNumber: (d.insurance_policy_number as string) || '',
    expiryDate: new Date(d.insurance_expiry_date as string),
  } : undefined,

  // Branding
  logo: d.logo as string | undefined,
  brandColor: d.brand_color as string | undefined,

  createdAt: new Date(d.created_at as string),
  isActive: (d.is_active as boolean) !== false,
  onboardingComplete: (d.onboarding_complete as boolean) || (d.is_complete as boolean) || false,
});

/**
 * Transform a TypeScript AgencyProfile object to Supabase format for saving
 */
export const transformAgencyProfileToDb = (
  profile: Partial<AgencyProfile>
): Record<string, unknown> => ({
  id: profile.id,
  agency_type: profile.agencyType,

  // Basic Info
  company_name: profile.companyName,
  registration_number: profile.registrationNumber,
  trading_name: profile.tradingName,

  // Contact
  primary_contact_name: profile.primaryContactName,
  email: profile.email,
  password_hash: profile.passwordHash,
  phone: profile.phone,
  address_street: profile.address?.line1, // Legacy column name
  address_line1: profile.address?.line1,
  address_line2: profile.address?.line2,
  address_city: profile.address?.city,
  address_county: profile.address?.county,
  address_postcode: profile.address?.postcode,
  address_country: profile.address?.country,

  // Service Areas
  service_areas: profile.serviceAreas,

  // Portfolio
  managed_property_ids: profile.managedPropertyIds,
  landlord_client_ids: profile.landlordClientIds,
  active_tenants_count: profile.activeTenantsCount,
  total_properties_managed: profile.totalPropertiesManaged,

  // SLA Configuration
  sla_emergency_response_hours: profile.slaConfiguration?.emergencyResponseHours,
  sla_urgent_response_hours: profile.slaConfiguration?.urgentResponseHours,
  sla_routine_response_hours: profile.slaConfiguration?.routineResponseHours,
  sla_maintenance_response_days: profile.slaConfiguration?.maintenanceResponseDays,

  // Performance Tracking
  avg_response_time_hours: profile.performanceMetrics?.averageResponseTimeHours,
  sla_compliance_rate: profile.performanceMetrics?.slaComplianceRate,
  total_issues_resolved: profile.performanceMetrics?.totalIssuesResolved,
  total_issues_raised: profile.performanceMetrics?.totalIssuesRaised,
  current_open_issues: profile.performanceMetrics?.currentOpenIssues,

  // Compliance
  property_ombudsman_member: profile.propertyOmbudsmanMember,
  insurance_provider: profile.insuranceDetails?.provider,
  insurance_policy_number: profile.insuranceDetails?.policyNumber,
  insurance_expiry_date: profile.insuranceDetails?.expiryDate?.toISOString(),

  // Branding
  logo: profile.logo,
  brand_color: profile.brandColor,

  is_active: profile.isActive,
  onboarding_complete: profile.onboardingComplete,
});
