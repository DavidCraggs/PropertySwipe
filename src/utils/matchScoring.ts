/**
 * Match Compatibility Scoring System
 * Phase 3: Two-Sided Matching from World-Class Implementation Plan
 *
 * Calculates compatibility scores between renters and properties/landlords
 * to help landlords make informed decisions when reviewing interested renters.
 *
 * Score Breakdown (100 points total):
 * - Affordability: 30 points (income vs rent ratio)
 * - Location: 20 points (area preference match)
 * - Timing: 15 points (move-in date alignment)
 * - Property Fit: 20 points (bedrooms, type, features)
 * - Tenant History: 15 points (previous ratings)
 */

import type {
  RenterProfile,
  Property,
  LandlordProfile,
  CompatibilityScore,
  CompatibilityBreakdown,
  CompatibilityFlag,
  UserRatingsSummary,
} from '../types';

// =====================================================
// SCORING CONSTANTS
// =====================================================

const WEIGHTS = {
  AFFORDABILITY: 30,
  LOCATION: 20,
  TIMING: 15,
  PROPERTY_FIT: 20,
  TENANT_HISTORY: 15,
} as const;

// Affordability thresholds
const INCOME_RATIO_IDEAL = 3.0; // 3x rent is ideal
const INCOME_RATIO_GOOD = 2.5; // 2.5x rent is acceptable
const INCOME_RATIO_MINIMUM = 2.0; // Below this is risky

// Timing thresholds (in days)
const TIMING_PERFECT_WINDOW = 7; // Within 7 days is perfect
const TIMING_GOOD_WINDOW = 30; // Within 30 days is good
const TIMING_ACCEPTABLE_WINDOW = 60; // Within 60 days is acceptable

// =====================================================
// MAIN SCORING FUNCTION
// =====================================================

/**
 * Calculate compatibility score between a renter and a property
 */
export function calculateCompatibility(
  renter: RenterProfile,
  property: Property,
  _landlord?: LandlordProfile
): CompatibilityScore {
  const breakdown: CompatibilityBreakdown = {
    affordability: calculateAffordabilityScore(renter.monthlyIncome, property.rentPcm),
    location: calculateLocationScore(renter.localArea, property.address.city),
    timing: calculateTimingScore(renter.preferredMoveInDate, property.availableFrom),
    propertyFit: calculatePropertyFitScore(renter, property),
    tenantHistory: calculateTenantHistoryScore(renter.ratingsSummary),
  };

  const overall = Object.values(breakdown).reduce((sum, score) => sum + score, 0);
  const flags = generateCompatibilityFlags(renter, property, breakdown);

  return {
    overall: Math.round(overall),
    breakdown,
    flags,
  };
}

// =====================================================
// INDIVIDUAL SCORING FUNCTIONS
// =====================================================

/**
 * Calculate affordability score (0-30 points)
 * Based on income to rent ratio
 */
function calculateAffordabilityScore(monthlyIncome: number, rentPcm: number): number {
  if (rentPcm <= 0) return WEIGHTS.AFFORDABILITY; // Free property = perfect score

  const ratio = monthlyIncome / rentPcm;

  if (ratio >= INCOME_RATIO_IDEAL) {
    // 3x or more = full points
    return WEIGHTS.AFFORDABILITY;
  } else if (ratio >= INCOME_RATIO_GOOD) {
    // 2.5x - 3x = 80-100% of points
    const proportion = (ratio - INCOME_RATIO_GOOD) / (INCOME_RATIO_IDEAL - INCOME_RATIO_GOOD);
    return Math.round(WEIGHTS.AFFORDABILITY * (0.8 + 0.2 * proportion));
  } else if (ratio >= INCOME_RATIO_MINIMUM) {
    // 2x - 2.5x = 50-80% of points
    const proportion = (ratio - INCOME_RATIO_MINIMUM) / (INCOME_RATIO_GOOD - INCOME_RATIO_MINIMUM);
    return Math.round(WEIGHTS.AFFORDABILITY * (0.5 + 0.3 * proportion));
  } else {
    // Below 2x = 0-50% of points
    const proportion = Math.max(0, ratio / INCOME_RATIO_MINIMUM);
    return Math.round(WEIGHTS.AFFORDABILITY * 0.5 * proportion);
  }
}

/**
 * Calculate location score (0-20 points)
 * Based on match between renter's preferred area and property location
 */
function calculateLocationScore(renterArea: string, propertyCity: string): number {
  // Exact match
  if (renterArea.toLowerCase() === propertyCity.toLowerCase()) {
    return WEIGHTS.LOCATION;
  }

  // Nearby areas (simplified regional groupings for UK North West)
  const regionGroups: Record<string, string[]> = {
    merseyside: ['liverpool', 'southport', 'formby', 'st helens'],
    manchester: ['manchester', 'warrington', 'wigan'],
    lancashire: ['preston', 'blackpool'],
    cheshire: ['chester', 'warrington'],
  };

  // Find if both are in same region
  const renterLower = renterArea.toLowerCase();
  const propertyLower = propertyCity.toLowerCase();

  for (const region of Object.values(regionGroups)) {
    if (region.includes(renterLower) && region.includes(propertyLower)) {
      // Same region = 80% of points
      return Math.round(WEIGHTS.LOCATION * 0.8);
    }
  }

  // Different region but within North West = 50% of points
  const allNorthWest = Object.values(regionGroups).flat();
  if (allNorthWest.includes(renterLower) && allNorthWest.includes(propertyLower)) {
    return Math.round(WEIGHTS.LOCATION * 0.5);
  }

  // No match = 25% of points (still might be interested)
  return Math.round(WEIGHTS.LOCATION * 0.25);
}

/**
 * Calculate timing score (0-15 points)
 * Based on alignment of move-in dates
 */
function calculateTimingScore(
  renterMoveDate: Date | undefined,
  propertyAvailableFrom: string | Date
): number {
  // No preference = full points (flexible)
  if (!renterMoveDate) {
    return WEIGHTS.TIMING;
  }

  const renterDate = new Date(renterMoveDate);
  const propertyDate = new Date(propertyAvailableFrom);
  const daysDifference = Math.abs(
    (renterDate.getTime() - propertyDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDifference <= TIMING_PERFECT_WINDOW) {
    return WEIGHTS.TIMING;
  } else if (daysDifference <= TIMING_GOOD_WINDOW) {
    // 7-30 days = 70-100%
    const proportion = (TIMING_GOOD_WINDOW - daysDifference) / (TIMING_GOOD_WINDOW - TIMING_PERFECT_WINDOW);
    return Math.round(WEIGHTS.TIMING * (0.7 + 0.3 * proportion));
  } else if (daysDifference <= TIMING_ACCEPTABLE_WINDOW) {
    // 30-60 days = 40-70%
    const proportion = (TIMING_ACCEPTABLE_WINDOW - daysDifference) / (TIMING_ACCEPTABLE_WINDOW - TIMING_GOOD_WINDOW);
    return Math.round(WEIGHTS.TIMING * (0.4 + 0.3 * proportion));
  } else {
    // Over 60 days = reduced score
    return Math.round(WEIGHTS.TIMING * 0.2);
  }
}

/**
 * Calculate property fit score (0-20 points)
 * Based on renter needs vs property features
 */
function calculatePropertyFitScore(renter: RenterProfile, property: Property): number {
  let score = 0;
  const maxScore = WEIGHTS.PROPERTY_FIT;

  // Situation match (7 points)
  const situationScore = calculateSituationScore(renter.situation, property);
  score += situationScore;

  // Pet compatibility (5 points)
  const petScore = calculatePetCompatibilityScore(renter, property);
  score += petScore;

  // Smoking compatibility (3 points)
  if (renter.smokingStatus === 'Non-Smoker') {
    score += 3; // Non-smokers are preferred by most landlords
  } else if (renter.smokingStatus === 'Vaper') {
    score += 2;
  } else {
    score += 1;
  }

  // Guarantor bonus (2 points)
  if (renter.hasGuarantor) {
    score += 2;
  }

  // Rental history bonus (3 points)
  if (renter.hasRentalHistory && renter.previousLandlordReference) {
    score += 3;
  } else if (renter.hasRentalHistory) {
    score += 1.5;
  }

  return Math.min(Math.round(score), maxScore);
}

/**
 * Calculate situation score based on property max occupants
 */
function calculateSituationScore(
  situation: RenterProfile['situation'],
  property: Property
): number {
  const situationOccupants: Record<string, number> = {
    Single: 1,
    Couple: 2,
    Family: 4, // Average family size
    'Professional Sharers': 3,
  };

  const expectedOccupants = situationOccupants[situation] || 2;
  const maxOccupants = property.maxOccupants || 4;

  if (expectedOccupants <= maxOccupants) {
    // Good fit
    const utilizationRatio = expectedOccupants / maxOccupants;
    if (utilizationRatio >= 0.5 && utilizationRatio <= 1) {
      return 7; // Optimal utilization
    } else if (utilizationRatio >= 0.25) {
      return 5; // Underutilized but acceptable
    } else {
      return 3; // Significantly underutilized
    }
  } else {
    // Over capacity - reduced score
    return 2;
  }
}

/**
 * Calculate pet compatibility score
 */
function calculatePetCompatibilityScore(renter: RenterProfile, property: Property): number {
  if (!renter.hasPets) {
    return 5; // No pets = no complications
  }

  // RRA 2025: Landlords must consider pets
  if (!property.petsPolicy?.willConsiderPets) {
    return 2; // Property must consider but hasn't configured policy
  }

  // Check if pet types match property preferences
  const renterPetTypes = renter.petDetails?.map((p) => p.type) || [];
  const preferredTypes = property.petsPolicy.preferredPetTypes || [];
  const unsuitable = property.petsPolicy.propertyUnsuitableFor || [];

  let petScore = 3; // Base score for having pets

  // Check pet type compatibility
  for (const petType of renterPetTypes) {
    if (preferredTypes.includes(petType as 'cat' | 'dog' | 'small_caged' | 'fish')) {
      petScore += 0.5;
    }
    if (petType === 'dog' && unsuitable.includes('large_dogs')) {
      petScore -= 1;
    }
  }

  // Pet insurance bonus
  const hasPetInsurance = renter.petDetails?.some((p) => p.hasInsurance);
  if (hasPetInsurance) {
    petScore += 1;
  }

  return Math.max(1, Math.min(5, Math.round(petScore)));
}

/**
 * Calculate tenant history score (0-15 points)
 * Based on previous ratings and rental history
 */
function calculateTenantHistoryScore(ratingsSummary?: UserRatingsSummary): number {
  if (!ratingsSummary || ratingsSummary.totalRatings === 0) {
    // First-time renter = neutral score
    return Math.round(WEIGHTS.TENANT_HISTORY * 0.5);
  }

  const { averageOverallScore, totalRatings, wouldRecommendPercentage } = ratingsSummary;

  // Base score from average rating (0-5 scale -> 0-10 points)
  const ratingScore = (averageOverallScore / 5) * 10;

  // Bonus for would-recommend percentage (0-3 points)
  const recommendScore = (wouldRecommendPercentage / 100) * 3;

  // Experience bonus (0-2 points)
  let experienceBonus = 0;
  if (totalRatings >= 5) {
    experienceBonus = 2;
  } else if (totalRatings >= 2) {
    experienceBonus = 1;
  }

  const total = ratingScore + recommendScore + experienceBonus;
  return Math.min(Math.round(total), WEIGHTS.TENANT_HISTORY);
}

// =====================================================
// FLAG GENERATION
// =====================================================

/**
 * Generate compatibility flags for edge cases
 */
function generateCompatibilityFlags(
  renter: RenterProfile,
  property: Property,
  breakdown: CompatibilityBreakdown
): CompatibilityFlag[] {
  const flags: CompatibilityFlag[] = [];

  // Affordability flags
  const incomeRatio = renter.monthlyIncome / property.rentPcm;
  if (incomeRatio >= INCOME_RATIO_IDEAL) {
    flags.push('income_strong');
  } else if (incomeRatio >= INCOME_RATIO_GOOD && incomeRatio < INCOME_RATIO_IDEAL) {
    flags.push('income_marginal');
  }

  // Timing flags
  if (!renter.preferredMoveInDate) {
    flags.push('move_date_flexible');
  } else if (breakdown.timing < WEIGHTS.TIMING * 0.5) {
    flags.push('move_date_mismatch');
  }

  // Pet flag
  if (renter.hasPets) {
    flags.push('pet_requires_approval');
  }

  // Rental history flags
  if (!renter.hasRentalHistory) {
    flags.push('first_time_renter');
  } else if (renter.ratingsSummary && renter.ratingsSummary.averageOverallScore >= 4.5) {
    flags.push('excellent_references');
  }

  // Guarantor flag
  if (renter.hasGuarantor) {
    flags.push('has_guarantor');
  }

  return flags;
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Get a human-readable description of a compatibility flag
 */
export function getFlagDescription(flag: CompatibilityFlag): string {
  const descriptions: Record<CompatibilityFlag, string> = {
    income_marginal: 'Income is 2.5-3x rent (acceptable)',
    income_strong: 'Income is 3x+ rent (excellent)',
    move_date_mismatch: 'Move-in dates may need alignment',
    move_date_flexible: 'Flexible on move-in date',
    pet_requires_approval: 'Has pets requiring approval',
    first_time_renter: 'First-time renter',
    excellent_references: 'Excellent previous ratings',
    has_guarantor: 'Has a guarantor',
    verified_income: 'Income verified',
    long_term_seeker: 'Looking for long-term tenancy',
  };

  return descriptions[flag] || flag;
}

/**
 * Get the color/type for a flag (positive, neutral, attention)
 */
export function getFlagType(flag: CompatibilityFlag): 'positive' | 'neutral' | 'attention' {
  const positiveFlags: CompatibilityFlag[] = [
    'income_strong',
    'excellent_references',
    'has_guarantor',
    'verified_income',
    'move_date_flexible',
    'long_term_seeker',
  ];

  const neutralFlags: CompatibilityFlag[] = ['first_time_renter', 'income_marginal'];

  if (positiveFlags.includes(flag)) return 'positive';
  if (neutralFlags.includes(flag)) return 'neutral';
  return 'attention';
}

/**
 * Get score rating tier
 */
export function getScoreTier(score: number): {
  tier: 'excellent' | 'good' | 'fair' | 'low';
  label: string;
  color: string;
} {
  if (score >= 80) {
    return { tier: 'excellent', label: 'Excellent Match', color: 'text-success-600' };
  } else if (score >= 60) {
    return { tier: 'good', label: 'Good Match', color: 'text-primary-600' };
  } else if (score >= 40) {
    return { tier: 'fair', label: 'Fair Match', color: 'text-warning-600' };
  } else {
    return { tier: 'low', label: 'Low Match', color: 'text-neutral-500' };
  }
}

/**
 * Format score for display
 */
export function formatScore(score: number): string {
  return `${score}%`;
}

/**
 * Get breakdown category label
 */
export function getBreakdownLabel(key: keyof CompatibilityBreakdown): string {
  const labels: Record<keyof CompatibilityBreakdown, string> = {
    affordability: 'Affordability',
    location: 'Location',
    timing: 'Move-in Timing',
    propertyFit: 'Property Fit',
    tenantHistory: 'Rental History',
  };

  return labels[key];
}

/**
 * Get breakdown max score for progress display
 */
export function getBreakdownMax(key: keyof CompatibilityBreakdown): number {
  const maxScores: Record<keyof CompatibilityBreakdown, number> = {
    affordability: WEIGHTS.AFFORDABILITY,
    location: WEIGHTS.LOCATION,
    timing: WEIGHTS.TIMING,
    propertyFit: WEIGHTS.PROPERTY_FIT,
    tenantHistory: WEIGHTS.TENANT_HISTORY,
  };

  return maxScores[key];
}
