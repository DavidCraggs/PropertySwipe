/**
 * PetsStep - Pet arrangements (RRA 2025 compliant)
 */

import { PawPrint, Info, AlertTriangle } from 'lucide-react';
import type { AgreementFormData } from '../../../../types';

interface PetsStepProps {
  formData: Partial<AgreementFormData>;
  onChange: (updates: Partial<AgreementFormData>) => void;
}

export function PetsStep({ formData, onChange }: PetsStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-1">
          Pet Arrangements
        </h3>
        <p className="text-sm text-neutral-500">
          Specify any pet arrangements for this tenancy.
        </p>
      </div>

      {/* RRA 2025 Pet Rights Notice */}
      <div className="bg-warning-50 border border-warning-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-warning-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-warning-800 mb-1">
              Renters' Rights Act 2025 - Pet Provisions
            </p>
            <p className="text-xs text-warning-700">
              Under RRA 2025, landlords cannot include blanket pet bans. Tenants have the right
              to request a pet at any time during the tenancy. Landlords must respond within
              42 days and can only refuse with a valid written reason.
            </p>
          </div>
        </div>
      </div>

      {/* Current Pet Arrangement */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <PawPrint size={18} className="text-primary-500" />
          <h4 className="font-medium text-neutral-900">Pets at Start of Tenancy</h4>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">
              Will any pets be living at the property from the start of the tenancy?
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onChange({ petsAllowed: true })}
                className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                  formData.petsAllowed === true
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-neutral-200 hover:border-neutral-300 text-neutral-600'
                }`}
              >
                Yes, pets agreed
              </button>
              <button
                type="button"
                onClick={() => onChange({ petsAllowed: false, petDetails: undefined })}
                className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                  formData.petsAllowed === false
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-neutral-200 hover:border-neutral-300 text-neutral-600'
                }`}
              >
                No pets currently
              </button>
            </div>
          </div>

          {formData.petsAllowed && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Pet Details *
              </label>
              <textarea
                value={formData.petDetails || ''}
                onChange={(e) => onChange({ petDetails: e.target.value })}
                placeholder="e.g., 1 cat (domestic shorthair), 1 small dog (cockapoo)"
                rows={3}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
              <p className="mt-1 text-xs text-neutral-400">
                Include type, breed, and number of pets
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pet Clause that will be included */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Info size={18} className="text-primary-500" />
          <h4 className="font-medium text-neutral-900">Pet Clause (Mandatory)</h4>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <p className="text-sm text-neutral-600 leading-relaxed">
            The Tenant may make a written request to keep a pet at the Property.
            The Landlord will respond in writing within 42 days. The Landlord may
            only refuse if there is a reasonable ground to do so (such as the property
            being unsuitable for the type of pet, or where keeping a pet would breach
            a superior lease) and must provide written reasons for any refusal. The
            Landlord may require the Tenant to obtain pet damage insurance as a
            condition of consent.
          </p>
        </div>

        <p className="mt-3 text-xs text-neutral-500">
          This clause is mandatory under RRA 2025 and will be included in all agreements.
        </p>
      </div>

      {/* Pet Insurance Note */}
      <div className="bg-primary-50 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <Info size={16} className="text-primary-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-primary-800 mb-1">
              Pet Insurance
            </p>
            <p className="text-xs text-primary-700">
              While you cannot refuse pets without valid reason, you may require the tenant
              to obtain pet damage insurance as a condition of keeping a pet. This provides
              protection against damage caused by pets.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
