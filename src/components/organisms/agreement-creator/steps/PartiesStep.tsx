/**
 * PartiesStep - Landlord and tenant details
 */

import { Users, Building, User } from 'lucide-react';
import type { AgreementFormData } from '../../../../types';

interface PartiesStepProps {
  formData: Partial<AgreementFormData>;
  onChange: (updates: Partial<AgreementFormData>) => void;
}

export function PartiesStep({ formData, onChange }: PartiesStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-1">
          Parties to the Agreement
        </h3>
        <p className="text-sm text-neutral-500">
          Confirm the details of the landlord and tenant for this tenancy agreement.
        </p>
      </div>

      {/* Landlord Details */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Building size={18} className="text-primary-500" />
          <h4 className="font-medium text-neutral-900">Landlord</h4>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Full Legal Name *
            </label>
            <input
              type="text"
              value={formData.landlordName || ''}
              onChange={(e) => onChange({ landlordName: e.target.value })}
              placeholder="Enter landlord's full name"
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Correspondence Address *
            </label>
            <textarea
              value={formData.landlordAddress || ''}
              onChange={(e) => onChange({ landlordAddress: e.target.value })}
              placeholder="Enter landlord's address for correspondence"
              rows={2}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>
        </div>
      </div>

      {/* Agent Details (Optional) */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-primary-500" />
            <h4 className="font-medium text-neutral-900">Managing Agent</h4>
          </div>
          <span className="text-xs text-neutral-400 bg-neutral-200 px-2 py-0.5 rounded">
            Optional
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Agent/Agency Name
            </label>
            <input
              type="text"
              value={formData.agentName || ''}
              onChange={(e) => onChange({ agentName: e.target.value })}
              placeholder="Enter agent or agency name (if applicable)"
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {formData.agentName && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Agent Address
              </label>
              <textarea
                value={formData.agentAddress || ''}
                onChange={(e) => onChange({ agentAddress: e.target.value })}
                placeholder="Enter agent's business address"
                rows={2}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Tenant Details */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <User size={18} className="text-success-500" />
          <h4 className="font-medium text-neutral-900">Tenant</h4>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Full Legal Name *
            </label>
            <input
              type="text"
              value={formData.tenantName || ''}
              onChange={(e) => onChange({ tenantName: e.target.value })}
              placeholder="Enter tenant's full legal name"
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-neutral-400">
              This should match the tenant's ID document
            </p>
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-primary-50 rounded-xl p-4">
        <p className="text-sm text-primary-700">
          <strong>Important:</strong> All names should match official identification documents.
          The landlord must be the legal owner or have authority to let the property.
        </p>
      </div>
    </div>
  );
}
