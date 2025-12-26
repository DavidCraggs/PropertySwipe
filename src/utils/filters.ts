import type { Property, UserPreferences } from '../types';
import { AFFORDABILITY_PERCENTAGE } from './constants';

/**
 * Utility functions for filtering rental properties based on renter preferences
 * Updated for GetOn Rental Platform (RRA 2025 compliant)
 */

/**
 * Filter rental properties based on renter preferences
 * @param properties - Array of rental properties to filter
 * @param preferences - Renter preferences
 * @returns Filtered properties
 */
export const filterProperties = (
  properties: Property[],
  preferences: UserPreferences
): Property[] => {
  return properties.filter((property) => {
    // RRA 2025: Only show properties that can be legally marketed
    if (!property.canBeMarketed) {
      return false;
    }

    // Filter by location
    if (
      preferences.locations.length > 0 &&
      !preferences.locations.includes(property.address.city)
    ) {
      return false;
    }

    // Filter by rent range
    if (property.rentPcm < preferences.rentRange.min || property.rentPcm > preferences.rentRange.max) {
      return false;
    }

    // Filter by bedrooms
    if (
      property.bedrooms < preferences.bedrooms.min ||
      property.bedrooms > preferences.bedrooms.max
    ) {
      return false;
    }

    // Filter by property type
    if (
      preferences.propertyTypes.length > 0 &&
      !preferences.propertyTypes.includes(property.propertyType)
    ) {
      return false;
    }

    // Filter by furnishing type
    if (
      preferences.furnishing &&
      preferences.furnishing.length > 0 &&
      !preferences.furnishing.includes(property.furnishing)
    ) {
      return false;
    }

    // Filter by garden requirement
    if (
      preferences.mustHaveGarden &&
      !property.features.some((f) => f.toLowerCase().includes('garden'))
    ) {
      return false;
    }

    // Filter by parking requirement
    if (
      preferences.mustHaveParking &&
      !property.features.some((f) => f.toLowerCase().includes('parking'))
    ) {
      return false;
    }

    // Filter by pets requirement
    // RRA 2025: All properties must consider pets
    // Just check if property will consider pets if renter requires them
    if (preferences.petsRequired && !property.petsPolicy?.willConsiderPets) {
      return false;
    }

    // Filter by availability date
    if (preferences.minMoveInDate) {
      const availableDate = new Date(property.availableFrom);
      const preferredDate = new Date(preferences.minMoveInDate);
      if (availableDate > preferredDate) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Filter properties by affordability (30% rule)
 * @param properties - Array of properties
 * @param monthlyIncome - Renter's monthly income
 * @returns Properties that are affordable
 */
export const filterByAffordability = (
  properties: Property[],
  monthlyIncome: number
): Property[] => {
  const maxAffordableRent = monthlyIncome * AFFORDABILITY_PERCENTAGE;
  return properties.filter((property) => property.rentPcm <= maxAffordableRent);
};

/**
 * Sort rental properties by specified criteria
 * @param properties - Array of properties to sort
 * @param sortBy - Sort criteria
 * @returns Sorted properties
 */
export const sortProperties = (
  properties: Property[],
  sortBy: 'rent-asc' | 'rent-desc' | 'newest' | 'bedrooms' | 'available-soonest' | 'price-asc' | 'price-desc'
): Property[] => {
  const sorted = [...properties];

  switch (sortBy) {
    case 'rent-asc':
    case 'price-asc': // Backward compatibility
      return sorted.sort((a, b) => a.rentPcm - b.rentPcm);

    case 'rent-desc':
    case 'price-desc': // Backward compatibility
      return sorted.sort((a, b) => b.rentPcm - a.rentPcm);

    case 'newest':
      return sorted.sort(
        (a, b) => new Date(b.listingDate).getTime() - new Date(a.listingDate).getTime()
      );

    case 'bedrooms':
      return sorted.sort((a, b) => b.bedrooms - a.bedrooms);

    case 'available-soonest':
      return sorted.sort(
        (a, b) => new Date(a.availableFrom).getTime() - new Date(b.availableFrom).getTime()
      );

    default:
      return sorted;
  }
};

/**
 * Calculate match score between property and renter preferences
 * Higher score means better match
 * @param property - Property to score
 * @param preferences - Renter preferences
 * @returns Match score (0-100)
 */
export const calculateMatchScore = (
  property: Property,
  preferences: UserPreferences
): number => {
  let score = 0;
  const weights = {
    location: 25,
    rent: 20,
    bedrooms: 20,
    propertyType: 10,
    furnishing: 10,
    features: 10,
    availability: 5,
  };

  // Location match
  if (preferences.locations.includes(property.address.city)) {
    score += weights.location;
  }

  // Rent match (closer to middle of range is better)
  const rentRangeSpan = preferences.rentRange.max - preferences.rentRange.min;
  const rentMid = preferences.rentRange.min + rentRangeSpan / 2;
  const rentDiff = Math.abs(property.rentPcm - rentMid);
  const rentScore = Math.max(0, 1 - rentDiff / rentRangeSpan);
  score += rentScore * weights.rent;

  // Bedrooms match
  if (
    property.bedrooms >= preferences.bedrooms.min &&
    property.bedrooms <= preferences.bedrooms.max
  ) {
    score += weights.bedrooms;
  }

  // Property type match
  if (preferences.propertyTypes.includes(property.propertyType)) {
    score += weights.propertyType;
  }

  // Furnishing match
  if (preferences.furnishing && preferences.furnishing.includes(property.furnishing)) {
    score += weights.furnishing;
  } else if (!preferences.furnishing || preferences.furnishing.length === 0) {
    score += weights.furnishing; // No preference, give full score
  }

  // Features match
  let featureMatches = 0;
  let requiredFeatures = 0;

  if (preferences.mustHaveGarden) {
    requiredFeatures++;
    if (property.features.some((f) => f.toLowerCase().includes('garden'))) {
      featureMatches++;
    }
  }

  if (preferences.mustHaveParking) {
    requiredFeatures++;
    if (property.features.some((f) => f.toLowerCase().includes('parking'))) {
      featureMatches++;
    }
  }

  if (preferences.petsRequired) {
    requiredFeatures++;
    if (property.petsPolicy?.willConsiderPets) {
      featureMatches++;
    }
  }

  if (requiredFeatures > 0) {
    score += (featureMatches / requiredFeatures) * weights.features;
  } else {
    score += weights.features; // No required features, give full score
  }

  // Availability match (available sooner is better)
  if (preferences.minMoveInDate) {
    const availableDate = new Date(property.availableFrom);
    const preferredDate = new Date(preferences.minMoveInDate);
    if (availableDate <= preferredDate) {
      score += weights.availability;
    }
  } else {
    score += weights.availability; // No preference, give full score
  }

  return Math.round(score);
};

/**
 * Get rental properties sorted by best match
 * @param properties - Array of properties
 * @param preferences - Renter preferences
 * @returns Properties sorted by match score
 */
export const sortByBestMatch = (
  properties: Property[],
  preferences: UserPreferences
): Property[] => {
  return [...properties].sort((a, b) => {
    const scoreA = calculateMatchScore(a, preferences);
    const scoreB = calculateMatchScore(b, preferences);
    return scoreB - scoreA;
  });
};

/**
 * Search properties by text query
 * Searches in address, description, and features
 * @param properties - Array of properties
 * @param query - Search query
 * @returns Matching properties
 */
export const searchProperties = (properties: Property[], query: string): Property[] => {
  if (!query.trim()) return properties;

  const searchTerms = query.toLowerCase().split(' ');

  return properties.filter((property) => {
    const searchableText = [
      property.address.street,
      property.address.city,
      property.address.postcode,
      property.address.council,
      property.description,
      property.propertyType,
      ...property.features,
    ]
      .join(' ')
      .toLowerCase();

    return searchTerms.every((term) => searchableText.includes(term));
  });
};

/**
 * Get unique cities from properties
 * @param properties - Array of properties
 * @returns Array of unique cities
 */
export const getUniqueCities = (properties: Property[]): string[] => {
  const cities = properties.map((p) => p.address.city);
  return Array.from(new Set(cities)).sort();
};

/**
 * Get rent range statistics from properties
 * @param properties - Array of properties
 * @returns Min and max monthly rent
 */
export const getRentRange = (properties: Property[]): { min: number; max: number } => {
  if (properties.length === 0) return { min: 0, max: 0 };

  const rents = properties.map((p) => p.rentPcm);
  return {
    min: Math.min(...rents),
    max: Math.max(...rents),
  };
};

/**
 * Legacy alias for backward compatibility (DEPRECATED)
 */
export const getPriceRange = getRentRange;

/**
 * Check if property meets RRA 2025 compliance requirements
 * @param property - Property to check
 * @returns true if property is compliant and can be marketed
 */
export const isPropertyCompliant = (property: Property): boolean => {
  return (
    property.prsPropertyRegistrationStatus === 'active' &&
    property.meetsDecentHomesStandard === true &&
    property.awaabsLawCompliant === true
  );
};

/**
 * Filter properties by landlord rating
 * @param properties - Array of properties
 * @returns Properties from landlords with acceptable rating
 */
export const filterByLandlordRating = (
  properties: Property[]
): Property[] => {
  return properties.filter(() => {
    // In real implementation, would join with landlord_profiles table
    // For now, assumes property has landlord rating attached
    return true; // Placeholder for actual landlord rating check
  });
};

/**
 * Get unique furnishing types from properties
 * @param properties - Array of properties
 * @returns Array of unique furnishing types
 */
export const getUniqueFurnishingTypes = (properties: Property[]): string[] => {
  const types = properties.map((p) => p.furnishing);
  return Array.from(new Set(types)).sort();
};
