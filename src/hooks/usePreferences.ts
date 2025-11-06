import { useAppStore } from './useAppStore';
import type { PropertyType, FurnishingType } from '../types';
import { DEFAULT_RENTAL_PREFERENCES } from '../utils/constants';

/**
 * Custom hook for managing renter preferences
 * Provides convenient methods for updating rental filters
 * Updated for rental platform (RRA 2025 compliant)
 */
export const usePreferences = () => {
  const { user, updatePreferences } = useAppStore();

  const preferences = user?.preferences || null;

  // Update location preferences
  const updateLocations = (locations: string[]) => {
    updatePreferences({ locations });
  };

  // Add location
  const addLocation = (location: string) => {
    if (!preferences) return;
    const newLocations = [...preferences.locations, location];
    updatePreferences({ locations: newLocations });
  };

  // Remove location
  const removeLocation = (location: string) => {
    if (!preferences) return;
    const newLocations = preferences.locations.filter((l) => l !== location);
    updatePreferences({ locations: newLocations });
  };

  // Update rent range (monthly rent, not purchase price)
  const updateRentRange = (min: number, max: number) => {
    updatePreferences({
      rentRange: { min, max },
    });
  };

  // Legacy alias for backward compatibility
  const updatePriceRange = updateRentRange;

  // Update bedroom range
  const updateBedroomRange = (min: number, max: number) => {
    updatePreferences({
      bedrooms: { min, max },
    });
  };

  // Update property types
  const updatePropertyTypes = (types: PropertyType[]) => {
    updatePreferences({ propertyTypes: types });
  };

  // Toggle property type
  const togglePropertyType = (type: PropertyType) => {
    if (!preferences) return;
    const currentTypes = preferences.propertyTypes;
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type];
    updatePreferences({ propertyTypes: newTypes });
  };

  // Update garden requirement
  const setMustHaveGarden = (value: boolean) => {
    updatePreferences({ mustHaveGarden: value });
  };

  // Update parking requirement
  const setMustHaveParking = (value: boolean) => {
    updatePreferences({ mustHaveParking: value });
  };

  // Update furnishing preference (NEW for rental platform)
  const updateFurnishing = (furnishing: FurnishingType[]) => {
    updatePreferences({ furnishing });
  };

  // Toggle furnishing type
  const toggleFurnishing = (type: FurnishingType) => {
    if (!preferences) return;
    const current = preferences.furnishing || [];
    const newFurnishing = current.includes(type)
      ? current.filter((f) => f !== type)
      : [...current, type];
    updatePreferences({ furnishing: newFurnishing });
  };

  // Set pets required
  const setPetsRequired = (value: boolean) => {
    updatePreferences({ petsRequired: value });
  };

  // Set move-in date
  const setMoveInDate = (date: Date | undefined) => {
    updatePreferences({ minMoveInDate: date });
  };

  // Reset to rental defaults
  const resetToDefaults = () => {
    updatePreferences(DEFAULT_RENTAL_PREFERENCES);
  };

  return {
    preferences,
    updateLocations,
    addLocation,
    removeLocation,
    updateRentRange,
    updatePriceRange, // Legacy
    updateBedroomRange,
    updatePropertyTypes,
    togglePropertyType,
    setMustHaveGarden,
    setMustHaveParking,
    // NEW rental-specific
    updateFurnishing,
    toggleFurnishing,
    setPetsRequired,
    setMoveInDate,
    resetToDefaults,
  };
};
