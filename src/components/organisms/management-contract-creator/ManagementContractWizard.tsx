/**
 * ManagementContractWizard - Main wizard component for creating management contracts
 */

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { ManagementContractProgress } from './ManagementContractProgress';
import { SelectAgencyStep } from './steps/SelectAgencyStep';
import { SelectPropertiesStep } from './steps/SelectPropertiesStep';
import { ServiceLevelStep } from './steps/ServiceLevelStep';
import { CommissionFeesStep } from './steps/CommissionFeesStep';
import { ServiceInclusionsStep } from './steps/ServiceInclusionsStep';
import { SlaTermsStep } from './steps/SlaTermsStep';
import { ContractDurationStep } from './steps/ContractDurationStep';
import { ReviewGenerateStep } from './steps/ReviewGenerateStep';
import {
  createInitialWizardState,
  saveWizardState,
  loadWizardState,
  clearWizardState,
  wizardStateToTerms,
  createManagementContract,
  submitForAgencyReview,
  generateContractPdf,
  getContractPdfUrl,
  DEFAULT_SERVICE_INCLUSIONS,
  DEFAULT_COMMISSION_RATES,
} from '../../../lib/managementContractService';
import { supabase } from '../../../lib/supabase';
import type {
  ManagementContractWizardState,
  ManagementServiceLevel,
  ManagementServiceInclusions,
  ManagementSlaTerms,
  AgencyProfile,
  Property,
} from '../../../types';

interface ManagementContractWizardProps {
  landlordId: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const STEPS = [
  { id: 'agency', title: 'Select Agency', shortTitle: 'Agency' },
  { id: 'properties', title: 'Select Properties', shortTitle: 'Properties' },
  { id: 'service-level', title: 'Service Level', shortTitle: 'Level' },
  { id: 'commission', title: 'Commission & Fees', shortTitle: 'Fees' },
  { id: 'services', title: 'Service Inclusions', shortTitle: 'Services' },
  { id: 'sla', title: 'SLA Terms', shortTitle: 'SLA' },
  { id: 'duration', title: 'Contract Duration', shortTitle: 'Duration' },
  { id: 'review', title: 'Review & Generate', shortTitle: 'Review' },
];

export function ManagementContractWizard({
  landlordId,
  isOpen,
  onClose,
  onComplete,
}: ManagementContractWizardProps) {
  const [wizardState, setWizardState] = useState<ManagementContractWizardState>(
    () => loadWizardState() || createInitialWizardState()
  );
  const [selectedAgency, setSelectedAgency] = useState<AgencyProfile | null>(null);
  const [selectedProperties, setSelectedProperties] = useState<Property[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | undefined>();
  const [contractId, setContractId] = useState<string | undefined>();

  // Auto-save wizard state
  useEffect(() => {
    if (wizardState.isDirty) {
      saveWizardState(wizardState);
    }
  }, [wizardState]);

  // Load agency data when selected
  useEffect(() => {
    if (wizardState.selectedAgencyId) {
      loadAgency(wizardState.selectedAgencyId);
    } else {
      setSelectedAgency(null);
    }
  }, [wizardState.selectedAgencyId]);

  // Load properties data when selected
  useEffect(() => {
    if (wizardState.selectedPropertyIds.length > 0) {
      loadProperties(wizardState.selectedPropertyIds);
    } else {
      setSelectedProperties([]);
    }
  }, [wizardState.selectedPropertyIds]);

  async function loadAgency(agencyId: string) {
    const { data } = await supabase
      .from('agency_profiles')
      .select('*')
      .eq('id', agencyId)
      .single();
    if (data) setSelectedAgency(data as AgencyProfile);
  }

  async function loadProperties(propertyIds: string[]) {
    const { data } = await supabase
      .from('properties')
      .select('*')
      .in('id', propertyIds);
    if (data) setSelectedProperties(data as Property[]);
  }

  const updateState = useCallback((updates: Partial<ManagementContractWizardState>) => {
    setWizardState(prev => ({
      ...prev,
      ...updates,
      isDirty: true,
    }));
  }, []);

  function handleServiceLevelChange(level: ManagementServiceLevel) {
    updateState({
      serviceLevel: level,
      commissionRate: DEFAULT_COMMISSION_RATES[level],
      includedServices: { ...DEFAULT_SERVICE_INCLUSIONS[level] },
      letOnlyFee: level === 'let_only' ? 500 : undefined,
    });
  }

  function canProceed(): boolean {
    switch (wizardState.currentStep) {
      case 0: // Agency
        return !!wizardState.selectedAgencyId;
      case 1: // Properties
        return wizardState.selectedPropertyIds.length > 0;
      case 2: // Service Level
        return !!wizardState.serviceLevel;
      case 3: // Commission
        if (wizardState.serviceLevel === 'let_only') {
          return !!wizardState.letOnlyFee && wizardState.letOnlyFee > 0;
        }
        return wizardState.commissionRate > 0;
      case 4: // Services
        return Object.values(wizardState.includedServices).some(Boolean);
      case 5: // SLA
        return true; // All have defaults
      case 6: // Duration
        return true; // All have defaults
      case 7: // Review
        return true;
      default:
        return false;
    }
  }

  function goNext() {
    if (canProceed() && wizardState.currentStep < STEPS.length - 1) {
      updateState({ currentStep: wizardState.currentStep + 1 });
    }
  }

  function goPrev() {
    if (wizardState.currentStep > 0) {
      updateState({ currentStep: wizardState.currentStep - 1 });
    }
  }

  function goToStep(step: number) {
    if (step <= wizardState.currentStep) {
      updateState({ currentStep: step });
    }
  }

  async function handleGenerate() {
    if (!wizardState.selectedAgencyId) return;

    try {
      setIsGenerating(true);

      // Create the contract in database
      const terms = wizardStateToTerms(wizardState);
      const contract = await createManagementContract(
        landlordId,
        wizardState.selectedAgencyId,
        wizardState.selectedPropertyIds,
        terms,
        landlordId
      );

      setContractId(contract.id);

      // Generate PDF
      const pdfPath = await generateContractPdf(contract.id);
      const pdfUrl = await getContractPdfUrl(pdfPath);
      setGeneratedPdfUrl(pdfUrl);
    } catch (err) {
      console.error('Failed to generate contract:', err);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSubmit() {
    if (!contractId) return;

    try {
      setIsSubmitting(true);
      await submitForAgencyReview(contractId);
      clearWizardState();
      onComplete();
    } catch (err) {
      console.error('Failed to submit contract:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    if (wizardState.isDirty) {
      // Could add confirmation dialog here
    }
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <h2 className="text-lg font-bold text-neutral-900">
            Create Management Contract
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors rounded-lg hover:bg-neutral-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-4 border-b border-neutral-100">
          <ManagementContractProgress
            steps={STEPS}
            currentStep={wizardState.currentStep}
            onStepClick={goToStep}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {wizardState.currentStep === 0 && (
            <SelectAgencyStep
              landlordId={landlordId}
              selectedAgencyId={wizardState.selectedAgencyId}
              onSelect={(agencyId) => updateState({ selectedAgencyId: agencyId })}
            />
          )}

          {wizardState.currentStep === 1 && (
            <SelectPropertiesStep
              landlordId={landlordId}
              selectedPropertyIds={wizardState.selectedPropertyIds}
              onSelect={(propertyIds) => updateState({ selectedPropertyIds: propertyIds })}
            />
          )}

          {wizardState.currentStep === 2 && (
            <ServiceLevelStep
              selectedLevel={wizardState.serviceLevel}
              onSelect={handleServiceLevelChange}
            />
          )}

          {wizardState.currentStep === 3 && (
            <CommissionFeesStep
              serviceLevel={wizardState.serviceLevel}
              commissionRate={wizardState.commissionRate}
              letOnlyFee={wizardState.letOnlyFee}
              paymentTerms={wizardState.paymentTerms}
              onChange={(updates) => updateState(updates as Partial<ManagementContractWizardState>)}
            />
          )}

          {wizardState.currentStep === 4 && (
            <ServiceInclusionsStep
              serviceLevel={wizardState.serviceLevel}
              inclusions={wizardState.includedServices}
              onChange={(inclusions: ManagementServiceInclusions) => updateState({ includedServices: inclusions })}
            />
          )}

          {wizardState.currentStep === 5 && (
            <SlaTermsStep
              slaTerms={wizardState.slaTerms}
              onChange={(terms: ManagementSlaTerms) => updateState({ slaTerms: terms })}
            />
          )}

          {wizardState.currentStep === 6 && (
            <ContractDurationStep
              contractLengthMonths={wizardState.contractLengthMonths}
              noticePeriodDays={wizardState.noticePeriodDays}
              renewalType={wizardState.renewalType}
              onChange={(updates) => updateState(updates as Partial<ManagementContractWizardState>)}
            />
          )}

          {wizardState.currentStep === 7 && (
            <ReviewGenerateStep
              wizardState={wizardState}
              agency={selectedAgency || undefined}
              properties={selectedProperties}
              onGenerate={handleGenerate}
              onSubmit={handleSubmit}
              isGenerating={isGenerating}
              isSubmitting={isSubmitting}
              generatedPdfUrl={generatedPdfUrl}
            />
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between p-4 border-t border-neutral-200">
          <button
            onClick={goPrev}
            disabled={wizardState.currentStep === 0}
            className="flex items-center gap-2 px-4 py-2 text-neutral-600 hover:text-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            Back
          </button>

          <div className="flex items-center gap-2">
            {wizardState.isDirty && (
              <span className="text-xs text-neutral-500 flex items-center gap-1">
                <Save className="h-3 w-3" />
                Auto-saved
              </span>
            )}
          </div>

          {wizardState.currentStep < STEPS.length - 1 && (
            <button
              onClick={goNext}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          {wizardState.currentStep === STEPS.length - 1 && (
            <div /> // Empty div to maintain flex spacing; buttons are in ReviewGenerateStep
          )}
        </div>
      </div>
    </div>
  );
}
