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
  Match,
  Rating,
  UserRatingsSummary,
  EvictionNotice,
  HazardReport,
  Dispute,
  AgencyLinkInvitation,
  AgencyPropertyLink,
  Message,
  ViewingPreference,
  Issue,
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
      property_id: profile.propertyId || null,
      is_complete: profile.onboardingComplete,
    };

    // Check if profile has a valid UUID
    const isValidUUID = profile.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profile.id);

    if (isValidUUID) {
      // Update existing profile
      console.log('[Storage] Updating landlord profile with data:', JSON.stringify(profileData, null, 2));

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
      console.log('[Storage] Inserting new landlord profile with data:', JSON.stringify(profileData, null, 2));

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
      propertyId: data.property_id,
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
      status: 'prospective', // Default to prospective for new renters
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

export const saveAgencyProfile = async (profile: any): Promise<AgencyProfile> => {
  if (isSupabaseConfigured()) {
    // Handle both camelCase TypeScript objects and snake_case database objects
    const profileData: any = {
      email: profile.email,
      password_hash: profile.password_hash || profile.passwordHash,
      agency_type: profile.agency_type || profile.agencyType,
      company_name: profile.company_name || profile.companyName,
      registration_number: profile.registration_number || profile.registrationNumber,
      primary_contact_name: profile.primary_contact_name || profile.primaryContactName,
      phone: profile.phone,
      service_areas: profile.service_areas || profile.serviceAreas,
      managed_property_ids: profile.managed_property_ids || profile.managedPropertyIds,
      landlord_client_ids: profile.landlord_client_ids || profile.landlordClientIds,
      active_tenants_count: profile.active_tenants_count ?? profile.activeTenantsCount,
      total_properties_managed: profile.total_properties_managed ?? profile.totalPropertiesManaged,
      property_ombudsman_member: profile.property_ombudsman_member ?? profile.propertyOmbudsmanMember,
      is_active: profile.is_active ?? profile.isActive,
      is_complete: profile.is_complete ?? profile.onboardingComplete,
    };

    // Handle address - either flat fields or nested object
    if (profile.address_street || profile.address) {
      profileData.address_street = profile.address_street || profile.address?.street;
      profileData.address_city = profile.address_city || profile.address?.city;
      profileData.address_postcode = profile.address_postcode || profile.address?.postcode;
    }

    // Handle SLA configuration - either flat fields or nested object
    if (profile.sla_emergency_response_hours !== undefined || profile.slaConfiguration) {
      profileData.sla_emergency_response_hours = profile.sla_emergency_response_hours ?? profile.slaConfiguration?.emergencyResponseHours;
      profileData.sla_urgent_response_hours = profile.sla_urgent_response_hours ?? profile.slaConfiguration?.urgentResponseHours;
      profileData.sla_routine_response_hours = profile.sla_routine_response_hours ?? profile.slaConfiguration?.routineResponseHours;
      profileData.sla_maintenance_response_days = profile.sla_maintenance_response_days ?? profile.slaConfiguration?.maintenanceResponseDays;
    }

    // Handle performance metrics - either flat fields or nested object
    if (profile.avg_response_time_hours !== undefined || profile.performanceMetrics) {
      profileData.avg_response_time_hours = profile.avg_response_time_hours ?? profile.performanceMetrics?.averageResponseTimeHours;
      profileData.sla_compliance_rate = profile.sla_compliance_rate ?? profile.performanceMetrics?.slaComplianceRate;
      profileData.total_issues_resolved = profile.total_issues_resolved ?? profile.performanceMetrics?.totalIssuesResolved;
      profileData.total_issues_raised = profile.total_issues_raised ?? profile.performanceMetrics?.totalIssuesRaised;
      profileData.current_open_issues = profile.current_open_issues ?? profile.performanceMetrics?.currentOpenIssues;
    }

    // Add seed_tag if present
    if (profile.seed_tag) {
      profileData.seed_tag = profile.seed_tag;
    }

    if (profile.id) {
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
    const agencyId = profile.id || `agency-${Date.now()}`;
    const updatedProfile = { ...profile, id: agencyId };

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

export const saveProperty = async (property: any): Promise<Property> => {
  if (isSupabaseConfigured()) {
    const propertyData: any = {
      landlord_id: property.landlord_id || property.landlordId || null,
      managing_agency_id: property.managing_agency_id || property.managingAgencyId || null,
      marketing_agent_id: property.marketing_agent_id || property.marketingAgentId || null,
      street: property.address?.street || property.street,
      city: property.address?.city || property.city,
      postcode: property.address?.postcode || property.postcode,
      council: property.address?.council || property.council,

      // Rental pricing (not purchase price)
      rent_pcm: property.rentPcm || property.rent_pcm,
      deposit: property.deposit,

      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      property_type: property.propertyType || property.property_type,
      year_built: property.yearBuilt || property.year_built,
      description: property.description,
      epc_rating: property.epcRating || property.epc_rating,
      images: property.images,
      features: property.features,

      // Rental-specific fields
      furnishing: property.furnishing,
      available_from: property.availableFrom || property.available_from,
      tenancy_type: property.tenancyType || property.tenancy_type || 'Periodic', // RRA 2025
      max_occupants: property.maxOccupants || property.max_occupants,
      pets_policy: property.petsPolicy || property.pets_policy,

      // Bills
      council_tax_band: property.bills?.councilTaxBand || property.council_tax_band,
      gas_electric_included: property.bills?.gasElectricIncluded ?? property.gas_electric_included ?? false,
      water_included: property.bills?.waterIncluded ?? property.water_included ?? false,
      internet_included: property.bills?.internetIncluded ?? property.internet_included ?? false,

      // RRA 2025 Compliance
      meets_decent_homes_standard: property.meetsDecentHomesStandard ?? property.meets_decent_homes_standard,
      awaabs_law_compliant: property.awaabsLawCompliant ?? property.awaabs_law_compliant,
      last_safety_inspection_date: property.lastSafetyInspectionDate || property.last_safety_inspection_date,
      prs_property_registration_number: property.prsPropertyRegistrationNumber || property.prs_property_registration_number,
      prs_property_registration_status: property.prsPropertyRegistrationStatus || property.prs_property_registration_status,

      is_available: property.isAvailable ?? property.is_available,
      listing_date: property.listingDate || property.listing_date,
      preferred_minimum_stay: property.preferredMinimumStay ?? property.preferred_minimum_stay,
      accepts_short_term_tenants: property.acceptsShortTermTenants ?? property.accepts_short_term_tenants,
    };

    // Add seed_tag if present
    if (property.seed_tag) {
      propertyData.seed_tag = property.seed_tag;
    }

    // Check if property has a valid UUID (for updates) or needs to be inserted
    const isValidUUID = property.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(property.id);

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
      console.log('[Storage] Inserting new property with data:', JSON.stringify(propertyData, null, 2));

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
    const index = allProperties.findIndex(p => p.id === property.id);
    if (index >= 0) {
      allProperties[index] = property;
    } else {
      allProperties.push(property);
    }
    localStorage.setItem('properties', JSON.stringify(allProperties));
    return property;
  }
};

export const getAllProperties = async (): Promise<Property[]> => {
  const supabaseConfigured = isSupabaseConfigured();
  console.log('[Storage] getAllProperties called - Supabase configured:', supabaseConfigured);

  if (supabaseConfigured) {
    console.log('[Storage] Fetching rental properties from Supabase...');

    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('is_available', true)
      .order('created_at', { ascending: false });

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

export const saveMatch = async (match: any): Promise<Match> => {
  if (isSupabaseConfigured()) {
    const matchData: any = {
      property_id: match.property_id || match.propertyId,
      landlord_id: match.landlord_id || match.landlordId,
      renter_id: match.renter_id || match.renterId,
      managing_agency_id: match.managing_agency_id || match.managingAgencyId || null,
      marketing_agent_id: match.marketing_agent_id || match.marketingAgentId || null,
      renter_name: match.renter_name || match.renterName,
      renter_profile: match.renter_profile || match.renterProfile,
      messages: match.messages,
      last_message_at: match.last_message_at || match.lastMessageAt,
      unread_count: match.unread_count ?? match.unreadCount,
      has_viewing_scheduled: match.has_viewing_scheduled ?? match.hasViewingScheduled,
      confirmed_viewing_date: match.confirmed_viewing_date || match.confirmedViewingDate,
      viewing_preference: match.viewing_preference || match.viewingPreference,
      tenancy_start_date: match.tenancy_start_date || match.tenancyStartDate,
      can_rate: match.can_rate ?? match.canRate,
      has_landlord_rated: match.has_landlord_rated ?? match.hasLandlordRated,
      has_renter_rated: match.has_renter_rated ?? match.hasRenterRated,
      landlord_rating_id: match.landlord_rating_id || match.landlordRatingId,
      renter_rating_id: match.renter_rating_id || match.renterRatingId,
    };

    // Add seed_tag if present
    if (match.seed_tag) {
      matchData.seed_tag = match.seed_tag;
    }

    // Check if match has a valid UUID
    const isValidUUID = match.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(match.id);

    if (isValidUUID) {
      // Update existing match
      const { data, error } = await supabase
        .from('matches')
        .update(matchData)
        .eq('id', match.id)
        .select()
        .single();

      if (error) throw error;
      return { ...match, id: data.id };
    } else {
      // Insert new match (let Supabase generate UUID)
      const { data, error } = await supabase
        .from('matches')
        .insert(matchData)
        .select()
        .single();

      if (error) throw error;
      return { ...match, id: data.id };
    }
  } else {
    const allMatches = await getAllMatches();
    const index = allMatches.findIndex(m => m.id === match.id);
    if (index >= 0) {
      allMatches[index] = match;
    } else {
      allMatches.push(match);
    }
    localStorage.setItem('matches', JSON.stringify(allMatches));
    return match;
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
      } : {} as any,
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
    const updateData: any = {
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
export const saveRating = async (rating: any): Promise<any> => {
  if (isSupabaseConfigured()) {
    const ratingData: any = {
      match_id: rating.match_id || rating.matchId,
      rated_user_id: rating.rated_user_id || rating.toUserId,
      rated_user_type: rating.rated_user_type || rating.toUserType,
      rater_user_id: rating.rater_user_id || rating.fromUserId,
      rater_user_type: rating.rater_user_type || rating.fromUserType,
      rating: Math.round(rating.rating ?? rating.overallScore ?? 5),
      comment: rating.comment || rating.review,
    };

    // Add seed_tag if present
    if (rating.seed_tag) {
      ratingData.seed_tag = rating.seed_tag;
    }

    // Check if rating has a valid UUID
    const isValidUUID = rating.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rating.id);

    if (isValidUUID) {
      // Update existing rating
      const { data, error } = await supabase
        .from('ratings')
        .update(ratingData)
        .eq('id', rating.id)
        .select()
        .single();

      if (error) throw error;
      return { ...rating, id: data.id };
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
      return { ...rating, id: data.id };
    }
  } else {
    const key = `ratings-${rating.toUserId}`;
    const stored = localStorage.getItem(key);
    const ratings = stored ? JSON.parse(stored) : [];
    ratings.push(rating);
    localStorage.setItem(key, JSON.stringify(ratings));
    return rating;
  }
};

/**
 * Get all ratings for a specific user (landlord or renter)
 */
export const getRatingsForUser = async (
  userId: string,
  userType: 'landlord' | 'renter'
): Promise<Rating[]> => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('ratings')
      .select('*')
      .eq('to_user_id', userId)
      .eq('to_user_type', userType)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(d => ({
      id: d.id,
      matchId: d.match_id,
      fromUserId: d.from_user_id,
      fromUserType: d.from_user_type,
      toUserId: d.to_user_id,
      toUserType: d.to_user_type,
      propertyId: d.property_id,
      overallScore: d.overall_score,
      categoryScores: {
        communication: d.communication_score,
        cleanliness: d.cleanliness_score,
        reliability: d.reliability_score,
        property_condition: d.property_condition_score,
        respect_for_property: d.respect_for_property_score,
      },
      review: d.review,
      wouldRecommend: d.would_recommend,
      tenancyStartDate: new Date(d.tenancy_start_date),
      tenancyEndDate: new Date(d.tenancy_end_date),
      isVerified: d.is_verified,
      createdAt: new Date(d.created_at),
      reportedAt: d.reported_at ? new Date(d.reported_at) : undefined,
      isHidden: d.is_hidden,
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

    const updateData: Record<string, any> = {};
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

    const updateData: Record<string, any> = {};
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
export const saveIssue = async (issue: any): Promise<any> => {
  if (isSupabaseConfigured()) {
    // Handle both old and new multi-role schema
    const issueData: any = {
      // Multi-role schema (new)
      property_id: issue.property_id || issue.propertyId,
      renter_id: issue.renter_id || issue.renterId,
      landlord_id: issue.landlord_id || issue.landlordId,
      agency_id: issue.agency_id || issue.agencyId,
      assigned_to_agent_id: issue.assigned_to_agent_id || issue.assignedToAgentId,
      category: issue.category,
      priority: issue.priority,
      subject: issue.subject || issue.title, // Support both
      description: issue.description,
      images: issue.images || [],
      raised_at: issue.raised_at || issue.raisedAt,
      acknowledged_at: issue.acknowledged_at || issue.acknowledgedAt,
      resolved_at: issue.resolved_at || issue.resolvedAt,
      closed_at: issue.closed_at || issue.closedAt,
      sla_deadline: issue.sla_deadline || issue.slaDeadline,
      is_overdue: issue.is_overdue ?? issue.isOverdue ?? false,
      response_time_hours: issue.response_time_hours ?? issue.responseTimeHours,
      resolution_time_days: issue.resolution_time_days ?? issue.resolutionTimeDays,
      status: issue.status,
      status_history: issue.status_history || issue.statusHistory || [],
      messages: issue.messages || [],
      internal_notes: issue.internal_notes || issue.internalNotes || [],
      resolution_summary: issue.resolution_summary || issue.resolutionSummary || issue.resolutionNotes,
      resolution_cost: issue.resolution_cost ?? issue.resolutionCost,
      renter_satisfaction_rating: issue.renter_satisfaction_rating ?? issue.renterSatisfactionRating,
    };

    // Add seed_tag if present
    if (issue.seed_tag) {
      issueData.seed_tag = issue.seed_tag;
    }

    const isValidUUID = issue.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(issue.id);

    if (isValidUUID) {
      // Update existing issue
      const { data, error } = await supabase
        .from('issues')
        .update(issueData)
        .eq('id', issue.id)
        .select()
        .single();

      if (error) throw error;
      return { ...issue, id: data.id };
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
      return { ...issue, id: data.id };
    }
  } else {
    const issueId = issue.id || `issue-${Date.now()}`;
    const updatedIssue = { ...issue, id: issueId };

    const stored = localStorage.getItem('issues');
    const issues: any[] = stored ? JSON.parse(stored) : [];
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
 * Get all issues for a match
 */
export const getIssuesForMatch = async (matchId: string): Promise<any[]> => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } else {
    const stored = localStorage.getItem('issues');
    const issues: any[] = stored ? JSON.parse(stored) : [];
    return issues.filter(i => i.matchId === matchId);
  }
};

/**
 * Get all issues for a property
 */
export const getIssuesForProperty = async (propertyId: string): Promise<any[]> => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } else {
    const stored = localStorage.getItem('issues');
    const issues: any[] = stored ? JSON.parse(stored) : [];
    return issues.filter(i => i.propertyId === propertyId);
  }
};

/**
 * Get a single issue by ID
 */
export const getIssue = async (issueId: string): Promise<any | null> => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .eq('id', issueId)
      .single();

    if (error) return null;
    return data;
  } else {
    const stored = localStorage.getItem('issues');
    const issues: any[] = stored ? JSON.parse(stored) : [];
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
): Promise<any> => {
  const updates: any = {
    status,
    updatedAt: new Date(),
  };

  if (status === 'resolved' || status === 'closed') {
    updates.resolvedAt = new Date();
    updates.resolutionNotes = resolutionNotes;
  }

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('issues')
      .update(updates)
      .eq('id', issueId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    const stored = localStorage.getItem('issues');
    const issues: any[] = stored ? JSON.parse(stored) : [];
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
export const saveTicket = async (ticket: any): Promise<any> => {
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

    const isValidUUID = ticket.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ticket.id);

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
    const ticketId = ticket.id || `ticket-${Date.now()}`;
    const updatedTicket = { ...ticket, id: ticketId };

    const stored = localStorage.getItem('tickets');
    const tickets: any[] = stored ? JSON.parse(stored) : [];
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
export const getTicketsForIssue = async (issueId: string): Promise<any[]> => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('issue_id', issueId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } else {
    const stored = localStorage.getItem('tickets');
    const tickets: any[] = stored ? JSON.parse(stored) : [];
    return tickets.filter(t => t.issueId === issueId);
  }
};

/**
 * Get all tickets for a match
 */
export const getTicketsForMatch = async (matchId: string): Promise<any[]> => {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } else {
    const stored = localStorage.getItem('tickets');
    const tickets: any[] = stored ? JSON.parse(stored) : [];
    return tickets.filter(t => t.matchId === matchId);
  }
};

/**
 * Add a message to a ticket
 */
export const addTicketMessage = async (
  ticketId: string,
  message: any
): Promise<any> => {
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
    const tickets: any[] = stored ? JSON.parse(stored) : [];
    const index = tickets.findIndex(t => t.id === ticketId);

    if (index >= 0) {
      tickets[index].messages = tickets[index].messages || [];
      tickets[index].messages.push(message);
      tickets[index].updatedAt = new Date();
      localStorage.setItem('tickets', JSON.stringify(tickets));
      return tickets[index];
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
      throw new Error(`Match not found for id: ${message.matchId}`);
    }
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
