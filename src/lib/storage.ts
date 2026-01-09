/**
 * Storage abstraction layer for GetOn Rental Platform
 * Automatically uses Supabase when configured, falls back to localStorage
 * Updated for RRA 2025 compliance
 */

import { supabase, isSupabaseConfigured } from './supabase';
import type {
  LandlordProfile,
  RenterProfile,
  AgencyProfile,
  Property,
  PropertyType,
  FurnishingType,
  EPCRating,
  PRSRegistrationStatus,
  Match,
  Rating,
  UserRatingsSummary,
  EvictionNotice,
  HazardReport,
  Dispute,
  AgencyLinkInvitation,
  AgencyPropertyLink,
  Message,
  Conversation,
  ConversationType,
  SendMessageParams,
  ViewingPreference,
  Issue,
  RenterInvite,
  InviteValidationResult,
  AgencyLandlordConversation,
  AgencyLandlordMessage,
  SendAgencyLandlordMessageParams,
  PropertyConversationGroup,
  LandlordConversationGroup,
  AgencyConversationGroup,
  // Property management types
  PropertyCost,
  PropertyWithDetails,
  OccupancyStatus,
  // Legacy aliases for backward compatibility
  VendorProfile,
  BuyerProfile,
} from '../types';

// =====================================================
// LANDLORD PROFILES (formerly Vendor Profiles)
// =====================================================

export const saveLandlordProfile = async (profile: LandlordProfile): Promise<LandlordProfile> => {
  if (isSupabaseConfigured()) {
    const profileData = {
      email: profile.email,
      password_hash: profile.passwordHash,
      names: profile.names,
      property_type: profile.propertyType,
      furnishing_preference: profile.furnishingPreference,
      preferred_tenant_types: profile.preferredTenantTypes,
      default_pets_policy: profile.defaultPetsPolicy,
      prs_registration_number: profile.prsRegistrationNumber,
      prs_registration_status: profile.prsRegistrationStatus,
      prs_registration_date: profile.prsRegistrationDate,
      prs_registration_expiry_date: profile.prsRegistrationExpiryDate,
      ombudsman_scheme: profile.ombudsmanScheme,
      ombudsman_membership_number: profile.ombudsmanMembershipNumber,
      deposit_scheme: profile.depositScheme,
      estate_agent_link: profile.estateAgentLink,
      // Store first propertyId for backward compatibility with database column
      property_id: profile.propertyIds?.[0] || null,
      is_complete: profile.onboardingComplete,
    };

    // Check if profile has a valid UUID
    const isValidUUID = profile.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profile.id);

    if (isValidUUID) {
      // Update existing profile
      console.log('[Storage] Updating landlord profile with ID:', profile.id);

      const { data, error } = await supabase
        .from('landlord_profiles')
        .update(profileData)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) {
        console.error('[Storage] Landlord profile update error:', error);
        console.error('[Storage] Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw error;
      }

      console.log('[Storage] Landlord profile updated successfully with ID:', data.id);
      return { ...profile, id: data.id };
    } else {
      // Insert new profile (let Supabase generate UUID)
      console.log('[Storage] Inserting new landlord profile');

      const { data, error } = await supabase
        .from('landlord_profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error('[Storage] Landlord profile insert error:', error);
        console.error('[Storage] Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw error;
      }

      console.log('[Storage] Landlord profile created successfully with ID:', data.id);
      return { ...profile, id: data.id };
    }
  } else {
    // Store individual profile
    localStorage.setItem(`landlord-profile-${profile.id}`, JSON.stringify(profile));

    // Also maintain a list of all landlord profiles for loginWithPassword
    const profilesJson = localStorage.getItem('get-on-landlord-profiles');
    const profiles: LandlordProfile[] = profilesJson ? JSON.parse(profilesJson) : [];
    const existingIndex = profiles.findIndex(p => p.id === profile.id);

    if (existingIndex >= 0) {
      profiles[existingIndex] = profile;
    } else {
      profiles.push(profile);
    }

    localStorage.setItem('get-on-landlord-profiles', JSON.stringify(profiles));
    return profile;
  }
};

export const getLandlordProfile = async (id: string): Promise<LandlordProfile | null> => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('landlord_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;

    return {
      id: data.id,
      email: data.email,
      passwordHash: data.password_hash,
      names: data.names,
      propertyType: data.property_type,
      furnishingPreference: data.furnishing_preference,
      preferredTenantTypes: data.preferred_tenant_types || [],
      defaultPetsPolicy: data.default_pets_policy,
      prsRegistrationNumber: data.prs_registration_number,
      prsRegistrationStatus: data.prs_registration_status,
      prsRegistrationDate: data.prs_registration_date ? new Date(data.prs_registration_date) : undefined,
      prsRegistrationExpiryDate: data.prs_registration_expiry_date ? new Date(data.prs_registration_expiry_date) : undefined,
      ombudsmanScheme: data.ombudsman_scheme,
      ombudsmanMembershipNumber: data.ombudsman_membership_number,
      isRegisteredLandlord: data.prs_registration_status === 'active',
      isFullyCompliant: data.is_fully_compliant,
      depositScheme: data.deposit_scheme,
      estateAgentLink: data.estate_agent_link,
      // Map legacy property_id to propertyIds array for backward compatibility
      propertyIds: data.property_id ? [data.property_id] : undefined,
      createdAt: new Date(data.created_at),
      onboardingComplete: data.is_complete,
      ratingsSummary: data.average_rating ? {
        userId: data.id,
        userType: 'landlord' as const,
        totalRatings: data.total_ratings || 0,
        averageOverallScore: data.average_rating || 0,
        averageCategoryScores: {
          communication: 0,
          cleanliness: 0,
          reliability: 0,
          property_condition: 0,
        },
        wouldRecommendPercentage: 0,
        verifiedTenancies: 0,
      } : undefined,
    };
  } else {
    const stored = localStorage.getItem(`landlord-profile-${id}`);
    return stored ? JSON.parse(stored) : null;
  }
};

// Legacy aliases for backward compatibility (DEPRECATED)
export const saveVendorProfile = saveLandlordProfile as unknown as (profile: VendorProfile) => Promise<VendorProfile>;
export const getVendorProfile = getLandlordProfile as unknown as (id: string) => Promise<VendorProfile | null>;

// =====================================================
// RENTER PROFILES (formerly Buyer Profiles)
// =====================================================

export const saveRenterProfile = async (profile: RenterProfile): Promise<RenterProfile> => {
  if (isSupabaseConfigured()) {
    const profileData = {
      email: profile.email,
      password_hash: profile.passwordHash,
      status: profile.status || 'prospective', // Add status field
      situation: profile.situation,
      names: profile.names,
      ages: profile.ages,
      local_area: profile.localArea,
      renter_type: profile.renterType,
      employment_status: profile.employmentStatus,
      monthly_income: profile.monthlyIncome,
      has_pets: profile.hasPets,
      pet_details: profile.petDetails,
      smoking_status: profile.smokingStatus,
      has_guarantor: profile.hasGuarantor,
      preferred_move_in_date: profile.preferredMoveInDate,
      current_rental_situation: profile.currentRentalSituation,
      has_rental_history: profile.hasRentalHistory,
      previous_landlord_reference: profile.previousLandlordReference,
      receives_housing_benefit: profile.receivesHousingBenefit,
      receives_universal_credit: profile.receivesUniversalCredit,
      number_of_children: profile.numberOfChildren,
      is_complete: profile.onboardingComplete,
      // Add current tenancy fields
      current_property_id: profile.currentPropertyId || null,
      current_landlord_id: profile.currentLandlordId || null,
      current_agency_id: profile.currentAgencyId || null,
    };

    // Check if profile has a valid UUID
    const isValidUUID = profile.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profile.id);

    if (isValidUUID) {
      // Update existing profile
      const { data, error } = await supabase
        .from('renter_profiles')
        .update(profileData)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;
      return { ...profile, id: data.id };
    } else {
      // Insert new profile (let Supabase generate UUID)
      const { data, error } = await supabase
        .from('renter_profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) throw error;
      return { ...profile, id: data.id };
    }
  } else {
    // Store individual profile
    localStorage.setItem(`renter-profile-${profile.id}`, JSON.stringify(profile));

    // Also maintain a list of all renter profiles for loginWithPassword
    const profilesJson = localStorage.getItem('get-on-renter-profiles');
    const profiles: RenterProfile[] = profilesJson ? JSON.parse(profilesJson) : [];
    const existingIndex = profiles.findIndex(p => p.id === profile.id);

    if (existingIndex >= 0) {
      profiles[existingIndex] = profile;
    } else {
      profiles.push(profile);
    }

    localStorage.setItem('get-on-renter-profiles', JSON.stringify(profiles));
    return profile;
  }
};

export const getRenterProfile = async (id: string): Promise<RenterProfile | null> => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('renter_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;

    return {
      id: data.id,
      email: data.email,
      passwordHash: data.password_hash,
      status: data.status || 'prospective', // Map status field
      situation: data.situation,
      names: data.names,
      ages: data.ages,
      localArea: data.local_area,
      renterType: data.renter_type,
      employmentStatus: data.employment_status,
      monthlyIncome: data.monthly_income,
      hasPets: data.has_pets,
      petDetails: data.pet_details,
      smokingStatus: data.smoking_status,
      hasGuarantor: data.has_guarantor,
      preferredMoveInDate: data.preferred_move_in_date ? new Date(data.preferred_move_in_date) : undefined,
      currentRentalSituation: data.current_rental_situation,
      hasRentalHistory: data.has_rental_history,
      previousLandlordReference: data.previous_landlord_reference,
      receivesHousingBenefit: data.receives_housing_benefit,
      receivesUniversalCredit: data.receives_universal_credit,
      numberOfChildren: data.number_of_children,
      createdAt: new Date(data.created_at),
      onboardingComplete: data.is_complete,
      // Map current tenancy fields
      currentPropertyId: data.current_property_id || undefined,
      currentLandlordId: data.current_landlord_id || undefined,
      currentAgencyId: data.current_agency_id || undefined,
      ratingsSummary: data.average_rating ? {
        userId: data.id,
        userType: 'renter' as const,
        totalRatings: data.total_ratings || 0,
        averageOverallScore: data.average_rating || 0,
        averageCategoryScores: {
          communication: 0,
          cleanliness: 0,
          reliability: 0,
          respect_for_property: 0,
        },
        wouldRecommendPercentage: 0,
        verifiedTenancies: 0,
      } : undefined,
    };
  } else {
    const stored = localStorage.getItem(`renter-profile-${id}`);
    return stored ? JSON.parse(stored) : null;
  }
};

// Legacy aliases for backward compatibility (DEPRECATED)
export const saveBuyerProfile = saveRenterProfile as unknown as (profile: BuyerProfile) => Promise<BuyerProfile>;
export const getBuyerProfile = getRenterProfile as unknown as (id: string) => Promise<BuyerProfile | null>;

// =====================================================
// AGENCY PROFILES (Estate Agents & Management Agencies)
// =====================================================

export const saveAgencyProfile = async (profile: AgencyProfile | Omit<AgencyProfile, 'id'>): Promise<AgencyProfile> => {
  if (isSupabaseConfigured()) {
    // Cast to Record to handle both camelCase TypeScript objects and snake_case database objects
    // This is needed because data may come from either the app (camelCase) or database (snake_case)
    const p = profile as Record<string, unknown>;

    const profileData: Record<string, unknown> = {
      email: profile.email,
      password_hash: p.password_hash || profile.passwordHash,
      agency_type: p.agency_type || profile.agencyType,
      company_name: p.company_name || profile.companyName,
      registration_number: p.registration_number || profile.registrationNumber,
      primary_contact_name: p.primary_contact_name || profile.primaryContactName,
      phone: profile.phone,
      service_areas: p.service_areas || profile.serviceAreas,
      managed_property_ids: p.managed_property_ids || profile.managedPropertyIds,
      landlord_client_ids: p.landlord_client_ids || profile.landlordClientIds,
      active_tenants_count: p.active_tenants_count ?? profile.activeTenantsCount,
      total_properties_managed: p.total_properties_managed ?? profile.totalPropertiesManaged,
      property_ombudsman_member: p.property_ombudsman_member ?? profile.propertyOmbudsmanMember,
      is_active: p.is_active ?? profile.isActive,
      is_complete: p.is_complete ?? profile.onboardingComplete,
    };

    // Handle address - either flat fields or nested object
    if (p.address_street || profile.address) {
      profileData.address_street = p.address_street || profile.address?.street;
      profileData.address_city = p.address_city || profile.address?.city;
      profileData.address_postcode = p.address_postcode || profile.address?.postcode;
    }

    // Handle SLA configuration - either flat fields or nested object
    if (p.sla_emergency_response_hours !== undefined || profile.slaConfiguration) {
      profileData.sla_emergency_response_hours = p.sla_emergency_response_hours ?? profile.slaConfiguration?.emergencyResponseHours;
      profileData.sla_urgent_response_hours = p.sla_urgent_response_hours ?? profile.slaConfiguration?.urgentResponseHours;
      profileData.sla_routine_response_hours = p.sla_routine_response_hours ?? profile.slaConfiguration?.routineResponseHours;
      profileData.sla_maintenance_response_days = p.sla_maintenance_response_days ?? profile.slaConfiguration?.maintenanceResponseDays;
    }

    // Handle performance metrics - either flat fields or nested object
    if (p.avg_response_time_hours !== undefined || profile.performanceMetrics) {
      profileData.avg_response_time_hours = p.avg_response_time_hours ?? profile.performanceMetrics?.averageResponseTimeHours;
      profileData.sla_compliance_rate = p.sla_compliance_rate ?? profile.performanceMetrics?.slaComplianceRate;
      profileData.total_issues_resolved = p.total_issues_resolved ?? profile.performanceMetrics?.totalIssuesResolved;
      profileData.total_issues_raised = p.total_issues_raised ?? profile.performanceMetrics?.totalIssuesRaised;
      profileData.current_open_issues = p.current_open_issues ?? profile.performanceMetrics?.currentOpenIssues;
    }

    // Add seed_tag if present
    if (p.seed_tag) {
      profileData.seed_tag = p.seed_tag;
    }

    if ('id' in profile && profile.id) {
      // Update existing profile
      const { data, error } = await supabase
        .from('agency_profiles')
        .update(profileData)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;
      return { ...profile, id: data.id };
    } else {
      // Insert new profile (let Supabase generate UUID)
      const { data, error } = await supabase
        .from('agency_profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) throw error;
      console.log('[Storage] Agency profile created successfully with ID:', data.id);
      return { ...profile, id: data.id };
    }
  } else {
    // localStorage fallback
    const agencyId = ('id' in profile && profile.id) ? profile.id : `agency-${Date.now()}`;
    const updatedProfile = { ...profile, id: agencyId } as AgencyProfile;

    // Store in array of agency profiles
    const storedProfiles = localStorage.getItem('get-on-agency-profiles');
    const profiles: AgencyProfile[] = storedProfiles ? JSON.parse(storedProfiles) : [];

    const existingIndex = profiles.findIndex(p => p.id === agencyId);
    if (existingIndex >= 0) {
      profiles[existingIndex] = updatedProfile;
    } else {
      profiles.push(updatedProfile);
    }

    localStorage.setItem('get-on-agency-profiles', JSON.stringify(profiles));
    return updatedProfile;
  }
};

export const getAgencyProfile = async (id: string): Promise<AgencyProfile | null> => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('agency_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;

    return {
      id: data.id,
      email: data.email,
      passwordHash: data.password_hash,
      agencyType: data.agency_type,
      companyName: data.company_name,
      registrationNumber: data.registration_number,
      primaryContactName: data.primary_contact_name,
      phone: data.phone,
      address: data.address,
      serviceAreas: data.service_areas,
      managedPropertyIds: data.managed_property_ids || [],
      landlordClientIds: data.landlord_client_ids || [],
      activeTenantsCount: data.active_tenants_count,
      totalPropertiesManaged: data.total_properties_managed,
      slaConfiguration: data.sla_configuration,
      performanceMetrics: data.performance_metrics,
      propertyOmbudsmanMember: data.property_ombudsman_member,
      insuranceDetails: data.insurance_details,
      createdAt: new Date(data.created_at),
      isActive: data.is_active,
      onboardingComplete: data.is_complete,
    };
  } else {
    const storedProfiles = localStorage.getItem('get-on-agency-profiles');
    if (!storedProfiles) return null;

    const profiles: AgencyProfile[] = JSON.parse(storedProfiles);
    return profiles.find(p => p.id === id) || null;
  }
};

// =====================================================
// RENTAL PROPERTIES
// =====================================================

export const saveProperty = async (property: Property | Omit<Property, 'id'>): Promise<Property> => {
  if (isSupabaseConfigured()) {
    // Cast to Record to handle both camelCase TypeScript objects and snake_case database objects
    const prop = property as Record<string, unknown>;

    const propertyData: Record<string, unknown> = {
      landlord_id: prop.landlord_id || property.landlordId || null,
      managing_agency_id: prop.managing_agency_id || property.managingAgencyId || null,
      marketing_agent_id: prop.marketing_agent_id || property.marketingAgentId || null,
      street: property.address?.street || prop.street,
      city: property.address?.city || prop.city,
      postcode: property.address?.postcode || prop.postcode,
      council: property.address?.council || prop.council,

      // Rental pricing (not purchase price)
      rent_pcm: property.rentPcm || prop.rent_pcm,
      deposit: property.deposit,

      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      property_type: property.propertyType || prop.property_type,
      year_built: property.yearBuilt || prop.year_built,
      description: property.description,
      epc_rating: property.epcRating || prop.epc_rating,
      images: property.images,
      features: property.features,

      // Rental-specific fields
      furnishing: property.furnishing,
      available_from: property.availableFrom || prop.available_from,
      tenancy_type: property.tenancyType || prop.tenancy_type || 'Periodic', // RRA 2025
      max_occupants: property.maxOccupants || prop.max_occupants,
      pets_policy: property.petsPolicy || prop.pets_policy,

      // Bills
      council_tax_band: property.bills?.councilTaxBand || prop.council_tax_band,
      gas_electric_included: property.bills?.gasElectricIncluded ?? prop.gas_electric_included ?? false,
      water_included: property.bills?.waterIncluded ?? prop.water_included ?? false,
      internet_included: property.bills?.internetIncluded ?? prop.internet_included ?? false,

      // RRA 2025 Compliance
      meets_decent_homes_standard: property.meetsDecentHomesStandard ?? prop.meets_decent_homes_standard,
      awaabs_law_compliant: property.awaabsLawCompliant ?? prop.awaabs_law_compliant,
      last_safety_inspection_date: property.lastSafetyInspectionDate || prop.last_safety_inspection_date,
      prs_property_registration_number: property.prsPropertyRegistrationNumber || prop.prs_property_registration_number,
      prs_property_registration_status: property.prsPropertyRegistrationStatus || prop.prs_property_registration_status,

      is_available: property.isAvailable ?? prop.is_available,
      listing_date: property.listingDate || prop.listing_date,
      preferred_minimum_stay: property.preferredMinimumStay ?? prop.preferred_minimum_stay,
      accepts_short_term_tenants: property.acceptsShortTermTenants ?? prop.accepts_short_term_tenants,
    };

    // Add seed_tag if present
    if (prop.seed_tag) {
      propertyData.seed_tag = prop.seed_tag;
    }

    // Check if property has a valid UUID (for updates) or needs to be inserted
    const isValidUUID = ('id' in property && property.id) && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(property.id);

    if (isValidUUID) {
      // Update existing property
      const { data, error } = await supabase
        .from('properties')
        .update(propertyData)
        .eq('id', property.id)
        .select()
        .single();

      if (error) throw error;

      return {
        ...property,
        id: data.id,
        landlordId: data.landlord_id || property.landlordId,
      };
    } else {
      // Insert new property (let Supabase generate UUID)
      console.log('[Storage] Inserting new property');

      const { data, error } = await supabase
        .from('properties')
        .insert(propertyData)
        .select()
        .single();

      if (error) {
        console.error('[Storage] Supabase insert error:', error);
        console.error('[Storage] Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw error;
      }

      console.log('[Storage] Property created successfully with ID:', data.id);

      return {
        ...property,
        id: data.id,
        landlordId: data.landlord_id || property.landlordId,
      };
    }
  } else {
    const allProperties = await getAllProperties();
    const propertyId = ('id' in property && property.id) ? property.id : `prop-${Date.now()}`;
    const propertyWithId = { ...property, id: propertyId } as Property;
    const index = allProperties.findIndex(p => p.id === propertyId);
    if (index >= 0) {
      allProperties[index] = propertyWithId;
    } else {
      allProperties.push(propertyWithId);
    }
    localStorage.setItem('properties', JSON.stringify(allProperties));
    return propertyWithId;
  }
};

// Pagination options for property queries
export interface PropertyQueryOptions {
  limit?: number;
  offset?: number;
  filters?: {
    rentMin?: number;
    rentMax?: number;
    city?: string;
    bedrooms?: number;
    propertyType?: string;
  };
}

// Response type for paginated queries
export interface PaginatedProperties {
  data: Property[];
  total: number;
  hasMore: boolean;
}

// Get properties with pagination support
export const getPropertiesPaginated = async (
  options: PropertyQueryOptions = {}
): Promise<PaginatedProperties> => {
  const { limit = 50, offset = 0, filters = {} } = options;

  if (!isSupabaseConfigured()) {
    const stored = localStorage.getItem('properties');
    const allProperties: Property[] = stored ? JSON.parse(stored) : [];
    return {
      data: allProperties.slice(offset, offset + limit),
      total: allProperties.length,
      hasMore: offset + limit < allProperties.length,
    };
  }

  let query = supabase
    .from('properties')
    .select('*', { count: 'exact' })
    .eq('is_available', true);

  // Apply filters
  if (filters.rentMin) query = query.gte('rent_pcm', filters.rentMin);
  if (filters.rentMax) query = query.lte('rent_pcm', filters.rentMax);
  if (filters.city) query = query.ilike('city', `%${filters.city}%`);
  if (filters.bedrooms) query = query.eq('bedrooms', filters.bedrooms);
  if (filters.propertyType) query = query.eq('property_type', filters.propertyType);

  // Apply pagination and ordering
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('[Storage] Paginated query error:', error);
    throw error;
  }

  const total = count ?? 0;
  const transformedData = (data || []).map(transformSupabasePropertyToLocal);

  return {
    data: transformedData,
    total,
    hasMore: offset + limit < total,
  };
};

// Helper function to transform Supabase property to local Property type
const transformSupabasePropertyToLocal = (d: Record<string, unknown>): Property => ({
  id: d.id as string,
  landlordId: (d.landlord_id as string) || '',
  managingAgencyId: (d.managing_agency_id as string) || undefined,
  marketingAgentId: (d.marketing_agent_id as string) || undefined,
  address: {
    street: d.street as string,
    city: d.city as string,
    postcode: d.postcode as string,
    council: d.council as string,
  },
  rentPcm: d.rent_pcm as number,
  deposit: d.deposit as number,
  maxRentInAdvance: 1, // RRA 2025: Hardcoded to 1 month by law
  bedrooms: d.bedrooms as number,
  bathrooms: d.bathrooms as number,
  propertyType: d.property_type as Property['propertyType'],
  yearBuilt: d.year_built as number,
  description: d.description as string,
  epcRating: d.epc_rating as Property['epcRating'],
  images: d.images as string[],
  features: d.features as string[],
  furnishing: d.furnishing as Property['furnishing'],
  availableFrom: d.available_from as string,
  tenancyType: d.tenancy_type as Property['tenancyType'],
  maxOccupants: d.max_occupants as number,
  petsPolicy: d.pets_policy as Property['petsPolicy'],
  bills: {
    councilTaxBand: d.council_tax_band as string,
    gasElectricIncluded: d.gas_electric_included as boolean,
    waterIncluded: d.water_included as boolean,
    internetIncluded: d.internet_included as boolean,
  },
  meetsDecentHomesStandard: d.meets_decent_homes_standard as boolean,
  awaabsLawCompliant: d.awaabs_law_compliant as boolean,
  lastSafetyInspectionDate: d.last_safety_inspection_date ? new Date(d.last_safety_inspection_date as string) : undefined,
  prsPropertyRegistrationNumber: d.prs_property_registration_number as string,
  prsPropertyRegistrationStatus: d.prs_property_registration_status as Property['prsPropertyRegistrationStatus'],
  canBeMarketed: d.can_be_marketed as boolean,
  isAvailable: d.is_available as boolean,
  listingDate: d.listing_date as string,
  preferredMinimumStay: d.preferred_minimum_stay as number,
  acceptsShortTermTenants: d.accepts_short_term_tenants as boolean,
});

// Get a single property by ID - efficient single-row query instead of fetching all properties
export const getPropertyById = async (propertyId: string): Promise<Property | null> => {
  if (!propertyId) return null;

  if (!isSupabaseConfigured()) {
    const stored = localStorage.getItem('properties');
    const properties: Property[] = stored ? JSON.parse(stored) : [];
    return properties.find(p => p.id === propertyId) || null;
  }

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error('[Storage] Error fetching property by ID:', error);
    throw error;
  }

  return data ? transformSupabasePropertyToLocal(data) : null;
};

// Get multiple properties by their IDs - efficient batch query using IN filter
export const getPropertiesByIds = async (propertyIds: string[]): Promise<Property[]> => {
  if (!propertyIds || propertyIds.length === 0) return [];

  if (!isSupabaseConfigured()) {
    const stored = localStorage.getItem('properties');
    const properties: Property[] = stored ? JSON.parse(stored) : [];
    return properties.filter(p => propertyIds.includes(p.id));
  }

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .in('id', propertyIds);

  if (error) {
    console.error('[Storage] Error fetching properties by IDs:', error);
    throw error;
  }

  return (data || []).map(transformSupabasePropertyToLocal);
};

// Original function maintained for backwards compatibility (uses default limit of 100)
export const getAllProperties = async (): Promise<Property[]> => {
  const supabaseConfigured = isSupabaseConfigured();
  console.log('[Storage] getAllProperties called - Supabase configured:', supabaseConfigured);

  if (supabaseConfigured) {
    console.log('[Storage] Fetching rental properties from Supabase (limit: 100)...');

    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('is_available', true)
      .order('created_at', { ascending: false })
      .limit(100); // Add reasonable default limit to prevent unbounded queries

    if (error) {
      console.error('[Storage] Supabase query error:', error);
      throw error;
    }

    console.log(`[Storage] Supabase returned ${data?.length || 0} rental properties`);

    if (data && data.length > 0) {
      console.log('[Storage] First property sample:', {
        id: data[0].id,
        street: data[0].street,
        city: data[0].city,
        rentPcm: data[0].rent_pcm,
        canBeMarketed: data[0].can_be_marketed,
      });
    }

    return (data || []).map(d => ({
      id: d.id,
      landlordId: d.landlord_id || '',
      managingAgencyId: d.managing_agency_id || undefined,  // CRITICAL FIX: Return agency IDs
      marketingAgentId: d.marketing_agent_id || undefined,  // CRITICAL FIX: Return agency IDs
      address: {
        street: d.street,
        city: d.city,
        postcode: d.postcode,
        council: d.council,
      },

      // Rental pricing
      rentPcm: d.rent_pcm,
      deposit: d.deposit,
      maxRentInAdvance: 1, // RRA 2025: Hardcoded to 1 month by law

      bedrooms: d.bedrooms,
      bathrooms: d.bathrooms,
      propertyType: d.property_type,
      yearBuilt: d.year_built,
      description: d.description,
      epcRating: d.epc_rating,
      images: d.images,
      features: d.features,

      // Rental-specific
      furnishing: d.furnishing,
      availableFrom: d.available_from,
      tenancyType: d.tenancy_type,
      maxOccupants: d.max_occupants,
      petsPolicy: d.pets_policy,

      // Bills
      bills: {
        councilTaxBand: d.council_tax_band,
        gasElectricIncluded: d.gas_electric_included,
        waterIncluded: d.water_included,
        internetIncluded: d.internet_included,
      },

      // RRA 2025 Compliance
      meetsDecentHomesStandard: d.meets_decent_homes_standard,
      awaabsLawCompliant: d.awaabs_law_compliant,
      lastSafetyInspectionDate: d.last_safety_inspection_date ? new Date(d.last_safety_inspection_date) : undefined,
      prsPropertyRegistrationNumber: d.prs_property_registration_number,
      prsPropertyRegistrationStatus: d.prs_property_registration_status,
      canBeMarketed: d.can_be_marketed,

      isAvailable: d.is_available,
      listingDate: d.listing_date,
      preferredMinimumStay: d.preferred_minimum_stay,
      acceptsShortTermTenants: d.accepts_short_term_tenants,
    }));
  } else {
    console.log('[Storage] Supabase not configured, using localStorage');
    const stored = localStorage.getItem('properties');
    const properties = stored ? JSON.parse(stored) : [];
    console.log(`[Storage] localStorage returned ${properties.length} properties`);
    return properties;
  }
};

export const deleteProperty = async (id: string): Promise<void> => {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } else {
    const allProperties = await getAllProperties();
    const filtered = allProperties.filter(p => p.id !== id);
    localStorage.setItem('properties', JSON.stringify(filtered));
  }
};

// =====================================================
// RENTAL MATCHES (Landlord ↔ Renter)
// =====================================================

export const saveMatch = async (match: Match | Omit<Match, 'id'>): Promise<Match> => {
  if (isSupabaseConfigured()) {
    // Cast to Record to handle both camelCase TypeScript objects and snake_case database objects
    const m = match as Record<string, unknown>;

    const matchData: Record<string, unknown> = {
      property_id: m.property_id || match.propertyId,
      landlord_id: m.landlord_id || match.landlordId,
      renter_id: m.renter_id || match.renterId,
      managing_agency_id: m.managing_agency_id || match.managingAgencyId || null,
      marketing_agent_id: m.marketing_agent_id || match.marketingAgentId || null,
      renter_name: m.renter_name || match.renterName,
      renter_profile: m.renter_profile || match.renterProfile,
      messages: match.messages,
      last_message_at: m.last_message_at || match.lastMessageAt,
      unread_count: m.unread_count ?? match.unreadCount,
      has_viewing_scheduled: m.has_viewing_scheduled ?? match.hasViewingScheduled,
      confirmed_viewing_date: m.confirmed_viewing_date || match.confirmedViewingDate,
      viewing_preference: m.viewing_preference || match.viewingPreference,
      tenancy_start_date: m.tenancy_start_date || match.tenancyStartDate,
      can_rate: m.can_rate ?? match.canRate,
      has_landlord_rated: m.has_landlord_rated ?? match.hasLandlordRated,
      has_renter_rated: m.has_renter_rated ?? match.hasRenterRated,
      landlord_rating_id: m.landlord_rating_id || match.landlordRatingId,
      renter_rating_id: m.renter_rating_id || match.renterRatingId,
    };

    // Add seed_tag if present
    if (m.seed_tag) {
      matchData.seed_tag = m.seed_tag;
    }

    // Check if match has a valid UUID
    const isValidUUID = ('id' in match && match.id) && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(match.id);

    if (isValidUUID) {
      // Update existing match
      const { data, error } = await supabase
        .from('matches')
        .update(matchData)
        .eq('id', match.id)
        .select()
        .single();

      if (error) throw error;
      return { ...match, id: data.id } as Match;
    } else {
      // Insert new match (let Supabase generate UUID)
      const { data, error } = await supabase
        .from('matches')
        .insert(matchData)
        .select()
        .single();

      if (error) throw error;
      return { ...match, id: data.id } as Match;
    }
  } else {
    const allMatches = await getAllMatches();
    const matchId = ('id' in match && match.id) ? match.id : `match-${Date.now()}`;
    const matchWithId = { ...match, id: matchId } as Match;
    const index = allMatches.findIndex(m => m.id === matchId);
    if (index >= 0) {
      allMatches[index] = matchWithId;
    } else {
      allMatches.push(matchWithId);
    }
    localStorage.setItem('matches', JSON.stringify(allMatches));
    return matchWithId;
  }
};

export const getAllMatches = async (): Promise<Match[]> => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        property:properties(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(d => ({
      id: d.id,
      propertyId: d.property_id,
      managingAgencyId: d.managing_agency_id || undefined,  // CRITICAL FIX: Return match agency IDs
      marketingAgentId: d.marketing_agent_id || undefined,  // CRITICAL FIX: Return match agency IDs
      property: d.property ? {
        id: d.property.id,
        landlordId: d.property.landlord_id || '',
        managingAgencyId: d.property.managing_agency_id || undefined,  // CRITICAL FIX: Return property agency IDs
        marketingAgentId: d.property.marketing_agent_id || undefined,  // CRITICAL FIX: Return property agency IDs
        address: {
          street: d.property.street,
          city: d.property.city,
          postcode: d.property.postcode,
          council: d.property.council,
        },
        rentPcm: d.property.rent_pcm,
        deposit: d.property.deposit,
        maxRentInAdvance: 1 as const, // RRA 2025 requirement
        bedrooms: d.property.bedrooms,
        bathrooms: d.property.bathrooms,
        propertyType: d.property.property_type,
        yearBuilt: d.property.year_built,
        description: d.property.description,
        epcRating: d.property.epc_rating,
        images: d.property.images,
        features: d.property.features,
        furnishing: d.property.furnishing,
        availableFrom: d.property.available_from,
        tenancyType: d.property.tenancy_type,
        maxOccupants: d.property.max_occupants,
        petsPolicy: d.property.pets_policy,
        bills: {
          councilTaxBand: d.property.council_tax_band,
          gasElectricIncluded: d.property.gas_electric_included,
          waterIncluded: d.property.water_included,
          internetIncluded: d.property.internet_included,
        },
        meetsDecentHomesStandard: d.property.meets_decent_homes_standard,
        awaabsLawCompliant: d.property.awaabs_law_compliant,
        prsPropertyRegistrationStatus: d.property.prs_property_registration_status,
        canBeMarketed: d.property.can_be_marketed,
        isAvailable: d.property.is_available,
        listingDate: d.property.listing_date,
        preferredMinimumStay: d.property.preferred_minimum_stay,
        acceptsShortTermTenants: d.property.accepts_short_term_tenants,
      } as Property : {} as unknown as Property,
      landlordId: d.landlord_id,
      landlordName: `Landlord ${d.landlord_id?.substring(0, 8)}`,
      renterId: d.renter_id,
      renterName: d.renter_name,
      renterProfile: d.renter_profile,
      timestamp: d.created_at,
      messages: d.messages || [],
      lastMessageAt: d.last_message_at,
      unreadCount: d.unread_count || 0,
      hasViewingScheduled: d.has_viewing_scheduled || false,
      confirmedViewingDate: d.confirmed_viewing_date ? new Date(d.confirmed_viewing_date) : undefined,
      viewingPreference: d.viewing_preference,
      applicationStatus: d.application_status || 'pending',
      applicationSubmittedAt: d.application_submitted_at ? new Date(d.application_submitted_at) : undefined,
      tenancyStartDate: d.tenancy_start_date ? new Date(d.tenancy_start_date) : undefined,
      tenancyNoticedDate: d.tenancy_noticed_date ? new Date(d.tenancy_noticed_date) : undefined,
      isUnderEvictionProceedings: d.is_under_eviction_proceedings || false,
      rentArrears: d.rent_arrears || {
        totalOwed: 0,
        monthsMissed: 0,
        consecutiveMonthsMissed: 0,
      },
      canRate: d.can_rate || false,
      hasLandlordRated: d.has_landlord_rated,
      hasRenterRated: d.has_renter_rated,
      landlordRatingId: d.landlord_rating_id,
      renterRatingId: d.renter_rating_id,
      // New tenancy lifecycle fields
      tenancyStatus: d.tenancy_status || 'prospective',
      activeIssueIds: d.active_issue_ids || [],
      totalIssuesRaised: d.total_issues_raised || 0,
      totalIssuesResolved: d.total_issues_resolved || 0,
    }));
  } else {
    const stored = localStorage.getItem('matches');
    return stored ? JSON.parse(stored) : [];
  }
};

// =====================================================
// VIEWING REQUESTS
// =====================================================

export const createViewingRequest = async (viewing: ViewingPreference): Promise<ViewingPreference> => {
  if (isSupabaseConfigured()) {
    // In Supabase, viewing preferences are stored on the match record
    // We need to update the match with this viewing preference
    const matchId = viewing.matchId;

    // First fetch the match to ensure it exists
    const { error: fetchError } = await supabase
      .from('matches')
      .select('id')
      .eq('id', matchId)
      .single();

    if (fetchError) throw fetchError;

    // Update the match with the viewing preference
    const updateData: Record<string, unknown> = {
      viewing_preference: viewing,
      has_viewing_scheduled: viewing.status === 'confirmed',
    };

    if (viewing.status === 'confirmed' && viewing.specificDateTime) {
      updateData.confirmed_viewing_date = viewing.specificDateTime;
    }

    const { error: updateError } = await supabase
      .from('matches')
      .update(updateData)
      .eq('id', matchId);

    if (updateError) throw updateError;

    return viewing;
  } else {
    // LocalStorage fallback
    const matches = await getAllMatches();
    const matchIndex = matches.findIndex(m => m.id === viewing.matchId);

    if (matchIndex >= 0) {
      const match = matches[matchIndex];
      match.viewingPreference = viewing;

      // Update related match fields
      if (viewing.status === 'confirmed') {
        match.hasViewingScheduled = true;
        if (viewing.specificDateTime) {
          match.confirmedViewingDate = viewing.specificDateTime;
        }
      }

      await saveMatch(match);
      return viewing;
    } else {
      throw new Error(`Match not found for id: ${viewing.matchId}`);
    }
  }
};

// =====================================================
// RATING SYSTEM
// =====================================================

/**
 * Save a rating (renter rating landlord OR landlord rating renter)
 */
export const saveRating = async (rating: Rating | Omit<Rating, 'id' | 'createdAt'>): Promise<Rating> => {
  if (isSupabaseConfigured()) {
    // Cast to Record to handle both camelCase TypeScript objects and snake_case database objects
    const r = rating as Record<string, unknown>;

    const ratingData: Record<string, unknown> = {
      match_id: r.match_id || rating.matchId,
      rated_user_id: r.rated_user_id || rating.toUserId,
      rated_user_type: r.rated_user_type || rating.toUserType,
      rater_user_id: r.rater_user_id || rating.fromUserId,
      rater_user_type: r.rater_user_type || rating.fromUserType,
      rating: Math.round((r.rating as number) ?? rating.overallScore ?? 5),
      comment: (r.comment as string) || rating.review,
    };

    // Add seed_tag if present
    if (r.seed_tag) {
      ratingData.seed_tag = r.seed_tag;
    }

    // Check if rating has a valid UUID
    const isValidUUID = ('id' in rating && rating.id) && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rating.id);

    if (isValidUUID) {
      // Update existing rating
      const { data, error } = await supabase
        .from('ratings')
        .update(ratingData)
        .eq('id', rating.id)
        .select()
        .single();

      if (error) throw error;
      return { ...rating, id: data.id } as Rating;
    } else {
      // Insert new rating (let Supabase generate UUID)
      const { data, error } = await supabase
        .from('ratings')
        .insert(ratingData)
        .select()
        .single();

      if (error) {
        console.error('[Storage] Rating insert error:', error);
        throw error;
      }
      return { ...rating, id: data.id } as Rating;
    }
  } else {
    const key = `ratings-${rating.toUserId}`;
    const stored = localStorage.getItem(key);
    const ratings = stored ? JSON.parse(stored) : [];
    const ratingId = ('id' in rating && rating.id) ? rating.id : `rating-${Date.now()}`;
    const createdAt = ('createdAt' in rating && rating.createdAt) ? rating.createdAt : new Date();
    const ratingWithId = { ...rating, id: ratingId, createdAt } as Rating;
    ratings.push(ratingWithId);
    localStorage.setItem(key, JSON.stringify(ratings));
    return ratingWithId;
  }
};

/**
 * Get all ratings for a specific user (landlord or renter)
 * Maps database column names to TypeScript interface
 */
export const getRatingsForUser = async (
  userId: string,
  userType: 'landlord' | 'renter'
): Promise<Rating[]> => {
  if (isSupabaseConfigured()) {
    // Database uses: rated_user_id, rated_user_type, rater_user_id, rater_user_type, rating, comment
    const { data, error } = await supabase
      .from('ratings')
      .select('*')
      .eq('rated_user_id', userId)
      .eq('rated_user_type', userType)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(d => ({
      id: d.id,
      matchId: d.match_id,
      fromUserId: d.rater_user_id,
      fromUserType: d.rater_user_type,
      toUserId: d.rated_user_id,
      toUserType: d.rated_user_type,
      propertyId: d.property_id || undefined,
      overallScore: d.rating, // DB uses 'rating' not 'overall_score'
      categoryScores: {
        communication: d.communication_score || d.rating,
        cleanliness: d.cleanliness_score || d.rating,
        reliability: d.reliability_score || d.rating,
        property_condition: d.property_condition_score || d.rating,
        respect_for_property: d.respect_for_property_score || d.rating,
      },
      review: d.comment || d.review || '', // DB uses 'comment' not 'review'
      wouldRecommend: d.would_recommend ?? true,
      tenancyStartDate: d.tenancy_start_date ? new Date(d.tenancy_start_date) : new Date(),
      tenancyEndDate: d.tenancy_end_date ? new Date(d.tenancy_end_date) : new Date(),
      isVerified: d.is_verified ?? false,
      createdAt: new Date(d.created_at),
      reportedAt: d.reported_at ? new Date(d.reported_at) : undefined,
      isHidden: d.is_hidden ?? false,
    }));
  } else {
    const stored = localStorage.getItem(`ratings-${userId}`);
    return stored ? JSON.parse(stored) : [];
  }
};

/**
 * Get ratings summary for a user (aggregated stats)
 */
export const getUserRatingsSummary = async (
  userId: string,
  userType: 'landlord' | 'renter'
): Promise<UserRatingsSummary | null> => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('user_ratings_summary')
      .select('*')
      .eq('user_id', userId)
      .eq('user_type', userType)
      .single();

    if (error) return null;

    return {
      userId: data.user_id,
      userType: data.user_type,
      totalRatings: data.total_ratings,
      averageOverallScore: data.average_overall_score,
      averageCategoryScores: {
        communication: data.average_communication,
        cleanliness: data.average_cleanliness,
        reliability: data.average_reliability,
        property_condition: data.average_property_condition,
        respect_for_property: data.average_respect_for_property,
      },
      wouldRecommendPercentage: data.would_recommend_percentage,
      verifiedTenancies: data.verified_tenancies,
    };
  } else {
    const ratings = await getRatingsForUser(userId, userType);
    if (ratings.length === 0) return null;

    const totalRatings = ratings.length;
    const averageOverallScore =
      ratings.reduce((sum, r) => sum + r.overallScore, 0) / totalRatings;
    const wouldRecommendCount = ratings.filter(r => r.wouldRecommend).length;

    return {
      userId,
      userType,
      totalRatings,
      averageOverallScore: Math.round(averageOverallScore * 10) / 10,
      averageCategoryScores: {
        communication: 0,
        cleanliness: 0,
        reliability: 0,
      },
      wouldRecommendPercentage: (wouldRecommendCount / totalRatings) * 100,
      verifiedTenancies: ratings.filter(r => r.isVerified).length,
    };
  }
};

// =====================================================
// RRA 2025 COMPLIANCE FUNCTIONS
// =====================================================

// =====================================================
// EVICTION NOTICES (RRA 2025 - Section 8 Only)
// =====================================================


export const saveEvictionNotice = async (notice: EvictionNotice): Promise<EvictionNotice> => {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('eviction_notices')
      .insert({
        id: notice.id,
        match_id: notice.matchId,
        landlord_id: notice.landlordId,
        renter_id: notice.renterId,
        property_id: notice.propertyId,
        ground: notice.ground,
        notice_served_date: notice.noticeServedDate,
        earliest_possession_date: notice.earliestPossessionDate,
        reason: notice.reason,
        evidence: notice.evidence,
        status: notice.status,
      })
      .select()
      .single();

    if (error) throw error;
    return notice;
  } else {
    localStorage.setItem(`eviction-${notice.id}`, JSON.stringify(notice));
    return notice;
  }
};

/**
 * Save a hazard report (Awaab's Law compliance)
 */
export const saveHazardReport = async (report: HazardReport): Promise<HazardReport> => {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('hazard_reports')
      .insert({
        id: report.id,
        match_id: report.matchId,
        property_id: report.propertyId,
        reported_by: report.reportedBy,
        hazard_type: report.hazardType,
        severity: report.severity,
        description: report.description,
        photos: report.photos,
        deadline: report.deadline,
      })
      .select()
      .single();

    if (error) throw error;
    return report;
  } else {
    localStorage.setItem(`hazard-${report.id}`, JSON.stringify(report));
    return report;
  }
};

/**
 * Save a dispute for ombudsman resolution
 */
export const saveDispute = async (dispute: Dispute): Promise<Dispute> => {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('disputes')
      .insert({
        id: dispute.id,
        match_id: dispute.matchId,
        landlord_id: dispute.landlordId,
        renter_id: dispute.renterId,
        property_id: dispute.propertyId,
        raised_by: dispute.raisedBy,
        category: dispute.category,
        description: dispute.description,
        evidence: dispute.evidence,
        desired_outcome: dispute.desiredOutcome,
        status: dispute.status,
      })
      .select()
      .single();

    if (error) throw error;
    return dispute;
  } else {
    localStorage.setItem(`dispute-${dispute.id}`, JSON.stringify(dispute));
    return dispute;
  }
};

// =====================================================
// AGENCY LINKING SYSTEM
// =====================================================

/**
 * Create a new agency link invitation
 * Used when landlords invite agencies or agencies invite landlords
 */
export const createAgencyInvitation = async (
  invitation: Omit<AgencyLinkInvitation, 'id' | 'createdAt' | 'expiresAt'>
): Promise<AgencyLinkInvitation> => {
  if (isSupabaseConfigured()) {
    console.log('[Storage] Creating agency invitation:', invitation);

    const invitationData = {
      landlord_id: invitation.landlordId,
      agency_id: invitation.agencyId,
      property_id: invitation.propertyId || null,
      invitation_type: invitation.invitationType,
      initiated_by: invitation.initiatedBy,
      status: invitation.status || 'pending',
      proposed_commission_rate: invitation.proposedCommissionRate || null,
      proposed_contract_length_months: invitation.proposedContractLengthMonths || null,
      message: invitation.message || null,
      response_message: invitation.responseMessage || null,
      responded_at: invitation.respondedAt || null,
    };

    const { data, error } = await supabase
      .from('agency_link_invitations')
      .insert(invitationData)
      .select()
      .single();

    if (error) {
      console.error('[Storage] Agency invitation insert error:', error);
      throw error;
    }

    console.log('[Storage] Agency invitation created successfully with ID:', data.id);

    return {
      id: data.id,
      landlordId: data.landlord_id,
      agencyId: data.agency_id,
      propertyId: data.property_id,
      invitationType: data.invitation_type,
      initiatedBy: data.initiated_by,
      status: data.status,
      proposedCommissionRate: data.proposed_commission_rate,
      proposedContractLengthMonths: data.proposed_contract_length_months,
      message: data.message,
      createdAt: new Date(data.created_at),
      expiresAt: new Date(data.expires_at),
      respondedAt: data.responded_at ? new Date(data.responded_at) : undefined,
      responseMessage: data.response_message,
    };
  } else {
    // localStorage fallback
    const id = crypto.randomUUID();
    const newInvitation: AgencyLinkInvitation = {
      ...invitation,
      id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };
    const key = `agency-invitations`;
    const stored = localStorage.getItem(key);
    const invitations = stored ? JSON.parse(stored) : [];
    invitations.push(newInvitation);
    localStorage.setItem(key, JSON.stringify(invitations));
    return newInvitation;
  }
};

/**
 * Get all agency invitations for a landlord
 */
export const getAgencyInvitationsForLandlord = async (
  landlordId: string
): Promise<AgencyLinkInvitation[]> => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('agency_link_invitations')
      .select('*')
      .eq('landlord_id', landlordId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Storage] Error fetching landlord invitations:', error);
      throw error;
    }

    return (data || []).map(d => ({
      id: d.id,
      landlordId: d.landlord_id,
      agencyId: d.agency_id,
      propertyId: d.property_id,
      invitationType: d.invitation_type,
      initiatedBy: d.initiated_by,
      status: d.status,
      proposedCommissionRate: d.proposed_commission_rate,
      proposedContractLengthMonths: d.proposed_contract_length_months,
      message: d.message,
      createdAt: new Date(d.created_at),
      expiresAt: new Date(d.expires_at),
      respondedAt: d.responded_at ? new Date(d.responded_at) : undefined,
      responseMessage: d.response_message,
    }));
  } else {
    const stored = localStorage.getItem('agency-invitations');
    const invitations = stored ? JSON.parse(stored) : [];
    return invitations.filter((inv: AgencyLinkInvitation) => inv.landlordId === landlordId);
  }
};

/**
 * Get all agency invitations for an agency
 */
export const getAgencyInvitationsForAgency = async (
  agencyId: string
): Promise<AgencyLinkInvitation[]> => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('agency_link_invitations')
      .select('*')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Storage] Error fetching agency invitations:', error);
      throw error;
    }

    return (data || []).map(d => ({
      id: d.id,
      landlordId: d.landlord_id,
      agencyId: d.agency_id,
      propertyId: d.property_id,
      invitationType: d.invitation_type,
      initiatedBy: d.initiated_by,
      status: d.status,
      proposedCommissionRate: d.proposed_commission_rate,
      proposedContractLengthMonths: d.proposed_contract_length_months,
      message: d.message,
      createdAt: new Date(d.created_at),
      expiresAt: new Date(d.expires_at),
      respondedAt: d.responded_at ? new Date(d.responded_at) : undefined,
      responseMessage: d.response_message,
    }));
  } else {
    const stored = localStorage.getItem('agency-invitations');
    const invitations = stored ? JSON.parse(stored) : [];
    return invitations.filter((inv: AgencyLinkInvitation) => inv.agencyId === agencyId);
  }
};

/**
 * Update an agency invitation (accept, decline, cancel, expire)
 */
export const updateAgencyInvitation = async (
  invitationId: string,
  updates: Partial<Pick<AgencyLinkInvitation, 'status' | 'responseMessage' | 'respondedAt'>>
): Promise<AgencyLinkInvitation> => {
  if (isSupabaseConfigured()) {
    console.log('[Storage] Updating agency invitation:', invitationId, updates);

    const updateData: Record<string, unknown> = {};
    if (updates.status) updateData.status = updates.status;
    if (updates.responseMessage) updateData.response_message = updates.responseMessage;
    if (updates.respondedAt) updateData.responded_at = updates.respondedAt;

    const { data, error } = await supabase
      .from('agency_link_invitations')
      .update(updateData)
      .eq('id', invitationId)
      .select()
      .single();

    if (error) {
      console.error('[Storage] Agency invitation update error:', error);
      throw error;
    }

    console.log('[Storage] Agency invitation updated successfully');

    return {
      id: data.id,
      landlordId: data.landlord_id,
      agencyId: data.agency_id,
      propertyId: data.property_id,
      invitationType: data.invitation_type,
      initiatedBy: data.initiated_by,
      status: data.status,
      proposedCommissionRate: data.proposed_commission_rate,
      proposedContractLengthMonths: data.proposed_contract_length_months,
      message: data.message,
      createdAt: new Date(data.created_at),
      expiresAt: new Date(data.expires_at),
      respondedAt: data.responded_at ? new Date(data.responded_at) : undefined,
      responseMessage: data.response_message,
    };
  } else {
    const stored = localStorage.getItem('agency-invitations');
    const invitations: AgencyLinkInvitation[] = stored ? JSON.parse(stored) : [];
    const index = invitations.findIndex(inv => inv.id === invitationId);
    if (index >= 0) {
      invitations[index] = { ...invitations[index], ...updates };
      localStorage.setItem('agency-invitations', JSON.stringify(invitations));
      return invitations[index];
    }
    throw new Error('Invitation not found');
  }
};

/**
 * Delete an agency invitation
 */
export const deleteAgencyInvitation = async (invitationId: string): Promise<void> => {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('agency_link_invitations')
      .delete()
      .eq('id', invitationId);

    if (error) {
      console.error('[Storage] Agency invitation delete error:', error);
      throw error;
    }

    console.log('[Storage] Agency invitation deleted successfully');
  } else {
    const stored = localStorage.getItem('agency-invitations');
    const invitations: AgencyLinkInvitation[] = stored ? JSON.parse(stored) : [];
    const filtered = invitations.filter(inv => inv.id !== invitationId);
    localStorage.setItem('agency-invitations', JSON.stringify(filtered));
  }
};

/**
 * Create a new agency property link (active relationship)
 * Called after invitation is accepted
 */
export const createAgencyPropertyLink = async (
  link: Omit<AgencyPropertyLink, 'id' | 'createdAt' | 'updatedAt' | 'totalRentCollected' | 'totalCommissionEarned'>
): Promise<AgencyPropertyLink> => {
  if (isSupabaseConfigured()) {
    console.log('[Storage] Creating agency property link:', link);

    const linkData = {
      landlord_id: link.landlordId,
      agency_id: link.agencyId,
      property_id: link.propertyId,
      link_type: link.linkType,
      commission_rate: link.commissionRate,
      contract_start_date: link.contractStartDate,
      contract_end_date: link.contractEndDate || null,
      is_active: link.isActive !== undefined ? link.isActive : true,
      termination_reason: link.terminationReason || null,
      terminated_at: link.terminatedAt || null,
    };

    const { data, error } = await supabase
      .from('agency_property_links')
      .insert(linkData)
      .select()
      .single();

    if (error) {
      console.error('[Storage] Agency property link insert error:', error);
      throw error;
    }

    console.log('[Storage] Agency property link created successfully with ID:', data.id);

    return {
      id: data.id,
      landlordId: data.landlord_id,
      agencyId: data.agency_id,
      propertyId: data.property_id,
      linkType: data.link_type,
      commissionRate: data.commission_rate,
      contractStartDate: new Date(data.contract_start_date),
      contractEndDate: data.contract_end_date ? new Date(data.contract_end_date) : undefined,
      isActive: data.is_active,
      terminationReason: data.termination_reason,
      terminatedAt: data.terminated_at ? new Date(data.terminated_at) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      totalRentCollected: data.total_rent_collected || 0,
      totalCommissionEarned: data.total_commission_earned || 0,
    };
  } else {
    // localStorage fallback
    const id = crypto.randomUUID();
    const newLink: AgencyPropertyLink = {
      ...link,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      totalRentCollected: 0,
      totalCommissionEarned: 0,
      isActive: link.isActive !== undefined ? link.isActive : true,
    };
    const key = `agency-property-links`;
    const stored = localStorage.getItem(key);
    const links = stored ? JSON.parse(stored) : [];
    links.push(newLink);
    localStorage.setItem(key, JSON.stringify(links));
    return newLink;
  }
};

/**
 * Get all agency property links for a landlord
 */
export const getAgencyLinksForLandlord = async (
  landlordId: string
): Promise<AgencyPropertyLink[]> => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('agency_property_links')
      .select('*')
      .eq('landlord_id', landlordId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Storage] Error fetching landlord links:', error);
      throw error;
    }

    return (data || []).map(d => ({
      id: d.id,
      landlordId: d.landlord_id,
      agencyId: d.agency_id,
      propertyId: d.property_id,
      linkType: d.link_type,
      commissionRate: d.commission_rate,
      contractStartDate: new Date(d.contract_start_date),
      contractEndDate: d.contract_end_date ? new Date(d.contract_end_date) : undefined,
      isActive: d.is_active,
      terminationReason: d.termination_reason,
      terminatedAt: d.terminated_at ? new Date(d.terminated_at) : undefined,
      createdAt: new Date(d.created_at),
      updatedAt: new Date(d.updated_at),
      totalRentCollected: d.total_rent_collected || 0,
      totalCommissionEarned: d.total_commission_earned || 0,
    }));
  } else {
    const stored = localStorage.getItem('agency-property-links');
    const links = stored ? JSON.parse(stored) : [];
    return links.filter((link: AgencyPropertyLink) => link.landlordId === landlordId);
  }
};

/**
 * Get all agency property links for an agency
 */
export const getAgencyLinksForAgency = async (
  agencyId: string
): Promise<AgencyPropertyLink[]> => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('agency_property_links')
      .select('*')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Storage] Error fetching agency links:', error);
      throw error;
    }

    return (data || []).map(d => ({
      id: d.id,
      landlordId: d.landlord_id,
      agencyId: d.agency_id,
      propertyId: d.property_id,
      linkType: d.link_type,
      commissionRate: d.commission_rate,
      contractStartDate: new Date(d.contract_start_date),
      contractEndDate: d.contract_end_date ? new Date(d.contract_end_date) : undefined,
      isActive: d.is_active,
      terminationReason: d.termination_reason,
      terminatedAt: d.terminated_at ? new Date(d.terminated_at) : undefined,
      createdAt: new Date(d.created_at),
      updatedAt: new Date(d.updated_at),
      totalRentCollected: d.total_rent_collected || 0,
      totalCommissionEarned: d.total_commission_earned || 0,
    }));
  } else {
    const stored = localStorage.getItem('agency-property-links');
    const links = stored ? JSON.parse(stored) : [];
    return links.filter((link: AgencyPropertyLink) => link.agencyId === agencyId);
  }
};

/**
 * Get agency links for a specific property
 */
export const getAgencyLinksForProperty = async (
  propertyId: string
): Promise<AgencyPropertyLink[]> => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('agency_property_links')
      .select('*')
      .eq('property_id', propertyId)
      .eq('is_active', true);

    if (error) {
      console.error('[Storage] Error fetching property links:', error);
      throw error;
    }

    return (data || []).map(d => ({
      id: d.id,
      landlordId: d.landlord_id,
      agencyId: d.agency_id,
      propertyId: d.property_id,
      linkType: d.link_type,
      commissionRate: d.commission_rate,
      contractStartDate: new Date(d.contract_start_date),
      contractEndDate: d.contract_end_date ? new Date(d.contract_end_date) : undefined,
      isActive: d.is_active,
      terminationReason: d.termination_reason,
      terminatedAt: d.terminated_at ? new Date(d.terminated_at) : undefined,
      createdAt: new Date(d.created_at),
      updatedAt: new Date(d.updated_at),
      totalRentCollected: d.total_rent_collected || 0,
      totalCommissionEarned: d.total_commission_earned || 0,
    }));
  } else {
    const stored = localStorage.getItem('agency-property-links');
    const links = stored ? JSON.parse(stored) : [];
    return links.filter(
      (link: AgencyPropertyLink) => link.propertyId === propertyId && link.isActive
    );
  }
};

/**
 * Update an agency property link
 */
export const updateAgencyPropertyLink = async (
  linkId: string,
  updates: Partial<AgencyPropertyLink>
): Promise<AgencyPropertyLink> => {
  if (isSupabaseConfigured()) {
    console.log('[Storage] Updating agency property link:', linkId, updates);

    const updateData: Record<string, unknown> = {};
    if (updates.commissionRate !== undefined) updateData.commission_rate = updates.commissionRate;
    if (updates.contractEndDate !== undefined) updateData.contract_end_date = updates.contractEndDate;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.terminationReason) updateData.termination_reason = updates.terminationReason;
    if (updates.terminatedAt) updateData.terminated_at = updates.terminatedAt;
    if (updates.totalRentCollected !== undefined) updateData.total_rent_collected = updates.totalRentCollected;
    if (updates.totalCommissionEarned !== undefined) updateData.total_commission_earned = updates.totalCommissionEarned;

    const { data, error } = await supabase
      .from('agency_property_links')
      .update(updateData)
      .eq('id', linkId)
      .select()
      .single();

    if (error) {
      console.error('[Storage] Agency property link update error:', error);
      throw error;
    }

    console.log('[Storage] Agency property link updated successfully');

    return {
      id: data.id,
      landlordId: data.landlord_id,
      agencyId: data.agency_id,
      propertyId: data.property_id,
      linkType: data.link_type,
      commissionRate: data.commission_rate,
      contractStartDate: new Date(data.contract_start_date),
      contractEndDate: data.contract_end_date ? new Date(data.contract_end_date) : undefined,
      isActive: data.is_active,
      terminationReason: data.termination_reason,
      terminatedAt: data.terminated_at ? new Date(data.terminated_at) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      totalRentCollected: data.total_rent_collected || 0,
      totalCommissionEarned: data.total_commission_earned || 0,
    };
  } else {
    const stored = localStorage.getItem('agency-property-links');
    const links: AgencyPropertyLink[] = stored ? JSON.parse(stored) : [];
    const index = links.findIndex(link => link.id === linkId);
    if (index >= 0) {
      links[index] = { ...links[index], ...updates, updatedAt: new Date() };
      localStorage.setItem('agency-property-links', JSON.stringify(links));
      return links[index];
    }
    throw new Error('Link not found');
  }
};

/**
 * Terminate an agency property link (soft delete)
 */
export const terminateAgencyPropertyLink = async (
  linkId: string,
  terminationReason: string
): Promise<AgencyPropertyLink> => {
  return updateAgencyPropertyLink(linkId, {
    isActive: false,
    terminationReason,
    terminatedAt: new Date(),
  });
};

/**
 * Delete an agency property link (hard delete - use with caution)
 */
export const deleteAgencyPropertyLink = async (linkId: string): Promise<void> => {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('agency_property_links')
      .delete()
      .eq('id', linkId);

    if (error) {
      console.error('[Storage] Agency property link delete error:', error);
      throw error;
    }

    console.log('[Storage] Agency property link deleted successfully');
  } else {
    const stored = localStorage.getItem('agency-property-links');
    const links: AgencyPropertyLink[] = stored ? JSON.parse(stored) : [];
    const filtered = links.filter(link => link.id !== linkId);
    localStorage.setItem('agency-property-links', JSON.stringify(filtered));
  }
};

// =====================================================
// ISSUE MANAGEMENT SYSTEM
// =====================================================

/**
 * Save an issue (create or update)
 */
export const saveIssue = async (issue: Issue | Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>): Promise<Issue> => {
  if (isSupabaseConfigured()) {
    // Cast to Record to handle both camelCase TypeScript objects and snake_case database objects
    const i = issue as Record<string, unknown>;

    // Handle both old and new multi-role schema
    const issueData: Record<string, unknown> = {
      // Multi-role schema (new)
      property_id: i.property_id || issue.propertyId,
      renter_id: i.renter_id || issue.renterId,
      landlord_id: i.landlord_id || issue.landlordId,
      agency_id: i.agency_id || issue.agencyId,
      assigned_to_agent_id: i.assigned_to_agent_id || issue.assignedToAgentId,
      category: issue.category,
      priority: issue.priority,
      subject: issue.subject || i.title, // Support both
      description: issue.description,
      images: issue.images || [],
      raised_at: i.raised_at || issue.raisedAt,
      acknowledged_at: i.acknowledged_at || issue.acknowledgedAt,
      resolved_at: i.resolved_at || issue.resolvedAt,
      closed_at: i.closed_at || issue.closedAt,
      sla_deadline: i.sla_deadline || issue.slaDeadline,
      is_overdue: i.is_overdue ?? issue.isOverdue ?? false,
      response_time_hours: i.response_time_hours ?? issue.responseTimeHours,
      resolution_time_days: i.resolution_time_days ?? issue.resolutionTimeDays,
      status: issue.status,
      status_history: i.status_history || issue.statusHistory || [],
      messages: issue.messages || [],
      internal_notes: i.internal_notes || issue.internalNotes || [],
      resolution_summary: i.resolution_summary || issue.resolutionSummary || i.resolutionNotes,
      resolution_cost: i.resolution_cost ?? issue.resolutionCost,
      renter_satisfaction_rating: i.renter_satisfaction_rating ?? issue.renterSatisfactionRating,
    };

    // Add seed_tag if present
    if (i.seed_tag) {
      issueData.seed_tag = i.seed_tag;
    }

    const isValidUUID = ('id' in issue && issue.id) && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(issue.id);

    if (isValidUUID) {
      // Update existing issue
      const { data, error } = await supabase
        .from('issues')
        .update(issueData)
        .eq('id', issue.id)
        .select()
        .single();

      if (error) throw error;
      return { ...issue, id: data.id } as Issue;
    } else {
      // Insert new issue
      const { data, error } = await supabase
        .from('issues')
        .insert(issueData)
        .select()
        .single();

      if (error) {
        console.error('[Storage] Issue insert error:', error);
        throw error;
      }
      return { ...issue, id: data.id } as Issue;
    }
  } else {
    const issueId = ('id' in issue && issue.id) ? issue.id : `issue-${Date.now()}`;
    const now = new Date();
    const createdAt = ('createdAt' in issue && issue.createdAt) ? issue.createdAt : now;
    const updatedAt = ('updatedAt' in issue && issue.updatedAt) ? issue.updatedAt : now;
    const updatedIssue = { ...issue, id: issueId, createdAt, updatedAt } as Issue;

    const stored = localStorage.getItem('issues');
    const issues: Issue[] = stored ? JSON.parse(stored) : [];
    const index = issues.findIndex(i => i.id === issueId);

    if (index >= 0) {
      issues[index] = updatedIssue;
    } else {
      issues.push(updatedIssue);
    }

    localStorage.setItem('issues', JSON.stringify(issues));

    return updatedIssue;
  }
};

/**
 * Create a new maintenance issue for a rental property
 * Automatically calculates SLA deadline based on priority and agency configuration
 * Routes to landlord or managing agency based on property relationships
 * 
 * @param issueData - Issue data without generated fields (id, createdAt, updatedAt)
 * @returns Promise<Issue> - Created issue with generated ID and timestamps
 * @throws Error if issue creation fails or required fields are missing
 */
export const createIssue = async (
  issueData: Omit<Issue, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory' | 'messages' | 'isOverdue' | 'slaDeadline'>
): Promise<Issue> => {
  // Validate required fields
  if (!issueData.propertyId) {
    throw new Error('Property ID is required');
  }
  if (!issueData.renterId) {
    throw new Error('Renter ID is required');
  }
  if (!issueData.landlordId) {
    throw new Error('Landlord ID is required');
  }
  if (!issueData.category) {
    throw new Error('Issue category is required');
  }
  if (!issueData.priority) {
    throw new Error('Issue priority is required');
  }
  if (!issueData.subject || issueData.subject.trim().length < 5) {
    throw new Error('Subject must be at least 5 characters long');
  }
  if (!issueData.description || issueData.description.trim().length < 20) {
    throw new Error('Description must be at least 20 characters long');
  }

  // Calculate SLA deadline based on priority and agency config
  const now = new Date();
  let slaHours = 0;

  // Fetch agency SLA config if agency is managing this property
  if (issueData.agencyId) {
    try {
      const agency = await getAgencyProfile(issueData.agencyId);
      if (agency?.slaConfiguration) {
        // Use agency-specific SLA config
        switch (issueData.priority) {
          case 'emergency':
            slaHours = agency.slaConfiguration.emergencyResponseHours;
            break;
          case 'urgent':
            slaHours = agency.slaConfiguration.urgentResponseHours;
            break;
          case 'routine':
            slaHours = agency.slaConfiguration.routineResponseHours;
            break;
          case 'low':
            // Low priority uses maintenance response in days, convert to hours
            slaHours = (agency.slaConfiguration.maintenanceResponseDays || 7) * 24;
            break;
          default:
            slaHours = 72; // Default fallback
        }
      }
    } catch (error) {
      console.warn('[createIssue] Could not fetch agency SLA config, using defaults:', error);
    }
  }

  // Use default SLA if not set by agency
  if (slaHours === 0) {
    switch (issueData.priority) {
      case 'emergency':
        slaHours = 4;
        break;
      case 'urgent':
        slaHours = 24;
        break;
      case 'routine':
        slaHours = 72;
        break;
      case 'low':
        slaHours = 168; // 7 days
        break;
      default:
        slaHours = 72;
    }
  }

  const slaDeadline = new Date(now.getTime() + slaHours * 60 * 60 * 1000);

  // Create initial status history entry
  const initialStatusEntry = {
    status: 'open' as const,
    timestamp: now,
    updatedBy: issueData.renterId,
    notes: 'Issue reported by renter',
  };

  // Build complete issue object
  const newIssue: Issue = {
    ...issueData,
    id: '', // Will be generated by Supabase or set for localStorage
    status: 'open',
    raisedAt: now,
    slaDeadline,
    isOverdue: false,
    statusHistory: [initialStatusEntry],
    messages: [],
    images: issueData.images || [],
    createdAt: now,
    updatedAt: now,
  };

  // Save to storage
  if (isSupabaseConfigured()) {
    const issueDbData = {
      property_id: newIssue.propertyId,
      renter_id: newIssue.renterId,
      landlord_id: newIssue.landlordId,
      agency_id: newIssue.agencyId || null,
      assigned_to_agent_id: newIssue.assignedToAgentId || null,
      category: newIssue.category,
      priority: newIssue.priority,
      subject: newIssue.subject,
      description: newIssue.description,
      images: newIssue.images,
      raised_at: newIssue.raisedAt.toISOString(),
      sla_deadline: slaDeadline.toISOString(),
      is_overdue: false,
      status: 'open',
      status_history: [initialStatusEntry],
      messages: [],
      internal_notes: [],
    };

    try {
      const { data, error } = await supabase
        .from('issues')
        .insert(issueDbData)
        .select()
        .single();

      if (error) {
        console.error('[createIssue] Supabase insert error:', error);
        throw new Error(`Failed to create issue: ${error.message}`);
      }

      return {
        ...newIssue,
        id: data.id,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create issue due to unknown error');
    }
  } else {
    // localStorage fallback
    const issueId = `issue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const issueWithId = { ...newIssue, id: issueId };

    const stored = localStorage.getItem('issues');
    const issues: Issue[] = stored ? JSON.parse(stored) : [];
    issues.push(issueWithId);
    localStorage.setItem('issues', JSON.stringify(issues));

    return issueWithId;
  }
};

/**
 * Get all issues for a match (via propertyId lookup)
 * Note: Issues are linked to properties, not matches directly
 */
export const getIssuesForMatch = async (matchId: string): Promise<Issue[]> => {
  if (isSupabaseConfigured()) {
    // In DB, issues may have a match_id column for legacy compatibility
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Issue[];
  } else {
    // In localStorage, filter by propertyId since matchId isn't on Issue type
    // This is a compatibility layer - in practice, lookup by propertyId
    const stored = localStorage.getItem('issues');
    const issues: Issue[] = stored ? JSON.parse(stored) : [];
    // Cast to access potential matchId from legacy data
    return issues.filter(i => (i as unknown as Record<string, unknown>).matchId === matchId);
  }
};

/**
 * Map database issue row to Issue type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDbIssueToIssue = (row: any): Issue => ({
  id: row.id,
  propertyId: row.property_id,
  renterId: row.renter_id,
  landlordId: row.landlord_id,
  agencyId: row.agency_id,
  assignedToAgentId: row.assigned_to_agent_id,
  category: row.category,
  priority: row.priority,
  subject: row.subject,
  description: row.description,
  images: row.images || [],
  raisedAt: row.raised_at ? new Date(row.raised_at) : new Date(row.created_at),
  acknowledgedAt: row.acknowledged_at ? new Date(row.acknowledged_at) : undefined,
  resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
  closedAt: row.closed_at ? new Date(row.closed_at) : undefined,
  slaDeadline: row.sla_deadline ? new Date(row.sla_deadline) : new Date(),
  isOverdue: row.is_overdue ?? false,
  responseTimeHours: row.response_time_hours,
  resolutionTimeDays: row.resolution_time_days,
  status: row.status,
  statusHistory: row.status_history || [],
  messages: row.messages || [],
  internalNotes: row.internal_notes || [],
  resolutionSummary: row.resolution_summary,
  resolutionCost: row.resolution_cost,
  renterSatisfactionRating: row.renter_satisfaction_rating,
  createdAt: row.created_at ? new Date(row.created_at) : new Date(),
  updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
});

/**
 * Get all issues for a property
 */
export const getIssuesForProperty = async (propertyId: string): Promise<Issue[]> => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapDbIssueToIssue);
  } else {
    const stored = localStorage.getItem('issues');
    const issues: Issue[] = stored ? JSON.parse(stored) : [];
    return issues.filter(i => i.propertyId === propertyId);
  }
};

/**
 * Get a single issue by ID
 */
export const getIssue = async (issueId: string): Promise<Issue | null> => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .eq('id', issueId)
      .single();

    if (error) return null;
    return data ? mapDbIssueToIssue(data) : null;
  } else {
    const stored = localStorage.getItem('issues');
    const issues: Issue[] = stored ? JSON.parse(stored) : [];
    return issues.find(i => i.id === issueId) || null;
  }
};

/**
 * Update issue status
 */
export const updateIssueStatus = async (
  issueId: string,
  status: string,
  resolutionNotes?: string
): Promise<Issue> => {
  if (isSupabaseConfigured()) {
    // Use snake_case for Supabase database columns
    const dbUpdates: Record<string, unknown> = {
      status: status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'resolved' || status === 'closed') {
      dbUpdates.resolved_at = new Date().toISOString();
      if (resolutionNotes) {
        dbUpdates.resolution_summary = resolutionNotes;
      }
    }

    if (status === 'acknowledged') {
      dbUpdates.acknowledged_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('issues')
      .update(dbUpdates)
      .eq('id', issueId)
      .select()
      .single();

    if (error) throw error;
    return mapDbIssueToIssue(data);
  } else {
    // Use camelCase for localStorage
    const updates: Partial<Issue> = {
      status: status as Issue['status'],
    };

    if (status === 'resolved' || status === 'closed') {
      updates.resolvedAt = new Date();
      updates.resolutionSummary = resolutionNotes;
    }

    if (status === 'acknowledged') {
      updates.acknowledgedAt = new Date();
    }

    const stored = localStorage.getItem('issues');
    const issues: Issue[] = stored ? JSON.parse(stored) : [];
    const index = issues.findIndex(i => i.id === issueId);

    if (index >= 0) {
      issues[index] = { ...issues[index], ...updates };
      localStorage.setItem('issues', JSON.stringify(issues));
      return issues[index];
    }
    throw new Error('Issue not found');
  }
};

/**
 * Save a ticket (support ticket for issue)
 */
export const saveTicket = async (ticket: Record<string, unknown>): Promise<Record<string, unknown>> => {
  if (isSupabaseConfigured()) {
    const ticketData = {
      issue_id: ticket.issueId,
      match_id: ticket.matchId,
      created_by_id: ticket.createdById,
      created_by_type: ticket.createdByType,
      assigned_to_id: ticket.assignedToId,
      assigned_to_type: ticket.assignedToType,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      messages: ticket.messages || [],
      attachments: ticket.attachments || [],
      resolved_at: ticket.resolvedAt,
      resolution_notes: ticket.resolutionNotes,
    };

    const isValidUUID = ticket.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ticket.id as string);

    if (isValidUUID) {
      // Update existing ticket
      const { data, error } = await supabase
        .from('tickets')
        .update(ticketData)
        .eq('id', ticket.id)
        .select()
        .single();

      if (error) throw error;
      return { ...ticket, id: data.id };
    } else {
      // Insert new ticket
      const { data, error } = await supabase
        .from('tickets')
        .insert(ticketData)
        .select()
        .single();

      if (error) throw error;
      return { ...ticket, id: data.id };
    }
  } else {
    const ticketId = (ticket.id as string) || `ticket-${Date.now()}`;
    const updatedTicket = { ...ticket, id: ticketId };

    const stored = localStorage.getItem('tickets');
    const tickets: Record<string, unknown>[] = stored ? JSON.parse(stored) : [];
    const index = tickets.findIndex(t => t.id === ticketId);

    if (index >= 0) {
      tickets[index] = updatedTicket;
    } else {
      tickets.push(updatedTicket);
    }

    localStorage.setItem('tickets', JSON.stringify(tickets));
    return updatedTicket;
  }
};

/**
 * Get all tickets for an issue
 */
export const getTicketsForIssue = async (issueId: string): Promise<Record<string, unknown>[]> => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('issue_id', issueId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Record<string, unknown>[];
  } else {
    const stored = localStorage.getItem('tickets');
    const tickets: Record<string, unknown>[] = stored ? JSON.parse(stored) : [];
    return tickets.filter(t => t.issueId === issueId);
  }
};

/**
 * Get all tickets for a match
 */
export const getTicketsForMatch = async (matchId: string): Promise<Record<string, unknown>[]> => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Record<string, unknown>[];
  } else {
    const stored = localStorage.getItem('tickets');
    const tickets: Record<string, unknown>[] = stored ? JSON.parse(stored) : [];
    return tickets.filter(t => t.matchId === matchId);
  }
};

/**
 * Add a message to a ticket
 */
export const addTicketMessage = async (
  ticketId: string,
  message: Record<string, unknown>
): Promise<Record<string, unknown>> => {
  if (isSupabaseConfigured()) {
    const { data: ticket, error: fetchError } = await supabase
      .from('tickets')
      .select('messages')
      .eq('id', ticketId)
      .single();

    if (fetchError) throw fetchError;

    const messages = ticket.messages || [];
    messages.push(message);

    const { data, error } = await supabase
      .from('tickets')
      .update({ messages, updated_at: new Date() })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    const stored = localStorage.getItem('tickets');
    const tickets: Record<string, unknown>[] = stored ? JSON.parse(stored) : [];
    const index = tickets.findIndex(t => t.id === ticketId);

    if (index >= 0) {
      const ticket = tickets[index];
      const messages = (ticket.messages as Record<string, unknown>[]) || [];
      messages.push(message);
      ticket.messages = messages;
      ticket.updatedAt = new Date();
      localStorage.setItem('tickets', JSON.stringify(tickets));
      return ticket;
    }
    throw new Error('Ticket not found');
  }
};

// =====================================================
// MESSAGING SYSTEM
// =====================================================

export const sendMessage = async (message: Message): Promise<Message> => {
  // Ensure message has an ID and timestamp
  const msgToSave = {
    ...message,
    id: message.id || Math.random().toString(36).substring(2, 15),
    timestamp: message.timestamp || new Date().toISOString(),
    isRead: message.isRead ?? false,
  };

  if (isSupabaseConfigured()) {
    // Update the match object as per the type definition
    // We need to fetch the current match to append the message
    const { data: match, error: fetchError } = await supabase
      .from('matches')
      .select('messages, unread_count')
      .eq('id', message.matchId)
      .single();

    if (fetchError) throw fetchError;

    const currentMessages = match.messages || [];
    const updatedMessages = [...currentMessages, msgToSave];

    const { error: updateError } = await supabase
      .from('matches')
      .update({
        messages: updatedMessages,
        last_message_at: msgToSave.timestamp,
        unread_count: (match.unread_count || 0) + 1
      })
      .eq('id', message.matchId);

    if (updateError) throw updateError;
    return msgToSave;
  } else {
    // LocalStorage fallback
    const matches = await getAllMatches();
    const matchIndex = matches.findIndex(m => m.id === message.matchId);

    if (matchIndex >= 0) {
      const match = matches[matchIndex];
      match.messages = match.messages || [];
      match.messages.push(msgToSave);
      match.lastMessageAt = msgToSave.timestamp;
      match.unreadCount = (match.unreadCount || 0) + 1;

      await saveMatch(match);
      return msgToSave;
    } else {
      throw new Error(`Match not found for message ${message.matchId}`);
    }
  }
};

// =====================================================
// CONVERSATIONS (Dual Messaging System)
// =====================================================

export const getConversations = async (matchId: string): Promise<Conversation[]> => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('match_id', matchId)
      .order('conversation_type');

    if (error) throw error;

    return (data || []).map(d => ({
      id: d.id,
      matchId: d.match_id,
      conversationType: d.conversation_type as ConversationType,
      messages: d.messages || [],
      lastMessageAt: d.last_message_at,
      unreadCountRenter: d.unread_count_renter || 0,
      unreadCountOther: d.unread_count_other || 0,
      createdAt: new Date(d.created_at),
      updatedAt: new Date(d.updated_at),
    }));
  } else {
    // LocalStorage fallback - simulate conversations from match messages
    const matches = await getAllMatches();
    const match = matches.find(m => m.id === matchId);
    if (!match) return [];

    return [{
      id: `${matchId}-landlord`,
      matchId,
      conversationType: 'landlord',
      messages: match.messages || [],
      lastMessageAt: match.lastMessageAt,
      unreadCountRenter: match.unreadCount || 0,
      unreadCountOther: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }];
  }
};

export const getConversation = async (
  matchId: string,
  type: ConversationType
): Promise<Conversation | null> => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('match_id', matchId)
      .eq('conversation_type', type)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return {
      id: data.id,
      matchId: data.match_id,
      conversationType: data.conversation_type as ConversationType,
      messages: data.messages || [],
      lastMessageAt: data.last_message_at,
      unreadCountRenter: data.unread_count_renter || 0,
      unreadCountOther: data.unread_count_other || 0,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } else {
    const conversations = await getConversations(matchId);
    return conversations.find(c => c.conversationType === type) || null;
  }
};

export const sendMessageToConversation = async (
  params: SendMessageParams
): Promise<Message> => {
  const message: Message = {
    id: Math.random().toString(36).substring(2, 15),
    matchId: params.matchId,
    senderId: params.senderId,
    receiverId: '', // Will be set based on conversation type
    senderType: params.senderType,
    content: params.content,
    timestamp: new Date().toISOString(),
    isRead: false,
  };

  if (isSupabaseConfigured()) {
    // Fetch conversation and match to determine receiver
    const [conversation, { data: match, error: matchError }] = await Promise.all([
      getConversation(params.matchId, params.conversationType),
      supabase.from('matches').select('*').eq('id', params.matchId).single()
    ]);

    if (matchError || !match) throw new Error('Match not found');

    // Determine receiver based on conversation type and sender
    if (params.conversationType === 'landlord') {
      message.receiverId = params.senderType === 'renter'
        ? match.landlord_id
        : match.renter_id;
    } else {
      // Agency conversation
      message.receiverId = params.senderType === 'renter'
        ? match.managing_agency_id
        : match.renter_id;
    }

    if (!conversation) {
      // Create new conversation if it doesn't exist
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          match_id: params.matchId,
          conversation_type: params.conversationType,
          messages: [message],
          last_message_at: message.timestamp,
          unread_count_renter: params.senderType === 'renter' ? 0 : 1,
          unread_count_other: params.senderType === 'renter' ? 1 : 0,
        })
        .select()
        .single();

      if (createError) throw createError;

      console.log('[Storage] Created new conversation:', newConv.id);
    } else {
      // Append message to existing conversation
      const updatedMessages = [...conversation.messages, message];
      const isRenterSending = params.senderType === 'renter';

      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          messages: updatedMessages,
          last_message_at: message.timestamp,
          unread_count_renter: isRenterSending
            ? conversation.unreadCountRenter
            : conversation.unreadCountRenter + 1,
          unread_count_other: isRenterSending
            ? conversation.unreadCountOther + 1
            : conversation.unreadCountOther,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversation.id);

      if (updateError) throw updateError;

      console.log('[Storage] Added message to conversation:', conversation.id);
    }

    // TODO: Trigger notification based on conversation type
    // await sendNewMessageNotification(message, params.conversationType, match);

    return message;
  } else {
    // LocalStorage fallback - use existing sendMessage
    return sendMessage(message);
  }
};

export const markConversationAsRead = async (
  conversationId: string,
  userRole: 'renter' | 'other'
): Promise<void> => {
  if (isSupabaseConfigured()) {
    const updateField = userRole === 'renter'
      ? 'unread_count_renter'
      : 'unread_count_other';

    const { error } = await supabase
      .from('conversations')
      .update({
        [updateField]: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    if (error) throw error;

    console.log('[Storage] Marked conversation as read:', conversationId);
  }
  // LocalStorage: No-op for backward compatibility
};

export const getUnreadCounts = async (matchId: string): Promise<{
  landlord: number;
  agency: number;
}> => {
  if (isSupabaseConfigured()) {
    const conversations = await getConversations(matchId);

    return {
      landlord: conversations.find(c => c.conversationType === 'landlord')?.unreadCountRenter || 0,
      agency: conversations.find(c => c.conversationType === 'agency')?.unreadCountRenter || 0,
    };
  } else {
    const match = (await getAllMatches()).find(m => m.id === matchId);
    return {
      landlord: match?.unreadCount || 0,
      agency: 0,
    };
  }
};


export const getMessagesForMatch = async (matchId: string): Promise<Message[]> => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('matches')
      .select('messages')
      .eq('id', matchId)
      .single();

    if (error) throw error;
    return data.messages || [];
  } else {
    const matches = await getAllMatches();
    const match = matches.find(m => m.id === matchId);
    return match ? match.messages || [] : [];
  }
};

// =====================================================
// AGENCY-LANDLORD MESSAGING SYSTEM
// =====================================================

// Helper function to get conversations from localStorage
function getConversationsFromLocalStorage(): AgencyLandlordConversation[] {
  const stored = localStorage.getItem('agency-landlord-conversations');
  return stored ? JSON.parse(stored) : [];
}

/**
 * Get all conversations for an agency
 */
export const getAgencyLandlordConversations = async (
  agencyId: string
): Promise<AgencyLandlordConversation[]> => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('agency_landlord_conversations')
        .select('*')
        .eq('agency_id', agencyId)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) {
        // Table doesn't exist yet - fall back to localStorage
        if (error.code === 'PGRST205' || error.code === '42P01') {
          console.warn('[Storage] agency_landlord_conversations table not found, using localStorage');
        } else {
          console.error('[Storage] Error fetching agency conversations:', error);
        }
        // Fall through to localStorage
      } else {
        return (data || []).map(d => ({
          id: d.id,
          agencyId: d.agency_id,
          landlordId: d.landlord_id,
          propertyId: d.property_id,
          messages: d.messages || [],
          lastMessageAt: d.last_message_at,
          unreadCountAgency: d.unread_count_agency || 0,
          unreadCountLandlord: d.unread_count_landlord || 0,
          createdAt: new Date(d.created_at),
          updatedAt: new Date(d.updated_at),
        }));
      }
    } catch (err) {
      console.warn('[Storage] Error fetching agency-landlord conversations:', err);
    }
  }
  // LocalStorage fallback
  const conversations = getConversationsFromLocalStorage();
  return conversations
    .filter(c => c.agencyId === agencyId)
    .sort((a, b) => {
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });
};

/**
 * Get all conversations for a landlord (with agencies)
 */
export const getLandlordAgencyConversations = async (
  landlordId: string
): Promise<AgencyLandlordConversation[]> => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('agency_landlord_conversations')
        .select('*')
        .eq('landlord_id', landlordId)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) {
        if (error.code === 'PGRST205' || error.code === '42P01') {
          console.warn('[Storage] agency_landlord_conversations table not found, using localStorage');
        } else {
          console.error('[Storage] Error fetching landlord conversations:', error);
        }
      } else {
        return (data || []).map(d => ({
          id: d.id,
          agencyId: d.agency_id,
          landlordId: d.landlord_id,
          propertyId: d.property_id,
          messages: d.messages || [],
          lastMessageAt: d.last_message_at,
          unreadCountAgency: d.unread_count_agency || 0,
          unreadCountLandlord: d.unread_count_landlord || 0,
          createdAt: new Date(d.created_at),
          updatedAt: new Date(d.updated_at),
        }));
      }
    } catch (err) {
      console.warn('[Storage] Error fetching landlord-agency conversations:', err);
    }
  }
  // LocalStorage fallback
  const conversations = getConversationsFromLocalStorage();
  return conversations
    .filter(c => c.landlordId === landlordId)
    .sort((a, b) => {
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });
};

/**
 * Get a specific conversation between agency and landlord
 */
export const getAgencyLandlordConversation = async (
  agencyId: string,
  landlordId: string
): Promise<AgencyLandlordConversation | null> => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('agency_landlord_conversations')
        .select('*')
        .eq('agency_id', agencyId)
        .eq('landlord_id', landlordId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        if (error.code === 'PGRST205' || error.code === '42P01') {
          console.warn('[Storage] agency_landlord_conversations table not found, using localStorage');
        } else {
          console.error('[Storage] Error fetching conversation:', error);
        }
      } else if (data) {
        return {
          id: data.id,
          agencyId: data.agency_id,
          landlordId: data.landlord_id,
          propertyId: data.property_id,
          messages: data.messages || [],
          lastMessageAt: data.last_message_at,
          unreadCountAgency: data.unread_count_agency || 0,
          unreadCountLandlord: data.unread_count_landlord || 0,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };
      }
    } catch (err) {
      console.warn('[Storage] Error fetching agency-landlord conversation:', err);
    }
  }
  // LocalStorage fallback
  const conversations = getConversationsFromLocalStorage();
  return conversations.find(c => c.agencyId === agencyId && c.landlordId === landlordId) || null;
};

// Helper function to save message to localStorage
function saveMessageToLocalStorage(
  params: SendAgencyLandlordMessageParams,
  message: AgencyLandlordMessage
): AgencyLandlordMessage {
  const conversations = getConversationsFromLocalStorage();

  const existingIndex = conversations.findIndex(
    c => c.agencyId === params.agencyId && c.landlordId === params.landlordId
  );

  if (existingIndex >= 0) {
    message.conversationId = conversations[existingIndex].id;
    conversations[existingIndex].messages.push(message);
    conversations[existingIndex].lastMessageAt = message.timestamp.toISOString();
    if (params.senderType === 'agency') {
      conversations[existingIndex].unreadCountLandlord += 1;
    } else {
      conversations[existingIndex].unreadCountAgency += 1;
    }
    conversations[existingIndex].updatedAt = new Date();
  } else {
    const newConversation: AgencyLandlordConversation = {
      id: `alc-${Date.now()}`,
      agencyId: params.agencyId,
      landlordId: params.landlordId,
      propertyId: params.propertyId,
      messages: [message],
      lastMessageAt: message.timestamp.toISOString(),
      unreadCountAgency: params.senderType === 'agency' ? 0 : 1,
      unreadCountLandlord: params.senderType === 'landlord' ? 0 : 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    message.conversationId = newConversation.id;
    conversations.push(newConversation);
  }

  localStorage.setItem('agency-landlord-conversations', JSON.stringify(conversations));
  return message;
}

/**
 * Send a message in an agency-landlord conversation
 */
export const sendAgencyLandlordMessage = async (
  params: SendAgencyLandlordMessageParams
): Promise<AgencyLandlordMessage> => {
  const message: AgencyLandlordMessage = {
    id: Math.random().toString(36).substring(2, 15),
    conversationId: '', // Will be set when we find/create conversation
    senderId: params.senderId,
    senderType: params.senderType,
    content: params.content,
    timestamp: new Date(),
    isRead: false,
  };

  if (isSupabaseConfigured()) {
    try {
      // Check for existing conversation
      const conversation = await getAgencyLandlordConversation(params.agencyId, params.landlordId);

      if (!conversation) {
        // Create new conversation
        const { data: newConv, error: createError } = await supabase
          .from('agency_landlord_conversations')
          .insert({
            agency_id: params.agencyId,
            landlord_id: params.landlordId,
            property_id: params.propertyId || null,
            messages: [message],
            last_message_at: message.timestamp.toISOString(),
            unread_count_agency: params.senderType === 'agency' ? 0 : 1,
            unread_count_landlord: params.senderType === 'landlord' ? 0 : 1,
          })
          .select()
          .single();

        if (createError) {
          if (createError.code === 'PGRST205' || createError.code === '42P01') {
            console.warn('[Storage] Table not found, using localStorage');
            return saveMessageToLocalStorage(params, message);
          }
          throw createError;
        }

        message.conversationId = newConv.id;
        console.log('[Storage] Created agency-landlord conversation:', newConv.id);
      } else {
        // Append message to existing conversation
        message.conversationId = conversation.id;
        const updatedMessages = [...conversation.messages, message];

        const { error: updateError } = await supabase
          .from('agency_landlord_conversations')
          .update({
            messages: updatedMessages,
            last_message_at: message.timestamp.toISOString(),
            unread_count_agency: params.senderType === 'agency'
              ? conversation.unreadCountAgency
              : conversation.unreadCountAgency + 1,
            unread_count_landlord: params.senderType === 'landlord'
              ? conversation.unreadCountLandlord
              : conversation.unreadCountLandlord + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', conversation.id);

        if (updateError) {
          if (updateError.code === 'PGRST205' || updateError.code === '42P01') {
            console.warn('[Storage] Table not found, using localStorage');
            return saveMessageToLocalStorage(params, message);
          }
          throw updateError;
        }

        console.log('[Storage] Added message to agency-landlord conversation:', conversation.id);
      }

      return message;
    } catch (err) {
      console.warn('[Storage] Error sending message, using localStorage:', err);
      return saveMessageToLocalStorage(params, message);
    }
  }
  // LocalStorage fallback
  return saveMessageToLocalStorage(params, message);
};

// Helper function to mark messages read in localStorage
function markMessagesReadInLocalStorage(conversationId: string, readerType: 'agency' | 'landlord'): void {
  const conversations = getConversationsFromLocalStorage();
  const index = conversations.findIndex(c => c.id === conversationId);
  if (index >= 0) {
    if (readerType === 'agency') {
      conversations[index].unreadCountAgency = 0;
    } else {
      conversations[index].unreadCountLandlord = 0;
    }
    conversations[index].updatedAt = new Date();
    localStorage.setItem('agency-landlord-conversations', JSON.stringify(conversations));
  }
}

/**
 * Mark agency-landlord conversation messages as read
 */
export const markAgencyLandlordMessagesRead = async (
  conversationId: string,
  readerType: 'agency' | 'landlord'
): Promise<void> => {
  if (isSupabaseConfigured()) {
    try {
      const updateField = readerType === 'agency'
        ? 'unread_count_agency'
        : 'unread_count_landlord';

      const { error } = await supabase
        .from('agency_landlord_conversations')
        .update({
          [updateField]: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      if (error) {
        if (error.code === 'PGRST205' || error.code === '42P01') {
          console.warn('[Storage] Table not found, using localStorage');
          markMessagesReadInLocalStorage(conversationId, readerType);
          return;
        }
        console.error('[Storage] Error marking as read:', error);
      } else {
        console.log('[Storage] Marked agency-landlord conversation as read:', conversationId);
        return;
      }
    } catch (err) {
      console.warn('[Storage] Error marking messages read:', err);
    }
  }
  // LocalStorage fallback
  markMessagesReadInLocalStorage(conversationId, readerType);
};

/**
 * Get total unread count for agency messages
 */
export const getAgencyUnreadMessageCount = async (agencyId: string): Promise<number> => {
  const conversations = await getAgencyLandlordConversations(agencyId);
  return conversations.reduce((sum, c) => sum + c.unreadCountAgency, 0);
};

/**
 * Get total unread count for landlord from agency messages
 */
export const getLandlordAgencyUnreadMessageCount = async (landlordId: string): Promise<number> => {
  const conversations = await getLandlordAgencyConversations(landlordId);
  return conversations.reduce((sum, c) => sum + c.unreadCountLandlord, 0);
};

// =====================================================
// PROPERTY-GROUPED CONVERSATIONS
// =====================================================

/**
 * Get or create a property-specific conversation
 * @param propertyId - null for general discussion thread
 */
export const getOrCreatePropertyConversation = async (
  agencyId: string,
  landlordId: string,
  propertyId: string | null
): Promise<AgencyLandlordConversation> => {
  if (isSupabaseConfigured()) {
    try {
      // Try to find existing conversation
      let query = supabase
        .from('agency_landlord_conversations')
        .select('*')
        .eq('agency_id', agencyId)
        .eq('landlord_id', landlordId);

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      } else {
        query = query.is('property_id', null);
      }

      const { data, error } = await query.single();

      if (error && error.code !== 'PGRST116') {
        console.error('[Storage] Error finding conversation:', error);
        throw error;
      }

      if (data) {
        return {
          id: data.id,
          agencyId: data.agency_id,
          landlordId: data.landlord_id,
          propertyId: data.property_id,
          messages: data.messages || [],
          lastMessageAt: data.last_message_at,
          unreadCountAgency: data.unread_count_agency || 0,
          unreadCountLandlord: data.unread_count_landlord || 0,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };
      }

      // Create new conversation
      const { data: newConv, error: createError } = await supabase
        .from('agency_landlord_conversations')
        .insert({
          agency_id: agencyId,
          landlord_id: landlordId,
          property_id: propertyId,
          messages: [],
          unread_count_agency: 0,
          unread_count_landlord: 0,
        })
        .select()
        .single();

      if (createError) throw createError;

      console.log('[Storage] Created property conversation:', newConv.id, 'propertyId:', propertyId);

      return {
        id: newConv.id,
        agencyId: newConv.agency_id,
        landlordId: newConv.landlord_id,
        propertyId: newConv.property_id,
        messages: [],
        lastMessageAt: undefined,
        unreadCountAgency: 0,
        unreadCountLandlord: 0,
        createdAt: new Date(newConv.created_at),
        updatedAt: new Date(newConv.updated_at),
      };
    } catch (err) {
      console.error('[Storage] Error in getOrCreatePropertyConversation:', err);
      throw err;
    }
  }

  // LocalStorage fallback
  const conversations = getConversationsFromLocalStorage();
  const existing = conversations.find(
    c => c.agencyId === agencyId &&
      c.landlordId === landlordId &&
      (propertyId ? c.propertyId === propertyId : !c.propertyId)
  );

  if (existing) return existing;

  const newConversation: AgencyLandlordConversation = {
    id: `alc-${Date.now()}-${propertyId || 'general'}`,
    agencyId,
    landlordId,
    propertyId: propertyId || undefined,
    messages: [],
    lastMessageAt: undefined,
    unreadCountAgency: 0,
    unreadCountLandlord: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  conversations.push(newConversation);
  localStorage.setItem('agency-landlord-conversations', JSON.stringify(conversations));
  return newConversation;
};

/**
 * Get all conversations for an agency, grouped by landlord and property
 */
export const getAgencyConversationsGrouped = async (
  agencyId: string
): Promise<LandlordConversationGroup[]> => {
  // Get all agency property links to find connected landlords
  const links = await getAgencyLinksForAgency(agencyId);
  const activeLinks = links.filter(l => l.isActive);

  // Get unique landlord IDs
  const landlordIds = [...new Set(activeLinks.map(l => l.landlordId))];

  // Fetch all conversations for this agency
  const allConversations = await getAgencyLandlordConversations(agencyId);

  // Group by landlord
  const groups: LandlordConversationGroup[] = [];

  for (const landlordId of landlordIds) {
    try {
      const landlord = await getLandlordProfile(landlordId);
      if (!landlord) continue;

      // Get properties for this landlord linked to this agency
      const landlordLinks = activeLinks.filter(l => l.landlordId === landlordId);
      const propertyIds = landlordLinks.map(l => l.propertyId);
      const properties = await getPropertiesByIds(propertyIds);

      // Get conversations for this landlord
      const landlordConvos = allConversations.filter(c => c.landlordId === landlordId);

      // Build property conversation groups
      const propertyConversations: PropertyConversationGroup[] = [];

      // Add general discussion thread (propertyId = null)
      const generalConvo = landlordConvos.find(c => !c.propertyId);
      propertyConversations.push({
        propertyId: null,
        propertyAddress: 'General Discussion',
        conversation: generalConvo || null,
        unreadCount: generalConvo?.unreadCountAgency || 0,
        lastMessageAt: generalConvo?.lastMessageAt,
      });

      // Add property-specific threads
      for (const property of properties) {
        const propConvo = landlordConvos.find(c => c.propertyId === property.id);
        propertyConversations.push({
          propertyId: property.id,
          propertyAddress: `${property.address.street}, ${property.address.city}`,
          conversation: propConvo || null,
          unreadCount: propConvo?.unreadCountAgency || 0,
          lastMessageAt: propConvo?.lastMessageAt,
        });
      }

      // Sort by last message time (most recent first)
      propertyConversations.sort((a, b) => {
        if (!a.lastMessageAt && !b.lastMessageAt) return 0;
        if (!a.lastMessageAt) return 1;
        if (!b.lastMessageAt) return -1;
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      });

      const totalUnreadCount = propertyConversations.reduce((sum, pc) => sum + pc.unreadCount, 0);

      groups.push({
        landlord,
        propertyConversations,
        totalUnreadCount,
        properties,
      });
    } catch (err) {
      console.error(`[Storage] Error processing landlord ${landlordId}:`, err);
    }
  }

  // Sort groups by most recent activity
  groups.sort((a, b) => {
    const aTime = a.propertyConversations[0]?.lastMessageAt;
    const bTime = b.propertyConversations[0]?.lastMessageAt;
    if (!aTime && !bTime) return a.landlord.names.localeCompare(b.landlord.names);
    if (!aTime) return 1;
    if (!bTime) return -1;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  return groups;
};

/**
 * Get all conversations for a landlord, grouped by agency and property
 */
export const getLandlordConversationsGrouped = async (
  landlordId: string
): Promise<AgencyConversationGroup[]> => {
  // Get all agency links for this landlord
  const links = await getAgencyLinksForLandlord(landlordId);
  const activeLinks = links.filter(l => l.isActive);

  // Get unique agency IDs
  const agencyIds = [...new Set(activeLinks.map(l => l.agencyId))];

  // Fetch all conversations for this landlord
  const allConversations = await getLandlordAgencyConversations(landlordId);

  // Group by agency
  const groups: AgencyConversationGroup[] = [];

  for (const agencyId of agencyIds) {
    try {
      const agency = await getAgencyProfile(agencyId);
      if (!agency) continue;

      // Get properties linked through this agency
      const agencyLinks = activeLinks.filter(l => l.agencyId === agencyId);
      const propertyIds = agencyLinks.map(l => l.propertyId);
      const properties = await getPropertiesByIds(propertyIds);

      // Get conversations with this agency
      const agencyConvos = allConversations.filter(c => c.agencyId === agencyId);

      // Build property conversation groups
      const propertyConversations: PropertyConversationGroup[] = [];

      // Add general discussion thread (propertyId = null)
      const generalConvo = agencyConvos.find(c => !c.propertyId);
      propertyConversations.push({
        propertyId: null,
        propertyAddress: 'General Discussion',
        conversation: generalConvo || null,
        unreadCount: generalConvo?.unreadCountLandlord || 0,
        lastMessageAt: generalConvo?.lastMessageAt,
      });

      // Add property-specific threads
      for (const property of properties) {
        const propConvo = agencyConvos.find(c => c.propertyId === property.id);
        propertyConversations.push({
          propertyId: property.id,
          propertyAddress: `${property.address.street}, ${property.address.city}`,
          conversation: propConvo || null,
          unreadCount: propConvo?.unreadCountLandlord || 0,
          lastMessageAt: propConvo?.lastMessageAt,
        });
      }

      // Sort by last message time (most recent first)
      propertyConversations.sort((a, b) => {
        if (!a.lastMessageAt && !b.lastMessageAt) return 0;
        if (!a.lastMessageAt) return 1;
        if (!b.lastMessageAt) return -1;
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      });

      const totalUnreadCount = propertyConversations.reduce((sum, pc) => sum + pc.unreadCount, 0);

      groups.push({
        agency,
        propertyConversations,
        totalUnreadCount,
        properties,
      });
    } catch (err) {
      console.error(`[Storage] Error processing agency ${agencyId}:`, err);
    }
  }

  // Sort groups by most recent activity
  groups.sort((a, b) => {
    const aTime = a.propertyConversations[0]?.lastMessageAt;
    const bTime = b.propertyConversations[0]?.lastMessageAt;
    if (!aTime && !bTime) return a.agency.companyName.localeCompare(b.agency.companyName);
    if (!aTime) return 1;
    if (!bTime) return -1;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  return groups;
};

/**
 * Send a message to a property-specific conversation
 */
export const sendPropertyMessage = async (params: {
  agencyId: string;
  landlordId: string;
  propertyId: string | null;
  content: string;
  senderId: string;
  senderType: 'agency' | 'landlord';
}): Promise<AgencyLandlordMessage> => {
  // Ensure conversation exists
  const conversation = await getOrCreatePropertyConversation(
    params.agencyId,
    params.landlordId,
    params.propertyId
  );

  const message: AgencyLandlordMessage = {
    id: Math.random().toString(36).substring(2, 15),
    conversationId: conversation.id,
    senderId: params.senderId,
    senderType: params.senderType,
    content: params.content,
    timestamp: new Date(),
    isRead: false,
  };

  if (isSupabaseConfigured()) {
    try {
      const updatedMessages = [...conversation.messages, message];

      const { error: updateError } = await supabase
        .from('agency_landlord_conversations')
        .update({
          messages: updatedMessages,
          last_message_at: message.timestamp.toISOString(),
          unread_count_agency: params.senderType === 'agency'
            ? conversation.unreadCountAgency
            : conversation.unreadCountAgency + 1,
          unread_count_landlord: params.senderType === 'landlord'
            ? conversation.unreadCountLandlord
            : conversation.unreadCountLandlord + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversation.id);

      if (updateError) throw updateError;

      console.log('[Storage] Sent property message to conversation:', conversation.id);
      return message;
    } catch (err) {
      console.error('[Storage] Error sending property message:', err);
      throw err;
    }
  }

  // LocalStorage fallback
  const conversations = getConversationsFromLocalStorage();
  const index = conversations.findIndex(c => c.id === conversation.id);

  if (index >= 0) {
    conversations[index].messages.push(message);
    conversations[index].lastMessageAt = message.timestamp.toISOString();
    if (params.senderType === 'agency') {
      conversations[index].unreadCountLandlord += 1;
    } else {
      conversations[index].unreadCountAgency += 1;
    }
    conversations[index].updatedAt = new Date();
    localStorage.setItem('agency-landlord-conversations', JSON.stringify(conversations));
  }

  return message;
};

// =====================================================
// RENTER INVITE SYSTEM
// =====================================================


/**
 * Generate a unique 8-character invite code (alphanumeric uppercase)
 * Excludes similar characters (0/O, 1/I) for clarity
 */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude 0/O, 1/I
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Transform Supabase property data (snake_case) to app format (camelCase)
 */
function transformSupabasePropertyToApp(data: Record<string, unknown>): Property {
  const bedrooms = (data.bedrooms as number) || 1;
  return {
    id: data.id as string,
    landlordId: (data.landlord_id as string) || '',
    managingAgencyId: data.managing_agency_id as string | undefined,
    marketingAgentId: data.marketing_agent_id as string | undefined,
    address: {
      street: (data.street as string) || '',
      city: (data.city as string) || '',
      postcode: (data.postcode as string) || '',
      council: (data.council as string) || '',
    },
    propertyType: (data.property_type as PropertyType) || 'House',
    bedrooms,
    bathrooms: (data.bathrooms as number) || 1,
    rentPcm: (data.rent_pcm as number) || 0,
    deposit: ((data.deposit as number) || (data.deposit_amount as number) || 0),
    maxRentInAdvance: 1 as const,
    furnishing: (data.furnishing as FurnishingType) || 'Unfurnished',
    images: (data.images as string[]) || [],
    description: (data.description as string) || '',
    epcRating: (data.epc_rating as EPCRating) || 'C',
    yearBuilt: (data.year_built as number) || new Date().getFullYear(),
    features: (data.features as string[]) || [],
    availableFrom: (data.available_from as string) || (data.listing_date as string) || new Date().toISOString(),
    tenancyType: 'Periodic' as const,
    maxOccupants: (data.max_occupants as number) || bedrooms * 2,
    petsPolicy: (data.pets_policy as Property['petsPolicy']) || {
      willConsiderPets: true as const,
      preferredPetTypes: [] as ('cat' | 'dog' | 'small_caged' | 'fish')[],
      requiresPetInsurance: false,
      maxPetsAllowed: 2,
    },
    bills: (data.bills as Property['bills']) || {
      councilTaxBand: (data.council_tax_band as string) || '',
      gasElectricIncluded: (data.landlord_pays_utilities as boolean) || false,
      waterIncluded: false,
      internetIncluded: false,
    },
    meetsDecentHomesStandard: (data.meets_decent_homes_standard as boolean) || false,
    awaabsLawCompliant: (data.awaabs_law_compliant as boolean) || false,
    prsPropertyRegistrationNumber: data.prs_property_registration_number as string | undefined,
    prsPropertyRegistrationStatus: (data.prs_property_registration_status as PRSRegistrationStatus) || 'not_registered',
    canBeMarketed: data.can_be_marketed !== false,
    isAvailable: data.is_available !== false,
    listingDate: (data.listing_date as string) || new Date().toISOString(),
    preferredMinimumStay: (data.preferred_minimum_stay as number) || 6,
    acceptsShortTermTenants: data.accepts_short_term_tenants !== false,
  };
}

/**
 * Create a new renter invite
 */
export const createRenterInvite = async (
  invite: Omit<RenterInvite, 'id' | 'code' | 'status' | 'expiresAt' | 'createdAt' | 'updatedAt'>
): Promise<RenterInvite> => {
  const code = generateInviteCode();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('renter_invites')
      .insert({
        code,
        created_by_id: invite.createdById,
        created_by_type: invite.createdByType,
        property_id: invite.propertyId,
        landlord_id: invite.landlordId,
        managing_agency_id: invite.managingAgencyId || null,
        proposed_rent_pcm: invite.proposedRentPcm,
        proposed_deposit_amount: invite.proposedDepositAmount,
        proposed_move_in_date: invite.proposedMoveInDate?.toISOString().split('T')[0],
        special_terms: invite.specialTerms,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select('*')
      .single();

    if (error) throw new Error(`Failed to create invite: ${error.message}`);

    return {
      id: data.id,
      code: data.code,
      createdById: data.created_by_id,
      createdByType: data.created_by_type,
      propertyId: data.property_id,
      landlordId: data.landlord_id,
      managingAgencyId: data.managing_agency_id,
      proposedRentPcm: data.proposed_rent_pcm,
      proposedDepositAmount: data.proposed_deposit_amount,
      proposedMoveInDate: data.proposed_move_in_date ? new Date(data.proposed_move_in_date) : undefined,
      specialTerms: data.special_terms,
      status: data.status,
      expiresAt: new Date(data.expires_at),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } else {
    // localStorage fallback
    const newInvite: RenterInvite = {
      id: `invite-${Date.now()}`,
      code,
      ...invite,
      status: 'pending',
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const stored = localStorage.getItem('renter-invites');
    const invites: RenterInvite[] = stored ? JSON.parse(stored) : [];
    invites.push(newInvite);
    localStorage.setItem('renter-invites', JSON.stringify(invites));

    return newInvite;
  }
};

/**
 * Validate an invite code
 */
export const validateInviteCode = async (code: string): Promise<InviteValidationResult> => {
  const upperCode = code.toUpperCase().trim();

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('renter_invites')
      .select('*, property:properties(*)')
      .eq('code', upperCode)
      .single();

    if (error || !data) {
      return { isValid: false, error: 'not_found' };
    }

    const invite: RenterInvite = {
      id: data.id,
      code: data.code,
      createdById: data.created_by_id,
      createdByType: data.created_by_type,
      propertyId: data.property_id,
      landlordId: data.landlord_id,
      managingAgencyId: data.managing_agency_id,
      proposedRentPcm: data.proposed_rent_pcm,
      proposedDepositAmount: data.proposed_deposit_amount,
      proposedMoveInDate: data.proposed_move_in_date ? new Date(data.proposed_move_in_date) : undefined,
      specialTerms: data.special_terms,
      status: data.status,
      expiresAt: new Date(data.expires_at),
      acceptedAt: data.accepted_at ? new Date(data.accepted_at) : undefined,
      acceptedByRenterId: data.accepted_by_renter_id,
      createdMatchId: data.created_match_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    if (invite.status === 'revoked') {
      return { isValid: false, error: 'revoked', invite };
    }

    if (invite.status === 'accepted') {
      return { isValid: false, error: 'already_used', invite };
    }

    if (new Date() > invite.expiresAt || invite.status === 'expired') {
      return { isValid: false, error: 'expired', invite };
    }

    // Transform property data
    const property = data.property ? transformSupabasePropertyToApp(data.property) : undefined;

    return { isValid: true, invite, property };
  } else {
    // localStorage fallback
    const stored = localStorage.getItem('renter-invites');
    const invites: RenterInvite[] = stored ? JSON.parse(stored) : [];
    const invite = invites.find((i) => i.code === upperCode);

    if (!invite) {
      return { isValid: false, error: 'not_found' };
    }

    if (invite.status === 'revoked') {
      return { isValid: false, error: 'revoked', invite };
    }

    if (invite.status === 'accepted') {
      return { isValid: false, error: 'already_used', invite };
    }

    if (new Date() > new Date(invite.expiresAt) || invite.status === 'expired') {
      return { isValid: false, error: 'expired', invite };
    }

    // Get property by ID (efficient single-row query)
    const property = await getPropertyById(invite.propertyId);

    return { isValid: true, invite, property: property || undefined };
  }
};

/**
 * Redeem an invite code (mark as accepted and create Match)
 */
export const redeemInviteCode = async (
  inviteId: string,
  renterId: string,
  renterProfile: RenterProfile
): Promise<Match> => {
  // First, get the invite to validate and get the code
  let inviteCode = '';

  if (isSupabaseConfigured()) {
    const { data } = await supabase
      .from('renter_invites')
      .select('code')
      .eq('id', inviteId)
      .single();
    inviteCode = data?.code || '';
  } else {
    const stored = localStorage.getItem('renter-invites');
    const invites: RenterInvite[] = stored ? JSON.parse(stored) : [];
    const invite = invites.find((i: RenterInvite) => i.id === inviteId);
    inviteCode = invite?.code || '';
  }

  // Validate invite is still pending
  const validation = await validateInviteCode(inviteCode);

  if (!validation.isValid || !validation.invite) {
    throw new Error(`Invalid invite: ${validation.error}`);
  }

  const invite = validation.invite;

  // Create Match
  const match: Partial<Match> = {
    propertyId: invite.propertyId,
    landlordId: invite.landlordId,
    renterId,
    renterName: renterProfile.names,
    renterProfile,
    managingAgencyId: invite.managingAgencyId || undefined,
    marketingAgentId: undefined,
    timestamp: new Date().toISOString(),
    messages: [],
    unreadCount: 0,
    hasViewingScheduled: false,
    applicationStatus: 'application_submitted',
    applicationSubmittedAt: new Date(),
    tenancyStatus: 'prospective',
    canRate: false,
    hasRenterRated: false,
    hasLandlordRated: false,
    isUnderEvictionProceedings: false,
    activeIssueIds: [],
    totalIssuesRaised: 0,
    totalIssuesResolved: 0,
  };

  const createdMatch = await saveMatch(match as Match);

  // Mark invite as accepted
  if (isSupabaseConfigured()) {
    await supabase
      .from('renter_invites')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        accepted_by_renter_id: renterId,
        created_match_id: createdMatch.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', inviteId);
  } else {
    const stored = localStorage.getItem('renter-invites');
    const invites: RenterInvite[] = stored ? JSON.parse(stored) : [];
    const index = invites.findIndex((i) => i.id === inviteId);
    if (index >= 0) {
      invites[index] = {
        ...invites[index],
        status: 'accepted',
        acceptedAt: new Date(),
        acceptedByRenterId: renterId,
        createdMatchId: createdMatch.id,
        updatedAt: new Date(),
      };
      localStorage.setItem('renter-invites', JSON.stringify(invites));
    }
  }

  // Update renter profile to 'current' status with property links
  await saveRenterProfile({
    ...renterProfile,
    status: 'current',
    currentPropertyId: invite.propertyId,
    currentLandlordId: invite.landlordId,
    currentAgencyId: invite.managingAgencyId,
  });

  return createdMatch;
};

// =====================================================
// PROPERTY COSTS (Financial Tracking)
// =====================================================

const PROPERTY_COSTS_KEY = 'property-costs';

/**
 * Save a property cost record
 */
export const savePropertyCost = async (cost: PropertyCost | Omit<PropertyCost, 'id'>): Promise<PropertyCost> => {
  const costId = ('id' in cost && cost.id) ? cost.id : `cost-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const costWithId: PropertyCost = {
    ...cost,
    id: costId,
    createdAt: cost.createdAt || new Date(),
    updatedAt: new Date(),
  } as PropertyCost;

  if (isSupabaseConfigured()) {
    const costData = {
      id: costWithId.id,
      property_id: costWithId.propertyId,
      category: costWithId.category,
      description: costWithId.description,
      amount: costWithId.amount,
      frequency: costWithId.frequency,
      is_recurring: costWithId.isRecurring,
      created_at: costWithId.createdAt,
      updated_at: costWithId.updatedAt,
    };

    const { data, error } = await supabase
      .from('property_costs')
      .upsert(costData)
      .select()
      .single();

    if (error) {
      console.error('[Storage] Property cost save error:', error);
      throw error;
    }

    return {
      id: data.id,
      propertyId: data.property_id,
      category: data.category,
      description: data.description,
      amount: data.amount,
      frequency: data.frequency,
      isRecurring: data.is_recurring,
      createdAt: new Date(data.created_at),
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
    };
  } else {
    // localStorage fallback
    const stored = localStorage.getItem(PROPERTY_COSTS_KEY);
    const costs: PropertyCost[] = stored ? JSON.parse(stored) : [];
    const index = costs.findIndex(c => c.id === costWithId.id);
    if (index >= 0) {
      costs[index] = costWithId;
    } else {
      costs.push(costWithId);
    }
    localStorage.setItem(PROPERTY_COSTS_KEY, JSON.stringify(costs));
    return costWithId;
  }
};

/**
 * Get all costs for a property
 */
export const getPropertyCosts = async (propertyId: string): Promise<PropertyCost[]> => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('property_costs')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Storage] Get property costs error:', error);
      return [];
    }

    return (data || []).map(d => ({
      id: d.id,
      propertyId: d.property_id,
      category: d.category,
      description: d.description,
      amount: d.amount,
      frequency: d.frequency,
      isRecurring: d.is_recurring,
      createdAt: new Date(d.created_at),
      updatedAt: d.updated_at ? new Date(d.updated_at) : undefined,
    }));
  } else {
    const stored = localStorage.getItem(PROPERTY_COSTS_KEY);
    const costs: PropertyCost[] = stored ? JSON.parse(stored) : [];
    return costs.filter(c => c.propertyId === propertyId);
  }
};

/**
 * Delete a property cost record
 */
export const deletePropertyCost = async (costId: string): Promise<void> => {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('property_costs')
      .delete()
      .eq('id', costId);

    if (error) {
      console.error('[Storage] Delete property cost error:', error);
      throw error;
    }
  } else {
    const stored = localStorage.getItem(PROPERTY_COSTS_KEY);
    const costs: PropertyCost[] = stored ? JSON.parse(stored) : [];
    const filtered = costs.filter(c => c.id !== costId);
    localStorage.setItem(PROPERTY_COSTS_KEY, JSON.stringify(filtered));
  }
};

/**
 * Calculate monthly cost from a PropertyCost record
 */
const calculateMonthlyCost = (cost: PropertyCost): number => {
  switch (cost.frequency) {
    case 'monthly':
      return cost.amount;
    case 'quarterly':
      return cost.amount / 3;
    case 'annually':
      return cost.amount / 12;
    case 'one_time':
      return 0; // One-time costs don't contribute to monthly
    default:
      return 0;
  }
};

// =====================================================
// LANDLORD PROPERTIES (Multi-Property Support)
// =====================================================

/**
 * Get all properties owned by a landlord
 */
export const getLandlordProperties = async (landlordId: string): Promise<Property[]> => {
  if (!landlordId) return [];

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('landlord_id', landlordId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Storage] Get landlord properties error:', error);
      return [];
    }

    // Map Supabase data to Property type (reuse existing mapping logic)
    return (data || []).map(d => ({
      id: d.id,
      address: {
        street: d.street || '',
        city: d.city || '',
        postcode: d.postcode || '',
        council: d.council || '',
      },
      rentPcm: d.rent_pcm || 0,
      deposit: d.deposit || 0,
      maxRentInAdvance: 1 as const,
      bedrooms: d.bedrooms || 0,
      bathrooms: d.bathrooms || 0,
      propertyType: d.property_type || 'Flat',
      images: d.images || [],
      description: d.description || '',
      epcRating: d.epc_rating || 'C',
      yearBuilt: d.year_built || 2000,
      features: d.features || [],
      furnishing: d.furnishing || 'Unfurnished',
      availableFrom: d.available_from || new Date().toISOString(),
      tenancyType: 'Periodic' as const,
      maxOccupants: d.max_occupants || 4,
      petsPolicy: d.pets_policy || {
        willConsiderPets: true,
        preferredPetTypes: [],
        requiresPetInsurance: false,
        maxPetsAllowed: 2,
      },
      bills: d.bills || {
        councilTaxBand: 'C',
        gasElectricIncluded: false,
        waterIncluded: false,
        internetIncluded: false,
      },
      meetsDecentHomesStandard: d.meets_decent_homes_standard ?? true,
      awaabsLawCompliant: d.awaabs_law_compliant ?? true,
      prsPropertyRegistrationStatus: d.prs_registration_status || 'not_registered',
      landlordId: d.landlord_id,
      managingAgencyId: d.managing_agency_id,
      marketingAgentId: d.marketing_agent_id,
      isFullyManagedByAgency: d.is_fully_managed_by_agency,
      isAvailable: d.is_available ?? true,
      canBeMarketed: d.can_be_marketed ?? true,
      listingDate: d.listing_date || new Date().toISOString(),
      acceptsShortTermTenants: d.accepts_short_term_tenants ?? true,
    }));
  } else {
    const stored = localStorage.getItem('properties');
    const properties: Property[] = stored ? JSON.parse(stored) : [];
    return properties.filter(p => p.landlordId === landlordId);
  }
};

/**
 * Get properties with enriched details (tenant info, issues, costs)
 */
export const getPropertiesWithDetails = async (landlordId: string): Promise<PropertyWithDetails[]> => {
  // Get base properties
  const properties = await getLandlordProperties(landlordId);
  if (properties.length === 0) return [];

  // Get all matches for this landlord
  const allMatches = await getAllMatches();
  const landlordMatches = allMatches.filter(m => m.landlordId === landlordId);

  // Get all property costs
  const allCostsPromises = properties.map(p => getPropertyCosts(p.id));
  const allCostsArrays = await Promise.all(allCostsPromises);

  // Get issues for properties
  const allIssuesPromises = properties.map(p => getIssuesForProperty(p.id));
  const allIssuesArrays = await Promise.all(allIssuesPromises);

  // Build enriched property data
  return properties.map((property, index) => {
    const costs = allCostsArrays[index] || [];
    const issues = allIssuesArrays[index] || [];

    // Find active tenancy for this property
    const activeMatch = landlordMatches.find(
      m => m.propertyId === property.id &&
        (m.tenancyStatus === 'active' || m.applicationStatus === 'tenancy_signed')
    );

    // Calculate occupancy status
    let occupancyStatus: OccupancyStatus = 'vacant';
    if (activeMatch) {
      if (activeMatch.tenancyStatus === 'notice_given') {
        occupancyStatus = 'ending_soon';
      } else {
        occupancyStatus = 'occupied';
      }
    }

    // Calculate monthly costs
    const monthlyCosts = costs.reduce((sum, cost) => sum + calculateMonthlyCost(cost), 0);

    // Calculate income (rent if occupied)
    const monthlyIncome = activeMatch ? (activeMatch.monthlyRentAmount || property.rentPcm) : 0;

    // Count active issues
    const activeIssuesCount = issues.filter(
      i => !['resolved', 'closed'].includes(i.status)
    ).length;

    // Build the enriched property
    const enrichedProperty: PropertyWithDetails = {
      ...property,
      occupancyStatus,
      activeIssuesCount,
      unreadMessagesCount: 0, // TODO: Calculate from conversations
      monthlyCosts: Math.round(monthlyCosts * 100) / 100,
      monthlyIncome,
      monthlyProfit: Math.round((monthlyIncome - monthlyCosts) * 100) / 100,
      costs,
      matchId: activeMatch?.id,
    };

    // Add tenant info if occupied
    if (activeMatch && activeMatch.renterProfile) {
      enrichedProperty.currentTenant = {
        name: activeMatch.renterName || activeMatch.renterProfile.names || 'Tenant',
        renterId: activeMatch.renterId,
        moveInDate: activeMatch.tenancyStartDate || new Date(),
        monthlyRent: activeMatch.monthlyRentAmount || property.rentPcm,
      };
    }

    return enrichedProperty;
  });
};

