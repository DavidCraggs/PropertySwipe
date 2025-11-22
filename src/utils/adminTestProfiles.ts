import type {
  RenterProfile,
  LandlordProfile,
  AgencyProfile,
  RenterStatus,
} from '../types';
import { hashPassword } from './validation';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Seed tag constants for test profiles
 */
const SEED_TAGS = {
  RENTER: 'seed-renter-001',
  LANDLORD: 'seed-landlord-001',
  ESTATE_AGENT: 'seed-agent-001',
  MANAGEMENT_AGENCY: 'seed-mgmt-001',
} as const;

/**
 * Resolve the actual UUID for a test profile from Supabase using its seed_tag
 * @param seedTag - The seed_tag to look up
 * @param profileType - The type of profile (landlord, renter, or agency)
 * @returns The UUID if found, null otherwise
 */
export const resolveTestProfileUUID = async (
  seedTag: string,
  profileType: 'landlord' | 'renter' | 'agency'
): Promise<string | null> => {
  if (!isSupabaseConfigured()) {
    console.warn('[Admin] Supabase not configured, cannot resolve UUID');
    return null;
  }

  try {
    const tableName = profileType === 'landlord'
      ? 'landlord_profiles'
      : profileType === 'renter'
        ? 'renter_profiles'
        : 'agency_profiles';

    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .eq('seed_tag', seedTag)
      .single();

    if (error) {
      console.warn(`[Admin] Could not resolve UUID for ${profileType} with seed_tag ${seedTag}:`, error.message);
      return null;
    }

    if (data?.id) {
      console.log(`[Admin] Resolved ${profileType} UUID: ${data.id} from seed_tag: ${seedTag}`);
      return data.id;
    }

    return null;
  } catch (error) {
    console.error(`[Admin] Error resolving UUID for ${profileType}:`, error);
    return null;
  }
};

/**
 * Generates a complete test renter profile for admin role switching
 * All data is realistic and complies with RRA 2025
 */
export const generateTestRenter = async (): Promise<RenterProfile> => {
  const passwordHash = await hashPassword('Test1234!');

  // Try to resolve the actual UUID from Supabase
  const resolvedId = await resolveTestProfileUUID(SEED_TAGS.RENTER, 'renter');

  return {
    id: resolvedId || 'test-renter-001', // Fallback to hardcoded ID if not found
    email: 'test.renter@geton.com',
    passwordHash,
    names: 'Test Renter',
    ages: '28',
    localArea: 'Liverpool',
    renterType: 'Young Professional',
    employmentStatus: 'Employed Full-Time',
    monthlyIncome: 2500,
    situation: 'Single',
    status: 'prospective' as RenterStatus,
    preferredMoveInDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    hasPets: false,
    smokingStatus: 'Non-Smoker',
    hasGuarantor: false,
    currentRentalSituation: 'Currently Renting',
    hasRentalHistory: true,
    previousLandlordReference: true,
    receivesHousingBenefit: false,
    receivesUniversalCredit: false,
    onboardingComplete: true,
    createdAt: new Date(),
  };
};

/**
 * Generates a complete test landlord profile
 */
export const generateTestLandlord = async (): Promise<LandlordProfile> => {
  const passwordHash = await hashPassword('Test1234!');

  // Try to resolve the actual UUID from Supabase
  const resolvedId = await resolveTestProfileUUID(SEED_TAGS.LANDLORD, 'landlord');

  return {
    id: resolvedId || 'test-landlord-001', // Fallback to hardcoded ID if not found
    email: 'test.landlord@geton.com',
    passwordHash,
    names: 'Test Landlord',
    propertyType: 'Flat',
    furnishingPreference: 'Furnished',
    preferredTenantTypes: ['Young Professional', 'Professional Sharers'],
    defaultPetsPolicy: {
      willConsiderPets: true,
      requiresPetInsurance: true,
      preferredPetTypes: ['cat', 'dog'],
      maxPetsAllowed: 2,
    },
    prsRegistrationNumber: 'PRS123456789',
    prsRegistrationStatus: 'active',
    ombudsmanScheme: 'property_ombudsman',
    ombudsmanMembershipNumber: 'OM123456',
    isFullyCompliant: true,
    isRegisteredLandlord: true,
    depositScheme: 'mydeposits',
    estateAgentLink: '',
    onboardingComplete: true,
    createdAt: new Date(),
  };
};

/**
 * Generates test estate agent profile
 * CRITICAL: Fetches FULL profile from Supabase to get managedPropertyIds
 */
export const generateTestEstateAgent = async (): Promise<AgencyProfile> => {
  const passwordHash = await hashPassword('Test1234!');

  // NEW: Fetch the FULL profile from Supabase if it exists
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('agency_profiles')
        .select('*')
        .eq('seed_tag', SEED_TAGS.ESTATE_AGENT)
        .single();

      if (!error && data) {
        console.log('[Admin] Fetched full estate agent profile from Supabase with', data.managed_property_ids?.length || 0, 'properties');
        // Return the Supabase data with snake_case converted to camelCase
        return {
          id: data.id,
          email: data.email,
          passwordHash: data.password_hash || passwordHash,
          agencyType: data.agency_type,
          companyName: data.company_name,
          registrationNumber: data.registration_number,
          primaryContactName: data.primary_contact_name,
          phone: data.phone,
          address: {
            street: data.address_street,
            city: data.address_city,
            postcode: data.address_postcode,
          },
          serviceAreas: data.service_areas || [],
          isActive: data.is_active,
          managedPropertyIds: data.managed_property_ids || [],  // CRITICAL: Real data from DB
          landlordClientIds: data.landlord_client_ids || [],    // CRITICAL: Real data from DB
          activeTenantsCount: data.active_tenants_count || 0,
          totalPropertiesManaged: data.total_properties_managed || 0,
          slaConfiguration: {
            emergencyResponseHours: data.sla_emergency_response_hours,
            urgentResponseHours: data.sla_urgent_response_hours,
            routineResponseHours: data.sla_routine_response_hours,
            maintenanceResponseDays: data.sla_maintenance_response_days,
          },
          performanceMetrics: {
            averageResponseTimeHours: data.avg_response_time_hours,
            slaComplianceRate: data.sla_compliance_rate,
            totalIssuesResolved: data.total_issues_resolved,
            totalIssuesRaised: data.total_issues_raised,
            currentOpenIssues: data.current_open_issues,
          },
          propertyOmbudsmanMember: data.property_ombudsman_member,
          onboardingComplete: data.is_complete,
          createdAt: new Date(data.created_at),
        };
      }
    } catch (error) {
      console.error('[Admin] Error fetching estate agent from Supabase:', error);
    }
  }

  // Fallback to template if Supabase fetch fails
  const resolvedId = await resolveTestProfileUUID(SEED_TAGS.ESTATE_AGENT, 'agency');
  console.warn('[Admin] Using fallback template for estate agent (Supabase fetch failed)');

  return {
    id: resolvedId || 'test-estate-agent-001',
    email: 'test.estateagent@geton.com',
    passwordHash,
    agencyType: 'estate_agent',
    companyName: 'Test Estate Agency Ltd',
    registrationNumber: 'EA123456',
    primaryContactName: 'Agent Contact',
    phone: '07700900123',
    address: {
      street: '123 High Street',
      city: 'Liverpool',
      postcode: 'L1 1AA',
    },
    serviceAreas: ['Liverpool', 'Southport', 'Formby'],
    isActive: true,
    managedPropertyIds: [],
    landlordClientIds: [],
    activeTenantsCount: 0,
    totalPropertiesManaged: 0,
    slaConfiguration: {
      emergencyResponseHours: 4,
      urgentResponseHours: 24,
      routineResponseHours: 72,
      maintenanceResponseDays: 14,
    },
    performanceMetrics: {
      averageResponseTimeHours: 12,
      slaComplianceRate: 95,
      totalIssuesResolved: 0,
      totalIssuesRaised: 0,
      currentOpenIssues: 0,
    },
    propertyOmbudsmanMember: true,
    onboardingComplete: true,
    createdAt: new Date(),
  };
};

/**
 * Generates test management agency profile
 * CRITICAL: Fetches FULL profile from Supabase to get managedPropertyIds
 */
export const generateTestManagementAgency = async (): Promise<AgencyProfile> => {
  const passwordHash = await hashPassword('Test1234!');

  // NEW: Fetch the FULL profile from Supabase if it exists
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('agency_profiles')
        .select('*')
        .eq('seed_tag', SEED_TAGS.MANAGEMENT_AGENCY)
        .single();

      if (!error && data) {
        console.log('[Admin] Fetched full management agency profile from Supabase with', data.managed_property_ids?.length || 0, 'properties');
        // Return the Supabase data with snake_case converted to camelCase
        return {
          id: data.id,
          email: data.email,
          passwordHash: data.password_hash || passwordHash,
          agencyType: data.agency_type,
          companyName: data.company_name,
          registrationNumber: data.registration_number,
          primaryContactName: data.primary_contact_name,
          phone: data.phone,
          address: {
            street: data.address_street,
            city: data.address_city,
            postcode: data.address_postcode,
          },
          serviceAreas: data.service_areas || [],
          isActive: data.is_active,
          managedPropertyIds: data.managed_property_ids || [],  // CRITICAL: Real data from DB
          landlordClientIds: data.landlord_client_ids || [],    // CRITICAL: Real data from DB
          activeTenantsCount: data.active_tenants_count || 0,
          totalPropertiesManaged: data.total_properties_managed || 0,
          slaConfiguration: {
            emergencyResponseHours: data.sla_emergency_response_hours,
            urgentResponseHours: data.sla_urgent_response_hours,
            routineResponseHours: data.sla_routine_response_hours,
            maintenanceResponseDays: data.sla_maintenance_response_days,
          },
          performanceMetrics: {
            averageResponseTimeHours: data.avg_response_time_hours,
            slaComplianceRate: data.sla_compliance_rate,
            totalIssuesResolved: data.total_issues_resolved,
            totalIssuesRaised: data.total_issues_raised,
            currentOpenIssues: data.current_open_issues,
          },
          propertyOmbudsmanMember: data.property_ombudsman_member,
          onboardingComplete: data.is_complete,
          createdAt: new Date(data.created_at),
        };
      }
    } catch (error) {
      console.error('[Admin] Error fetching management agency from Supabase:', error);
    }
  }

  // Fallback to template if Supabase fetch fails
  const resolvedId = await resolveTestProfileUUID(SEED_TAGS.MANAGEMENT_AGENCY, 'agency');
  console.warn('[Admin] Using fallback template for management agency (Supabase fetch failed)');

  return {
    id: resolvedId || 'test-management-agency-001',
    email: 'test.managementagency@geton.com',
    passwordHash,
    agencyType: 'management_agency',
    companyName: 'Test Management Services Ltd',
    registrationNumber: 'MA123456',
    primaryContactName: 'Manager Contact',
    phone: '07700900456',
    address: {
      street: '456 Management Road',
      city: 'Manchester',
      postcode: 'M1 1BB',
    },
    serviceAreas: ['Manchester', 'Preston', 'Blackpool'],
    isActive: true,
    managedPropertyIds: [],
    landlordClientIds: [],
    activeTenantsCount: 0,
    totalPropertiesManaged: 0,
    slaConfiguration: {
      emergencyResponseHours: 4,
      urgentResponseHours: 24,
      routineResponseHours: 72,
      maintenanceResponseDays: 14,
    },
    performanceMetrics: {
      averageResponseTimeHours: 10,
      slaComplianceRate: 98,
      totalIssuesResolved: 0,
      totalIssuesRaised: 0,
      currentOpenIssues: 0,
    },
    propertyOmbudsmanMember: true,
    onboardingComplete: true,
    createdAt: new Date(),
  };
};

/**
 * Initialize all test profiles and store them
 * This will resolve UUIDs from Supabase if available
 */
export const initializeTestProfiles = async (): Promise<void> => {
  const testProfiles = {
    renter: await generateTestRenter(),
    landlord: await generateTestLandlord(),
    estate_agent: await generateTestEstateAgent(),
    management_agency: await generateTestManagementAgency(),
  };

  localStorage.setItem('get-on-admin-test-profiles', JSON.stringify(testProfiles));
  console.log('[Admin] Test profiles initialized with resolved UUIDs');
};

/**
 * Get test profile for a specific role
 */
export const getTestProfile = (
  userType: 'renter' | 'landlord' | 'estate_agent' | 'management_agency'
): RenterProfile | LandlordProfile | AgencyProfile | null => {
  const profilesJson = localStorage.getItem('get-on-admin-test-profiles');
  if (!profilesJson) return null;

  const profiles = JSON.parse(profilesJson);
  return profiles[userType] || null;
};

