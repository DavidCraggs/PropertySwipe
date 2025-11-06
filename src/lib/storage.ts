/**
 * Storage abstraction layer for GetOn Rental Platform
 * Automatically uses Supabase when configured, falls back to localStorage
 * Updated for RRA 2025 compliance
 */

import { supabase, isSupabaseConfigured } from './supabase';
import type {
  LandlordProfile,
  RenterProfile,
  Property,
  Match,
  Rating,
  UserRatingsSummary,
  EvictionNotice,
  HazardReport,
  Dispute,
  // Legacy aliases for backward compatibility
  VendorProfile,
  BuyerProfile,
} from '../types';

// =====================================================
// LANDLORD PROFILES (formerly Vendor Profiles)
// =====================================================

export const saveLandlordProfile = async (profile: LandlordProfile): Promise<LandlordProfile> => {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('landlord_profiles')
      .upsert({
        id: profile.id,
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
        property_id: profile.propertyId,
        is_complete: profile.isComplete,
      })
      .select()
      .single();

    if (error) throw error;
    return profile;
  } else {
    localStorage.setItem(`landlord-profile-${profile.id}`, JSON.stringify(profile));
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
      isComplete: data.is_complete,
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
    const { error } = await supabase
      .from('renter_profiles')
      .upsert({
        id: profile.id,
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
        is_complete: profile.isComplete,
      })
      .select()
      .single();

    if (error) throw error;
    return profile;
  } else {
    localStorage.setItem(`renter-profile-${profile.id}`, JSON.stringify(profile));
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
      isComplete: data.is_complete,
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
// RENTAL PROPERTIES
// =====================================================

export const saveProperty = async (property: Property): Promise<Property> => {
  if (isSupabaseConfigured()) {
    const { error } = await supabase
      .from('properties')
      .upsert({
        id: property.id,
        landlord_id: property.landlordId,
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
      })
      .select()
      .single();

    if (error) throw error;
    return property;
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
    const { error } = await supabase
      .from('matches')
      .upsert({
        id: match.id,
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
      })
      .select()
      .single();

    if (error) throw error;
    return match;
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
