/**
 * SlaTermsStep - Set SLA commitments for the contract
 */

import { Clock, AlertTriangle, Wrench, Banknote, Eye } from 'lucide-react';
import type { ManagementSlaTerms } from '../../../../types';

interface SlaTermsStepProps {
  slaTerms: ManagementSlaTerms;
  onChange: (terms: ManagementSlaTerms) => void;
}

export function SlaTermsStep({ slaTerms, onChange }: SlaTermsStepProps) {
  function updateTerm<K extends keyof ManagementSlaTerms>(
    key: K,
    value: ManagementSlaTerms[K]
  ) {
    onChange({ ...slaTerms, [key]: value });
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Clock className="mx-auto h-12 w-12 text-primary-500 mb-4" />
        <h2 className="text-xl font-bold text-neutral-900">SLA Terms</h2>
        <p className="mt-2 text-neutral-600">
          Define service level agreement commitments
        </p>
      </div>

      {/* Emergency Response */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={18} className="text-danger-500" />
          <h3 className="font-medium text-neutral-900">Emergency Response</h3>
        </div>

        <div>
          <label htmlFor="emergencyResponse" className="block text-sm font-medium text-neutral-700 mb-1">
            Response Time (Hours)
          </label>
          <select
            id="emergencyResponse"
            value={slaTerms.emergencyResponseHours}
            onChange={(e) => updateTerm('emergencyResponseHours', parseInt(e.target.value))}
            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
          >
            <option value={2}>2 hours</option>
            <option value={4}>4 hours</option>
            <option value={8}>8 hours (same day)</option>
            <option value={24}>24 hours</option>
          </select>
          <p className="text-xs text-neutral-500 mt-1">
            For emergencies like gas leaks, flooding, or security issues
          </p>
        </div>
      </div>

      {/* Routine Response */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Wrench size={18} className="text-warning-500" />
          <h3 className="font-medium text-neutral-900">Routine Maintenance Response</h3>
        </div>

        <div>
          <label htmlFor="routineResponse" className="block text-sm font-medium text-neutral-700 mb-1">
            Response Time (Days)
          </label>
          <select
            id="routineResponse"
            value={slaTerms.routineResponseDays}
            onChange={(e) => updateTerm('routineResponseDays', parseInt(e.target.value))}
            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
          >
            <option value={1}>1 day (next business day)</option>
            <option value={2}>2 days</option>
            <option value={3}>3 days</option>
            <option value={5}>5 days</option>
            <option value={7}>7 days</option>
          </select>
          <p className="text-xs text-neutral-500 mt-1">
            For non-emergency repairs and routine maintenance requests
          </p>
        </div>
      </div>

      {/* Rent Remittance */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Banknote size={18} className="text-success-500" />
          <h3 className="font-medium text-neutral-900">Rent Remittance</h3>
        </div>

        <div>
          <label htmlFor="rentRemittance" className="block text-sm font-medium text-neutral-700 mb-1">
            Days After Collection
          </label>
          <select
            id="rentRemittance"
            value={slaTerms.rentRemittanceDays}
            onChange={(e) => updateTerm('rentRemittanceDays', parseInt(e.target.value))}
            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
          >
            <option value={3}>3 days</option>
            <option value={5}>5 days</option>
            <option value={7}>7 days</option>
            <option value={10}>10 days</option>
            <option value={14}>14 days</option>
          </select>
          <p className="text-xs text-neutral-500 mt-1">
            How quickly rent will be transferred to you after collection
          </p>
        </div>
      </div>

      {/* Inspection Frequency */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Eye size={18} className="text-primary-500" />
          <h3 className="font-medium text-neutral-900">Property Inspections</h3>
        </div>

        <div>
          <label htmlFor="inspectionFrequency" className="block text-sm font-medium text-neutral-700 mb-1">
            Inspection Frequency
          </label>
          <select
            id="inspectionFrequency"
            value={slaTerms.inspectionFrequency}
            onChange={(e) => updateTerm('inspectionFrequency', e.target.value as ManagementSlaTerms['inspectionFrequency'])}
            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly (every 3 months)</option>
            <option value="biannually">Biannually (every 6 months)</option>
          </select>
          <p className="text-xs text-neutral-500 mt-1">
            Regular inspections help identify issues early and ensure compliance
          </p>
        </div>
      </div>

      {/* SLA Summary */}
      <div className="bg-primary-50 rounded-xl p-4">
        <h4 className="font-medium text-primary-900 mb-3">SLA Summary</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-danger-500" />
            <span className="text-neutral-700">Emergency: {slaTerms.emergencyResponseHours}h</span>
          </div>
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-warning-500" />
            <span className="text-neutral-700">Routine: {slaTerms.routineResponseDays} days</span>
          </div>
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4 text-success-500" />
            <span className="text-neutral-700">Rent: {slaTerms.rentRemittanceDays} days</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary-500" />
            <span className="text-neutral-700 capitalize">{slaTerms.inspectionFrequency}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
