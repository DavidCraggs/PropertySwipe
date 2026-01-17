/**
 * Agreement Creator Service
 * Handles RRA 2025 compliant tenancy agreement generation
 */

import { supabase } from './supabase';
import type {
  AgreementTemplate,
  AgreementSection,
  AgreementClause,
  AgreementFormData,
  GeneratedAgreement,
  GeneratedAgreementStatus,
  ComplianceCheckResult,
  ComplianceError,
  ComplianceWarning,
  ClauseCategory,
  Property,
  LandlordProfile,
  RenterProfile,
  Match,
  EPCRating,
} from '../types';

// =====================================================
// TEMPLATE FUNCTIONS
// =====================================================

/**
 * Get all active agreement templates
 */
export async function getActiveTemplates(): Promise<AgreementTemplate[]> {
  const { data, error } = await supabase
    .from('agreement_templates')
    .select('*')
    .eq('is_active', true)
    .order('is_system_template', { ascending: false })
    .order('name');

  if (error) {
    console.error('Failed to fetch templates:', error);
    throw new Error('Failed to load agreement templates');
  }

  return (data || []).map(mapTemplateFromDb);
}

/**
 * Get a specific template by ID
 */
export async function getTemplateById(id: string): Promise<AgreementTemplate | null> {
  const { data, error } = await supabase
    .from('agreement_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Failed to fetch template:', error);
    throw new Error('Failed to load agreement template');
  }

  return mapTemplateFromDb(data);
}

/**
 * Get the default RRA 2025 system template
 */
export async function getDefaultTemplate(): Promise<AgreementTemplate | null> {
  const { data, error } = await supabase
    .from('agreement_templates')
    .select('*')
    .eq('is_system_template', true)
    .eq('is_active', true)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Failed to fetch default template:', error);
    throw new Error('Failed to load default template');
  }

  return mapTemplateFromDb(data);
}

// =====================================================
// CLAUSE FUNCTIONS
// =====================================================

/**
 * Get clauses by category from the clause library
 */
export async function getClausesByCategory(category: ClauseCategory): Promise<AgreementClause[]> {
  const { data, error } = await supabase
    .from('agreement_clauses')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .order('is_mandatory', { ascending: false })
    .order('title');

  if (error) {
    console.error('Failed to fetch clauses:', error);
    throw new Error('Failed to load clauses');
  }

  return (data || []).map(mapClauseFromDb);
}

/**
 * Get all mandatory clauses
 */
export async function getMandatoryClauses(): Promise<AgreementClause[]> {
  const { data, error } = await supabase
    .from('agreement_clauses')
    .select('*')
    .eq('is_mandatory', true)
    .eq('is_active', true);

  if (error) {
    console.error('Failed to fetch mandatory clauses:', error);
    throw new Error('Failed to load mandatory clauses');
  }

  return (data || []).map(mapClauseFromDb);
}

/**
 * Get all prohibited clauses (for validation)
 */
export async function getProhibitedClauses(): Promise<AgreementClause[]> {
  const { data, error } = await supabase
    .from('agreement_clauses')
    .select('*')
    .eq('is_prohibited', true)
    .eq('is_active', true);

  if (error) {
    console.error('Failed to fetch prohibited clauses:', error);
    throw new Error('Failed to load prohibited clauses');
  }

  return (data || []).map(mapClauseFromDb);
}

// =====================================================
// GENERATED AGREEMENT FUNCTIONS
// =====================================================

/**
 * Create a new draft agreement
 */
export async function createDraftAgreement(
  matchId: string,
  templateId: string,
  createdBy: string
): Promise<GeneratedAgreement> {
  // Fetch match with related data
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select(`
      *,
      property:properties(*),
      renter:renter_profiles(*),
      landlord:landlord_profiles(*)
    `)
    .eq('id', matchId)
    .single();

  if (matchError || !match) {
    throw new Error('Match not found');
  }

  // Initialize form data with property/match info
  const initialData: Partial<AgreementFormData> = {
    propertyAddress: formatPropertyAddress(match.property),
    rentAmount: match.property.rent_pcm || match.monthly_rent_amount,
    tenantName: match.renter?.names || '',
    landlordName: match.landlord?.names || '',
    epcRating: match.property.epc_rating || 'C',
    prsRegistrationNumber: match.landlord?.prs_registration_number || '',
    furnishingLevel: (match.property.furnishing || 'unfurnished').toLowerCase() as 'unfurnished' | 'part furnished' | 'fully furnished',
  };

  const { data, error } = await supabase
    .from('generated_agreements')
    .insert({
      template_id: templateId,
      match_id: matchId,
      landlord_id: match.landlord_id,
      agency_id: match.managing_agency_id || null,
      renter_id: match.renter_id,
      property_id: match.property_id,
      agreement_data: initialData,
      status: 'draft',
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create draft agreement:', error);
    throw new Error('Failed to create draft agreement');
  }

  return mapGeneratedAgreementFromDb(data);
}

/**
 * Update agreement form data
 */
export async function updateAgreementData(
  agreementId: string,
  data: Partial<AgreementFormData>
): Promise<GeneratedAgreement> {
  // Get current agreement
  const { data: current, error: fetchError } = await supabase
    .from('generated_agreements')
    .select('agreement_data')
    .eq('id', agreementId)
    .single();

  if (fetchError || !current) {
    throw new Error('Agreement not found');
  }

  // Merge data
  const mergedData = { ...current.agreement_data, ...data };

  const { data: updated, error } = await supabase
    .from('generated_agreements')
    .update({
      agreement_data: mergedData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', agreementId)
    .select()
    .single();

  if (error) {
    console.error('Failed to update agreement:', error);
    throw new Error('Failed to update agreement');
  }

  return mapGeneratedAgreementFromDb(updated);
}

/**
 * Get a generated agreement by ID
 */
export async function getGeneratedAgreement(id: string): Promise<GeneratedAgreement | null> {
  const { data, error } = await supabase
    .from('generated_agreements')
    .select(`
      *,
      template:agreement_templates(*),
      property:properties(*),
      landlord:landlord_profiles(*),
      renter:renter_profiles(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Failed to fetch generated agreement:', error);
    throw new Error('Failed to load agreement');
  }

  return mapGeneratedAgreementFromDb(data);
}

/**
 * Get all agreements for a match
 */
export async function getAgreementsForMatch(matchId: string): Promise<GeneratedAgreement[]> {
  const { data, error } = await supabase
    .from('generated_agreements')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch agreements for match:', error);
    throw new Error('Failed to load agreements');
  }

  return (data || []).map(mapGeneratedAgreementFromDb);
}

/**
 * Update agreement status
 */
export async function updateAgreementStatus(
  agreementId: string,
  status: GeneratedAgreementStatus
): Promise<void> {
  const { error } = await supabase
    .from('generated_agreements')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', agreementId);

  if (error) {
    console.error('Failed to update agreement status:', error);
    throw new Error('Failed to update agreement status');
  }
}

/**
 * Mark agreement as generated with PDF path
 */
export async function markAgreementGenerated(
  agreementId: string,
  pdfPath: string
): Promise<void> {
  const { error } = await supabase
    .from('generated_agreements')
    .update({
      status: 'generated',
      generated_pdf_path: pdfPath,
      generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', agreementId);

  if (error) {
    console.error('Failed to mark agreement as generated:', error);
    throw new Error('Failed to update agreement');
  }
}

/**
 * Link generated agreement to tenancy agreement for signing
 */
export async function linkToTenancyAgreement(
  generatedAgreementId: string,
  tenancyAgreementId: string
): Promise<void> {
  const { error } = await supabase
    .from('generated_agreements')
    .update({
      tenancy_agreement_id: tenancyAgreementId,
      status: 'sent_for_signing',
      updated_at: new Date().toISOString(),
    })
    .eq('id', generatedAgreementId);

  if (error) {
    console.error('Failed to link to tenancy agreement:', error);
    throw new Error('Failed to link agreement');
  }
}

// =====================================================
// COMPLIANCE FUNCTIONS
// =====================================================

/**
 * Check RRA 2025 compliance for agreement form data
 */
export function checkCompliance(
  formData: Partial<AgreementFormData>,
  property?: Property,
  landlord?: LandlordProfile
): ComplianceCheckResult {
  const errors: ComplianceError[] = [];
  const warnings: ComplianceWarning[] = [];

  // Deposit cap validation
  if (formData.depositAmount !== undefined && formData.rentAmount !== undefined) {
    const maxDeposit = calculateMaxDeposit(formData.rentAmount);
    if (formData.depositAmount > maxDeposit) {
      errors.push({
        field: 'depositAmount',
        message: `Deposit exceeds maximum of £${maxDeposit.toFixed(2)} (${formData.rentAmount * 12 >= 50000 ? '6' : '5'} weeks' rent)`,
        rraReference: 'Tenant Fees Act 2019, Schedule 1',
      });
    }
  }

  // Deposit weeks validation
  if (formData.depositWeeks !== undefined) {
    const annualRent = (formData.rentAmount || 0) * 12;
    const maxWeeks = annualRent >= 50000 ? 6 : 5;
    if (formData.depositWeeks > maxWeeks) {
      errors.push({
        field: 'depositWeeks',
        message: `Deposit cannot exceed ${maxWeeks} weeks' rent`,
        rraReference: 'Tenant Fees Act 2019',
      });
    }
  }

  // Payment day validation
  if (formData.rentPaymentDay !== undefined) {
    if (formData.rentPaymentDay < 1 || formData.rentPaymentDay > 28) {
      errors.push({
        field: 'rentPaymentDay',
        message: 'Payment day must be between 1 and 28',
        rraReference: 'Standard practice',
      });
    }
  }

  // EPC rating validation
  if (formData.epcRating !== undefined) {
    const lowRatings: EPCRating[] = ['D', 'E', 'F', 'G'];
    if (lowRatings.includes(formData.epcRating)) {
      errors.push({
        field: 'epcRating',
        message: 'Property EPC rating must be C or above for new tenancies',
        rraReference: 'MEES Regulations 2025',
      });
    }
  }

  // PRS registration validation
  if (!formData.prsRegistrationNumber) {
    errors.push({
      field: 'prsRegistrationNumber',
      message: 'Landlord must be registered with PRS Database',
      rraReference: 'RRA 2025 - PRS Registration',
    });
  }

  // Ombudsman validation
  if (!formData.ombudsmanScheme || !formData.ombudsmanMembershipNumber) {
    errors.push({
      field: 'ombudsmanScheme',
      message: 'Landlord must be member of approved ombudsman scheme',
      rraReference: 'RRA 2025 - Ombudsman Membership',
    });
  }

  // Gas safety check (if property has gas)
  if (formData.hasGas && !formData.gasSafetyDate) {
    errors.push({
      field: 'gasSafetyDate',
      message: 'Gas Safety Certificate date is required for properties with gas',
      rraReference: 'Gas Safety (Installation and Use) Regulations 1998',
    });
  }

  // EICR validation
  if (!formData.eicrDate) {
    errors.push({
      field: 'eicrDate',
      message: 'Electrical Installation Condition Report date is required',
      rraReference: 'Electrical Safety Standards Regulations 2020',
    });
  }

  // Warnings (non-blocking best practices)
  if (!formData.inventoryIncluded) {
    warnings.push({
      field: 'inventoryIncluded',
      message: 'No inventory included',
      suggestion: 'An inventory protects both parties in deposit disputes',
    });
  }

  if (!formData.depositProtectedDate) {
    warnings.push({
      field: 'depositProtectedDate',
      message: 'Deposit protection date not set',
      suggestion: 'Deposit must be protected within 30 days of receipt',
    });
  }

  return {
    isCompliant: errors.length === 0,
    errors,
    warnings,
  };
}

// =====================================================
// CALCULATION FUNCTIONS
// =====================================================

/**
 * Calculate maximum deposit allowed under Tenant Fees Act 2019
 * 5 weeks' rent for annual rent < £50,000
 * 6 weeks' rent for annual rent >= £50,000
 */
export function calculateMaxDeposit(monthlyRent: number): number {
  const annualRent = monthlyRent * 12;
  const weeklyRent = annualRent / 52;

  if (annualRent >= 50000) {
    return weeklyRent * 6; // 6 weeks for high-value
  }
  return weeklyRent * 5; // 5 weeks for standard
}

/**
 * Calculate deposit amount in weeks
 */
export function calculateDepositWeeks(monthlyRent: number, depositAmount: number): number {
  const weeklyRent = (monthlyRent * 12) / 52;
  return depositAmount / weeklyRent;
}

/**
 * Calculate maximum holding deposit (1 week's rent)
 */
export function calculateMaxHoldingDeposit(monthlyRent: number): number {
  return (monthlyRent * 12) / 52; // 1 week
}

/**
 * Get maximum rent in advance allowed (1 month)
 */
export function getMaxRentInAdvanceMonths(): number {
  return 1;
}

// =====================================================
// VARIABLE SUBSTITUTION
// =====================================================

/**
 * Substitute variables in clause content
 */
export function substituteVariables(
  content: string,
  formData: Partial<AgreementFormData>
): string {
  let result = content;

  // Handle simple variable substitution
  const variableMap: Record<string, string | number | undefined> = {
    landlord_name: formData.landlordName,
    landlord_address: formData.landlordAddress,
    tenant_name: formData.tenantName,
    agent_name: formData.agentName,
    agent_address: formData.agentAddress,
    property_address: formData.propertyAddress,
    rent_amount: formData.rentAmount,
    payment_day: formData.rentPaymentDay,
    payment_method: formData.rentPaymentMethod,
    deposit_amount: formData.depositAmount,
    deposit_weeks: formData.depositWeeks?.toFixed(1),
    deposit_scheme: formData.depositScheme,
    deposit_scheme_ref: formData.depositSchemeRef,
    deposit_protected_date: formData.depositProtectedDate,
    start_date: formData.tenancyStartDate ? formatDate(formData.tenancyStartDate) : '',
    agreement_date: formData.agreementDate ? formatDate(formData.agreementDate) : '',
    epc_rating: formData.epcRating,
    epc_expiry_date: formData.epcExpiryDate ? formatDate(formData.epcExpiryDate) : '',
    gas_safety_date: formData.gasSafetyDate ? formatDate(formData.gasSafetyDate) : '',
    eicr_date: formData.eicrDate ? formatDate(formData.eicrDate) : '',
    prs_registration_number: formData.prsRegistrationNumber,
    ombudsman_scheme: formData.ombudsmanScheme,
    ombudsman_membership_number: formData.ombudsmanMembershipNumber,
    furnishing_level: formData.furnishingLevel,
    council_tax_responsibility: formData.councilTaxResponsibility,
    council_tax_band: formData.councilTaxBand,
    pet_details: formData.petDetails,
    parking_details: formData.parkingDetails,
    garden_maintenance: formData.gardenMaintenance,
    included_utilities: formData.includedUtilities,
    additional_conditions: formData.additionalConditions,
  };

  // Replace {{variable_name}} patterns
  for (const [key, value] of Object.entries(variableMap)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value !== undefined ? String(value) : '');
  }

  // Handle conditional blocks {{#if condition}}...{{/if}}
  result = processConditionals(result, formData);

  return result;
}

/**
 * Process conditional blocks in template
 */
function processConditionals(
  content: string,
  formData: Partial<AgreementFormData>
): string {
  let result = content;

  // Map field names to boolean values
  const conditionalMap: Record<string, boolean> = {
    pets_allowed: formData.petsAllowed ?? false,
    inventory_included: formData.inventoryIncluded ?? false,
    parking_included: formData.parkingIncluded ?? false,
    has_garden: formData.hasGarden ?? false,
    has_gas: formData.hasGas ?? true,
    utilities_included: formData.utilitiesIncluded ?? false,
    additional_conditions: !!formData.additionalConditions,
  };

  // Process {{#if condition}}content{{else}}other{{/if}} blocks
  for (const [condition, value] of Object.entries(conditionalMap)) {
    // With else clause
    const ifElseRegex = new RegExp(
      `\\{\\{#if\\s+${condition}\\}\\}([\\s\\S]*?)\\{\\{else\\}\\}([\\s\\S]*?)\\{\\{/if\\}\\}`,
      'g'
    );
    result = result.replace(ifElseRegex, (_, ifContent, elseContent) => {
      return value ? ifContent : elseContent;
    });

    // Without else clause
    const ifOnlyRegex = new RegExp(
      `\\{\\{#if\\s+${condition}\\}\\}([\\s\\S]*?)\\{\\{/if\\}\\}`,
      'g'
    );
    result = result.replace(ifOnlyRegex, (_, ifContent) => {
      return value ? ifContent : '';
    });
  }

  return result;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function formatPropertyAddress(property: Record<string, unknown>): string {
  const address = property.address as Record<string, string> | undefined;
  if (!address) return '';
  return [address.street, address.city, address.postcode].filter(Boolean).join(', ');
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

function mapTemplateFromDb(row: Record<string, unknown>): AgreementTemplate {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string | undefined,
    version: row.version as string,
    sections: (row.sections as AgreementSection[]) || [],
    isSystemTemplate: row.is_system_template as boolean,
    createdBy: row.created_by as string | undefined,
    isActive: row.is_active as boolean,
    rraCompliant: row.rra_compliant as boolean,
    lastComplianceCheck: row.last_compliance_check
      ? new Date(row.last_compliance_check as string)
      : undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

function mapClauseFromDb(row: Record<string, unknown>): AgreementClause {
  return {
    id: row.id as string,
    category: row.category as ClauseCategory,
    title: row.title as string,
    content: row.content as string,
    variables: row.variables as AgreementClause['variables'],
    isMandatory: row.is_mandatory as boolean,
    isProhibited: row.is_prohibited as boolean,
    rraReference: row.rra_reference as string | undefined,
  };
}

function mapGeneratedAgreementFromDb(row: Record<string, unknown>): GeneratedAgreement {
  return {
    id: row.id as string,
    templateId: row.template_id as string,
    matchId: row.match_id as string,
    landlordId: row.landlord_id as string,
    agencyId: row.agency_id as string | undefined,
    renterId: row.renter_id as string,
    propertyId: row.property_id as string,
    agreementData: row.agreement_data as AgreementFormData,
    generatedPdfPath: row.generated_pdf_path as string | undefined,
    generatedAt: row.generated_at ? new Date(row.generated_at as string) : undefined,
    tenancyAgreementId: row.tenancy_agreement_id as string | undefined,
    status: row.status as GeneratedAgreementStatus,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    createdBy: row.created_by as string,
    template: row.template ? mapTemplateFromDb(row.template as Record<string, unknown>) : undefined,
    property: row.property as Property | undefined,
    landlord: row.landlord as LandlordProfile | undefined,
    renter: row.renter as RenterProfile | undefined,
  };
}
