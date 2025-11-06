/**
 * Utility functions for formatting data for display
 * Updated for GetOn Rental Platform (RRA 2025 compliant)
 */

import type { FurnishingType } from '../types';
import { MAX_DEPOSIT_WEEKS } from './constants';

/**
 * Format monthly rent in GBP (per calendar month)
 * @param rentPcm - Monthly rent in pounds
 * @returns Formatted rent string (e.g., "£800 pcm")
 */
export const formatRent = (rentPcm: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rentPcm) + ' pcm';
};

/**
 * Format rent in compact form for mobile displays
 * @param rentPcm - Monthly rent in pounds
 * @returns Compact rent string (e.g., "£1.2K pcm")
 */
export const formatRentCompact = (rentPcm: number): string => {
  if (rentPcm >= 1000) {
    return `£${(rentPcm / 1000).toFixed(1)}K pcm`;
  }
  return `£${rentPcm} pcm`;
};

/**
 * Format deposit amount
 * @param deposit - Deposit in pounds
 * @returns Formatted deposit string (e.g., "£1,000")
 */
export const formatDeposit = (deposit: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(deposit);
};

/**
 * Calculate standard deposit (5 weeks rent per RRA 2025)
 * @param rentPcm - Monthly rent in pounds
 * @returns Calculated deposit amount
 */
export const calculateDeposit = (rentPcm: number): number => {
  const weeklyRent = (rentPcm * 12) / 52;
  return Math.round(weeklyRent * MAX_DEPOSIT_WEEKS);
};

/**
 * Format deposit with weeks calculation
 * @param deposit - Deposit in pounds
 * @param rentPcm - Monthly rent in pounds
 * @returns Formatted string (e.g., "£1,000 (5 weeks rent)")
 */
export const formatDepositWithWeeks = (deposit: number, rentPcm: number): string => {
  const weeklyRent = (rentPcm * 12) / 52;
  const weeks = Math.round(deposit / weeklyRent);
  return `${formatDeposit(deposit)} (${weeks} weeks rent)`;
};

/**
 * Legacy aliases for backward compatibility (DEPRECATED)
 */
export const formatPrice = formatRent;
export const formatPriceCompact = formatRentCompact;

/**
 * Format date to relative time (e.g., "2 days ago", "Just now")
 * @param dateString - ISO date string
 * @returns Relative time string
 */
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 60) {
    return 'Just now';
  }
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  if (diffInDays === 1) {
    return 'Yesterday';
  }
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks}w ago`;
  }
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

/**
 * Format full date in UK format
 * @param dateString - ISO date string
 * @returns Formatted date (e.g., "15 Oct 2025")
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

/**
 * Format time for messages
 * @param dateString - ISO date string
 * @returns Formatted time (e.g., "14:30")
 */
export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Format square footage with proper formatting
 * @param sqft - Square footage number
 * @returns Formatted string (e.g., "1,450 sq ft")
 */
export const formatSquareFootage = (sqft: number): string => {
  return `${sqft.toLocaleString('en-GB')} sq ft`;
};

/**
 * Format postcode for display (ensure proper spacing)
 * @param postcode - UK postcode
 * @returns Formatted postcode
 */
export const formatPostcode = (postcode: string): string => {
  // Remove all spaces
  const cleaned = postcode.replace(/\s+/g, '');
  // Add space before last 3 characters
  if (cleaned.length > 3) {
    return `${cleaned.slice(0, -3)} ${cleaned.slice(-3)}`;
  }
  return cleaned;
};

/**
 * Pluralize word based on count
 * @param count - Number to check
 * @param singular - Singular form
 * @param plural - Plural form (optional, defaults to singular + 's')
 * @returns Pluralized word
 */
export const pluralize = (count: number, singular: string, plural?: string): string => {
  return count === 1 ? singular : plural || `${singular}s`;
};

/**
 * Format bedroom count for display
 * @param bedrooms - Number of bedrooms
 * @returns Formatted string (e.g., "3 beds")
 */
export const formatBedrooms = (bedrooms: number): string => {
  return `${bedrooms} ${pluralize(bedrooms, 'bed')}`;
};

/**
 * Format bathroom count for display
 * @param bathrooms - Number of bathrooms
 * @returns Formatted string (e.g., "2 baths")
 */
export const formatBathrooms = (bathrooms: number): string => {
  return `${bathrooms} ${pluralize(bathrooms, 'bath')}`;
};

/**
 * Truncate text to specified length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength).trim()}...`;
};

/**
 * Get initials from name
 * @param name - Full name
 * @returns Initials (e.g., "John Doe" -> "JD")
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

/**
 * Format furnishing type for display
 * @param furnishing - Furnishing type
 * @returns Formatted string
 */
export const formatFurnishing = (furnishing: FurnishingType): string => {
  return furnishing;
};

/**
 * Format availability date for display
 * @param dateString - ISO date string
 * @returns Formatted availability (e.g., "Available Now", "Available 15 Oct 2025")
 */
export const formatAvailability = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = date.getTime() - now.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays <= 0) {
    return 'Available Now';
  }
  if (diffInDays <= 7) {
    return `Available in ${diffInDays} ${pluralize(diffInDays, 'day')}`;
  }
  if (diffInDays <= 30) {
    const weeks = Math.ceil(diffInDays / 7);
    return `Available in ${weeks} ${pluralize(weeks, 'week')}`;
  }
  return `Available ${formatDate(dateString)}`;
};

/**
 * Format rating score for display
 * @param score - Rating score (1-5)
 * @returns Formatted rating (e.g., "4.5")
 */
export const formatRating = (score: number): string => {
  return score.toFixed(1);
};

/**
 * Format rating count for display
 * @param count - Number of ratings
 * @returns Formatted count (e.g., "(12 reviews)")
 */
export const formatRatingCount = (count: number): string => {
  return `(${count} ${pluralize(count, 'review')})`;
};

/**
 * Format percentage for display
 * @param percentage - Percentage value (0-100)
 * @returns Formatted percentage (e.g., "92%")
 */
export const formatPercentage = (percentage: number): string => {
  return `${Math.round(percentage)}%`;
};

/**
 * Format tenancy duration in days to readable format
 * @param days - Number of days
 * @returns Formatted duration (e.g., "6 months", "2 years")
 */
export const formatTenancyDuration = (days: number): string => {
  if (days < 30) {
    return `${days} ${pluralize(days, 'day')}`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `${months} ${pluralize(months, 'month')}`;
  }
  const years = Math.floor(days / 365);
  const remainingMonths = Math.floor((days % 365) / 30);
  if (remainingMonths === 0) {
    return `${years} ${pluralize(years, 'year')}`;
  }
  return `${years} ${pluralize(years, 'year')}, ${remainingMonths} ${pluralize(remainingMonths, 'month')}`;
};

/**
 * Format monthly income for display
 * @param income - Monthly income in pounds
 * @returns Formatted income (e.g., "£2,500")
 */
export const formatIncome = (income: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(income);
};

/**
 * Calculate and format affordability percentage
 * @param rentPcm - Monthly rent in pounds
 * @param monthlyIncome - Monthly income in pounds
 * @returns Formatted affordability (e.g., "32% of income")
 */
export const formatAffordability = (rentPcm: number, monthlyIncome: number): string => {
  const percentage = (rentPcm / monthlyIncome) * 100;
  return `${Math.round(percentage)}% of income`;
};

/**
 * Format pets policy for display
 * @param willConsiderPets - Whether pets are considered
 * @param preferredPetTypes - Array of preferred pet types
 * @returns Formatted pets policy (e.g., "Pets Considered (Cat, Dog)")
 */
export const formatPetsPolicy = (
  willConsiderPets: boolean,
  preferredPetTypes?: ('cat' | 'dog' | 'small_caged' | 'fish')[]
): string => {
  if (!willConsiderPets) {
    return 'Pets Considered'; // RRA 2025: cannot say "No Pets"
  }
  if (!preferredPetTypes || preferredPetTypes.length === 0) {
    return 'All Pets Considered';
  }
  const formattedTypes = preferredPetTypes.map(type => {
    const typeMap: Record<string, string> = {
      cat: 'Cat',
      dog: 'Dog',
      small_caged: 'Small Caged Pets',
      fish: 'Fish',
    };
    return typeMap[type] || type;
  });
  return `Pets Considered (${formattedTypes.join(', ')})`;
};

/**
 * Format hazard deadline status
 * @param deadline - Deadline date string
 * @returns Status string (e.g., "Due in 3 days", "Overdue by 2 days")
 */
export const formatHazardDeadline = (deadline: string): string => {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffInMs = deadlineDate.getTime() - now.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays > 0) {
    return `Due in ${diffInDays} ${pluralize(diffInDays, 'day')}`;
  }
  if (diffInDays === 0) {
    return 'Due Today';
  }
  return `Overdue by ${Math.abs(diffInDays)} ${pluralize(Math.abs(diffInDays), 'day')}`;
};

/**
 * Format eviction notice period
 * @param noticeDays - Number of days notice
 * @returns Formatted notice period (e.g., "8 weeks notice")
 */
export const formatEvictionNotice = (noticeDays: number): string => {
  if (noticeDays < 14) {
    return `${noticeDays} ${pluralize(noticeDays, 'day')} notice`;
  }
  const weeks = Math.floor(noticeDays / 7);
  return `${weeks} ${pluralize(weeks, 'week')} notice`;
};
