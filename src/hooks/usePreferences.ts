import { useAppStore } from './useAppStore';
import type { PropertyType } from '../types';

/**
 * Custom hook for managing user preferences
 * Provides convenient methods for updating filters
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

  // Update price range
  const updatePriceRange = (min: number, max: number) => {
    updatePreferences({
      priceRange: { min, max },
    });
  };

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

  // Update new build requirement
  const setNewBuildOnly = (value: boolean) => {
    updatePreferences({ newBuildOnly: value });
  };

  // Update max age
  const setMaxAge = (years: number | undefined) => {
    updatePreferences({ maxAge: years });
  };

  // Reset to defaults
  const resetToDefaults = () => {
    updatePreferences({
      locations: [],
      priceRange: { min: 100000, max: 500000 },
      bedrooms: { min: 1, max: 5 },
      propertyTypes: [],
      mustHaveGarden: false,
      mustHaveParking: false,
      newBuildOnly: false,
      maxAge: undefined,
    });
  };

  return {
    preferences,
    updateLocations,
    addLocation,
    removeLocation,
    updatePriceRange,
    updateBedroomRange,
    updatePropertyTypes,
    togglePropertyType,
    setMustHaveGarden,
    setMustHaveParking,
    setNewBuildOnly,
    setMaxAge,
    resetToDefaults,
  };
};
