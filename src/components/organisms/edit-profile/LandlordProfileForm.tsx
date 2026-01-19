/**
 * LandlordProfileForm - Edit form for landlord profile
 */

import { User, Mail, Shield, Home, PawPrint } from 'lucide-react';
import { FormField } from '../../molecules/FormField';
import { AddressSection } from './AddressSection';
import type { LandlordProfile, PropertyType, FurnishingType, RenterType, PRSRegistrationStatus, OmbudsmanScheme, Address } from '../../../types';

interface LandlordProfileFormProps {
  profile: LandlordProfile;
  onChange: (updates: Partial<LandlordProfile>) => void;
  errors?: Record<string, string>;
}

const PROPERTY_TYPES: PropertyType[] = [
  'Detached', 'Semi-detached', 'Terraced', 'End-Terraced', 'Bungalow', 'Flat'
];

const FURNISHING_TYPES: FurnishingType[] = ['Furnished', 'Part Furnished', 'Unfurnished'];

const RENTER_TYPES: RenterType[] = [
  'Student', 'Young Professional', 'Family', 'Couple', 'Professional Sharers', 'Retired'
];

const PRS_STATUSES: PRSRegistrationStatus[] = [
  'not_registered', 'pending', 'active', 'expired', 'suspended'
];

const OMBUDSMAN_SCHEMES: OmbudsmanScheme[] = [
  'not_registered', 'property_redress_scheme', 'property_ombudsman', 'tpo'
];

const DEPOSIT_SCHEMES = ['DPS', 'TDS', 'MyDeposits'];

const CONTACT_METHODS: { value: 'in_app' | 'email' | 'both'; label: string }[] = [
  { value: 'in_app', label: 'In-app only' },
  { value: 'email', label: 'Email only' },
  { value: 'both', label: 'Both in-app and email' }
];

const PET_TYPES = ['cat', 'dog', 'small_caged', 'fish'] as const;

export function LandlordProfileForm({ profile, onChange, errors = {} }: LandlordProfileFormProps) {
  const handleAddressChange = (address: Partial<Address>) => {
    onChange({ businessAddress: { ...profile.businessAddress, ...address } as Address });
  };

  const handlePetTypesChange = (petType: typeof PET_TYPES[number], checked: boolean) => {
    const currentTypes = profile.defaultPetsPolicy?.preferredPetTypes || [];
    const updatedTypes = checked
      ? [...currentTypes, petType]
      : currentTypes.filter((t) => t !== petType);

    onChange({
      defaultPetsPolicy: {
        ...profile.defaultPetsPolicy,
        willConsiderPets: true,
        preferredPetTypes: updatedTypes
      }
    });
  };

  const handlePreferredTenantChange = (tenantType: RenterType, checked: boolean) => {
    const currentTypes = profile.preferredTenantTypes || [];
    const updatedTypes = checked
      ? [...currentTypes, tenantType]
      : currentTypes.filter((t) => t !== tenantType);

    onChange({ preferredTenantTypes: updatedTypes });
  };

  return (
    <div className="space-y-6">
      {/* Personal Details Section */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <User size={18} className="text-primary-500" />
          <h4 className="font-medium text-neutral-900">Personal Details</h4>
        </div>

        <div className="space-y-4">
          <FormField
            id="names"
            label="Name(s)"
            value={profile.names}
            onChange={(e) => onChange({ names: e.target.value })}
            placeholder="Enter your name(s)"
            isRequired
            error={errors.names}
          />

          <FormField
            id="email"
            label="Email"
            type="email"
            value={profile.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder="your@email.com"
            isRequired
            error={errors.email}
            disabled
            helperText="Contact support to change your email"
          />
        </div>
      </div>

      {/* Business Address Section */}
      <AddressSection
        title="Business/Correspondence Address"
        address={profile.businessAddress || {}}
        onChange={handleAddressChange}
        errors={{}}
        required
      />

      {/* Contact Preferences Section */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Mail size={18} className="text-primary-500" />
          <h4 className="font-medium text-neutral-900">Contact Preferences</h4>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="preferredContactMethod" className="block text-sm font-medium text-neutral-700">
              Preferred Contact Method
            </label>
            <select
              id="preferredContactMethod"
              value={profile.preferredContactMethod || 'both'}
              onChange={(e) => onChange({ preferredContactMethod: e.target.value as 'in_app' | 'email' | 'both' })}
              className="w-full px-4 py-3 bg-white border-2 border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-4 focus:border-primary-500 focus:ring-primary-100"
            >
              {CONTACT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          <FormField
            id="notificationEmail"
            label="Notification Email"
            type="email"
            value={profile.notificationEmail || ''}
            onChange={(e) => onChange({ notificationEmail: e.target.value })}
            placeholder="notifications@email.com"
            helperText="If different from your account email"
          />
        </div>
      </div>

      {/* Property Preferences Section */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Home size={18} className="text-primary-500" />
          <h4 className="font-medium text-neutral-900">Property Preferences</h4>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="propertyType" className="block text-sm font-medium text-neutral-700">
              Property Type
            </label>
            <select
              id="propertyType"
              value={profile.propertyType}
              onChange={(e) => onChange({ propertyType: e.target.value as PropertyType })}
              className="w-full px-4 py-3 bg-white border-2 border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-4 focus:border-primary-500 focus:ring-primary-100"
            >
              {PROPERTY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="furnishingPreference" className="block text-sm font-medium text-neutral-700">
              Furnishing Preference
            </label>
            <select
              id="furnishingPreference"
              value={profile.furnishingPreference}
              onChange={(e) => onChange({ furnishingPreference: e.target.value as FurnishingType })}
              className="w-full px-4 py-3 bg-white border-2 border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-4 focus:border-primary-500 focus:ring-primary-100"
            >
              {FURNISHING_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Preferred Tenant Types
            </label>
            <div className="grid grid-cols-2 gap-2">
              {RENTER_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.preferredTenantTypes?.includes(type) || false}
                    onChange={(e) => handlePreferredTenantChange(type, e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-700">{type}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              These are preferences only - you cannot discriminate against tenant types
            </p>
          </div>
        </div>
      </div>

      {/* Pets Policy Section */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <PawPrint size={18} className="text-primary-500" />
          <h4 className="font-medium text-neutral-900">Pets Policy</h4>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-primary-700 bg-primary-50 p-3 rounded-lg">
            Under RRA 2025, landlords cannot unreasonably refuse pets. Tenants can request to keep a pet at any time.
          </p>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Preferred Pet Types
            </label>
            <div className="flex flex-wrap gap-3">
              {PET_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.defaultPetsPolicy?.preferredPetTypes?.includes(type) || false}
                    onChange={(e) => handlePetTypesChange(type, e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-700 capitalize">{type.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          <FormField
            id="maxPetsAllowed"
            label="Maximum Pets Allowed"
            type="number"
            min={1}
            max={10}
            value={profile.defaultPetsPolicy?.maxPetsAllowed || 2}
            onChange={(e) => onChange({
              defaultPetsPolicy: {
                ...profile.defaultPetsPolicy,
                willConsiderPets: true,
                maxPetsAllowed: parseInt(e.target.value) || 2
              }
            })}
          />

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.defaultPetsPolicy?.requiresPetInsurance || false}
              onChange={(e) => onChange({
                defaultPetsPolicy: {
                  ...profile.defaultPetsPolicy,
                  willConsiderPets: true,
                  requiresPetInsurance: e.target.checked
                }
              })}
              className="w-5 h-5 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-sm text-neutral-700">Require pet damage insurance</span>
          </label>
        </div>
      </div>

      {/* Compliance Section */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={18} className="text-primary-500" />
          <h4 className="font-medium text-neutral-900">Compliance (RRA 2025)</h4>
        </div>

        <div className="space-y-4">
          <FormField
            id="prsRegistrationNumber"
            label="PRS Registration Number"
            value={profile.prsRegistrationNumber || ''}
            onChange={(e) => onChange({ prsRegistrationNumber: e.target.value })}
            placeholder="PRS-XXXXXX"
            helperText="Property Registration Scheme number"
          />

          <div className="space-y-2">
            <label htmlFor="prsRegistrationStatus" className="block text-sm font-medium text-neutral-700">
              PRS Registration Status
            </label>
            <select
              id="prsRegistrationStatus"
              value={profile.prsRegistrationStatus}
              onChange={(e) => onChange({ prsRegistrationStatus: e.target.value as PRSRegistrationStatus })}
              className="w-full px-4 py-3 bg-white border-2 border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-4 focus:border-primary-500 focus:ring-primary-100"
            >
              {PRS_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="ombudsmanScheme" className="block text-sm font-medium text-neutral-700">
              Ombudsman Scheme
            </label>
            <select
              id="ombudsmanScheme"
              value={profile.ombudsmanScheme}
              onChange={(e) => onChange({ ombudsmanScheme: e.target.value as OmbudsmanScheme })}
              className="w-full px-4 py-3 bg-white border-2 border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-4 focus:border-primary-500 focus:ring-primary-100"
            >
              {OMBUDSMAN_SCHEMES.map((scheme) => (
                <option key={scheme} value={scheme}>
                  {scheme === 'tpo' ? 'TPO' : scheme.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          <FormField
            id="ombudsmanMembershipNumber"
            label="Ombudsman Membership Number"
            value={profile.ombudsmanMembershipNumber || ''}
            onChange={(e) => onChange({ ombudsmanMembershipNumber: e.target.value })}
            placeholder="OMB-XXXXXX"
          />

          <div className="space-y-2">
            <label htmlFor="depositScheme" className="block text-sm font-medium text-neutral-700">
              Deposit Protection Scheme
            </label>
            <select
              id="depositScheme"
              value={profile.depositScheme}
              onChange={(e) => onChange({ depositScheme: e.target.value })}
              className="w-full px-4 py-3 bg-white border-2 border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-4 focus:border-primary-500 focus:ring-primary-100"
            >
              {DEPOSIT_SCHEMES.map((scheme) => (
                <option key={scheme} value={scheme}>
                  {scheme}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
