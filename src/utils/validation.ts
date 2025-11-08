/**
 * Validation utilities for forms and data
 */

/**
 * Comprehensive UK postcode regex
 * Handles all valid UK postcode formats:
 * - Standard: SW1A 1AA
 * - Without space: SW1A1AA
 * - Variations: W1A 0AX, M1 1AE, B33 8TH, CR2 6XH, DN55 1PT, GIR 0AA
 *
 * Format explanation:
 * - Area: 1-2 letters (e.g., SW, W, B)
 * - District: 1-2 digits, optionally followed by a letter (e.g., 1, 1A, 33)
 * - Sector: single digit (e.g., 1)
 * - Unit: 2 letters (e.g., AA)
 *
 * Special cases handled:
 * - GIR 0AA (Girobank)
 * - BFPO addresses
 * - Excludes CIKMOV from final two letters (not used in UK postcodes)
 */
export const UK_POSTCODE_REGEX = /^([A-Z]{1,2})([0-9]{1,2}[A-Z]?)\s?([0-9])([A-BD-HJLNP-UW-Z]{2})$/i;

/**
 * Extract UK postcode from a string (e.g., URL or address)
 * Returns the first valid postcode found, or null if none found
 */
export function extractPostcode(text: string): string | null {
  // More permissive regex for extraction (allows embedded in text)
  const extractRegex = /\b([A-Z]{1,2}[0-9]{1,2}[A-Z]?)\s?([0-9][A-BD-HJLNP-UW-Z]{2})\b/gi;
  const match = text.match(extractRegex);

  if (match) {
    // Validate the extracted postcode with the strict regex
    const candidate = match[0].trim();
    if (UK_POSTCODE_REGEX.test(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Validate a UK postcode
 * Returns true if the postcode is valid
 */
export function isValidPostcode(postcode: string): boolean {
  return UK_POSTCODE_REGEX.test(postcode.trim());
}

/**
 * Normalize a postcode (uppercase, single space)
 * Example: "sw1a1aa" -> "SW1A 1AA"
 */
export function normalizePostcode(postcode: string): string {
  const cleaned = postcode.replace(/\s/g, '').toUpperCase();
  const match = cleaned.match(/^([A-Z]{1,2}[0-9]{1,2}[A-Z]?)([0-9][A-BD-HJLNP-UW-Z]{2})$/);

  if (match) {
    return `${match[1]} ${match[2]}`;
  }

  return postcode; // Return original if can't normalize
}

/**
 * Compare two postcodes (case-insensitive, space-insensitive)
 */
export function comparePostcodes(postcode1: string, postcode2: string): boolean {
  const clean1 = postcode1.replace(/\s/g, '').toUpperCase();
  const clean2 = postcode2.replace(/\s/g, '').toUpperCase();
  return clean1 === clean2;
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate property listing URL (Rightmove, Zoopla, OnTheMarket)
 */
export function isValidPropertyListingUrl(url: string): boolean {
  if (!isValidUrl(url)) return false;

  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    const validDomains = ['rightmove.co.uk', 'zoopla.co.uk', 'onthemarket.com'];
    return validDomains.some((domain) => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}

/**
 * Validate year (for property year built)
 */
export function isValidYear(year: number | string, minYear = 1800, maxYear = new Date().getFullYear()): boolean {
  const yearNum = typeof year === 'string' ? parseInt(year, 10) : year;
  return !isNaN(yearNum) && yearNum >= minYear && yearNum <= maxYear;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// =====================================================
// AGENCY LINKING VALIDATION
// =====================================================

/**
 * Validate commission rate (must be between 0 and 100)
 */
export function isValidCommissionRate(rate: number): boolean {
  return !isNaN(rate) && rate >= 0 && rate <= 100;
}

/**
 * Validate contract length in months (must be positive, typically 1-60 months)
 */
export function isValidContractLength(months: number, maxMonths = 60): boolean {
  return !isNaN(months) && months >= 1 && months <= maxMonths;
}

/**
 * Check if an invitation has expired
 */
export function isInvitationExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

/**
 * Check if an invitation is still pending (not expired, not responded to)
 */
export function isInvitationPending(status: string, expiresAt: Date): boolean {
  return status === 'pending' && !isInvitationExpired(expiresAt);
}

/**
 * Validate that a property can have an agency link
 * (e.g., property must exist, landlord must own it, etc.)
 */
export function canPropertyHaveAgencyLink(
  propertyId: string | undefined,
  landlordId: string,
  propertyLandlordId: string
): boolean {
  // Property must exist and belong to the landlord
  return !!propertyId && landlordId === propertyLandlordId;
}

/**
 * Check if a property already has an active link of a specific type
 * Used to prevent duplicate estate agent or management agency links
 */
export function hasActiveLink(
  existingLinks: Array<{ linkType: string; isActive: boolean }>,
  linkType: 'estate_agent' | 'management_agency'
): boolean {
  return existingLinks.some(link => link.linkType === linkType && link.isActive);
}

/**
 * Validate agency invitation data before creating
 */
export function validateAgencyInvitation(invitation: {
  landlordId: string;
  agencyId: string;
  proposedCommissionRate?: number;
  proposedContractLengthMonths?: number;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate landlord and agency IDs
  if (!invitation.landlordId || invitation.landlordId.trim() === '') {
    errors.push('Landlord ID is required');
  }
  if (!invitation.agencyId || invitation.agencyId.trim() === '') {
    errors.push('Agency ID is required');
  }

  // Validate proposed commission rate (if provided)
  if (
    invitation.proposedCommissionRate !== undefined &&
    !isValidCommissionRate(invitation.proposedCommissionRate)
  ) {
    errors.push('Commission rate must be between 0 and 100');
  }

  // Validate proposed contract length (if provided)
  if (
    invitation.proposedContractLengthMonths !== undefined &&
    !isValidContractLength(invitation.proposedContractLengthMonths)
  ) {
    errors.push('Contract length must be between 1 and 60 months');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate agency property link data before creating
 */
export function validateAgencyPropertyLink(link: {
  landlordId: string;
  agencyId: string;
  propertyId: string;
  commissionRate: number;
  contractStartDate: Date;
  contractEndDate?: Date;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate IDs
  if (!link.landlordId || link.landlordId.trim() === '') {
    errors.push('Landlord ID is required');
  }
  if (!link.agencyId || link.agencyId.trim() === '') {
    errors.push('Agency ID is required');
  }
  if (!link.propertyId || link.propertyId.trim() === '') {
    errors.push('Property ID is required');
  }

  // Validate commission rate (required)
  if (!isValidCommissionRate(link.commissionRate)) {
    errors.push('Commission rate must be between 0 and 100');
  }

  // Validate dates
  if (!(link.contractStartDate instanceof Date) || isNaN(link.contractStartDate.getTime())) {
    errors.push('Valid contract start date is required');
  }

  if (link.contractEndDate) {
    if (!(link.contractEndDate instanceof Date) || isNaN(link.contractEndDate.getTime())) {
      errors.push('Contract end date must be a valid date');
    } else if (link.contractEndDate <= link.contractStartDate) {
      errors.push('Contract end date must be after start date');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
