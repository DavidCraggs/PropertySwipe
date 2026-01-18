/**
 * AgreementCreatorWizard
 * Multi-step wizard for creating RRA 2025 compliant tenancy agreements
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  FileText,
  Users,
  Home,
  Banknote,
  UserPlus,
  PawPrint,
  Zap,
  Shield,
  Plus,
  Eye,
  Download,
} from 'lucide-react';
import { Button } from '../../atoms/Button';
import { PartiesStep } from './steps/PartiesStep';
import { PropertyStep } from './steps/PropertyStep';
import { RentDepositStep } from './steps/RentDepositStep';
import { OccupantsStep } from './steps/OccupantsStep';
import { PetsStep } from './steps/PetsStep';
import { UtilitiesStep } from './steps/UtilitiesStep';
import { ComplianceStep } from './steps/ComplianceStep';
import { SpecialConditionsStep } from './steps/SpecialConditionsStep';
import { ReviewStep } from './steps/ReviewStep';
import { GenerateStep } from './steps/GenerateStep';
import {
  getDefaultTemplate,
  createDraftAgreement,
  updateAgreementData,
  checkCompliance,
} from '../../../lib/agreementCreatorService';
import type {
  Match,
  AgreementTemplate,
  AgreementFormData,
  GeneratedAgreement,
  ComplianceCheckResult,
  WizardStep,
} from '../../../types';

interface AgreementCreatorWizardProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  currentUserId: string;
  currentUserType: 'landlord' | 'agency';
  onComplete: (agreement: GeneratedAgreement) => void;
}

const WIZARD_STEPS: WizardStep[] = [
  { id: 'parties', title: 'Parties', description: 'Landlord and tenant details', isOptional: false, isComplete: false },
  { id: 'property', title: 'Property', description: 'Property details', isOptional: false, isComplete: false },
  { id: 'rent-deposit', title: 'Rent & Deposit', description: 'Financial terms', isOptional: false, isComplete: false },
  { id: 'occupants', title: 'Occupants', description: 'Additional occupants', isOptional: true, isComplete: false },
  { id: 'pets', title: 'Pets', description: 'Pet arrangements', isOptional: false, isComplete: false },
  { id: 'utilities', title: 'Utilities', description: 'Bills and services', isOptional: false, isComplete: false },
  { id: 'compliance', title: 'Compliance', description: 'Legal requirements', isOptional: false, isComplete: false },
  { id: 'special', title: 'Special Terms', description: 'Additional clauses', isOptional: true, isComplete: false },
  { id: 'review', title: 'Review', description: 'Preview agreement', isOptional: false, isComplete: false },
  { id: 'generate', title: 'Generate', description: 'Create and send', isOptional: false, isComplete: false },
];

const STEP_ICONS = [Users, Home, Banknote, UserPlus, PawPrint, Zap, Shield, Plus, Eye, Download];

export function AgreementCreatorWizard({
  isOpen,
  onClose,
  match,
  currentUserId,
  currentUserType,
  onComplete,
}: AgreementCreatorWizardProps) {
  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<WizardStep[]>(WIZARD_STEPS);
  const [template, setTemplate] = useState<AgreementTemplate | null>(null);
  const [agreement, setAgreement] = useState<GeneratedAgreement | null>(null);
  const [formData, setFormData] = useState<Partial<AgreementFormData>>({});
  const [complianceResult, setComplianceResult] = useState<ComplianceCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref for step navigation scroll container
  const stepNavRef = useRef<HTMLDivElement>(null);
  const stepButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Initialize wizard when opened
  useEffect(() => {
    if (isOpen && !template) {
      initializeWizard();
    }
  }, [isOpen]);

  // Auto-scroll to active step in navigation
  useEffect(() => {
    const activeButton = stepButtonRefs.current[currentStep];
    const container = stepNavRef.current;
    if (activeButton && container) {
      const containerRect = container.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      const scrollLeft = buttonRect.left - containerRect.left - (containerRect.width / 2) + (buttonRect.width / 2) + container.scrollLeft;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [currentStep]);

  // Auto-save form data periodically
  useEffect(() => {
    if (!agreement || Object.keys(formData).length === 0) return;

    const saveTimeout = setTimeout(() => {
      saveFormData();
    }, 2000);

    return () => clearTimeout(saveTimeout);
  }, [formData]);

  // Run compliance check when form data changes
  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      const result = checkCompliance(formData, match.property);
      setComplianceResult(result);
    }
  }, [formData, match.property]);

  const initializeWizard = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load default template
      const defaultTemplate = await getDefaultTemplate();
      if (!defaultTemplate) {
        throw new Error('No agreement template available');
      }
      setTemplate(defaultTemplate);

      // Create draft agreement
      const draft = await createDraftAgreement(match.id, defaultTemplate.id, currentUserId);
      setAgreement(draft);
      setFormData(draft.agreementData || {});
    } catch (err) {
      console.error('Failed to initialize wizard:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize agreement creator');
    } finally {
      setIsLoading(false);
    }
  };

  const saveFormData = async () => {
    if (!agreement) return;

    setIsSaving(true);
    try {
      await updateAgreementData(agreement.id, formData);
    } catch (err) {
      console.error('Failed to save form data:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const updateFormData = useCallback((updates: Partial<AgreementFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const markStepComplete = useCallback((stepIndex: number) => {
    setSteps((prev) =>
      prev.map((step, i) => (i === stepIndex ? { ...step, isComplete: true } : step))
    );
  }, []);

  // Validate a step and return error messages
  const validateStep = useCallback((stepIndex: number): string[] => {
    const errors: string[] = [];

    switch (stepIndex) {
      case 0: // Parties
        if (!formData.landlordName?.trim()) errors.push('Landlord name is required');
        if (!formData.landlordAddress?.trim()) errors.push('Landlord address is required');
        if (!formData.tenantName?.trim()) errors.push('Tenant name is required');
        break;
      case 1: // Property
        if (!formData.propertyAddress?.trim()) errors.push('Property address is required');
        if (!formData.tenancyStartDate) errors.push('Tenancy start date is required');
        if (!formData.furnishingLevel) errors.push('Furnishing level is required');
        break;
      case 2: // Rent & Deposit
        if (!formData.rentAmount || formData.rentAmount <= 0) errors.push('Rent amount is required');
        if (!formData.depositAmount || formData.depositAmount <= 0) errors.push('Deposit amount is required');
        if (!formData.depositScheme) errors.push('Deposit protection scheme is required');
        break;
      case 3: // Occupants (optional step)
        // No required fields
        break;
      case 4: // Pets
        if (formData.petsAllowed === undefined) errors.push('Please select whether pets are allowed');
        if (formData.petsAllowed && !formData.petDetails?.trim()) errors.push('Pet details are required when pets are allowed');
        break;
      case 5: // Utilities
        if (formData.councilTaxResponsibility === undefined) errors.push('Council tax responsibility is required');
        break;
      case 6: // Compliance
        if (!formData.prsRegistrationNumber?.trim()) errors.push('PRS registration number is required');
        if (!formData.ombudsmanScheme) errors.push('Ombudsman scheme is required');
        if (!formData.ombudsmanMembershipNumber?.trim()) errors.push('Ombudsman membership number is required');
        if (!formData.epcRating) errors.push('EPC rating is required');
        if (!formData.epcExpiryDate) errors.push('EPC expiry date is required');
        if (formData.hasGas !== false && !formData.gasSafetyDate) errors.push('Gas safety certificate date is required');
        if (!formData.eicrDate) errors.push('EICR (electrical safety) date is required');
        break;
      case 7: // Special Conditions (optional step)
        // No required fields
        break;
      case 8: // Review
        // No required fields - just a review step
        break;
      case 9: // Generate
        // No required fields - action step
        break;
    }

    return errors;
  }, [formData]);

  // Check if current step is valid
  const currentStepErrors = validateStep(currentStep);
  const isCurrentStepValid = currentStepErrors.length === 0;

  const goToStep = (step: number) => {
    if (step >= 0 && step < steps.length) {
      // Only allow going forward if current step is valid (or going backward)
      if (step > currentStep && !isCurrentStepValid) {
        return; // Block navigation forward if current step is invalid
      }
      // Mark current step as complete if moving forward and it's valid
      if (step > currentStep && isCurrentStepValid) {
        markStepComplete(currentStep);
      }
      setCurrentStep(step);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1 && isCurrentStepValid) {
      markStepComplete(currentStep);
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      // Save any pending changes
      if (agreement && Object.keys(formData).length > 0) {
        saveFormData();
      }
      onClose();
    }
  };

  const handleComplete = (completedAgreement: GeneratedAgreement) => {
    onComplete(completedAgreement);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal - Full screen on mobile, centered modal on desktop */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative bg-white sm:rounded-2xl shadow-2xl w-full sm:max-w-3xl h-[100dvh] sm:h-auto sm:max-h-[85vh] overflow-hidden flex flex-col"
        >
          {/* Header - Compact on mobile */}
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-4 sm:p-5 text-white flex-shrink-0">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-50 z-10"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 pr-10">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText size={20} className="sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold truncate">Create Agreement</h2>
                <p className="text-primary-100 text-xs sm:text-sm truncate">
                  {match.property.address.street}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3 flex items-center gap-0.5">
              {steps.map((step, i) => (
                <div
                  key={step.id}
                  className={`flex-1 h-1 sm:h-1.5 rounded-full transition-colors ${
                    i < currentStep
                      ? 'bg-white'
                      : i === currentStep
                      ? 'bg-white/70'
                      : 'bg-white/30'
                  }`}
                />
              ))}
            </div>

            {/* Step counter */}
            <div className="mt-2 flex items-center justify-between text-xs sm:text-sm">
              <span className="text-primary-100">
                Step {currentStep + 1}/{steps.length}
              </span>
              <span className="font-medium">{steps[currentStep].title}</span>
            </div>
          </div>

          {/* Step navigation - Horizontal scrollable */}
          <div className="border-b border-neutral-200 flex-shrink-0">
            <div
              ref={stepNavRef}
              className="flex gap-1.5 px-3 py-2.5 overflow-x-auto scrollbar-hide"
            >
              {steps.map((step, i) => {
                const Icon = STEP_ICONS[i];
                const isActive = i === currentStep;
                const isCompleted = step.isComplete;
                return (
                  <button
                    key={step.id}
                    ref={(el) => { stepButtonRefs.current[i] = el; }}
                    onClick={() => goToStep(i)}
                    disabled={isLoading}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                      isActive
                        ? 'bg-primary-500 text-white shadow-md ring-2 ring-primary-300'
                        : isCompleted
                        ? 'bg-success-100 text-success-700 hover:bg-success-200'
                        : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                    }`}
                  >
                    {isCompleted && !isActive ? (
                      <Check size={14} />
                    ) : (
                      <Icon size={14} />
                    )}
                    <span>{step.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
                <p className="text-neutral-500">Loading agreement template...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <AlertCircle size={48} className="text-danger-500" />
                <p className="text-danger-600">{error}</p>
                <Button variant="secondary" onClick={initializeWizard}>
                  Try Again
                </Button>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {currentStep === 0 && (
                    <PartiesStep
                      formData={formData}
                      onChange={updateFormData}
                    />
                  )}
                  {currentStep === 1 && (
                    <PropertyStep
                      formData={formData}
                      onChange={updateFormData}
                    />
                  )}
                  {currentStep === 2 && (
                    <RentDepositStep
                      formData={formData}
                      onChange={updateFormData}
                      match={match}
                    />
                  )}
                  {currentStep === 3 && (
                    <OccupantsStep
                      formData={formData}
                      onChange={updateFormData}
                    />
                  )}
                  {currentStep === 4 && (
                    <PetsStep
                      formData={formData}
                      onChange={updateFormData}
                    />
                  )}
                  {currentStep === 5 && (
                    <UtilitiesStep
                      formData={formData}
                      onChange={updateFormData}
                    />
                  )}
                  {currentStep === 6 && (
                    <ComplianceStep
                      formData={formData}
                      onChange={updateFormData}
                      complianceResult={complianceResult}
                    />
                  )}
                  {currentStep === 7 && (
                    <SpecialConditionsStep
                      formData={formData}
                      onChange={updateFormData}
                    />
                  )}
                  {currentStep === 8 && template && (
                    <ReviewStep
                      formData={formData}
                      template={template}
                      complianceResult={complianceResult}
                    />
                  )}
                  {currentStep === 9 && agreement && template && (
                    <GenerateStep
                      agreement={agreement}
                      formData={formData}
                      template={template}
                      match={match}
                      currentUserId={currentUserId}
                      currentUserType={currentUserType}
                      complianceResult={complianceResult}
                      onComplete={handleComplete}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-neutral-200 p-3 sm:p-4 bg-neutral-50 flex-shrink-0">
            {/* Validation errors */}
            {currentStepErrors.length > 0 && (
              <div className="mb-3 p-2.5 bg-danger-50 border border-danger-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-danger-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-danger-700 mb-1">Please complete required fields:</p>
                    <ul className="text-xs text-danger-600 space-y-0.5">
                      {currentStepErrors.map((err, i) => (
                        <li key={i}>• {err}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              {/* Compliance indicator - hidden on mobile when there are errors */}
              <div className={`flex items-center gap-2 flex-shrink-0 ${currentStepErrors.length > 0 ? 'hidden sm:flex' : ''}`}>
                {complianceResult && (
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs font-medium ${
                      complianceResult.isCompliant
                        ? 'bg-success-100 text-success-700'
                        : 'bg-warning-100 text-warning-700'
                    }`}
                  >
                    {complianceResult.isCompliant ? (
                      <>
                        <Check size={12} />
                        <span className="hidden sm:inline">RRA 2025 Compliant</span>
                        <span className="sm:hidden">Compliant</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={12} />
                        {complianceResult.errors.length} issue{complianceResult.errors.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </div>
                )}
                {isSaving && (
                  <span className="text-xs text-neutral-400">Saving...</span>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="flex gap-2 sm:gap-3 ml-auto">
                <Button
                  variant="secondary"
                  onClick={handlePrevious}
                  disabled={currentStep === 0 || isLoading}
                  className="flex items-center gap-1 px-3 sm:px-4"
                >
                  <ChevronLeft size={16} />
                  Back
                </Button>

                {currentStep < steps.length - 1 ? (
                  <Button
                    variant="primary"
                    onClick={handleNext}
                    disabled={isLoading || !isCurrentStepValid}
                    className="flex items-center gap-1 px-3 sm:px-4"
                  >
                    Next
                    <ChevronRight size={16} />
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
