/**
 * Property Transformer
 * Handles conversion between Supabase snake_case and TypeScript camelCase
 */

import type { Property, PropertyType, EPCRating, FurnishingType, TenancyType, PRSRegistrationStatus } from '../../types';
import type { DbRecord } from './index';

/**
 * Transform a Supabase property record to a TypeScript Property object
 * Handles the nested address structure and all field mappings
 */
export const transformProperty = (d: DbRecord): Property => ({
  id: d.id as string,
  landlordId: (d.landlord_id as string) || '',
  managingAgencyId: d.managing_agency_id as string | undefined,
  marketingAgentId: d.marketing_agent_id as string | undefined,

  // Nested address from flat database fields
  address: {
    street: (d.street as string) || '',
    city: (d.city as string) || '',
    postcode: (d.postcode as string) || '',
    council: (d.council as string) || '',
  },

  // Pricing
  rentPcm: (d.rent_pcm as number) || 0,
  deposit: (d.deposit as number) || 0,
  maxRentInAdvance: 1, // RRA 2025: Hardcoded to 1 month by law

  // Property details
  bedrooms: (d.bedrooms as number) || 1,
  bathrooms: (d.bathrooms as number) || 1,
  propertyType: (d.property_type as PropertyType) || 'house',
  yearBuilt: (d.year_built as number) || 2000,
  description: (d.description as string) || '',
  epcRating: (d.epc_rating as EPCRating) || 'C',
  images: (d.images as string[]) || [],
  features: (d.features as string[]) || [],

  // Rental specifics
  furnishing: (d.furnishing as FurnishingType) || 'unfurnished',
  availableFrom: (d.available_from as string) || new Date().toISOString(),
  tenancyType: (d.tenancy_type as TenancyType) || 'Periodic',
  maxOccupants: (d.max_occupants as number) || 4,

  // Pets policy (RRA 2025 compliant)
  petsPolicy: {
    willConsiderPets: true, // Required by law
    preferredPetTypes: (d.preferred_pet_types as ('cat' | 'dog' | 'small_caged' | 'fish')[]) || [],
    requiresPetInsurance: (d.requires_pet_insurance as boolean) || false,
    petDeposit: d.pet_deposit as number | undefined,
    additionalPetRent: d.additional_pet_rent as number | undefined,
    maxPetsAllowed: (d.max_pets_allowed as number) || 2,
    propertyUnsuitableFor: d.property_unsuitable_for as ('large_dogs' | 'multiple_dogs')[] | undefined,
  },

  // Bills
  bills: {
    councilTaxBand: (d.council_tax_band as string) || 'C',
    gasElectricIncluded: (d.gas_electric_included as boolean) || false,
    waterIncluded: (d.water_included as boolean) || false,
    internetIncluded: (d.internet_included as boolean) || false,
  },

  // RRA 2025 Compliance
  meetsDecentHomesStandard: (d.meets_decent_homes_standard as boolean) || false,
  awaabsLawCompliant: (d.awaabs_law_compliant as boolean) || false,
  lastSafetyInspectionDate: d.last_safety_inspection_date
    ? new Date(d.last_safety_inspection_date as string)
    : undefined,
  prsPropertyRegistrationNumber: d.prs_property_registration_number as string | undefined,
  prsPropertyRegistrationStatus: (d.prs_property_registration_status as PRSRegistrationStatus) || 'not_registered',

  // Availability
  isAvailable: (d.is_available as boolean) ?? true,
  canBeMarketed: (d.can_be_marketed as boolean) || false,
  listingDate: (d.listing_date as string) || new Date().toISOString(),

  // Preferences
  preferredMinimumStay: d.preferred_minimum_stay as number | undefined,
  acceptsShortTermTenants: (d.accepts_short_term_tenants as boolean) || false,
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

  // Rental specifics
  furnishing: property.furnishing,
  available_from: property.availableFrom,
  tenancy_type: property.tenancyType,
  max_occupants: property.maxOccupants,

  // Pets policy
  preferred_pet_types: property.petsPolicy?.preferredPetTypes,
  requires_pet_insurance: property.petsPolicy?.requiresPetInsurance,
  pet_deposit: property.petsPolicy?.petDeposit,
  additional_pet_rent: property.petsPolicy?.additionalPetRent,
  max_pets_allowed: property.petsPolicy?.maxPetsAllowed,
  property_unsuitable_for: property.petsPolicy?.propertyUnsuitableFor,

  // Bills
  council_tax_band: property.bills?.councilTaxBand,
  gas_electric_included: property.bills?.gasElectricIncluded,
  water_included: property.bills?.waterIncluded,
  internet_included: property.bills?.internetIncluded,

  // RRA 2025 Compliance
  meets_decent_homes_standard: property.meetsDecentHomesStandard,
  awaabs_law_compliant: property.awaabsLawCompliant,
  last_safety_inspection_date: property.lastSafetyInspectionDate?.toISOString(),
  prs_property_registration_number: property.prsPropertyRegistrationNumber,
  prs_property_registration_status: property.prsPropertyRegistrationStatus,

  // Availability
  is_available: property.isAvailable,
  can_be_marketed: property.canBeMarketed,
  listing_date: property.listingDate,

  // Preferences
  preferred_minimum_stay: property.preferredMinimumStay,
  accepts_short_term_tenants: property.acceptsShortTermTenants,
});
