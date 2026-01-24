/**
 * ReviewGenerateStep - Review all contract terms and generate the contract
 */

import { useState } from 'react';
import {
  FileText,
  Building2,
  Home,
  Settings,
  PoundSterling,
  Clock,
  CalendarDays,
  Check,
  AlertTriangle,
  Download,
  Send,
} from 'lucide-react';
import type {
  ManagementContractWizardState,
  AgencyProfile,
  Property,
} from '../../../../types';
import { formatServiceLevel } from '../../../../lib/managementContractService';

interface ReviewGenerateStepProps {
  wizardState: ManagementContractWizardState;
  agency?: AgencyProfile;
  properties: Property[];
  onGenerate: () => Promise<void>;
  onSubmit: () => Promise<void>;
  isGenerating: boolean;
  isSubmitting: boolean;
  generatedPdfUrl?: string;
}

export function ReviewGenerateStep({
  wizardState,
  agency,
  properties,
  onGenerate,
  onSubmit,
  isGenerating,
  isSubmitting,
  generatedPdfUrl,
}: ReviewGenerateStepProps) {
  const [errors, setErrors] = useState<string[]>([]);

  function validateContract(): boolean {
    const newErrors: string[] = [];

    if (!wizardState.selectedAgencyId) {
      newErrors.push('No agency selected');
    }

    if (wizardState.selectedPropertyIds.length === 0) {
      newErrors.push('No properties selected');
    }

    if (wizardState.serviceLevel !== 'let_only' && wizardState.commissionRate <= 0) {
      newErrors.push('Commission rate must be greater than 0%');
    }

    if (wizardState.serviceLevel === 'let_only' && (!wizardState.letOnlyFee || wizardState.letOnlyFee <= 0)) {
      newErrors.push('Let-only fee must be greater than £0');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  }

  async function handleGenerate() {
    if (!validateContract()) return;
    await onGenerate();
  }

  async function handleSubmit() {
    if (!validateContract()) return;
    await onSubmit();
  }

  const isLetOnly = wizardState.serviceLevel === 'let_only';
  const enabledServices = Object.entries(wizardState.includedServices)
    .filter(([, enabled]) => enabled)
    .map(([key]) => key);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <FileText className="mx-auto h-12 w-12 text-primary-500 mb-4" />
        <h2 className="text-xl font-bold text-neutral-900">Review & Generate</h2>
        <p className="mt-2 text-neutral-600">
          Review your contract terms before generating
        </p>
      </div>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="bg-danger-50 border border-danger-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-danger-700 font-medium mb-2">
            <AlertTriangle className="h-5 w-5" />
            Please fix the following issues:
          </div>
          <ul className="list-disc list-inside text-sm text-danger-600 space-y-1">
            {errors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Agency Section */}
      <SummarySection
        icon={Building2}
        title="Agency"
        iconColor="text-primary-500"
      >
        {agency ? (
          <div>
            <p className="font-medium text-neutral-900">
              {agency.tradingName || agency.companyName}
            </p>
            <p className="text-sm text-neutral-600">{agency.email}</p>
          </div>
        ) : (
          <p className="text-neutral-500 italic">No agency selected</p>
        )}
      </SummarySection>

      {/* Properties Section */}
      <SummarySection
        icon={Home}
        title={`Properties (${wizardState.selectedPropertyIds.length})`}
        iconColor="text-success-500"
      >
        {properties.length > 0 ? (
          <div className="space-y-2">
            {properties.map(property => (
              <div key={property.id} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-success-500" />
                <span className="text-neutral-700">
                  {property.address.street}, {property.address.city}
                </span>
                <span className="text-neutral-500">
                  (£{property.rentPcm?.toLocaleString()}/mo)
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-neutral-500 italic">No properties selected</p>
        )}
      </SummarySection>

      {/* Service Level & Fees */}
      <SummarySection
        icon={Settings}
        title="Service Level"
        iconColor="text-warning-500"
      >
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-neutral-600">Level:</span>
            <span className="font-medium text-neutral-900">
              {formatServiceLevel(wizardState.serviceLevel)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">
              {isLetOnly ? 'One-time fee:' : 'Commission:'}
            </span>
            <span className="font-medium text-neutral-900">
              {isLetOnly
                ? `£${wizardState.letOnlyFee?.toLocaleString() || 0}`
                : `${wizardState.commissionRate}%`
              }
            </span>
          </div>
          <div className="pt-2 border-t border-neutral-200">
            <span className="text-sm text-neutral-500">
              {enabledServices.length} services included
            </span>
          </div>
        </div>
      </SummarySection>

      {/* Payment Terms */}
      <SummarySection
        icon={PoundSterling}
        title="Payment Terms"
        iconColor="text-success-500"
      >
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-600">Frequency:</span>
            <span className="font-medium text-neutral-900 capitalize">
              {wizardState.paymentTerms.paymentFrequency}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">Method:</span>
            <span className="font-medium text-neutral-900">
              {wizardState.paymentTerms.paymentMethod === 'bank_transfer'
                ? 'Bank Transfer'
                : 'Standing Order'
              }
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">Invoice due:</span>
            <span className="font-medium text-neutral-900">
              {wizardState.paymentTerms.invoiceDueWithinDays} days
            </span>
          </div>
        </div>
      </SummarySection>

      {/* SLA Terms */}
      <SummarySection
        icon={Clock}
        title="SLA Commitments"
        iconColor="text-danger-500"
      >
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-neutral-500">Emergency:</span>
            <span className="ml-2 font-medium">
              {wizardState.slaTerms.emergencyResponseHours}h
            </span>
          </div>
          <div>
            <span className="text-neutral-500">Routine:</span>
            <span className="ml-2 font-medium">
              {wizardState.slaTerms.routineResponseDays} days
            </span>
          </div>
          <div>
            <span className="text-neutral-500">Rent remit:</span>
            <span className="ml-2 font-medium">
              {wizardState.slaTerms.rentRemittanceDays} days
            </span>
          </div>
          <div>
            <span className="text-neutral-500">Inspections:</span>
            <span className="ml-2 font-medium capitalize">
              {wizardState.slaTerms.inspectionFrequency}
            </span>
          </div>
        </div>
      </SummarySection>

      {/* Contract Duration */}
      <SummarySection
        icon={CalendarDays}
        title="Contract Duration"
        iconColor="text-primary-500"
      >
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-600">Length:</span>
            <span className="font-medium text-neutral-900">
              {wizardState.contractLengthMonths === 0
                ? 'Open-ended'
                : `${wizardState.contractLengthMonths} months`
              }
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">Notice period:</span>
            <span className="font-medium text-neutral-900">
              {wizardState.noticePeriodDays} days
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">Renewal:</span>
            <span className="font-medium text-neutral-900 capitalize">
              {wizardState.renewalType === 'auto' ? 'Auto-renew' : wizardState.renewalType}
            </span>
          </div>
        </div>
      </SummarySection>

      {/* Action Buttons */}
      <div className="space-y-3 pt-4">
        {generatedPdfUrl ? (
          <>
            <a
              href={generatedPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-medium transition-colors"
            >
              <Download className="h-5 w-5" />
              Download Contract PDF
            </a>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Sending to Agency...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Send to Agency for Review
                </>
              )}
            </button>
          </>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                Generating Contract...
              </>
            ) : (
              <>
                <FileText className="h-5 w-5" />
                Generate Contract
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

interface SummarySectionProps {
  icon: typeof FileText;
  title: string;
  iconColor: string;
  children: React.ReactNode;
}

function SummarySection({ icon: Icon, title, iconColor, children }: SummarySectionProps) {
  return (
    <div className="bg-neutral-50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={18} className={iconColor} />
        <h3 className="font-medium text-neutral-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}
