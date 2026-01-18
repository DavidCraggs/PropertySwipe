/**
 * GenerateStep - Generate PDF and send for signing
 */

import { useState } from 'react';
import { Download, Send, Eye, Check, AlertCircle, Loader2, FileText } from 'lucide-react';
import { Button } from '../../../atoms/Button';
import {
  generateAgreementPdf,
  downloadPdf,
  openPdfInNewTab,
} from '../../../../lib/pdfGenerator';
import {
  updateAgreementData,
  linkToTenancyAgreement,
} from '../../../../lib/agreementCreatorService';
import { uploadAgreement } from '../../../../lib/agreementService';
import { useToastStore } from '../../toastUtils';
import type {
  AgreementFormData,
  AgreementTemplate,
  GeneratedAgreement,
  ComplianceCheckResult,
  Match,
} from '../../../../types';

interface GenerateStepProps {
  agreement: GeneratedAgreement;
  formData: Partial<AgreementFormData>;
  template: AgreementTemplate;
  match: Match;
  currentUserId: string;
  currentUserType: 'landlord' | 'agency';
  complianceResult: ComplianceCheckResult | null;
  onComplete: (agreement: GeneratedAgreement) => void;
}

export function GenerateStep({
  agreement,
  formData,
  template,
  match,
  currentUserId,
  currentUserType,
  complianceResult,
  onComplete,
}: GenerateStepProps) {
  const { addToast } = useToastStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [generatedPdf, setGeneratedPdf] = useState<Uint8Array | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isCompliant = complianceResult?.isCompliant ?? false;

  const handleGeneratePdf = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Ensure form data is saved
      await updateAgreementData(agreement.id, formData);

      // Generate PDF
      const pdfBytes = await generateAgreementPdf(template, formData, {
        includeSignaturePages: true,
        includeWatermark: false,
      });

      setGeneratedPdf(pdfBytes);

      addToast({
        type: 'success',
        title: 'PDF Generated',
        message: 'Your agreement has been generated successfully.',
      });
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewPdf = () => {
    if (generatedPdf) {
      openPdfInNewTab(generatedPdf);
    }
  };

  const handleDownloadPdf = () => {
    if (generatedPdf) {
      const filename = `Tenancy_Agreement_${match.property.address.street.replace(/\s+/g, '_')}.pdf`;
      downloadPdf(generatedPdf, filename);
    }
  };

  const handleSendForSigning = async () => {
    if (!generatedPdf) return;

    setIsSending(true);
    setError(null);

    try {
      // Convert PDF bytes to File object
      const blob = new Blob([generatedPdf as BlobPart], { type: 'application/pdf' });
      const filename = `Tenancy_Agreement_${match.property.address.street.replace(/\s+/g, '_')}.pdf`;
      const file = new File([blob], filename, { type: 'application/pdf' });

      // Build signatories
      const signatories = [
        {
          userId: currentUserId,
          userType: currentUserType,
          userEmail: '', // Would come from profile
          userName: formData.landlordName || 'Landlord',
          signingOrder: 1,
          isRequired: true,
        },
        {
          userId: match.renterId,
          userType: 'renter' as const,
          userEmail: match.renterProfile?.email || '',
          userName: formData.tenantName || match.renterName || 'Tenant',
          signingOrder: 2,
          isRequired: true,
        },
      ];

      // Upload to tenancy_agreements for signing workflow
      const tenancyAgreement = await uploadAgreement(
        file,
        match.id,
        {
          title: `Tenancy Agreement - ${match.property.address.street}`,
          description: 'RRA 2025 Compliant Assured Shorthold Tenancy Agreement',
          tenancyStartDate: formData.tenancyStartDate ? new Date(formData.tenancyStartDate) : undefined,
          rentAmount: formData.rentAmount,
          depositAmount: formData.depositAmount,
        },
        signatories,
        currentUserId
      );

      // Link generated agreement to tenancy agreement
      await linkToTenancyAgreement(agreement.id, tenancyAgreement.id);

      addToast({
        type: 'success',
        title: 'Agreement Sent!',
        message: 'The tenant has been notified to sign the agreement.',
      });

      // Return updated agreement
      onComplete({
        ...agreement,
        tenancyAgreementId: tenancyAgreement.id,
        status: 'sent_for_signing',
      });
    } catch (err) {
      console.error('Failed to send for signing:', err);
      setError(err instanceof Error ? err.message : 'Failed to send agreement');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-1">
          Generate & Send
        </h3>
        <p className="text-sm text-neutral-500">
          Generate the PDF and send it to the tenant for signing.
        </p>
      </div>

      {/* Compliance Check */}
      {!isCompliant && (
        <div className="bg-danger-50 border border-danger-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-danger-600 mt-0.5" />
            <div>
              <p className="font-medium text-danger-800">
                Cannot generate - compliance issues found
              </p>
              <p className="text-sm text-danger-700 mt-1">
                Please go back and fix the compliance issues before generating the agreement.
              </p>
              {complianceResult?.errors.map((error, i) => (
                <p key={i} className="text-sm text-danger-600 mt-1">
                  • {error.message}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Generate PDF */}
      <div
        className={`rounded-xl p-5 ${
          generatedPdf ? 'bg-success-50 border border-success-200' : 'bg-neutral-50'
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              generatedPdf ? 'bg-success-200' : 'bg-primary-100'
            }`}
          >
            {generatedPdf ? (
              <Check size={20} className="text-success-700" />
            ) : (
              <span className="font-bold text-primary-700">1</span>
            )}
          </div>

          <div className="flex-1">
            <h4 className="font-medium text-neutral-900 mb-1">Generate PDF</h4>
            <p className="text-sm text-neutral-500 mb-4">
              Create the agreement PDF with all your information
            </p>

            {!generatedPdf ? (
              <Button
                variant="primary"
                onClick={handleGeneratePdf}
                disabled={isGenerating || !isCompliant}
                className="flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText size={16} />
                    Generate PDF
                  </>
                )}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={handlePreviewPdf}
                  className="flex items-center gap-2"
                >
                  <Eye size={16} />
                  Preview
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleDownloadPdf}
                  className="flex items-center gap-2"
                >
                  <Download size={16} />
                  Download
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step 2: Send for Signing */}
      <div
        className={`rounded-xl p-5 ${
          !generatedPdf
            ? 'bg-neutral-100 opacity-60'
            : 'bg-neutral-50'
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              !generatedPdf ? 'bg-neutral-200' : 'bg-primary-100'
            }`}
          >
            <span className={`font-bold ${!generatedPdf ? 'text-neutral-400' : 'text-primary-700'}`}>
              2
            </span>
          </div>

          <div className="flex-1">
            <h4 className="font-medium text-neutral-900 mb-1">Send for Signatures</h4>
            <p className="text-sm text-neutral-500 mb-4">
              Send the agreement to {formData.tenantName || 'the tenant'} for their signature
            </p>

            <Button
              variant="primary"
              onClick={handleSendForSigning}
              disabled={!generatedPdf || isSending}
              className="flex items-center gap-2 !bg-success-500 hover:!bg-success-600"
            >
              {isSending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send for Signing
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 text-danger-600 text-sm bg-danger-50 rounded-xl p-4">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* What happens next */}
      <div className="bg-primary-50 rounded-xl p-4">
        <p className="text-sm font-medium text-primary-800 mb-2">
          What happens next?
        </p>
        <ul className="text-xs text-primary-700 space-y-1">
          <li>1. You sign the agreement first</li>
          <li>2. The tenant receives a notification to sign</li>
          <li>3. Once both parties have signed, you'll both receive a copy</li>
          <li>4. The signed agreement is stored securely for both parties</li>
        </ul>
      </div>
    </div>
  );
}
