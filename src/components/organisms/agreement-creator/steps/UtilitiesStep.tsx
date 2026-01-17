/**
 * UtilitiesStep - Bills and utilities configuration
 */

import { Zap, Droplet, Wifi, Flame, Building } from 'lucide-react';
import type { AgreementFormData, Match } from '../../../../types';

interface UtilitiesStepProps {
  formData: Partial<AgreementFormData>;
  onChange: (updates: Partial<AgreementFormData>) => void;
  match: Match;
}

const COUNCIL_TAX_BANDS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export function UtilitiesStep({ formData, onChange, match }: UtilitiesStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-1">
          Utilities & Bills
        </h3>
        <p className="text-sm text-neutral-500">
          Specify which utilities are included and council tax responsibility.
        </p>
      </div>

      {/* Utilities Included */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={18} className="text-primary-500" />
          <h4 className="font-medium text-neutral-900">Utilities</h4>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">
              Are any utilities included in the rent?
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onChange({ utilitiesIncluded: true })}
                className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                  formData.utilitiesIncluded === true
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-neutral-200 hover:border-neutral-300 text-neutral-600'
                }`}
              >
                Yes, some included
              </button>
              <button
                type="button"
                onClick={() => onChange({ utilitiesIncluded: false, includedUtilities: undefined })}
                className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                  formData.utilitiesIncluded === false
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-neutral-200 hover:border-neutral-300 text-neutral-600'
                }`}
              >
                No, tenant pays all
              </button>
            </div>
          </div>

          {formData.utilitiesIncluded && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Which utilities are included? *
              </label>
              <textarea
                value={formData.includedUtilities || ''}
                onChange={(e) => onChange({ includedUtilities: e.target.value })}
                placeholder="e.g., Water, Gas, Electricity, Internet"
                rows={2}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>
          )}

          {/* Quick utility icons for visual reference */}
          <div className="flex items-center gap-6 pt-2 text-neutral-400">
            <div className="flex items-center gap-1.5">
              <Flame size={16} />
              <span className="text-xs">Gas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap size={16} />
              <span className="text-xs">Electric</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Droplet size={16} />
              <span className="text-xs">Water</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wifi size={16} />
              <span className="text-xs">Internet</span>
            </div>
          </div>
        </div>
      </div>

      {/* Council Tax */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Building size={18} className="text-primary-500" />
          <h4 className="font-medium text-neutral-900">Council Tax</h4>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">
              Who is responsible for Council Tax? *
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onChange({ councilTaxResponsibility: 'Tenant' })}
                className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                  formData.councilTaxResponsibility === 'Tenant'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-neutral-200 hover:border-neutral-300 text-neutral-600'
                }`}
              >
                Tenant
              </button>
              <button
                type="button"
                onClick={() => onChange({ councilTaxResponsibility: 'Landlord' })}
                className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                  formData.councilTaxResponsibility === 'Landlord'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-neutral-200 hover:border-neutral-300 text-neutral-600'
                }`}
              >
                Landlord
              </button>
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              In most cases, the tenant is responsible for Council Tax
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Council Tax Band
            </label>
            <select
              value={formData.councilTaxBand || ''}
              onChange={(e) => onChange({ councilTaxBand: e.target.value })}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select band (optional)...</option>
              {COUNCIL_TAX_BANDS.map((band) => (
                <option key={band} value={band}>
                  Band {band}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Utility Information Note */}
      <div className="bg-primary-50 rounded-xl p-4">
        <p className="text-sm text-primary-700">
          <strong>Note:</strong> The tenant is responsible for registering with utility
          providers and ensuring bills are paid on time. Meter readings should be taken
          at the start of the tenancy.
        </p>
      </div>
    </div>
  );
}
