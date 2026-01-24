/**
 * Management Contract Service
 * Handles CRUD operations for landlord-agency management contracts
 */

import { supabase } from './supabase';
import type {
  ManagementContract,
  ManagementContractTerms,
  ManagementContractStatus,
  ManagementServiceLevel,
  ManagementServiceInclusions,
  ManagementContractWizardState,
  LandlordProfile,
  AgencyProfile,
  Property,
} from '../types';

// Default service inclusions per service level
export const DEFAULT_SERVICE_INCLUSIONS: Record<ManagementServiceLevel, ManagementServiceInclusions> = {
  let_only: {
    tenantFinding: true,
    referenceChecking: true,
    rentCollection: false,
    propertyInspections: false,
    maintenanceCoordination: false,
    tenantCommunication: false,
    legalCompliance: false,
    evictionHandling: false,
  },
  rent_collection: {
    tenantFinding: true,
    referenceChecking: true,
    rentCollection: true,
    propertyInspections: false,
    maintenanceCoordination: false,
    tenantCommunication: false,
    legalCompliance: false,
    evictionHandling: false,
  },
  full_management: {
    tenantFinding: true,
    referenceChecking: true,
    rentCollection: true,
    propertyInspections: true,
    maintenanceCoordination: true,
    tenantCommunication: true,
    legalCompliance: true,
    evictionHandling: true,
  },
};

// Default commission rates per service level (percentage)
export const DEFAULT_COMMISSION_RATES: Record<ManagementServiceLevel, number> = {
  let_only: 0,       // Let-only uses flat fee instead
  rent_collection: 8, // 8% of rent
  full_management: 12, // 12% of rent
};

// =====================================================
// CRUD OPERATIONS
// =====================================================

/**
 * Create a new management contract
 */
export async function createManagementContract(
  landlordId: string,
  agencyId: string,
  propertyIds: string[],
  terms: ManagementContractTerms,
  createdBy: string
): Promise<ManagementContract> {
  const { data, error } = await supabase
    .from('management_contracts')
    .insert({
      landlord_id: landlordId,
      agency_id: agencyId,
      property_ids: propertyIds,
      service_level: terms.serviceLevel,
      commission_rate: terms.commissionRate,
      let_only_fee: terms.letOnlyFee,
      contract_length_months: terms.contractLengthMonths,
      notice_period_days: terms.noticePeriodDays,
      renewal_type: terms.renewalType,
      included_services: terms.includedServices,
      payment_frequency: terms.paymentTerms.paymentFrequency,
      payment_method: terms.paymentTerms.paymentMethod,
      invoice_due_within_days: terms.paymentTerms.invoiceDueWithinDays,
      emergency_response_hours: terms.slaTerms.emergencyResponseHours,
      routine_response_days: terms.slaTerms.routineResponseDays,
      rent_remittance_days: terms.slaTerms.rentRemittanceDays,
      inspection_frequency: terms.slaTerms.inspectionFrequency,
      status: 'draft',
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) {
    console.error('[ManagementContractService] Failed to create contract:', error);
    throw new Error('Failed to create management contract');
  }

  return mapContractFromDb(data);
}

/**
 * Get a management contract by ID
 */
export async function getManagementContract(id: string): Promise<ManagementContract | null> {
  const { data, error } = await supabase
    .from('management_contracts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('[ManagementContractService] Failed to fetch contract:', error);
    throw new Error('Failed to load management contract');
  }

  return mapContractFromDb(data);
}

/**
 * Get a management contract with related data
 */
export async function getManagementContractWithDetails(id: string): Promise<ManagementContract | null> {
  const { data, error } = await supabase
    .from('management_contracts')
    .select(`
      *,
      landlord:landlord_profiles(*),
      agency:agency_profiles(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('[ManagementContractService] Failed to fetch contract with details:', error);
    throw new Error('Failed to load management contract');
  }

  // Fetch properties separately since it's an array
  const contract = mapContractFromDb(data);
  if (contract.propertyIds.length > 0) {
    const { data: properties } = await supabase
      .from('properties')
      .select('*')
      .in('id', contract.propertyIds);
    contract.properties = properties as Property[] | undefined;
  }

  contract.landlord = data.landlord as LandlordProfile | undefined;
  contract.agency = data.agency as AgencyProfile | undefined;

  return contract;
}

/**
 * Get all contracts for a landlord
 */
export async function getContractsByLandlord(landlordId: string): Promise<ManagementContract[]> {
  const { data, error } = await supabase
    .from('management_contracts')
    .select(`
      *,
      agency:agency_profiles(id, company_name, trading_name, email)
    `)
    .eq('landlord_id', landlordId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[ManagementContractService] Failed to fetch landlord contracts:', error);
    throw new Error('Failed to load contracts');
  }

  return (data || []).map(row => {
    const contract = mapContractFromDb(row);
    contract.agency = row.agency as AgencyProfile | undefined;
    return contract;
  });
}

/**
 * Get all contracts for an agency
 */
export async function getContractsByAgency(agencyId: string): Promise<ManagementContract[]> {
  const { data, error } = await supabase
    .from('management_contracts')
    .select(`
      *,
      landlord:landlord_profiles(id, names, email)
    `)
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[ManagementContractService] Failed to fetch agency contracts:', error);
    throw new Error('Failed to load contracts');
  }

  return (data || []).map(row => {
    const contract = mapContractFromDb(row);
    contract.landlord = row.landlord as LandlordProfile | undefined;
    return contract;
  });
}

/**
 * Get active contracts for a property
 */
export async function getActiveContractsForProperty(propertyId: string): Promise<ManagementContract[]> {
  const { data, error } = await supabase
    .from('management_contracts')
    .select('*')
    .contains('property_ids', [propertyId])
    .eq('status', 'active');

  if (error) {
    console.error('[ManagementContractService] Failed to fetch property contracts:', error);
    throw new Error('Failed to load contracts');
  }

  return (data || []).map(mapContractFromDb);
}

/**
 * Update a management contract
 */
export async function updateManagementContract(
  id: string,
  updates: Partial<ManagementContractTerms> & {
    propertyIds?: string[];
    status?: ManagementContractStatus;
  }
): Promise<ManagementContract> {
  const dbUpdates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.serviceLevel) dbUpdates.service_level = updates.serviceLevel;
  if (updates.commissionRate !== undefined) dbUpdates.commission_rate = updates.commissionRate;
  if (updates.letOnlyFee !== undefined) dbUpdates.let_only_fee = updates.letOnlyFee;
  if (updates.contractLengthMonths !== undefined) dbUpdates.contract_length_months = updates.contractLengthMonths;
  if (updates.noticePeriodDays !== undefined) dbUpdates.notice_period_days = updates.noticePeriodDays;
  if (updates.renewalType) dbUpdates.renewal_type = updates.renewalType;
  if (updates.includedServices) dbUpdates.included_services = updates.includedServices;
  if (updates.propertyIds) dbUpdates.property_ids = updates.propertyIds;
  if (updates.status) dbUpdates.status = updates.status;

  if (updates.paymentTerms) {
    dbUpdates.payment_frequency = updates.paymentTerms.paymentFrequency;
    dbUpdates.payment_method = updates.paymentTerms.paymentMethod;
    dbUpdates.invoice_due_within_days = updates.paymentTerms.invoiceDueWithinDays;
  }

  if (updates.slaTerms) {
    dbUpdates.emergency_response_hours = updates.slaTerms.emergencyResponseHours;
    dbUpdates.routine_response_days = updates.slaTerms.routineResponseDays;
    dbUpdates.rent_remittance_days = updates.slaTerms.rentRemittanceDays;
    dbUpdates.inspection_frequency = updates.slaTerms.inspectionFrequency;
  }

  const { data, error } = await supabase
    .from('management_contracts')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[ManagementContractService] Failed to update contract:', error);
    throw new Error('Failed to update management contract');
  }

  return mapContractFromDb(data);
}

/**
 * Delete a draft contract
 */
export async function deleteManagementContract(id: string): Promise<void> {
  const { error } = await supabase
    .from('management_contracts')
    .delete()
    .eq('id', id)
    .eq('status', 'draft');

  if (error) {
    console.error('[ManagementContractService] Failed to delete contract:', error);
    throw new Error('Failed to delete contract. Only draft contracts can be deleted.');
  }
}

// =====================================================
// STATUS OPERATIONS
// =====================================================

/**
 * Submit contract for agency review
 */
export async function submitForAgencyReview(id: string): Promise<ManagementContract> {
  return updateContractStatus(id, 'pending_agency');
}

/**
 * Submit contract for landlord review (agency-initiated)
 */
export async function submitForLandlordReview(id: string): Promise<ManagementContract> {
  return updateContractStatus(id, 'pending_landlord');
}

/**
 * Sign contract as landlord
 */
export async function signAsLandlord(id: string): Promise<ManagementContract> {
  const contract = await getManagementContract(id);
  if (!contract) throw new Error('Contract not found');

  const { data, error } = await supabase
    .from('management_contracts')
    .update({
      signed_by_landlord_at: new Date().toISOString(),
      status: contract.signedByAgencyAt ? 'active' : contract.status,
      effective_from: contract.signedByAgencyAt ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[ManagementContractService] Failed to sign as landlord:', error);
    throw new Error('Failed to sign contract');
  }

  return mapContractFromDb(data);
}

/**
 * Sign contract as agency
 */
export async function signAsAgency(id: string): Promise<ManagementContract> {
  const contract = await getManagementContract(id);
  if (!contract) throw new Error('Contract not found');

  const now = new Date();
  const effectiveUntil = contract.terms.contractLengthMonths > 0
    ? new Date(now.getTime() + contract.terms.contractLengthMonths * 30 * 24 * 60 * 60 * 1000)
    : null;

  const { data, error } = await supabase
    .from('management_contracts')
    .update({
      signed_by_agency_at: now.toISOString(),
      status: contract.signedByLandlordAt ? 'active' : contract.status,
      effective_from: contract.signedByLandlordAt ? now.toISOString() : null,
      effective_until: contract.signedByLandlordAt && effectiveUntil ? effectiveUntil.toISOString() : null,
      updated_at: now.toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[ManagementContractService] Failed to sign as agency:', error);
    throw new Error('Failed to sign contract');
  }

  return mapContractFromDb(data);
}

/**
 * Terminate a contract
 */
export async function terminateContract(id: string, reason: string): Promise<ManagementContract> {
  const { data, error } = await supabase
    .from('management_contracts')
    .update({
      status: 'terminated',
      terminated_at: new Date().toISOString(),
      termination_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[ManagementContractService] Failed to terminate contract:', error);
    throw new Error('Failed to terminate contract');
  }

  return mapContractFromDb(data);
}

/**
 * Update contract status
 */
async function updateContractStatus(
  id: string,
  status: ManagementContractStatus
): Promise<ManagementContract> {
  const { data, error } = await supabase
    .from('management_contracts')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[ManagementContractService] Failed to update status:', error);
    throw new Error('Failed to update contract status');
  }

  return mapContractFromDb(data);
}

// =====================================================
// PDF GENERATION
// =====================================================

/**
 * Generate PDF for a contract
 */
export async function generateContractPdf(id: string): Promise<string> {
  const contract = await getManagementContractWithDetails(id);
  if (!contract) throw new Error('Contract not found');

  // Generate PDF content (simplified - in production would use a PDF library)
  const pdfContent = generatePdfContent(contract);

  // Upload to storage
  const fileName = `management-contract-${id}-${Date.now()}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from('contracts')
    .upload(fileName, pdfContent, {
      contentType: 'application/pdf',
    });

  if (uploadError) {
    console.error('[ManagementContractService] Failed to upload PDF:', uploadError);
    throw new Error('Failed to generate contract PDF');
  }

  // Update contract with PDF path
  const { error: updateError } = await supabase
    .from('management_contracts')
    .update({
      generated_pdf_path: fileName,
      generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) {
    console.error('[ManagementContractService] Failed to update PDF path:', updateError);
  }

  return fileName;
}

/**
 * Get PDF download URL
 */
export async function getContractPdfUrl(pdfPath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('contracts')
    .createSignedUrl(pdfPath, 3600); // 1 hour expiry

  if (error) {
    console.error('[ManagementContractService] Failed to get PDF URL:', error);
    throw new Error('Failed to get contract PDF');
  }

  return data.signedUrl;
}

// =====================================================
// WIZARD STATE HELPERS
// =====================================================

/**
 * Create initial wizard state
 */
export function createInitialWizardState(
  serviceLevel: ManagementServiceLevel = 'full_management'
): ManagementContractWizardState {
  const inclusions = { ...DEFAULT_SERVICE_INCLUSIONS[serviceLevel] };

  return {
    currentStep: 0,
    selectedAgencyId: undefined,
    selectedPropertyIds: [],
    serviceLevel,
    commissionRate: DEFAULT_COMMISSION_RATES[serviceLevel],
    letOnlyFee: serviceLevel === 'let_only' ? 500 : undefined, // Default £500 for let-only
    contractLengthMonths: 12,
    noticePeriodDays: 30,
    renewalType: 'manual',
    includedServices: inclusions,
    paymentTerms: {
      paymentFrequency: 'monthly',
      paymentMethod: 'bank_transfer',
      invoiceDueWithinDays: 14,
    },
    slaTerms: {
      emergencyResponseHours: 24,
      routineResponseDays: 5,
      rentRemittanceDays: 7,
      inspectionFrequency: 'quarterly',
    },
    isDirty: false,
    lastSavedAt: undefined,
  };
}

/**
 * Save wizard state to localStorage
 */
export function saveWizardState(state: ManagementContractWizardState): void {
  try {
    localStorage.setItem('management_contract_wizard', JSON.stringify({
      ...state,
      lastSavedAt: new Date().toISOString(),
    }));
  } catch (err) {
    console.error('[ManagementContractService] Failed to save wizard state:', err);
  }
}

/**
 * Load wizard state from localStorage
 */
export function loadWizardState(): ManagementContractWizardState | null {
  try {
    const saved = localStorage.getItem('management_contract_wizard');
    if (!saved) return null;

    const state = JSON.parse(saved);
    return {
      ...state,
      lastSavedAt: state.lastSavedAt ? new Date(state.lastSavedAt) : undefined,
    };
  } catch (err) {
    console.error('[ManagementContractService] Failed to load wizard state:', err);
    return null;
  }
}

/**
 * Clear wizard state from localStorage
 */
export function clearWizardState(): void {
  try {
    localStorage.removeItem('management_contract_wizard');
  } catch (err) {
    console.error('[ManagementContractService] Failed to clear wizard state:', err);
  }
}

/**
 * Convert wizard state to contract terms
 */
export function wizardStateToTerms(state: ManagementContractWizardState): ManagementContractTerms {
  return {
    serviceLevel: state.serviceLevel,
    commissionRate: state.commissionRate,
    letOnlyFee: state.letOnlyFee,
    contractLengthMonths: state.contractLengthMonths,
    noticePeriodDays: state.noticePeriodDays,
    renewalType: state.renewalType,
    includedServices: state.includedServices,
    paymentTerms: state.paymentTerms,
    slaTerms: state.slaTerms,
  };
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function mapContractFromDb(row: Record<string, unknown>): ManagementContract {
  return {
    id: row.id as string,
    landlordId: row.landlord_id as string,
    agencyId: row.agency_id as string,
    propertyIds: row.property_ids as string[],
    terms: {
      serviceLevel: row.service_level as ManagementServiceLevel,
      commissionRate: parseFloat(row.commission_rate as string),
      letOnlyFee: row.let_only_fee ? parseFloat(row.let_only_fee as string) : undefined,
      contractLengthMonths: row.contract_length_months as number,
      noticePeriodDays: row.notice_period_days as number,
      renewalType: row.renewal_type as 'auto' | 'manual' | 'none',
      includedServices: row.included_services as ManagementServiceInclusions,
      paymentTerms: {
        paymentFrequency: row.payment_frequency as 'monthly' | 'quarterly',
        paymentMethod: row.payment_method as 'bank_transfer' | 'standing_order',
        invoiceDueWithinDays: row.invoice_due_within_days as number,
      },
      slaTerms: {
        emergencyResponseHours: row.emergency_response_hours as number,
        routineResponseDays: row.routine_response_days as number,
        rentRemittanceDays: row.rent_remittance_days as number,
        inspectionFrequency: row.inspection_frequency as 'monthly' | 'quarterly' | 'biannually',
      },
    },
    status: row.status as ManagementContractStatus,
    signedByLandlordAt: row.signed_by_landlord_at
      ? new Date(row.signed_by_landlord_at as string)
      : undefined,
    signedByAgencyAt: row.signed_by_agency_at
      ? new Date(row.signed_by_agency_at as string)
      : undefined,
    effectiveFrom: row.effective_from
      ? new Date(row.effective_from as string)
      : undefined,
    effectiveUntil: row.effective_until
      ? new Date(row.effective_until as string)
      : undefined,
    terminatedAt: row.terminated_at
      ? new Date(row.terminated_at as string)
      : undefined,
    terminationReason: row.termination_reason as string | undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    createdBy: row.created_by as string,
    generatedPdfPath: row.generated_pdf_path as string | undefined,
    generatedAt: row.generated_at
      ? new Date(row.generated_at as string)
      : undefined,
  };
}

function generatePdfContent(contract: ManagementContract): Blob {
  // In a real implementation, this would use a PDF library like jsPDF or pdfmake
  // For now, return a placeholder
  const content = `
MANAGEMENT CONTRACT

Contract ID: ${contract.id}
Service Level: ${contract.terms.serviceLevel}
Commission Rate: ${contract.terms.commissionRate}%
Contract Length: ${contract.terms.contractLengthMonths} months

Landlord ID: ${contract.landlordId}
Agency ID: ${contract.agencyId}
Properties: ${contract.propertyIds.join(', ')}

Status: ${contract.status}
Created: ${contract.createdAt.toISOString()}
  `.trim();

  return new Blob([content], { type: 'application/pdf' });
}

/**
 * Format service level for display
 */
export function formatServiceLevel(level: ManagementServiceLevel): string {
  const labels: Record<ManagementServiceLevel, string> = {
    let_only: 'Let Only',
    rent_collection: 'Rent Collection',
    full_management: 'Full Management',
  };
  return labels[level];
}

/**
 * Get service level description
 */
export function getServiceLevelDescription(level: ManagementServiceLevel): string {
  const descriptions: Record<ManagementServiceLevel, string> = {
    let_only: 'One-time tenant finding service. The agency finds and references tenants, then hands over to the landlord.',
    rent_collection: 'Ongoing rent collection service. Includes tenant finding plus monthly rent collection and remittance.',
    full_management: 'Complete property management. Includes all services: tenant finding, rent collection, maintenance coordination, inspections, and legal compliance.',
  };
  return descriptions[level];
}
