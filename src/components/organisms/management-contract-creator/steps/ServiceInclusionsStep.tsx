/**
 * ServiceInclusionsStep - Customize which services are included
 */

import { Settings, Check, X, Info } from 'lucide-react';
import type { ManagementServiceLevel, ManagementServiceInclusions } from '../../../../types';
import { formatServiceLevel, DEFAULT_SERVICE_INCLUSIONS } from '../../../../lib/managementContractService';

interface ServiceInclusionsStepProps {
  serviceLevel: ManagementServiceLevel;
  inclusions: ManagementServiceInclusions;
  onChange: (inclusions: ManagementServiceInclusions) => void;
}

interface ServiceDefinition {
  key: keyof ManagementServiceInclusions;
  label: string;
  description: string;
  isCore: boolean; // Core services for the level can't be removed
}

const SERVICE_DEFINITIONS: ServiceDefinition[] = [
  {
    key: 'tenantFinding',
    label: 'Tenant Finding',
    description: 'Advertising the property, conducting viewings, and finding suitable tenants',
    isCore: true,
  },
  {
    key: 'referenceChecking',
    label: 'Reference Checking',
    description: 'Credit checks, employer references, and previous landlord references',
    isCore: true,
  },
  {
    key: 'rentCollection',
    label: 'Rent Collection',
    description: 'Monthly rent collection and pursuing late payments',
    isCore: false,
  },
  {
    key: 'propertyInspections',
    label: 'Property Inspections',
    description: 'Regular property inspections to check condition and compliance',
    isCore: false,
  },
  {
    key: 'maintenanceCoordination',
    label: 'Maintenance Coordination',
    description: 'Arranging repairs and maintenance, managing contractors',
    isCore: false,
  },
  {
    key: 'tenantCommunication',
    label: 'Tenant Communication',
    description: 'Handling all tenant queries and communications',
    isCore: false,
  },
  {
    key: 'legalCompliance',
    label: 'Legal Compliance',
    description: 'Gas safety certificates, EPC, deposit protection, Right to Rent',
    isCore: false,
  },
  {
    key: 'evictionHandling',
    label: 'Eviction Handling',
    description: 'Managing the eviction process if required (court fees extra)',
    isCore: false,
  },
];

export function ServiceInclusionsStep({
  serviceLevel,
  inclusions,
  onChange,
}: ServiceInclusionsStepProps) {
  const defaults = DEFAULT_SERVICE_INCLUSIONS[serviceLevel];

  function toggleService(key: keyof ManagementServiceInclusions) {
    const service = SERVICE_DEFINITIONS.find(s => s.key === key);
    // Core services for the level can't be toggled off
    if (service?.isCore && defaults[key]) return;

    onChange({
      ...inclusions,
      [key]: !inclusions[key],
    });
  }

  function resetToDefaults() {
    onChange({ ...defaults });
  }

  const enabledCount = Object.values(inclusions).filter(Boolean).length;
  const defaultCount = Object.values(defaults).filter(Boolean).length;
  const hasCustomizations = enabledCount !== defaultCount ||
    Object.keys(inclusions).some(key => inclusions[key as keyof ManagementServiceInclusions] !== defaults[key as keyof ManagementServiceInclusions]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Settings className="mx-auto h-12 w-12 text-primary-500 mb-4" />
        <h2 className="text-xl font-bold text-neutral-900">Service Inclusions</h2>
        <p className="mt-2 text-neutral-600">
          Customize included services for {formatServiceLevel(serviceLevel)}
        </p>
      </div>

      {/* Reset button */}
      {hasCustomizations && (
        <div className="flex justify-end">
          <button
            onClick={resetToDefaults}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Reset to defaults
          </button>
        </div>
      )}

      {/* Services list */}
      <div className="space-y-3">
        {SERVICE_DEFINITIONS.map(service => {
          const isEnabled = inclusions[service.key];
          const isDefault = defaults[service.key];
          const isCoreForLevel = service.isCore && isDefault;
          const canToggle = !isCoreForLevel;

          return (
            <div
              key={service.key}
              className={`p-4 rounded-xl border-2 transition-all ${
                isEnabled
                  ? 'border-success-200 bg-success-50'
                  : 'border-neutral-200 bg-white'
              } ${canToggle ? 'cursor-pointer hover:border-primary-300' : ''}`}
              onClick={() => canToggle && toggleService(service.key)}
            >
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  isEnabled ? 'bg-success-500' : 'bg-neutral-200'
                }`}>
                  {isEnabled ? (
                    <Check className="h-4 w-4 text-white" />
                  ) : (
                    <X className="h-4 w-4 text-neutral-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-neutral-900">{service.label}</h4>
                    {isCoreForLevel && (
                      <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                        Core Service
                      </span>
                    )}
                    {isEnabled && !isDefault && (
                      <span className="text-xs bg-success-100 text-success-700 px-2 py-0.5 rounded-full">
                        Added
                      </span>
                    )}
                    {!isEnabled && isDefault && (
                      <span className="text-xs bg-warning-100 text-warning-700 px-2 py-0.5 rounded-full">
                        Removed
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-600 mt-1">
                    {service.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="bg-primary-50 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-primary-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-primary-900">
              {enabledCount} services selected
            </h4>
            <p className="text-sm text-primary-700 mt-1">
              {hasCustomizations
                ? 'You have customized the default services for this level. Additional services may affect the commission rate.'
                : `These are the standard services included with ${formatServiceLevel(serviceLevel)}.`
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
