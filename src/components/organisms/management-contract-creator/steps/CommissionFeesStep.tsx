/**
 * CommissionFeesStep - Set commission rates and payment terms
 */

import { PoundSterling, Percent, Calendar, CreditCard } from 'lucide-react';
import type { ManagementServiceLevel, ManagementPaymentTerms } from '../../../../types';
import { formatServiceLevel, DEFAULT_COMMISSION_RATES } from '../../../../lib/managementContractService';

interface CommissionFeesStepProps {
  serviceLevel: ManagementServiceLevel;
  commissionRate: number;
  letOnlyFee?: number;
  paymentTerms: ManagementPaymentTerms;
  onChange: (updates: {
    commissionRate?: number;
    letOnlyFee?: number;
    paymentTerms?: ManagementPaymentTerms;
  }) => void;
}

export function CommissionFeesStep({
  serviceLevel,
  commissionRate,
  letOnlyFee,
  paymentTerms,
  onChange,
}: CommissionFeesStepProps) {
  const isLetOnly = serviceLevel === 'let_only';
  const defaultRate = DEFAULT_COMMISSION_RATES[serviceLevel];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <PoundSterling className="mx-auto h-12 w-12 text-primary-500 mb-4" />
        <h2 className="text-xl font-bold text-neutral-900">Commission & Fees</h2>
        <p className="mt-2 text-neutral-600">
          Set the fees for {formatServiceLevel(serviceLevel)} service
        </p>
      </div>

      {/* Commission / Fee */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          {isLetOnly ? (
            <PoundSterling size={18} className="text-primary-500" />
          ) : (
            <Percent size={18} className="text-primary-500" />
          )}
          <h3 className="font-medium text-neutral-900">
            {isLetOnly ? 'One-Time Fee' : 'Commission Rate'}
          </h3>
        </div>

        {isLetOnly ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="letOnlyFee" className="block text-sm font-medium text-neutral-700 mb-1">
                Let Only Fee (£)
              </label>
              <div className="relative">
                <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  id="letOnlyFee"
                  type="number"
                  min={0}
                  max={10000}
                  step={50}
                  value={letOnlyFee || ''}
                  onChange={(e) => onChange({ letOnlyFee: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-10 pr-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                  placeholder="e.g., 500"
                />
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Typical let-only fees are equivalent to 4-6 weeks' rent
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="commissionRate" className="block text-sm font-medium text-neutral-700 mb-1">
                Commission Rate (%)
              </label>
              <div className="relative">
                <input
                  id="commissionRate"
                  type="number"
                  min={0}
                  max={25}
                  step={0.5}
                  value={commissionRate}
                  onChange={(e) => onChange({ commissionRate: parseFloat(e.target.value) || 0 })}
                  className="w-full pr-12 pl-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                  placeholder={`e.g., ${defaultRate}`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500">%</span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Typical rate for {formatServiceLevel(serviceLevel)}: {defaultRate}%
              </p>
            </div>

            {/* Commission calculator */}
            <div className="bg-white p-4 rounded-lg border border-neutral-200">
              <h4 className="text-sm font-medium text-neutral-700 mb-2">Example Calculation</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-neutral-500">Monthly Rent:</span>
                  <span className="ml-2 font-medium">£1,000</span>
                </div>
                <div>
                  <span className="text-neutral-500">Commission:</span>
                  <span className="ml-2 font-medium text-primary-600">
                    £{((1000 * commissionRate) / 100).toFixed(2)}/mo
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Terms */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard size={18} className="text-primary-500" />
          <h3 className="font-medium text-neutral-900">Payment Terms</h3>
        </div>

        <div className="space-y-4">
          {/* Payment Frequency */}
          <div>
            <label htmlFor="paymentFrequency" className="block text-sm font-medium text-neutral-700 mb-1">
              Payment Frequency
            </label>
            <select
              id="paymentFrequency"
              value={paymentTerms.paymentFrequency}
              onChange={(e) => onChange({
                paymentTerms: {
                  ...paymentTerms,
                  paymentFrequency: e.target.value as 'monthly' | 'quarterly',
                },
              })}
              className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label htmlFor="paymentMethod" className="block text-sm font-medium text-neutral-700 mb-1">
              Payment Method
            </label>
            <select
              id="paymentMethod"
              value={paymentTerms.paymentMethod}
              onChange={(e) => onChange({
                paymentTerms: {
                  ...paymentTerms,
                  paymentMethod: e.target.value as 'bank_transfer' | 'standing_order',
                },
              })}
              className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="standing_order">Standing Order</option>
            </select>
          </div>

          {/* Invoice Due Days */}
          <div>
            <label htmlFor="invoiceDueDays" className="block text-sm font-medium text-neutral-700 mb-1">
              Invoice Due Within (Days)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <input
                id="invoiceDueDays"
                type="number"
                min={7}
                max={60}
                value={paymentTerms.invoiceDueWithinDays}
                onChange={(e) => onChange({
                  paymentTerms: {
                    ...paymentTerms,
                    invoiceDueWithinDays: parseInt(e.target.value) || 14,
                  },
                })}
                className="w-full pl-10 pr-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
              />
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Standard payment terms: 14-30 days
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
