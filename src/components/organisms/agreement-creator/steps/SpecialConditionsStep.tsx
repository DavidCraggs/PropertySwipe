/**
 * SpecialConditionsStep - Additional clauses and special conditions
 */

import { Plus, AlertTriangle, Info } from 'lucide-react';
import type { AgreementFormData } from '../../../../types';

interface SpecialConditionsStepProps {
  formData: Partial<AgreementFormData>;
  onChange: (updates: Partial<AgreementFormData>) => void;
}

const EXAMPLE_CONDITIONS = [
  'The Tenant agrees to maintain professional indemnity insurance throughout the tenancy.',
  'The Landlord agrees to replace the carpets within 3 months of the tenancy start date.',
  'The Tenant is permitted to hang pictures using appropriate fixings, with holes to be filled upon departure.',
  'The Tenant agrees to have the property professionally cleaned at the end of the tenancy.',
  'The Landlord agrees to provide a washing machine within 14 days of tenancy commencement.',
];

export function SpecialConditionsStep({ formData, onChange }: SpecialConditionsStepProps) {
  const addExampleCondition = (condition: string) => {
    const current = formData.additionalConditions || '';
    const newConditions = current
      ? `${current}\n\n${condition}`
      : condition;
    onChange({ additionalConditions: newConditions });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-1">
          Special Conditions
        </h3>
        <p className="text-sm text-neutral-500">
          Add any additional terms or conditions specific to this tenancy.
        </p>
      </div>

      {/* Warning about prohibited clauses */}
      <div className="bg-warning-50 border border-warning-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-warning-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-warning-800 mb-1">
              Prohibited Clauses
            </p>
            <p className="text-xs text-warning-700 mb-2">
              Under RRA 2025 and the Tenant Fees Act 2019, certain clauses are prohibited:
            </p>
            <ul className="text-xs text-warning-700 space-y-1">
              <li>• Fixed-term lock-in periods</li>
              <li>• Blanket bans on pets</li>
              <li>• Fees beyond deposit and rent</li>
              <li>• Rent increases more than once per year</li>
              <li>• Section 21 "no fault" eviction clauses</li>
              <li>• Clauses limiting tenant's right to challenge rent increases</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Additional Conditions */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Plus size={18} className="text-primary-500" />
            <h4 className="font-medium text-neutral-900">Additional Conditions</h4>
          </div>
          <span className="text-xs text-neutral-400 bg-neutral-200 px-2 py-0.5 rounded">
            Optional
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Enter any additional conditions
            </label>
            <textarea
              value={formData.additionalConditions || ''}
              onChange={(e) => onChange({ additionalConditions: e.target.value })}
              placeholder="Enter any special conditions or terms that apply to this tenancy..."
              rows={6}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none font-mono text-sm"
            />
            <p className="mt-1 text-xs text-neutral-400">
              Each condition should be clearly worded and enforceable
            </p>
          </div>
        </div>
      </div>

      {/* Example Conditions */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Info size={18} className="text-primary-500" />
          <h4 className="font-medium text-neutral-900">Example Conditions</h4>
        </div>

        <p className="text-sm text-neutral-500 mb-3">
          Click on any example to add it to your conditions:
        </p>

        <div className="space-y-2">
          {EXAMPLE_CONDITIONS.map((condition, index) => (
            <button
              key={index}
              type="button"
              onClick={() => addExampleCondition(condition)}
              className="w-full text-left p-3 bg-white rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-sm text-neutral-600"
            >
              {condition}
            </button>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-primary-50 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <Info size={16} className="text-primary-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-primary-800 mb-1">
              Tips for Special Conditions
            </p>
            <ul className="text-xs text-primary-700 space-y-1">
              <li>• Be specific and clear about expectations</li>
              <li>• Ensure conditions are reasonable and enforceable</li>
              <li>• Avoid vague language that could be misinterpreted</li>
              <li>• Consider whether both parties have agreed to any verbal arrangements</li>
              <li>• If in doubt, seek legal advice</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
