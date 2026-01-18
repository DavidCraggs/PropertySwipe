/**
 * OccupantsStep - Additional occupants management
 */

import { UserPlus, Trash2, Plus, Users } from 'lucide-react';
import { Button } from '../../../atoms/Button';
import type { AgreementFormData, AdditionalOccupant } from '../../../../types';

interface OccupantsStepProps {
  formData: Partial<AgreementFormData>;
  onChange: (updates: Partial<AgreementFormData>) => void;
}

export function OccupantsStep({ formData, onChange }: OccupantsStepProps) {
  const occupants = formData.additionalOccupants || [];

  const addOccupant = () => {
    const newOccupant: AdditionalOccupant = {
      name: '',
      relationship: '',
    };
    onChange({ additionalOccupants: [...occupants, newOccupant] });
  };

  const updateOccupant = (index: number, updates: Partial<AdditionalOccupant>) => {
    const updated = occupants.map((o, i) => (i === index ? { ...o, ...updates } : o));
    onChange({ additionalOccupants: updated });
  };

  const removeOccupant = (index: number) => {
    const updated = occupants.filter((_, i) => i !== index);
    onChange({ additionalOccupants: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-1">
          Additional Occupants
        </h3>
        <p className="text-sm text-neutral-500">
          List any additional people who will be living at the property besides the main tenant.
        </p>
      </div>

      {/* Maximum Occupancy */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} className="text-primary-500" />
          <h4 className="font-medium text-neutral-900">Maximum Occupancy</h4>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Maximum number of occupants permitted
          </label>
          <input
            type="number"
            value={formData.maxOccupants || 2}
            onChange={(e) => onChange({ maxOccupants: parseInt(e.target.value) || 2 })}
            min="1"
            max="10"
            className="w-32 px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-neutral-400">
            Including the main tenant
          </p>
        </div>
      </div>

      {/* Additional Occupants List */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-primary-500" />
            <h4 className="font-medium text-neutral-900">Additional Occupants</h4>
          </div>
          <span className="text-xs text-neutral-400 bg-neutral-200 px-2 py-0.5 rounded">
            Optional
          </span>
        </div>

        {occupants.length === 0 ? (
          <div className="text-center py-8">
            <Users size={40} className="mx-auto text-neutral-300 mb-3" />
            <p className="text-sm text-neutral-500 mb-4">
              No additional occupants added yet
            </p>
            <Button
              variant="secondary"
              onClick={addOccupant}
              className="inline-flex items-center gap-2"
            >
              <Plus size={16} />
              Add Occupant
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {occupants.map((occupant, index) => (
              <div
                key={index}
                className="bg-white rounded-lg border border-neutral-200 p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-neutral-500">
                    Occupant {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeOccupant(index)}
                    className="p-1 text-neutral-400 hover:text-danger-500 hover:bg-danger-50 rounded transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={occupant.name}
                      onChange={(e) => updateOccupant(index, { name: e.target.value })}
                      placeholder="Enter name"
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      Relationship to Tenant *
                    </label>
                    <select
                      value={occupant.relationship}
                      onChange={(e) => updateOccupant(index, { relationship: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select...</option>
                      <option value="spouse">Spouse/Partner</option>
                      <option value="child">Child</option>
                      <option value="parent">Parent</option>
                      <option value="sibling">Sibling</option>
                      <option value="other_family">Other Family Member</option>
                      <option value="friend">Friend/Housemate</option>
                      <option value="carer">Carer</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={occupant.dateOfBirth || ''}
                      onChange={(e) => updateOccupant(index, { dateOfBirth: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              variant="secondary"
              onClick={addOccupant}
              className="w-full flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Add Another Occupant
            </Button>
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="bg-primary-50 rounded-xl p-4">
        <p className="text-sm text-primary-700">
          <strong>Note:</strong> All adults aged 18 and over who will be living at the property
          should be listed. Right to Rent checks may be required for all adult occupants.
        </p>
      </div>
    </div>
  );
}
