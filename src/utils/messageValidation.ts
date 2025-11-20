/**
 * RRA 2025 Message Validation Utilities
 *
 * Prevents landlords from requesting rent above advertised price (rent bidding ban)
 * Enforces Renters' Rights Act 2025 compliance in messaging
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  bannedPhrases?: string[];
}

/**
 * Banned phrases that indicate rent bidding or requesting above advertised rent
 * These patterns violate RRA 2025 rent bidding ban
 */
const RENT_BIDDING_PATTERNS = [
  // Direct offers above asking
  /offer\s+(more|above|higher|extra)/i,
  /willing\s+to\s+pay\s+(more|extra|higher)/i,
  /can\s+you\s+pay\s+(more|extra|higher)/i,
  /increase\s+(your|the)\s+offer/i,
  /bid\s+higher/i,
  /outbid/i,

  // Requesting above advertised rent
  /pay\s+more\s+than\s+£?\d+/i,
  /above\s+the\s+(asking|advertised|listed)\s+(rent|price)/i,
  /more\s+than\s+(asking|advertised|listed)/i,
  /higher\s+than\s+£?\d+/i,
  /£\d+\s+(more|extra|additional)\s+(per\s+month|pcm)/i,

  // Bidding language
  /best\s+offer/i,
  /highest\s+(bidder|offer)/i,
  /bidding\s+war/i,
  /rent\s+auction/i,

  // Requesting extra payments
  /pay\s+£?\d+\s+more/i,
  /additional\s+£?\d+/i,
  /extra\s+£?\d+\s+(per\s+month|monthly|pcm)/i,

  // Conditional on higher rent
  /if\s+you\s+pay\s+(more|extra)/i,
  /provided\s+you\s+pay/i,
  /only\s+if\s+you\s+(offer|pay)\s+(more|higher)/i,
];

/**
 * Phrases that are allowed (false positives we should exclude)
 */
const ALLOWED_PATTERNS = [
  /no\s+more/i,
  /not\s+(willing|able)\s+to\s+pay\s+more/i,
  /cannot\s+pay\s+more/i,
  /won't\s+pay\s+more/i,
  /won't\s+pay\s+more/i,
];

/**
 * Banned discriminatory phrases (RRA 2025 & Equality Act 2010)
 */
const DISCRIMINATORY_PATTERNS = [
  // Benefits / DSS
  /no\s+(dss|benefits|housing\s+benefit|universal\s+credit)/i,
  /(dss|benefits|housing\s+benefit|universal\s+credit)\s+not\s+accepted/i,
  /(not|do\s+not|don't)\s+accept\s+(dss|benefits|housing\s+benefit|universal\s+credit)/i,
  /professionals\s+only/i, // Can be indirect discrimination
  /working\s+people\s+only/i,

  // Family / Children
  /no\s+(kids|children|families)/i,
  /(kids|children|families)\s+not\s+allowed/i,
  /(not|do\s+not|don't)\s+allow\s+(kids|children|families)/i,
  /adults\s+only/i,
  /child\s+free/i,
  /not\s+suitable\s+for\s+children/i, // Unless specific safety reason given (hard to validate automatically, but flagging is good)
];

/**
 * Validates a message for RRA 2025 compliance (rent bidding ban)
 * Only applies validation if sender is a landlord
 *
 * @param message - Message content to validate
 * @param senderType - 'landlord' or 'renter'
 * @param advertisedRent - The property's advertised monthly rent (for context)
 * @returns ValidationResult with isValid flag and error details
 */
export function validateMessage(
  message: string,
  senderType: 'landlord' | 'renter',
  advertisedRent?: number
): ValidationResult {
  // Only validate landlord messages (landlords cannot request rent above advertised)
  if (senderType !== 'landlord') {
    return { isValid: true };
  }

  // Check if message is trying to bypass the system
  if (!message || typeof message !== 'string') {
    return { isValid: false, error: 'Invalid message format' };
  }

  const trimmedMessage = message.trim().toLowerCase();

  // Empty messages are valid (will be caught by UI validation)
  if (trimmedMessage.length === 0) {
    return { isValid: true };
  }

  // Check for allowed patterns first (avoid false positives)
  for (const pattern of ALLOWED_PATTERNS) {
    if (pattern.test(message)) {
      return { isValid: true };
    }
  }

  // Check for banned rent bidding patterns
  const detectedPhrases: string[] = [];
  for (const pattern of RENT_BIDDING_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      detectedPhrases.push(match[0]);
    }
  }

  if (detectedPhrases.length > 0) {
    return {
      isValid: false,
      error: 'This message violates the Renters\' Rights Act 2025. Landlords cannot request or accept rent above the advertised price. This is known as "rent bidding" and is illegal.',
      bannedPhrases: detectedPhrases,
    };
  }

  // Check for discriminatory patterns
  const detectedDiscriminatoryPhrases: string[] = [];
  for (const pattern of DISCRIMINATORY_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      detectedDiscriminatoryPhrases.push(match[0]);
    }
  }

  if (detectedDiscriminatoryPhrases.length > 0) {
    return {
      isValid: false,
      error: 'This message contains phrases that may violate the Equality Act 2010 and RRA 2025. Discrimination against families or benefit recipients is illegal.',
      bannedPhrases: detectedDiscriminatoryPhrases,
    };
  }

  // Additional check: detect specific rent amounts above advertised
  if (advertisedRent) {
    const rentMentionPattern = /£(\d{1,5})\s*(per\s+month|pcm|monthly|\/month)?/gi;
    const matches = [...message.matchAll(rentMentionPattern)];

    for (const match of matches) {
      const mentionedAmount = parseInt(match[1]);
      if (mentionedAmount > advertisedRent) {
        return {
          isValid: false,
          error: `This message mentions £${mentionedAmount.toLocaleString()}, which is above the advertised rent of £${advertisedRent.toLocaleString()}. Under RRA 2025, landlords cannot request rent above the advertised price.`,
          bannedPhrases: [match[0]],
        };
      }
    }
  }

  return { isValid: true };
}

/**
 * Sanitizes a message by removing banned phrases (NOT RECOMMENDED - prefer rejection)
 * This function exists for reference but should not be used in production
 * Messages should be rejected, not sanitized, to ensure compliance
 */
export function sanitizeMessage(message: string): string {
  let sanitized = message;

  for (const pattern of RENT_BIDDING_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REMOVED - VIOLATES RRA 2025]');
  }

  return sanitized;
}

/**
 * Returns user-friendly error message for display
 */
export function getValidationErrorMessage(result: ValidationResult): string {
  if (result.isValid) return '';

  let errorMsg = result.error || 'Message violates RRA 2025 compliance rules.';

  if (result.bannedPhrases && result.bannedPhrases.length > 0) {
    errorMsg += `\n\nDetected phrases: "${result.bannedPhrases.join('", "')}"`;
  }

  errorMsg += '\n\nThe Renters\' Rights Act 2025 prohibits landlords from requesting or accepting rent above the advertised price. This practice, known as "rent bidding," can result in fines up to £7,000.';

  return errorMsg;
}
