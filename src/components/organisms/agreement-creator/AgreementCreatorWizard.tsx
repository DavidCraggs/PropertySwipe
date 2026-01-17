/**
 * AgreementCreatorWizard
 * Multi-step wizard for creating RRA 2025 compliant tenancy agreements
 */

import { useState, useEffect, useCallback } from 'react';
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
  getGeneratedAgreement,
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

  // Initialize wizard when opened
  useEffect(() => {
    if (isOpen && !template) {
      initializeWizard();
    }
  }, [isOpen]);

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

  const goToStep = (step: number) => {
    if (step >= 0 && step < steps.length) {
      // Mark current step as complete if moving forward
      if (step > currentStep) {
        markStepComplete(currentStep);
      }
      setCurrentStep(step);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
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

  const StepIcon = STEP_ICONS[currentStep];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-6 text-white">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <FileText size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Create Tenancy Agreement</h2>
                <p className="text-primary-100 text-sm">
                  RRA 2025 Compliant Agreement for {match.property.address.street}
                </p>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="mt-4 flex items-center gap-1">
              {steps.map((step, i) => (
                <div
                  key={step.id}
                  className={`flex-1 h-1.5 rounded-full transition-colors ${
                    i < currentStep
                      ? 'bg-white'
                      : i === currentStep
                      ? 'bg-white/70'
                      : 'bg-white/30'
                  }`}
                />
              ))}
            </div>

            {/* Step info */}
            <div className="mt-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <StepIcon size={16} className="text-primary-200" />
                <span className="text-primary-100">
                  Step {currentStep + 1} of {steps.length}
                </span>
              </div>
              <span className="font-medium">{steps[currentStep].title}</span>
            </div>
          </div>

          {/* Step navigation tabs */}
          <div className="border-b border-neutral-200 px-6 py-2 flex gap-1 overflow-x-auto">
            {steps.map((step, i) => {
              const Icon = STEP_ICONS[i];
              return (
                <button
                  key={step.id}
                  onClick={() => goToStep(i)}
                  disabled={isLoading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    i === currentStep
                      ? 'bg-primary-100 text-primary-700'
                      : step.isComplete
                      ? 'text-success-600 hover:bg-success-50'
                      : 'text-neutral-500 hover:bg-neutral-100'
                  }`}
                >
                  {step.isComplete ? (
                    <Check size={12} className="text-success-500" />
                  ) : (
                    <Icon size={12} />
                  )}
                  {step.title}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
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
                      match={match}
                    />
                  )}
                  {currentStep === 1 && (
                    <PropertyStep
                      formData={formData}
                      onChange={updateFormData}
                      match={match}
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
                      match={match}
                    />
                  )}
                  {currentStep === 5 && (
                    <UtilitiesStep
                      formData={formData}
                      onChange={updateFormData}
                      match={match}
                    />
                  )}
                  {currentStep === 6 && (
                    <ComplianceStep
                      formData={formData}
                      onChange={updateFormData}
                      match={match}
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
          <div className="border-t border-neutral-200 p-4 bg-neutral-50">
            <div className="flex items-center justify-between">
              {/* Compliance indicator */}
              <div className="flex items-center gap-2">
                {complianceResult && (
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                      complianceResult.isCompliant
                        ? 'bg-success-100 text-success-700'
                        : 'bg-warning-100 text-warning-700'
                    }`}
                  >
                    {complianceResult.isCompliant ? (
                      <>
                        <Check size={12} />
                        RRA 2025 Compliant
                      </>
                    ) : (
                      <>
                        <AlertCircle size={12} />
                        {complianceResult.errors.length} issue{complianceResult.errors.length !== 1 ? 's' : ''} to fix
                      </>
                    )}
                  </div>
                )}
                {isSaving && (
                  <span className="text-xs text-neutral-400">Saving...</span>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={handlePrevious}
                  disabled={currentStep === 0 || isLoading}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft size={16} />
                  Back
                </Button>

                {currentStep < steps.length - 1 ? (
                  <Button
                    variant="primary"
                    onClick={handleNext}
                    disabled={isLoading}
                    className="flex items-center gap-1"
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
