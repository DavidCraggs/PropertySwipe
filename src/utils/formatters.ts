/**
 * Utility functions for formatting data for display
 */

/**
 * Format price in GBP with proper thousands separators
 * @param price - Price in pounds
 * @returns Formatted price string (e.g., "£1,250,000")
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

/**
 * Format price in compact form for mobile displays
 * @param price - Price in pounds
 * @returns Compact price string (e.g., "£1.25M")
 */
export const formatPriceCompact = (price: number): string => {
  if (price >= 1000000) {
    return `£${(price / 1000000).toFixed(2)}M`;
  }
  if (price >= 1000) {
    return `£${(price / 1000).toFixed(0)}K`;
  }
  return `£${price}`;
};

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
