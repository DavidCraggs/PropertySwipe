/**
 * RenterProfileForm - Edit form for renter profile
 */

import { User, Briefcase, Calendar, Home, PawPrint } from 'lucide-react';
import { FormField } from '../../molecules/FormField';
import { AddressSection } from './AddressSection';
import type { RenterProfile, LocalArea, RenterType, EmploymentStatus, RenterSituation, Address } from '../../../types';

interface RenterProfileFormProps {
  profile: RenterProfile;
  onChange: (updates: Partial<RenterProfile>) => void;
  errors?: Record<string, string>;
}

const LOCAL_AREAS: LocalArea[] = [
  'Southport', 'Liverpool', 'Manchester', 'Preston', 'Blackpool',
  'Chester', 'Warrington', 'Wigan', 'St Helens', 'Formby'
];

const RENTER_TYPES: RenterType[] = [
  'Student', 'Young Professional', 'Family', 'Couple', 'Professional Sharers', 'Retired'
];

const EMPLOYMENT_STATUSES: EmploymentStatus[] = [
  'Employed Full-Time', 'Employed Part-Time', 'Self-Employed', 'Student',
  'Retired', 'Unemployed', 'Contract Worker'
];

const SITUATIONS: RenterSituation[] = ['Single', 'Couple', 'Family', 'Professional Sharers'];

const RENTAL_SITUATIONS: RenterProfile['currentRentalSituation'][] = [
  'Living with Parents', 'Currently Renting', 'Homeowner', 'Student Accommodation'
];

const SMOKING_STATUSES: RenterProfile['smokingStatus'][] = ['Non-Smoker', 'Smoker', 'Vaper'];

export function RenterProfileForm({ profile, onChange, errors = {} }: RenterProfileFormProps) {
  const handleAddressChange = (address: Partial<Address>) => {
    onChange({ address: { ...profile.address, ...address } as Address });
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
            helperText="For couples/families, list all names"
          />

          <FormField
            id="ages"
            label="Age(s)"
            value={profile.ages}
            onChange={(e) => onChange({ ages: e.target.value })}
            placeholder="e.g., 28, or 28 & 30"
            isRequired
            error={errors.ages}
            helperText="For couples/families, list all ages"
          />

          <div className="space-y-2">
            <label htmlFor="situation" className="block text-sm font-medium text-neutral-700">
              Situation <span className="text-danger-500">*</span>
            </label>
            <select
              id="situation"
              value={profile.situation}
              onChange={(e) => onChange({ situation: e.target.value as RenterSituation })}
              className="w-full px-4 py-3 bg-white border-2 border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-4 focus:border-primary-500 focus:ring-primary-100"
            >
              {SITUATIONS.map((situation) => (
                <option key={situation} value={situation}>
                  {situation}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="renterType" className="block text-sm font-medium text-neutral-700">
              Renter Type <span className="text-danger-500">*</span>
            </label>
            <select
              id="renterType"
              value={profile.renterType}
              onChange={(e) => onChange({ renterType: e.target.value as RenterType })}
              className="w-full px-4 py-3 bg-white border-2 border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-4 focus:border-primary-500 focus:ring-primary-100"
            >
              {RENTER_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Address Section */}
      <AddressSection
        title="Current Address"
        address={profile.address || {}}
        onChange={handleAddressChange}
        errors={{}}
        required
      />

      {/* Search Preferences Section */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Home size={18} className="text-primary-500" />
          <h4 className="font-medium text-neutral-900">Search Preferences</h4>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="localArea" className="block text-sm font-medium text-neutral-700">
              Preferred Area <span className="text-danger-500">*</span>
            </label>
            <select
              id="localArea"
              value={profile.localArea}
              onChange={(e) => onChange({ localArea: e.target.value as LocalArea })}
              className="w-full px-4 py-3 bg-white border-2 border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-4 focus:border-primary-500 focus:ring-primary-100"
            >
              {LOCAL_AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="currentRentalSituation" className="block text-sm font-medium text-neutral-700">
              Current Living Situation
            </label>
            <select
              id="currentRentalSituation"
              value={profile.currentRentalSituation}
              onChange={(e) => onChange({ currentRentalSituation: e.target.value as RenterProfile['currentRentalSituation'] })}
              className="w-full px-4 py-3 bg-white border-2 border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-4 focus:border-primary-500 focus:ring-primary-100"
            >
              {RENTAL_SITUATIONS.map((situation) => (
                <option key={situation} value={situation}>
                  {situation}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Employment Section */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase size={18} className="text-primary-500" />
          <h4 className="font-medium text-neutral-900">Employment & Income</h4>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="employmentStatus" className="block text-sm font-medium text-neutral-700">
              Employment Status <span className="text-danger-500">*</span>
            </label>
            <select
              id="employmentStatus"
              value={profile.employmentStatus}
              onChange={(e) => onChange({ employmentStatus: e.target.value as EmploymentStatus })}
              className="w-full px-4 py-3 bg-white border-2 border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-4 focus:border-primary-500 focus:ring-primary-100"
            >
              {EMPLOYMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <FormField
            id="monthlyIncome"
            label="Monthly Income"
            type="number"
            value={profile.monthlyIncome || ''}
            onChange={(e) => onChange({ monthlyIncome: parseFloat(e.target.value) || 0 })}
            placeholder="0"
            isRequired
            error={errors.monthlyIncome}
            helperText="Combined household income if applicable"
          />

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.hasGuarantor}
              onChange={(e) => onChange({ hasGuarantor: e.target.checked })}
              className="w-5 h-5 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-sm text-neutral-700">I have a guarantor available</span>
          </label>
        </div>
      </div>

      {/* Living Preferences Section */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-primary-500" />
          <h4 className="font-medium text-neutral-900">Living Preferences</h4>
        </div>

        <div className="space-y-4">
          <FormField
            id="preferredMoveInDate"
            label="Preferred Move-in Date"
            type="date"
            value={profile.preferredMoveInDate ? new Date(profile.preferredMoveInDate).toISOString().split('T')[0] : ''}
            onChange={(e) => onChange({ preferredMoveInDate: e.target.value ? new Date(e.target.value) : undefined })}
          />

          <div className="space-y-2">
            <label htmlFor="smokingStatus" className="block text-sm font-medium text-neutral-700">
              Smoking Status
            </label>
            <select
              id="smokingStatus"
              value={profile.smokingStatus}
              onChange={(e) => onChange({ smokingStatus: e.target.value as RenterProfile['smokingStatus'] })}
              className="w-full px-4 py-3 bg-white border-2 border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-4 focus:border-primary-500 focus:ring-primary-100"
            >
              {SMOKING_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Pets Section */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <PawPrint size={18} className="text-primary-500" />
          <h4 className="font-medium text-neutral-900">Pets</h4>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.hasPets}
              onChange={(e) => onChange({ hasPets: e.target.checked })}
              className="w-5 h-5 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-sm text-neutral-700">I have pets</span>
          </label>

          {profile.hasPets && (
            <p className="text-sm text-neutral-500 bg-primary-50 p-3 rounded-lg">
              Under RRA 2025, landlords cannot unreasonably refuse pets. You can request to keep a pet at any time during your tenancy.
            </p>
          )}
        </div>
      </div>

      {/* Rental History Section */}
      <div className="bg-neutral-50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Home size={18} className="text-primary-500" />
          <h4 className="font-medium text-neutral-900">Rental History</h4>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.hasRentalHistory}
              onChange={(e) => onChange({ hasRentalHistory: e.target.checked })}
              className="w-5 h-5 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-sm text-neutral-700">I have previous rental history</span>
          </label>

          {profile.hasRentalHistory && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={profile.previousLandlordReference}
                onChange={(e) => onChange({ previousLandlordReference: e.target.checked })}
                className="w-5 h-5 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm text-neutral-700">I can provide a landlord reference</span>
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
