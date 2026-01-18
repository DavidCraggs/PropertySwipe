/**
 * ComplianceStep - RRA 2025 legal compliance requirements
 */

import { Shield, AlertCircle, Check, Info } from 'lucide-react';
import type { AgreementFormData, ComplianceCheckResult, OmbudsmanSchemeOption, EPCRating } from '../../../../types';

interface ComplianceStepProps {
  formData: Partial<AgreementFormData>;
  onChange: (updates: Partial<AgreementFormData>) => void;
  complianceResult: ComplianceCheckResult | null;
}

const OMBUDSMAN_SCHEMES: { value: OmbudsmanSchemeOption; label: string }[] = [
  { value: 'Housing Ombudsman Service', label: 'Housing Ombudsman Service' },
  { value: 'Property Ombudsman', label: 'The Property Ombudsman (TPO)' },
  { value: 'Property Redress Scheme', label: 'Property Redress Scheme (PRS)' },
];

const EPC_RATINGS: EPCRating[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

export function ComplianceStep({ formData, onChange, complianceResult }: ComplianceStepProps) {
  const isEpcCompliant = formData.epcRating && ['A', 'B', 'C'].includes(formData.epcRating);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-1">
          Legal Compliance
        </h3>
        <p className="text-sm text-neutral-500">
          Verify RRA 2025 compliance requirements are met.
        </p>
      </div>

      {/* Compliance Status Summary */}
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
            <div>
              <p
                className={`font-medium ${
                  complianceResult.isCompliant ? 'text-success-800' : 'text-danger-800'
                }`}
              >
                {complianceResult.isCompliant
                  ? 'All compliance requirements met'
                  : `${complianceResult.errors.length} compliance issue${
                      complianceResult.errors.length !== 1 ? 's' : ''
                    } to resolve`}
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
            </div>
          </div>
        </div>
      )}

      {/* PRS Registration */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={18} className="text-primary-500" />
          <h4 className="font-medium text-neutral-900">PRS Database Registration</h4>
          <span className="ml-auto text-xs bg-danger-100 text-danger-700 px-2 py-0.5 rounded font-medium">
            Mandatory
          </span>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            PRS Registration Number *
          </label>
          <input
            type="text"
            value={formData.prsRegistrationNumber || ''}
            onChange={(e) => onChange({ prsRegistrationNumber: e.target.value })}
            placeholder="Enter PRS registration number"
            className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-neutral-400">
            All landlords must be registered with the Private Rented Sector Database
          </p>
        </div>
      </div>

      {/* Ombudsman Membership */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={18} className="text-primary-500" />
          <h4 className="font-medium text-neutral-900">Ombudsman Membership</h4>
          <span className="ml-auto text-xs bg-danger-100 text-danger-700 px-2 py-0.5 rounded font-medium">
            Mandatory
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Ombudsman Scheme *
            </label>
            <select
              value={formData.ombudsmanScheme || ''}
              onChange={(e) => onChange({ ombudsmanScheme: e.target.value as OmbudsmanSchemeOption })}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select scheme...</option>
              {OMBUDSMAN_SCHEMES.map((scheme) => (
                <option key={scheme.value} value={scheme.value}>
                  {scheme.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Membership Number *
            </label>
            <input
              type="text"
              value={formData.ombudsmanMembershipNumber || ''}
              onChange={(e) => onChange({ ombudsmanMembershipNumber: e.target.value })}
              placeholder="Enter membership number"
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Energy Performance */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={18} className="text-primary-500" />
          <h4 className="font-medium text-neutral-900">Energy Performance Certificate</h4>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                EPC Rating *
              </label>
              <select
                value={formData.epcRating || ''}
                onChange={(e) => onChange({ epcRating: e.target.value as EPCRating })}
                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent ${
                  formData.epcRating && !isEpcCompliant
                    ? 'border-danger-300 focus:ring-danger-500'
                    : 'border-neutral-300 focus:ring-primary-500'
                }`}
              >
                <option value="">Select rating...</option>
                {EPC_RATINGS.map((rating) => (
                  <option key={rating} value={rating}>
                    {rating} {['D', 'E', 'F', 'G'].includes(rating) ? '(Below minimum)' : ''}
                  </option>
                ))}
              </select>
              {formData.epcRating && !isEpcCompliant && (
                <p className="mt-1 text-xs text-danger-600">
                  Minimum rating C required for new tenancies
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                EPC Expiry Date *
              </label>
              <input
                type="date"
                value={formData.epcExpiryDate || ''}
                onChange={(e) => onChange({ epcExpiryDate: e.target.value })}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Safety Certificates */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={18} className="text-primary-500" />
          <h4 className="font-medium text-neutral-900">Safety Certificates</h4>
        </div>

        <div className="space-y-4">
          {/* Gas Safety */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={formData.hasGas ?? true}
                onChange={(e) => onChange({ hasGas: e.target.checked })}
                className="w-5 h-5 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
              />
              <span className="font-medium text-neutral-700">Property has gas supply</span>
            </label>

            {formData.hasGas && (
              <div className="ml-8">
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Gas Safety Certificate Date *
                </label>
                <input
                  type="date"
                  value={formData.gasSafetyDate || ''}
                  onChange={(e) => onChange({ gasSafetyDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-neutral-400">
                  Must be renewed annually
                </p>
              </div>
            )}
          </div>

          {/* EICR */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              EICR (Electrical Safety) Date *
            </label>
            <input
              type="date"
              value={formData.eicrDate || ''}
              onChange={(e) => onChange({ eicrDate: e.target.value })}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-neutral-400">
              Valid for 5 years
            </p>
          </div>
        </div>
      </div>

      {/* RRA 2025 Info */}
      <div className="bg-primary-50 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <Info size={16} className="text-primary-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-primary-800 mb-1">
              RRA 2025 Compliance Requirements
            </p>
            <ul className="text-xs text-primary-700 space-y-1">
              <li>• PRS Database registration is mandatory for all landlords</li>
              <li>• Membership of an approved ombudsman scheme is required</li>
              <li>• Properties must have EPC rating of C or above for new tenancies</li>
              <li>• Gas Safety Certificate must be provided annually (if applicable)</li>
              <li>• EICR must be provided and satisfactory</li>
              <li>• "How to Rent" guide must be provided to tenant</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
