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

export const saveAgencyProfile = async (profile: AgencyProfile): Promise<AgencyProfile> => {
  if (isSupabaseConfigured()) {
    const profileData = {
      email: profile.email,
      password_hash: profile.passwordHash,
      agency_type: profile.agencyType,
      company_name: profile.companyName,
      registration_number: profile.registrationNumber,
      primary_contact_name: profile.primaryContactName,
      phone: profile.phone,
      address: profile.address,
      service_areas: profile.serviceAreas,
      managed_property_ids: profile.managedPropertyIds,
      landlord_client_ids: profile.landlordClientIds,
      active_tenants_count: profile.activeTenantsCount,
      total_properties_managed: profile.totalPropertiesManaged,
      sla_configuration: profile.slaConfiguration,
      performance_metrics: profile.performanceMetrics,
      property_ombudsman_member: profile.propertyOmbudsmanMember,
      insurance_details: profile.insuranceDetails,
      is_active: profile.isActive,
      is_complete: profile.onboardingComplete,
    };

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

export const saveProperty = async (property: Property): Promise<Property> => {
  if (isSupabaseConfigured()) {
    const propertyData = {
      landlord_id: property.landlordId || null, // NULL instead of empty string
      street: property.address.street,
      city: property.address.city,
      postcode: property.address.postcode,
      council: property.address.council,

      // Rental pricing (not purchase price)
      rent_pcm: property.rentPcm,
      deposit: property.deposit,

      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      property_type: property.propertyType,
      year_built: property.yearBuilt,
      description: property.description,
      epc_rating: property.epcRating,
      images: property.images,
      features: property.features,

      // Rental-specific fields
      furnishing: property.furnishing,
      available_from: property.availableFrom,
      tenancy_type: property.tenancyType || 'Periodic', // RRA 2025
      max_occupants: property.maxOccupants,
      pets_policy: property.petsPolicy,

      // Bills
      council_tax_band: property.bills?.councilTaxBand,
      gas_electric_included: property.bills?.gasElectricIncluded || false,
      water_included: property.bills?.waterIncluded || false,
      internet_included: property.bills?.internetIncluded || false,

      // RRA 2025 Compliance
      meets_decent_homes_standard: property.meetsDecentHomesStandard,
      awaabs_law_compliant: property.awaabsLawCompliant,
      last_safety_inspection_date: property.lastSafetyInspectionDate,
      prs_property_registration_number: property.prsPropertyRegistrationNumber,
      prs_property_registration_status: property.prsPropertyRegistrationStatus,

      is_available: property.isAvailable,
      listing_date: property.listingDate,
      preferred_minimum_stay: property.preferredMinimumStay,
      accepts_short_term_tenants: property.acceptsShortTermTenants,
    };

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

export const saveMatch = async (match: Match): Promise<Match> => {
  if (isSupabaseConfigured()) {
    const matchData = {
      property_id: match.propertyId,
      landlord_id: match.landlordId,
      renter_id: match.renterId,
      renter_name: match.renterName,
      renter_profile: match.renterProfile,
      messages: match.messages,
      last_message_at: match.lastMessageAt,
      unread_count: match.unreadCount,
      has_viewing_scheduled: match.hasViewingScheduled,
      confirmed_viewing_date: match.confirmedViewingDate,
      viewing_preference: match.viewingPreference,
      tenancy_start_date: match.tenancyStartDate,
      can_rate: match.canRate,
      has_landlord_rated: match.hasLandlordRated,
      has_renter_rated: match.hasRenterRated,
      landlord_rating_id: match.landlordRatingId,
      renter_rating_id: match.renterRatingId,
    };

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
      property: d.property ? {
        id: d.property.id,
        landlordId: d.property.landlord_id || '',
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
// RATING SYSTEM
// =====================================================

/**
 * Save a rating (renter rating landlord OR landlord rating renter)
 */
export const saveRating = async (rating: Rating): Promise<Rating> => {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('ratings')
      .insert({
        id: rating.id,
        match_id: rating.matchId,
        from_user_id: rating.fromUserId,
        from_user_type: rating.fromUserType,
        to_user_id: rating.toUserId,
        to_user_type: rating.toUserType,
        property_id: rating.propertyId,
        overall_score: rating.overallScore,
        communication_score: rating.categoryScores.communication,
        cleanliness_score: rating.categoryScores.cleanliness,
        reliability_score: rating.categoryScores.reliability,
        property_condition_score: rating.categoryScores.property_condition,
        respect_for_property_score: rating.categoryScores.respect_for_property,
        review: rating.review,
        would_recommend: rating.wouldRecommend,
        tenancy_start_date: rating.tenancyStartDate,
        tenancy_end_date: rating.tenancyEndDate,
        is_verified: rating.isVerified,
      })
      .select()
      .single();

    if (error) throw error;
    return rating;
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

/**
 * Save an eviction notice (Section 8 only, per RRA 2025)
 */
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
