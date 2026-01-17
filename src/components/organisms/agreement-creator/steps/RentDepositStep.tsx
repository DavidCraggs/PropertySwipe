/**
 * RentDepositStep - Rent and deposit configuration with RRA 2025 compliance
 */

import { useState, useEffect } from 'react';
import { Banknote, Shield, AlertCircle, Check, Info } from 'lucide-react';
import {
  calculateMaxDeposit,
  calculateDepositWeeks,
} from '../../../../lib/agreementCreatorService';
import type { AgreementFormData, Match, DepositScheme, RentPaymentMethod } from '../../../../types';

interface RentDepositStepProps {
  formData: Partial<AgreementFormData>;
  onChange: (updates: Partial<AgreementFormData>) => void;
  match: Match;
}

const DEPOSIT_SCHEMES: { value: DepositScheme; label: string }[] = [
  { value: 'DPS', label: 'DPS (Deposit Protection Service)' },
  { value: 'TDS', label: 'TDS (Tenancy Deposit Scheme)' },
  { value: 'MyDeposits', label: 'MyDeposits' },
];

const PAYMENT_METHODS: { value: RentPaymentMethod; label: string }[] = [
  { value: 'standing_order', label: 'Standing Order' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'direct_debit', label: 'Direct Debit' },
];

export function RentDepositStep({ formData, onChange, match }: RentDepositStepProps) {
  const rentAmount = formData.rentAmount || match.property.rentPcm || 0;
  const maxDeposit = calculateMaxDeposit(rentAmount);
  const annualRent = rentAmount * 12;
  const maxWeeks = annualRent >= 50000 ? 6 : 5;

  // Calculate deposit weeks when deposit amount changes
  useEffect(() => {
    if (formData.depositAmount && rentAmount > 0) {
      const weeks = calculateDepositWeeks(rentAmount, formData.depositAmount);
      onChange({ depositWeeks: Math.round(weeks * 10) / 10 });
    }
  }, [formData.depositAmount, rentAmount]);

  const isDepositValid = !formData.depositAmount || formData.depositAmount <= maxDeposit;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-1">
          Rent & Deposit
        </h3>
        <p className="text-sm text-neutral-500">
          Set the financial terms for the tenancy agreement.
        </p>
      </div>

      {/* Monthly Rent */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Banknote size={18} className="text-primary-500" />
          <h4 className="font-medium text-neutral-900">Monthly Rent</h4>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Rent Amount (per calendar month) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">
                £
              </span>
              <input
                type="number"
                value={formData.rentAmount || ''}
                onChange={(e) => onChange({ rentAmount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full pl-8 pr-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Payment Day *
              </label>
              <select
                value={formData.rentPaymentDay || 1}
                onChange={(e) => onChange({ rentPaymentDay: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of each month
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Payment Method *
              </label>
              <select
                value={formData.rentPaymentMethod || 'standing_order'}
                onChange={(e) => onChange({ rentPaymentMethod: e.target.value as RentPaymentMethod })}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Deposit */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={18} className="text-primary-500" />
          <h4 className="font-medium text-neutral-900">Deposit</h4>
        </div>

        {/* Deposit Cap Info */}
        <div className={`mb-4 p-3 rounded-lg ${isDepositValid ? 'bg-success-50' : 'bg-danger-50'}`}>
          <div className="flex items-start gap-2">
            {isDepositValid ? (
              <Check size={16} className="text-success-600 mt-0.5" />
            ) : (
              <AlertCircle size={16} className="text-danger-600 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${isDepositValid ? 'text-success-700' : 'text-danger-700'}`}>
                Maximum deposit: £{maxDeposit.toFixed(2)} ({maxWeeks} weeks' rent)
              </p>
              <p className={`text-xs ${isDepositValid ? 'text-success-600' : 'text-danger-600'}`}>
                Annual rent: £{annualRent.toLocaleString()} ({annualRent >= 50000 ? 'high-value' : 'standard'} cap applies)
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Deposit Amount *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">
                £
              </span>
              <input
                type="number"
                value={formData.depositAmount || ''}
                onChange={(e) => onChange({ depositAmount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                min="0"
                max={maxDeposit}
                step="0.01"
                className={`w-full pl-8 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent ${
                  isDepositValid
                    ? 'border-neutral-300 focus:ring-primary-500'
                    : 'border-danger-300 focus:ring-danger-500'
                }`}
              />
            </div>
            {formData.depositWeeks !== undefined && (
              <p className="mt-1 text-xs text-neutral-500">
                Equivalent to {formData.depositWeeks.toFixed(1)} weeks' rent
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Deposit Protection Scheme *
            </label>
            <select
              value={formData.depositScheme || ''}
              onChange={(e) => onChange({ depositScheme: e.target.value as DepositScheme })}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select a scheme...</option>
              {DEPOSIT_SCHEMES.map((scheme) => (
                <option key={scheme.value} value={scheme.value}>
                  {scheme.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Scheme Reference
              </label>
              <input
                type="text"
                value={formData.depositSchemeRef || ''}
                onChange={(e) => onChange({ depositSchemeRef: e.target.value })}
                placeholder="Enter reference number"
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Date Protected
              </label>
              <input
                type="date"
                value={formData.depositProtectedDate || ''}
                onChange={(e) => onChange({ depositProtectedDate: e.target.value })}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* RRA 2025 Info */}
      <div className="bg-primary-50 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <Info size={16} className="text-primary-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-primary-800 mb-1">
              Tenant Fees Act 2019 & RRA 2025 Requirements
            </p>
            <ul className="text-xs text-primary-700 space-y-1">
              <li>• Maximum deposit: 5 weeks' rent (6 weeks if annual rent ≥ £50,000)</li>
              <li>• Maximum rent in advance: 1 month</li>
              <li>• Deposit must be protected within 30 days of receipt</li>
              <li>• Prescribed information must be provided to tenant</li>
              <li>• Rent can only be increased once per 12 months</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
