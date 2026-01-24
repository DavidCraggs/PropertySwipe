/**
 * ContractDurationStep - Set contract length, notice period, and renewal terms
 */

import { CalendarDays, Bell, RefreshCw } from 'lucide-react';
import type { ContractRenewalType } from '../../../../types';

interface ContractDurationStepProps {
  contractLengthMonths: number;
  noticePeriodDays: number;
  renewalType: ContractRenewalType;
  onChange: (updates: {
    contractLengthMonths?: number;
    noticePeriodDays?: number;
    renewalType?: ContractRenewalType;
  }) => void;
}

const CONTRACT_LENGTH_OPTIONS = [
  { value: 6, label: '6 months' },
  { value: 12, label: '12 months (1 year)' },
  { value: 24, label: '24 months (2 years)' },
  { value: 36, label: '36 months (3 years)' },
  { value: 0, label: 'Open-ended (rolling)' },
];

const NOTICE_PERIOD_OPTIONS = [
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days (1 month)' },
  { value: 60, label: '60 days (2 months)' },
  { value: 90, label: '90 days (3 months)' },
];

const RENEWAL_OPTIONS: { value: ContractRenewalType; label: string; description: string }[] = [
  {
    value: 'auto',
    label: 'Auto-Renew',
    description: 'Contract automatically renews for the same period unless notice is given',
  },
  {
    value: 'manual',
    label: 'Manual Renewal',
    description: 'Both parties must agree to renew the contract before expiry',
  },
  {
    value: 'none',
    label: 'No Renewal',
    description: 'Contract ends on the specified date with no renewal option',
  },
];

export function ContractDurationStep({
  contractLengthMonths,
  noticePeriodDays,
  renewalType,
  onChange,
}: ContractDurationStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <CalendarDays className="mx-auto h-12 w-12 text-primary-500 mb-4" />
        <h2 className="text-xl font-bold text-neutral-900">Contract Duration</h2>
        <p className="mt-2 text-neutral-600">
          Set the contract length and termination terms
        </p>
      </div>

      {/* Contract Length */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays size={18} className="text-primary-500" />
          <h3 className="font-medium text-neutral-900">Contract Length</h3>
        </div>

        <div>
          <label htmlFor="contractLength" className="block text-sm font-medium text-neutral-700 mb-1">
            Duration
          </label>
          <select
            id="contractLength"
            value={contractLengthMonths}
            onChange={(e) => onChange({ contractLengthMonths: parseInt(e.target.value) })}
            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
          >
            {CONTRACT_LENGTH_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-neutral-500 mt-1">
            {contractLengthMonths === 0
              ? 'Open-ended contracts continue until either party gives notice'
              : '12 months is the most common duration for management contracts'
            }
          </p>
        </div>
      </div>

      {/* Notice Period */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={18} className="text-warning-500" />
          <h3 className="font-medium text-neutral-900">Notice Period</h3>
        </div>

        <div>
          <label htmlFor="noticePeriod" className="block text-sm font-medium text-neutral-700 mb-1">
            Required Notice to Terminate
          </label>
          <select
            id="noticePeriod"
            value={noticePeriodDays}
            onChange={(e) => onChange({ noticePeriodDays: parseInt(e.target.value) })}
            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
          >
            {NOTICE_PERIOD_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-neutral-500 mt-1">
            Either party must give this much notice to terminate the contract
          </p>
        </div>
      </div>

      {/* Renewal Type */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw size={18} className="text-success-500" />
          <h3 className="font-medium text-neutral-900">Renewal Terms</h3>
        </div>

        <div className="space-y-3">
          {RENEWAL_OPTIONS.map(option => (
            <label
              key={option.value}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                renewalType === option.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 bg-white hover:border-primary-300'
              }`}
            >
              <input
                type="radio"
                name="renewalType"
                value={option.value}
                checked={renewalType === option.value}
                onChange={(e) => onChange({ renewalType: e.target.value as ContractRenewalType })}
                className="mt-1 h-4 w-4 text-primary-500 border-neutral-300 focus:ring-primary-500"
              />
              <div>
                <span className="font-medium text-neutral-900">{option.label}</span>
                <p className="text-sm text-neutral-600 mt-0.5">{option.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Contract Timeline Preview */}
      <div className="bg-primary-50 rounded-xl p-4">
        <h4 className="font-medium text-primary-900 mb-3">Contract Timeline</h4>
        <div className="space-y-2 text-sm text-primary-800">
          <p>
            <strong>Start:</strong> Upon both parties signing
          </p>
          <p>
            <strong>Duration:</strong>{' '}
            {contractLengthMonths === 0
              ? 'Rolling (no fixed end date)'
              : `${contractLengthMonths} months`
            }
          </p>
          <p>
            <strong>Termination notice:</strong> {noticePeriodDays} days required
          </p>
          <p>
            <strong>At expiry:</strong>{' '}
            {renewalType === 'auto' && 'Auto-renews unless notice given'}
            {renewalType === 'manual' && 'Requires mutual agreement to renew'}
            {renewalType === 'none' && 'Contract ends, no renewal'}
          </p>
        </div>
      </div>
    </div>
  );
}
