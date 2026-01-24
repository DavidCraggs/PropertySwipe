/**
 * SelectPropertiesStep - Choose properties to include in the management contract
 */

import { useState, useEffect } from 'react';
import { Home, Check, MapPin, Bed, Bath, AlertCircle } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import type { Property } from '../../../../types';

interface SelectPropertiesStepProps {
  landlordId: string;
  selectedPropertyIds: string[];
  onSelect: (propertyIds: string[]) => void;
}

export function SelectPropertiesStep({
  landlordId,
  selectedPropertyIds,
  onSelect,
}: SelectPropertiesStepProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProperties();
  }, [landlordId]);

  async function loadProperties() {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('properties')
        .select('*')
        .eq('landlord_id', landlordId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setProperties(data || []);
    } catch (err) {
      console.error('Failed to load properties:', err);
      setError('Failed to load your properties');
    } finally {
      setLoading(false);
    }
  }

  function toggleProperty(propertyId: string) {
    const newSelection = selectedPropertyIds.includes(propertyId)
      ? selectedPropertyIds.filter(id => id !== propertyId)
      : [...selectedPropertyIds, propertyId];
    onSelect(newSelection);
  }

  function selectAll() {
    onSelect(properties.map(p => p.id));
  }

  function clearSelection() {
    onSelect([]);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Home className="mx-auto h-12 w-12 text-primary-500 mb-4" />
        <h2 className="text-xl font-bold text-neutral-900">Select Properties</h2>
        <p className="mt-2 text-neutral-600">
          Choose which properties to include in this management contract
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-danger-50 text-danger-700 rounded-lg">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Selection controls */}
      {properties.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-600">
            {selectedPropertyIds.length} of {properties.length} selected
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Select All
            </button>
            <span className="text-neutral-300">|</span>
            <button
              type="button"
              onClick={clearSelection}
              className="text-sm text-neutral-500 hover:text-neutral-700"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Property list */}
      {properties.length === 0 ? (
        <div className="text-center py-8">
          <Home className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
          <p className="text-neutral-600">You don't have any properties yet.</p>
          <p className="text-sm text-neutral-500 mt-1">
            Add properties to your portfolio to create management contracts.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {properties.map(property => (
            <PropertyCard
              key={property.id}
              property={property}
              isSelected={selectedPropertyIds.includes(property.id)}
              onToggle={() => toggleProperty(property.id)}
            />
          ))}
        </div>
      )}

      {/* Selection summary */}
      {selectedPropertyIds.length > 0 && (
        <div className="bg-primary-50 rounded-xl p-4">
          <h4 className="font-medium text-primary-900 mb-2">
            Selected Properties Summary
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedPropertyIds.map(id => {
              const property = properties.find(p => p.id === id);
              if (!property) return null;
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-lg text-sm text-neutral-700 border border-primary-200"
                >
                  <MapPin className="h-3 w-3 text-primary-500" />
                  {property.address.street}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface PropertyCardProps {
  property: Property;
  isSelected: boolean;
  onToggle: () => void;
}

function PropertyCard({ property, isSelected, onToggle }: PropertyCardProps) {
  const address = property.address;

  return (
    <button
      onClick={onToggle}
      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
        isSelected
          ? 'border-primary-500 bg-primary-50'
          : 'border-neutral-200 bg-white hover:border-primary-300'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Property image or placeholder */}
        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-100">
          {property.images?.[0] ? (
            <img
              src={property.images[0]}
              alt={address.street}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Home className="h-8 w-8 text-neutral-300" />
            </div>
          )}
        </div>

        {/* Property details */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-neutral-900 truncate">
            {address.street}
          </h4>
          <p className="text-sm text-neutral-600">
            {address.city}, {address.postcode}
          </p>
          <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500">
            <span className="flex items-center gap-1">
              <Bed className="h-4 w-4" />
              {property.bedrooms} bed
            </span>
            <span className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              {property.bathrooms} bath
            </span>
            <span className="font-medium text-primary-600">
              £{property.rentPcm?.toLocaleString()}/mo
            </span>
          </div>
          {!property.isAvailable && (
            <span className="inline-block mt-2 text-xs bg-warning-100 text-warning-700 px-2 py-0.5 rounded-full">
              Currently Occupied
            </span>
          )}
        </div>

        {/* Selection indicator */}
        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
          isSelected ? 'bg-primary-500' : 'bg-neutral-200'
        }`}>
          {isSelected && <Check className="h-4 w-4 text-white" />}
        </div>
      </div>
    </button>
  );
}
