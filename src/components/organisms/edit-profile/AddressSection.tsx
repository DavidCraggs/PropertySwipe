/**
 * AddressSection - Reusable address form section
 */

import { MapPin } from 'lucide-react';
import { FormField } from '../../molecules/FormField';
import type { Address } from '../../../types';

interface AddressSectionProps {
  title: string;
  address: Partial<Address>;
  onChange: (address: Partial<Address>) => void;
  errors?: Partial<Record<keyof Address, string>>;
  required?: boolean;
}

const UK_COUNTIES = [
  'Bedfordshire', 'Berkshire', 'Bristol', 'Buckinghamshire', 'Cambridgeshire',
  'Cheshire', 'City of London', 'Cornwall', 'County Durham', 'Cumbria',
  'Derbyshire', 'Devon', 'Dorset', 'East Riding of Yorkshire', 'East Sussex',
  'Essex', 'Gloucestershire', 'Greater London', 'Greater Manchester',
  'Hampshire', 'Herefordshire', 'Hertfordshire', 'Isle of Wight', 'Kent',
  'Lancashire', 'Leicestershire', 'Lincolnshire', 'Merseyside', 'Norfolk',
  'North Yorkshire', 'Northamptonshire', 'Northumberland', 'Nottinghamshire',
  'Oxfordshire', 'Rutland', 'Shropshire', 'Somerset', 'South Yorkshire',
  'Staffordshire', 'Suffolk', 'Surrey', 'Tyne and Wear', 'Warwickshire',
  'West Midlands', 'West Sussex', 'West Yorkshire', 'Wiltshire', 'Worcestershire'
];

/**
 * Validates UK postcode format
 */
export const isValidUKPostcode = (postcode: string): boolean => {
  const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;
  return postcodeRegex.test(postcode.trim());
};

export function AddressSection({
  title,
  address,
  onChange,
  errors = {},
  required = false
}: AddressSectionProps) {
  const handleChange = (field: keyof Address, value: string) => {
    onChange({ ...address, [field]: value });
  };

  return (
    <div className="bg-neutral-50 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <MapPin size={18} className="text-primary-500" />
        <h4 className="font-medium text-neutral-900">{title}</h4>
        {required && <span className="text-danger-500 text-sm">*</span>}
      </div>

      <div className="space-y-4">
        <FormField
          id="address-line1"
          label="Address Line 1"
          value={address.line1 || ''}
          onChange={(e) => handleChange('line1', e.target.value)}
          placeholder="123 Main Street"
          isRequired={required}
          error={errors.line1}
        />

        <FormField
          id="address-line2"
          label="Address Line 2"
          value={address.line2 || ''}
          onChange={(e) => handleChange('line2', e.target.value)}
          placeholder="Flat 2, Building Name (optional)"
          helperText="Optional"
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            id="address-city"
            label="City"
            value={address.city || ''}
            onChange={(e) => handleChange('city', e.target.value)}
            placeholder="London"
            isRequired={required}
            error={errors.city}
          />

          <div className="space-y-2">
            <label htmlFor="address-county" className="block text-sm font-medium text-neutral-700">
              County
            </label>
            <select
              id="address-county"
              value={address.county || ''}
              onChange={(e) => handleChange('county', e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-4 focus:border-primary-500 focus:ring-primary-100"
            >
              <option value="">Select county (optional)</option>
              {UK_COUNTIES.map((county) => (
                <option key={county} value={county}>
                  {county}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            id="address-postcode"
            label="Postcode"
            value={address.postcode || ''}
            onChange={(e) => handleChange('postcode', e.target.value.toUpperCase())}
            placeholder="SW1A 1AA"
            isRequired={required}
            error={errors.postcode}
            helperText="UK postcode format"
          />

          <div className="space-y-2">
            <label htmlFor="address-country" className="block text-sm font-medium text-neutral-700">
              Country
            </label>
            <select
              id="address-country"
              value={address.country || 'United Kingdom'}
              onChange={(e) => handleChange('country', e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-4 focus:border-primary-500 focus:ring-primary-100"
            >
              <option value="United Kingdom">United Kingdom</option>
              <option value="England">England</option>
              <option value="Scotland">Scotland</option>
              <option value="Wales">Wales</option>
              <option value="Northern Ireland">Northern Ireland</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
