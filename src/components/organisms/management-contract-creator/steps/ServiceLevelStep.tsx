/**
 * ServiceLevelStep - Choose the service level for the management contract
 */

import { Check, Users, Banknote, Building } from 'lucide-react';
import type { ManagementServiceLevel } from '../../../../types';
import {
  formatServiceLevel,
  getServiceLevelDescription,
  DEFAULT_COMMISSION_RATES,
} from '../../../../lib/managementContractService';

interface ServiceLevelStepProps {
  selectedLevel: ManagementServiceLevel;
  onSelect: (level: ManagementServiceLevel) => void;
}

const SERVICE_LEVELS: ManagementServiceLevel[] = [
  'let_only',
  'rent_collection',
  'full_management',
];

const LEVEL_ICONS: Record<ManagementServiceLevel, typeof Users> = {
  let_only: Users,
  rent_collection: Banknote,
  full_management: Building,
};

const LEVEL_FEATURES: Record<ManagementServiceLevel, string[]> = {
  let_only: [
    'Tenant finding & advertising',
    'Tenant referencing',
    'Right to rent checks',
    'Tenancy agreement preparation',
    'Inventory check-in',
  ],
  rent_collection: [
    'Everything in Let Only, plus:',
    'Monthly rent collection',
    'Rent remittance to landlord',
    'Arrears management',
    'Deposit protection',
    'Basic tenant liaison',
  ],
  full_management: [
    'Everything in Rent Collection, plus:',
    'Property inspections',
    'Maintenance coordination',
    'Tenant communication',
    'Legal compliance (gas, EPC)',
    'Eviction handling if needed',
    '24/7 emergency support',
  ],
};

export function ServiceLevelStep({
  selectedLevel,
  onSelect,
}: ServiceLevelStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Building className="mx-auto h-12 w-12 text-primary-500 mb-4" />
        <h2 className="text-xl font-bold text-neutral-900">Choose Service Level</h2>
        <p className="mt-2 text-neutral-600">
          Select the type of management service you need
        </p>
      </div>

      <div className="space-y-4">
        {SERVICE_LEVELS.map(level => {
          const Icon = LEVEL_ICONS[level];
          const isSelected = selectedLevel === level;
          const typicalRate = DEFAULT_COMMISSION_RATES[level];

          return (
            <button
              key={level}
              onClick={() => onSelect(level)}
              className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 bg-white hover:border-primary-300'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${
                  isSelected ? 'bg-primary-500 text-white' : 'bg-neutral-100 text-neutral-600'
                }`}>
                  <Icon className="h-6 w-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-semibold text-neutral-900">
                      {formatServiceLevel(level)}
                    </h3>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-primary-500' : 'bg-neutral-200'
                    }`}>
                      {isSelected && <Check className="h-4 w-4 text-white" />}
                    </div>
                  </div>

                  <p className="text-sm text-neutral-600 mb-3">
                    {getServiceLevelDescription(level)}
                  </p>

                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm font-medium text-primary-600">
                      {level === 'let_only'
                        ? 'Typical: 4-6 weeks rent (one-time)'
                        : `Typical: ${typicalRate}% of rent/month`
                      }
                    </span>
                  </div>

                  <div className="border-t border-neutral-200 pt-3">
                    <h4 className="text-xs font-medium text-neutral-700 uppercase tracking-wider mb-2">
                      Includes:
                    </h4>
                    <ul className="space-y-1">
                      {LEVEL_FEATURES[level].map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-neutral-600">
                          <Check className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                            feature.startsWith('Everything')
                              ? 'text-primary-500'
                              : 'text-success-500'
                          }`} />
                          <span className={feature.startsWith('Everything') ? 'font-medium text-primary-700' : ''}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Info box */}
      <div className="bg-neutral-100 rounded-xl p-4">
        <p className="text-sm text-neutral-600">
          <strong>Note:</strong> You can customize the included services in the next step.
          Commission rates are negotiable and will be set in the following step.
        </p>
      </div>
    </div>
  );
}
