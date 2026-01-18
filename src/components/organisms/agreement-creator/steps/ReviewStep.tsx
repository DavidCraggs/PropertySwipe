/**
 * ReviewStep - Preview the complete agreement before generation
 */

import { useState } from 'react';
import { Check, AlertCircle, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { substituteVariables } from '../../../../lib/agreementCreatorService';
import type { AgreementFormData, AgreementTemplate, ComplianceCheckResult } from '../../../../types';

interface ReviewStepProps {
  formData: Partial<AgreementFormData>;
  template: AgreementTemplate;
  complianceResult: ComplianceCheckResult | null;
}

export function ReviewStep({ formData, template, complianceResult }: ReviewStepProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['parties', 'property', 'rent']));

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedSections(new Set(template.sections.map((s) => s.id)));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-1">
          Review Agreement
        </h3>
        <p className="text-sm text-neutral-500">
          Review the complete agreement before generating the PDF.
        </p>
      </div>

      {/* Compliance Summary */}
      {complianceResult && (
        <div
          className={`rounded-xl p-4 ${
            complianceResult.isCompliant
              ? 'bg-success-50 border border-success-200'
              : 'bg-danger-50 border border-danger-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {complianceResult.isCompliant ? (
              <Check size={20} className="text-success-600 mt-0.5" />
            ) : (
              <AlertCircle size={20} className="text-danger-600 mt-0.5" />
            )}
            <div className="flex-1">
              <p
                className={`font-medium ${
                  complianceResult.isCompliant ? 'text-success-800' : 'text-danger-800'
                }`}
              >
                {complianceResult.isCompliant
                  ? 'Agreement is RRA 2025 compliant'
                  : 'Please fix compliance issues before generating'}
              </p>
              {!complianceResult.isCompliant && (
                <ul className="mt-2 space-y-1">
                  {complianceResult.errors.map((error, i) => (
                    <li key={i} className="text-sm text-danger-700">
                      • {error.message}
                    </li>
                  ))}
                </ul>
              )}
              {complianceResult.warnings.length > 0 && (
                <div className="mt-2 pt-2 border-t border-warning-200">
                  <p className="text-xs font-medium text-warning-700 mb-1">Warnings:</p>
                  {complianceResult.warnings.map((warning, i) => (
                    <p key={i} className="text-xs text-warning-600">
                      • {warning.message}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Summary */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={18} className="text-primary-500" />
          <h4 className="font-medium text-neutral-900">Agreement Summary</h4>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-neutral-500">Property</p>
            <p className="font-medium text-neutral-900">{formData.propertyAddress || '-'}</p>
          </div>
          <div>
            <p className="text-neutral-500">Start Date</p>
            <p className="font-medium text-neutral-900">
              {formData.tenancyStartDate
                ? new Date(formData.tenancyStartDate).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : '-'}
            </p>
          </div>
          <div>
            <p className="text-neutral-500">Landlord</p>
            <p className="font-medium text-neutral-900">{formData.landlordName || '-'}</p>
          </div>
          <div>
            <p className="text-neutral-500">Tenant</p>
            <p className="font-medium text-neutral-900">{formData.tenantName || '-'}</p>
          </div>
          <div>
            <p className="text-neutral-500">Monthly Rent</p>
            <p className="font-medium text-neutral-900">
              {formData.rentAmount ? `£${formData.rentAmount.toLocaleString()}` : '-'}
            </p>
          </div>
          <div>
            <p className="text-neutral-500">Deposit</p>
            <p className="font-medium text-neutral-900">
              {formData.depositAmount ? `£${formData.depositAmount.toLocaleString()}` : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Expand/Collapse Controls */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={expandAll}
          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
        >
          Expand All
        </button>
        <span className="text-neutral-300">|</span>
        <button
          type="button"
          onClick={collapseAll}
          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
        >
          Collapse All
        </button>
      </div>

      {/* Agreement Sections Preview */}
      <div className="space-y-3">
        {template.sections.map((section) => (
          <div
            key={section.id}
            className="bg-white rounded-xl border border-neutral-200 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-neutral-900">
                  {section.title}
                </span>
                {section.isRequired && (
                  <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded">
                    Required
                  </span>
                )}
              </div>
              {expandedSections.has(section.id) ? (
                <ChevronUp size={18} className="text-neutral-400" />
              ) : (
                <ChevronDown size={18} className="text-neutral-400" />
              )}
            </button>

            {expandedSections.has(section.id) && (
              <div className="px-4 pb-4 border-t border-neutral-100">
                <div className="pt-4 space-y-4">
                  {section.clauses.map((clause) => {
                    // Substitute variables in clause content
                    const renderedContent = substituteVariables(
                      clause.content,
                      formData as Partial<AgreementFormData>
                    );

                    return (
                      <div key={clause.id} className="text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-neutral-800">
                            {clause.title}
                          </span>
                          {clause.isMandatory && (
                            <span className="text-xs bg-danger-100 text-danger-700 px-1.5 py-0.5 rounded">
                              Mandatory
                            </span>
                          )}
                          {clause.rraReference && (
                            <span className="text-xs text-neutral-400">
                              ({clause.rraReference})
                            </span>
                          )}
                        </div>
                        <p className="text-neutral-600 whitespace-pre-wrap leading-relaxed">
                          {renderedContent}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Final Note */}
      <div className="bg-primary-50 rounded-xl p-4">
        <p className="text-sm text-primary-700">
          <strong>Ready to generate?</strong> Once you're satisfied with the agreement,
          proceed to the next step to generate the PDF and send it for signatures.
        </p>
      </div>
    </div>
  );
}
