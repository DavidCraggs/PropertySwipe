import type { Property, UserPreferences } from '../types';

/**
 * Utility functions for filtering properties based on user preferences
 */

/**
 * Filter properties based on user preferences
 * @param properties - Array of properties to filter
 * @param preferences - User preferences
 * @returns Filtered properties
 */
export const filterProperties = (
  properties: Property[],
  preferences: UserPreferences
): Property[] => {
  return properties.filter((property) => {
    // Filter by location
    if (
      preferences.locations.length > 0 &&
      !preferences.locations.includes(property.address.city)
    ) {
      return false;
    }

    // Filter by price range
    if (property.price < preferences.priceRange.min || property.price > preferences.priceRange.max) {
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

    // Filter by new build requirement
    if (preferences.newBuildOnly) {
      const currentYear = new Date().getFullYear();
      const age = currentYear - property.yearBuilt;
      if (age > 5) {
        // Consider "new build" as less than 5 years old
        return false;
      }
    }

    // Filter by property age if maxAge is specified
    if (preferences.maxAge !== undefined) {
      const currentYear = new Date().getFullYear();
      const age = currentYear - property.yearBuilt;
      if (age > preferences.maxAge) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Sort properties by specified criteria
 * @param properties - Array of properties to sort
 * @param sortBy - Sort criteria
 * @returns Sorted properties
 */
export const sortProperties = (
  properties: Property[],
  sortBy: 'price-asc' | 'price-desc' | 'newest' | 'bedrooms'
): Property[] => {
  const sorted = [...properties];

  switch (sortBy) {
    case 'price-asc':
      return sorted.sort((a, b) => a.price - b.price);

    case 'price-desc':
      return sorted.sort((a, b) => b.price - a.price);

    case 'newest':
      return sorted.sort(
        (a, b) => new Date(b.listingDate).getTime() - new Date(a.listingDate).getTime()
      );

    case 'bedrooms':
      return sorted.sort((a, b) => b.bedrooms - a.bedrooms);

    default:
      return sorted;
  }
};

/**
 * Calculate match score between property and user preferences
 * Higher score means better match
 * @param property - Property to score
 * @param preferences - User preferences
 * @returns Match score (0-100)
 */
export const calculateMatchScore = (
  property: Property,
  preferences: UserPreferences
): number => {
  let score = 0;
  const weights = {
    location: 30,
    price: 25,
    bedrooms: 20,
    propertyType: 15,
    features: 10,
  };

  // Location match
  if (preferences.locations.includes(property.address.city)) {
    score += weights.location;
  }

  // Price match (closer to middle of range is better)
  const priceRange = preferences.priceRange.max - preferences.priceRange.min;
  const priceMid = preferences.priceRange.min + priceRange / 2;
  const priceDiff = Math.abs(property.price - priceMid);
  const priceScore = Math.max(0, 1 - priceDiff / priceRange);
  score += priceScore * weights.price;

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

  if (requiredFeatures > 0) {
    score += (featureMatches / requiredFeatures) * weights.features;
  } else {
    score += weights.features; // No required features, give full score
  }

  return Math.round(score);
};

/**
 * Get properties sorted by best match
 * @param properties - Array of properties
 * @param preferences - User preferences
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
 * Get price range statistics from properties
 * @param properties - Array of properties
 * @returns Min and max prices
 */
export const getPriceRange = (properties: Property[]): { min: number; max: number } => {
  if (properties.length === 0) return { min: 0, max: 0 };

  const prices = properties.map((p) => p.price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
};
