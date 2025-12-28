/**
 * Property Transformer
 * Handles conversion between Supabase snake_case and TypeScript camelCase
 */

import type { Property } from '../../types';
import type { DbRecord } from './index';

/**
 * Transform a Supabase property record to a TypeScript Property object
 * Handles the nested address structure and all field mappings
 */
export const transformProperty = (d: DbRecord): Property => ({
  id: d.id as string,
  landlordId: (d.landlord_id as string) || '',
  managingAgencyId: (d.managing_agency_id as string) || undefined,
  marketingAgentId: (d.marketing_agent_id as string) || undefined,

  // Nested address from flat database fields
  address: {
    street: d.street as string,
    city: d.city as string,
    postcode: d.postcode as string,
    council: (d.council as string) || '',
  },

  // Pricing
  rentPcm: d.rent_pcm as number,
  deposit: (d.deposit as number) || 0,
  maxRentInAdvance: 1, // RRA 2025: Hardcoded to 1 month by law

  // Property details
  bedrooms: d.bedrooms as number,
  bathrooms: d.bathrooms as number,
  propertyType: d.property_type as Property['propertyType'],
  yearBuilt: d.year_built as number,
  description: (d.description as string) || '',
  epcRating: d.epc_rating as Property['epcRating'],
  images: (d.images as string[]) || [],
  features: (d.features as string[]) || [],
  floorArea: d.floor_area as number,

  // Rental specifics
  furnishing: d.furnishing as Property['furnishing'],
  furnished: d.furnished as Property['furnished'],
  availableFrom: d.available_from as string,
  tenancyType: d.tenancy_type as Property['tenancyType'],
  maxOccupants: d.max_occupants as number,
  petsPolicy: d.pets_policy as Property['petsPolicy'],
  minTenancy: d.min_tenancy as number,
  maxTenancy: d.max_tenancy as number,

  // Policies
  petsAllowed: (d.pets_allowed as boolean) ?? false,
  smokingAllowed: (d.smoking_allowed as boolean) ?? false,
  dssAccepted: (d.dss_accepted as boolean) ?? false,

  // Bills
  bills: {
    councilTaxBand: d.council_tax_band as string,
    gasElectricIncluded: d.gas_electric_included as boolean,
    waterIncluded: d.water_included as boolean,
    internetIncluded: d.internet_included as boolean,
  },
  councilTaxBand: d.council_tax_band as string,

  // Outdoor/Parking
  parkingType: d.parking_type as Property['parkingType'],
  outdoorSpace: d.outdoor_space as Property['outdoorSpace'],

  // RRA 2025 Compliance
  meetsDecentHomesStandard: d.meets_decent_homes_standard as boolean,
  awaabsLawCompliant: d.awaabs_law_compliant as boolean,
  lastSafetyInspectionDate: d.last_safety_inspection_date
    ? new Date(d.last_safety_inspection_date as string)
    : undefined,
  prsPropertyRegistrationNumber: d.prs_property_registration_number as string,
  prsPropertyRegistrationStatus: d.prs_property_registration_status as Property['prsPropertyRegistrationStatus'],
  canBeMarketed: d.can_be_marketed as boolean,

  // Availability
  isAvailable: (d.is_available as boolean) ?? true,
  listingDate: d.listing_date as string,
  preferredMinimumStay: d.preferred_minimum_stay as number,
  acceptsShortTermTenants: d.accepts_short_term_tenants as boolean,

  // Stats
  viewCount: (d.view_count as number) || 0,
  likeCount: (d.like_count as number) || 0,

  // Timestamps
  createdAt: d.created_at as string,
  updatedAt: d.updated_at as string,
});

/**
 * Transform a TypeScript Property object to Supabase format for saving
 */
export const transformPropertyToDb = (
  property: Partial<Property>
): Record<string, unknown> => ({
  id: property.id,
  landlord_id: property.landlordId,
  managing_agency_id: property.managingAgencyId || null,
  marketing_agent_id: property.marketingAgentId || null,

  // Flatten address
  street: property.address?.street,
  city: property.address?.city,
  postcode: property.address?.postcode,
  council: property.address?.council,

  // Pricing
  rent_pcm: property.rentPcm,
  deposit: property.deposit,

  // Property details
  bedrooms: property.bedrooms,
  bathrooms: property.bathrooms,
  property_type: property.propertyType,
  year_built: property.yearBuilt,
  description: property.description,
  epc_rating: property.epcRating,
  images: property.images,
  features: property.features,
  floor_area: property.floorArea,

  // Rental specifics
  furnishing: property.furnishing,
  furnished: property.furnished,
  available_from: property.availableFrom,
  tenancy_type: property.tenancyType,
  max_occupants: property.maxOccupants,
  pets_policy: property.petsPolicy,
  min_tenancy: property.minTenancy,
  max_tenancy: property.maxTenancy,

  // Policies
  pets_allowed: property.petsAllowed,
  smoking_allowed: property.smokingAllowed,
  dss_accepted: property.dssAccepted,

  // Bills
  council_tax_band: property.bills?.councilTaxBand || property.councilTaxBand,
  gas_electric_included: property.bills?.gasElectricIncluded,
  water_included: property.bills?.waterIncluded,
  internet_included: property.bills?.internetIncluded,

  // Outdoor/Parking
  parking_type: property.parkingType,
  outdoor_space: property.outdoorSpace,

  // RRA 2025 Compliance
  meets_decent_homes_standard: property.meetsDecentHomesStandard,
  awaabs_law_compliant: property.awaabsLawCompliant,
  last_safety_inspection_date: property.lastSafetyInspectionDate,
  prs_property_registration_number: property.prsPropertyRegistrationNumber,
  prs_property_registration_status: property.prsPropertyRegistrationStatus,
  can_be_marketed: property.canBeMarketed,

  // Availability
  is_available: property.isAvailable,
  listing_date: property.listingDate,
  preferred_minimum_stay: property.preferredMinimumStay,
  accepts_short_term_tenants: property.acceptsShortTermTenants,
});
