/**
 * AgencyProfileForm - Edit form for agency profile
 */

import { Building, User, Mail, Phone, MapPin, Shield } from 'lucide-react';
import { FormField } from '../../molecules/FormField';
import { AddressSection } from './AddressSection';
import type { AgencyProfile, LocalArea, Address, AgencyType } from '../../../types';

interface AgencyProfileFormProps {
  profile: AgencyProfile;
  onChange: (updates: Partial<AgencyProfile>) => void;
  errors?: Record<string, string>;
}

const LOCAL_AREAS: LocalArea[] = [
  'Southport', 'Liverpool', 'Manchester', 'Preston', 'Blackpool',
  'Chester', 'Warrington', 'Wigan', 'St Helens', 'Formby'
];

const AGENCY_TYPES: { value: AgencyType; label: string }[] = [
  { value: 'estate_agent', label: 'Estate Agent' },
  { value: 'management_agency', label: 'Management Agency' }
];

export function AgencyProfileForm({ profile, onChange, errors = {} }: AgencyProfileFormProps) {
  const handleAddressChange = (address: Partial<Address>) => {
    onChange({ address: { ...profile.address, ...address } as Address });
  };

  const handleServiceAreasChange = (area: LocalArea, checked: boolean) => {
    const currentAreas = profile.serviceAreas || [];
    const updatedAreas = checked
      ? [...currentAreas, area]
      : currentAreas.filter((a) => a !== area);

    onChange({ serviceAreas: updatedAreas });
  };

  return (
    <div className="space-y-6">
      {/* Company Details Section */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Building size={18} className="text-primary-500" />
          <h4 className="font-medium text-neutral-900">Company Details</h4>
        </div>

        <div className="space-y-4">
          <FormField
            id="companyName"
            label="Company Name"
            value={profile.companyName}
            onChange={(e) => onChange({ companyName: e.target.value })}
            placeholder="Enter company name"
            isRequired
            error={errors.companyName}
          />

          <FormField
            id="tradingName"
            label="Trading Name"
            value={profile.tradingName || ''}
            onChange={(e) => onChange({ tradingName: e.target.value })}
            placeholder="Trading as... (optional)"
            helperText="If different from company name"
          />

          <FormField
            id="registrationNumber"
            label="Companies House Number"
            value={profile.registrationNumber}
            onChange={(e) => onChange({ registrationNumber: e.target.value })}
            placeholder="e.g., 12345678"
            isRequired
            error={errors.registrationNumber}
          />

          <div className="space-y-2">
            <label htmlFor="agencyType" className="block text-sm font-medium text-neutral-700">
              Agency Type <span className="text-danger-500">*</span>
            </label>
            <select
              id="agencyType"
              value={profile.agencyType}
              onChange={(e) => onChange({ agencyType: e.target.value as AgencyType })}
              className="w-full px-4 py-3 bg-white border-2 border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-4 focus:border-primary-500 focus:ring-primary-100"
            >
              {AGENCY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Primary Contact Section */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <User size={18} className="text-primary-500" />
          <h4 className="font-medium text-neutral-900">Primary Contact</h4>
        </div>

        <div className="space-y-4">
          <FormField
            id="primaryContactName"
            label="Contact Name"
            value={profile.primaryContactName}
            onChange={(e) => onChange({ primaryContactName: e.target.value })}
            placeholder="Full name"
            isRequired
            error={errors.primaryContactName}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
                <div className="flex items-center gap-2">
                  <Mail size={14} />
                  Email <span className="text-danger-500">*</span>
                </div>
              </label>
              <input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => onChange({ email: e.target.value })}
                placeholder="contact@agency.com"
                disabled
                className="w-full px-4 py-3 bg-neutral-100 border-2 border-neutral-200 rounded-xl text-neutral-500 cursor-not-allowed"
              />
              <p className="text-xs text-neutral-500">Contact support to change email</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="block text-sm font-medium text-neutral-700">
                <div className="flex items-center gap-2">
                  <Phone size={14} />
                  Phone <span className="text-danger-500">*</span>
                </div>
              </label>
              <input
                id="phone"
                type="tel"
                value={profile.phone}
                onChange={(e) => onChange({ phone: e.target.value })}
                placeholder="01onal 123456"
                className="w-full px-4 py-3 bg-white border-2 border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-4 focus:border-primary-500 focus:ring-primary-100"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Office Address Section */}
      <AddressSection
        title="Office Address"
        address={profile.address || {}}
        onChange={handleAddressChange}
        errors={{}}
        required
      />

      {/* Service Areas Section */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={18} className="text-primary-500" />
          <h4 className="font-medium text-neutral-900">Service Areas</h4>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            Select the areas where you provide services
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {LOCAL_AREAS.map((area) => (
              <label key={area} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-white transition-colors">
                <input
                  type="checkbox"
                  checked={profile.serviceAreas?.includes(area) || false}
                  onChange={(e) => handleServiceAreasChange(area, e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700">{area}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Compliance Section */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={18} className="text-primary-500" />
          <h4 className="font-medium text-neutral-900">Compliance</h4>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.propertyOmbudsmanMember}
              onChange={(e) => onChange({ propertyOmbudsmanMember: e.target.checked })}
              className="w-5 h-5 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
            />
            <div>
              <span className="text-sm font-medium text-neutral-700">Property Ombudsman Member</span>
              <p className="text-xs text-neutral-500">Required for letting agents under RRA 2025</p>
            </div>
          </label>

          {/* Insurance Details */}
          <div className="pt-4 border-t border-neutral-200">
            <h5 className="text-sm font-medium text-neutral-700 mb-3">Insurance Details</h5>

            <div className="space-y-4">
              <FormField
                id="insuranceProvider"
                label="Insurance Provider"
                value={profile.insuranceDetails?.provider || ''}
                onChange={(e) => onChange({
                  insuranceDetails: {
                    ...profile.insuranceDetails,
                    provider: e.target.value,
                    policyNumber: profile.insuranceDetails?.policyNumber || '',
                    expiryDate: profile.insuranceDetails?.expiryDate || new Date()
                  }
                })}
                placeholder="Provider name"
              />

              <FormField
                id="insurancePolicyNumber"
                label="Policy Number"
                value={profile.insuranceDetails?.policyNumber || ''}
                onChange={(e) => onChange({
                  insuranceDetails: {
                    ...profile.insuranceDetails,
                    provider: profile.insuranceDetails?.provider || '',
                    policyNumber: e.target.value,
                    expiryDate: profile.insuranceDetails?.expiryDate || new Date()
                  }
                })}
                placeholder="Policy number"
              />

              <FormField
                id="insuranceExpiryDate"
                label="Expiry Date"
                type="date"
                value={profile.insuranceDetails?.expiryDate
                  ? new Date(profile.insuranceDetails.expiryDate).toISOString().split('T')[0]
                  : ''
                }
                onChange={(e) => onChange({
                  insuranceDetails: {
                    ...profile.insuranceDetails,
                    provider: profile.insuranceDetails?.provider || '',
                    policyNumber: profile.insuranceDetails?.policyNumber || '',
                    expiryDate: e.target.value ? new Date(e.target.value) : new Date()
                  }
                })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Branding Section */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Building size={18} className="text-primary-500" />
          <h4 className="font-medium text-neutral-900">Branding</h4>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="brandColor" className="block text-sm font-medium text-neutral-700">
              Brand Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                id="brandColor"
                value={profile.brandColor || '#3B82F6'}
                onChange={(e) => onChange({ brandColor: e.target.value })}
                className="w-12 h-12 rounded-lg cursor-pointer border-2 border-neutral-200"
              />
              <input
                type="text"
                value={profile.brandColor || '#3B82F6'}
                onChange={(e) => onChange({ brandColor: e.target.value })}
                placeholder="#3B82F6"
                className="flex-1 px-4 py-3 bg-white border-2 border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-4 focus:border-primary-500 focus:ring-primary-100"
              />
            </div>
            <p className="text-xs text-neutral-500">Used for your agency branding throughout the platform</p>
          </div>
        </div>
      </div>
    </div>
  );
}
