/**
 * PropertyStep - Property details for the agreement
 */

import { Home, Sofa, Calendar, FileText } from 'lucide-react';
import type { AgreementFormData } from '../../../../types';

interface PropertyStepProps {
  formData: Partial<AgreementFormData>;
  onChange: (updates: Partial<AgreementFormData>) => void;
}

export function PropertyStep({ formData, onChange }: PropertyStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-1">
          Property Details
        </h3>
        <p className="text-sm text-neutral-500">
          Confirm the property address and tenancy start date.
        </p>
      </div>

      {/* Property Address */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Home size={18} className="text-primary-500" />
          <h4 className="font-medium text-neutral-900">Property Address</h4>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Full Address *
          </label>
          <textarea
            value={formData.propertyAddress || ''}
            onChange={(e) => onChange({ propertyAddress: e.target.value })}
            placeholder="Enter the full property address"
            rows={2}
            className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
          <p className="mt-1 text-xs text-neutral-400">
            Include flat/unit number if applicable
          </p>
        </div>
      </div>

      {/* Tenancy Start Date */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-primary-500" />
          <h4 className="font-medium text-neutral-900">Tenancy Start Date</h4>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Start Date *
          </label>
          <input
            type="date"
            value={formData.tenancyStartDate || ''}
            onChange={(e) => onChange({ tenancyStartDate: e.target.value })}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-neutral-400">
            This is the date the tenancy will commence
          </p>
        </div>
      </div>

      {/* Furnishing Level */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sofa size={18} className="text-primary-500" />
          <h4 className="font-medium text-neutral-900">Furnishing</h4>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Furnishing Level *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['unfurnished', 'part furnished', 'fully furnished'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => onChange({ furnishingLevel: level })}
                  className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors ${
                    formData.furnishingLevel === level
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-neutral-200 hover:border-neutral-300 text-neutral-600'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.inventoryIncluded ?? true}
                onChange={(e) => onChange({ inventoryIncluded: e.target.checked })}
                className="w-5 h-5 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
              />
              <div>
                <span className="font-medium text-neutral-700">Include Inventory</span>
                <p className="text-xs text-neutral-500">
                  An inventory and schedule of condition will be prepared
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Property Features */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={18} className="text-primary-500" />
          <h4 className="font-medium text-neutral-900">Property Features</h4>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.parkingIncluded ?? false}
              onChange={(e) => onChange({ parkingIncluded: e.target.checked })}
              className="w-5 h-5 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="font-medium text-neutral-700">Parking Included</span>
          </label>

          {formData.parkingIncluded && (
            <div className="ml-8">
              <input
                type="text"
                value={formData.parkingDetails || ''}
                onChange={(e) => onChange({ parkingDetails: e.target.value })}
                placeholder="e.g., 1 allocated parking space, permit parking"
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.hasGarden ?? false}
              onChange={(e) => onChange({ hasGarden: e.target.checked })}
              className="w-5 h-5 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="font-medium text-neutral-700">Has Garden/Outdoor Space</span>
          </label>

          {formData.hasGarden && (
            <div className="ml-8">
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Garden Maintenance Responsibility
              </label>
              <select
                value={formData.gardenMaintenance || 'Tenant'}
                onChange={(e) => onChange({ gardenMaintenance: e.target.value as 'Tenant' | 'Landlord' | 'shared' })}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="Tenant">Tenant</option>
                <option value="Landlord">Landlord</option>
                <option value="shared">Shared</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* RRA 2025 Notice */}
      <div className="bg-primary-50 rounded-xl p-4">
        <p className="text-sm text-primary-700">
          <strong>RRA 2025:</strong> Under the Renters' Rights Act 2025, this will be a
          periodic tenancy with no fixed term. The tenant can give 2 months' notice at any time.
        </p>
      </div>
    </div>
  );
}
