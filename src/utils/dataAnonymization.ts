/**
 * Data Anonymization Utilities
 *
 * GDPR-compliant anonymization functions that preserve aggregate data for analytics
 * while removing personally identifiable information (PII) when users exercise their
 * right to erasure under GDPR Article 17.
 *
 * Anonymization Strategy:
 * - Replace PII with standardized placeholders
 * - Preserve data structure for analytics
 * - Maintain referential integrity where needed
 * - Document which fields are anonymized vs deleted
 *
 * @see https://gdpr-info.eu/art-17-gdpr/ - Right to erasure
 * @see DataDeletionService for orchestration of deletion requests
 */

import { supabase } from '../lib/supabase';
import type { Rating, UserType } from '../types';

// =====================================================
// CONSTANTS
// =====================================================

/**
 * Placeholder text used for anonymized user identifiers
 */
export const DELETED_USER_PLACEHOLDER = '[Deleted User]';

/**
 * Placeholder text used for anonymized message content
 */
export const DELETED_MESSAGE_CONTENT = '[Message deleted]';

/**
 * Placeholder text used for anonymized review content
 */
export const DELETED_REVIEW_CONTENT = '[Review removed at user request]';

/**
 * Anonymous user ID pattern - maintains UUID structure for foreign key compatibility
 * Format: 00000000-0000-0000-0000-{timestamp}
 */
export const ANONYMOUS_USER_ID_PREFIX = '00000000-0000-0000-0000-';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

/**
 * Result of an anonymization operation
 */
export interface AnonymizationResult {
  success: boolean;
  recordsAffected: number;
  errors?: string[];
}

/**
 * Options for anonymization operations
 */
export interface AnonymizationOptions {
  /**
   * Whether to use Supabase (true) or localStorage (false)
   * @default true
   */
  useSupabase?: boolean;

  /**
   * Whether to preserve the record or delete it entirely
   * @default true - preserve for analytics
   */
  preserveRecord?: boolean;

  /**
   * Custom placeholder text (overrides defaults)
   */
  customPlaceholder?: string;
}

/**
 * Fields that should be anonymized in a Rating record
 * @deprecated Not currently used, kept for potential future use
 */
// interface RatingAnonymizationFields {
//   fromUserId: boolean;
//   toUserId: boolean;
//   review: boolean;
// }

// Note: Message anonymization is deprecated - messages are stored in conversations as JSONB arrays
// and are deleted via CASCADE when matches are deleted.

// =====================================================
// CORE ANONYMIZATION FUNCTIONS
// =====================================================

/**
 * Generates an anonymous user ID that maintains UUID structure
 * This allows foreign key relationships to remain valid while anonymizing the user
 *
 * @param originalUserId - The original user ID to anonymize
 * @returns Anonymous user ID in UUID format
 *
 * @example
 * ```typescript
 * const anonId = generateAnonymousUserId('abc123');
 * // Returns: '00000000-0000-0000-0000-abcd1234abcd'
 * ```
 */
export function generateAnonymousUserId(originalUserId: string): string {
  // Take last 12 characters of original ID for uniqueness tracking
  const suffix = originalUserId.slice(-12).padStart(12, '0');
  return `${ANONYMOUS_USER_ID_PREFIX}${suffix}`;
}

/**
 * Replaces a field value with a placeholder
 *
 * @param fieldValue - Original field value
 * @param placeholder - Placeholder text to use
 * @returns Placeholder text
 */
export function replaceWithPlaceholder(
  _fieldValue: string | null | undefined,
  placeholder: string = DELETED_USER_PLACEHOLDER
): string {
  return placeholder;
}

/**
 * Checks if a user ID is already anonymized
 *
 * @param userId - User ID to check
 * @returns True if the user ID is an anonymous placeholder
 */
export function isAnonymizedUserId(userId: string): boolean {
  return userId.startsWith(ANONYMOUS_USER_ID_PREFIX);
}

// =====================================================
// RATINGS ANONYMIZATION
// =====================================================

/**
 * Anonymizes user references in a Rating record
 *
 * This function anonymizes the fromUserId and/or toUserId in a rating,
 * along with the review text, while preserving:
 * - Overall score and category scores (for aggregate analytics)
 * - Timestamps and verification status
 * - Match and property references
 *
 * GDPR Compliance:
 * - Removes PII (user IDs, review text) per Article 17
 * - Preserves aggregate data for legitimate interests per Article 6(1)(f)
 *
 * @param ratingId - ID of the rating to anonymize
 * @param userId - User ID to anonymize (can be fromUserId or toUserId)
 * @param options - Anonymization options
 * @returns Result of the anonymization operation
 *
 * @example
 * ```typescript
 * // Anonymize a rating left by a deleted user
 * await anonymizeUserInRating('rating-123', 'user-456', {
 *   useSupabase: true,
 *   preserveRecord: true
 * });
 * ```
 */
export async function anonymizeUserInRating(
  ratingId: string,
  userId: string,
  options: AnonymizationOptions = {}
): Promise<AnonymizationResult> {
  const { useSupabase = true, preserveRecord = true } = options;

  try {
    if (!preserveRecord) {
      // If not preserving, delete the entire record
      if (useSupabase) {
        const { error } = await supabase
          .from('ratings')
          .delete()
          .eq('id', ratingId);

        if (error) throw error;
      } else {
        // localStorage: remove from stored ratings array
        const ratings = JSON.parse(localStorage.getItem('ratings') || '[]');
        const filtered = ratings.filter((r: Rating) => r.id !== ratingId);
        localStorage.setItem('ratings', JSON.stringify(filtered));
      }

      return { success: true, recordsAffected: 1 };
    }

    // Otherwise, anonymize while preserving structure
    const anonymousId = generateAnonymousUserId(userId);
    const updates: Partial<Rating> = {};

    if (useSupabase) {
      // First, fetch the rating to determine which fields to anonymize
      const { data: rating, error: fetchError } = await supabase
        .from('ratings')
        .select('*')
        .eq('id', ratingId)
        .single();

      if (fetchError) throw fetchError;
      if (!rating) throw new Error(`Rating ${ratingId} not found`);

      // Determine which fields to anonymize
      if (rating.fromUserId === userId) {
        updates.fromUserId = anonymousId;
        updates.review = DELETED_REVIEW_CONTENT;
      }

      if (rating.toUserId === userId) {
        updates.toUserId = anonymousId;
      }

      // Update the rating
      const { error: updateError } = await supabase
        .from('ratings')
        .update(updates)
        .eq('id', ratingId);

      if (updateError) throw updateError;
    } else {
      // localStorage: update in memory
      const ratings = JSON.parse(localStorage.getItem('ratings') || '[]');
      const index = ratings.findIndex((r: Rating) => r.id === ratingId);

      if (index === -1) throw new Error(`Rating ${ratingId} not found`);

      const rating = ratings[index];

      if (rating.fromUserId === userId) {
        rating.fromUserId = anonymousId;
        rating.review = DELETED_REVIEW_CONTENT;
      }

      if (rating.toUserId === userId) {
        rating.toUserId = anonymousId;
      }

      ratings[index] = rating;
      localStorage.setItem('ratings', JSON.stringify(ratings));
    }

    return { success: true, recordsAffected: 1 };
  } catch (error) {
    console.error('Failed to anonymize rating:', error);
    return {
      success: false,
      recordsAffected: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Anonymizes all ratings associated with a user
 *
 * This function finds all ratings where the user is either the reviewer (fromUserId)
 * or the reviewee (toUserId) and anonymizes them.
 *
 * @param userId - User ID to anonymize
 * @param options - Anonymization options
 * @returns Result of the anonymization operation
 *
 * @example
 * ```typescript
 * // Anonymize all ratings for a deleted user
 * const result = await anonymizeAllRatingsForUser('user-123');
 * console.log(`Anonymized ${result.recordsAffected} ratings`);
 * ```
 */
export async function anonymizeAllRatingsForUser(
  userId: string,
  options: AnonymizationOptions = {}
): Promise<AnonymizationResult> {
  const { useSupabase = true } = options;
  let recordsAffected = 0;
  const errors: string[] = [];

  try {
    if (useSupabase) {
      // Find all ratings involving this user
      const { data: ratings, error: fetchError } = await supabase
        .from('ratings')
        .select('id')
        .or(`fromUserId.eq.${userId},toUserId.eq.${userId}`);

      if (fetchError) throw fetchError;

      // Anonymize each rating
      for (const rating of ratings || []) {
        const result = await anonymizeUserInRating(rating.id, userId, options);
        if (result.success) {
          recordsAffected += result.recordsAffected;
        } else {
          errors.push(...(result.errors || []));
        }
      }
    } else {
      // localStorage: filter and update
      const ratings = JSON.parse(localStorage.getItem('ratings') || '[]');

      for (const rating of ratings) {
        if (rating.fromUserId === userId || rating.toUserId === userId) {
          const result = await anonymizeUserInRating(rating.id, userId, options);
          if (result.success) {
            recordsAffected += result.recordsAffected;
          } else {
            errors.push(...(result.errors || []));
          }
        }
      }
    }

    return {
      success: errors.length === 0,
      recordsAffected,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error) {
    console.error('Failed to anonymize ratings for user:', error);
    return {
      success: false,
      recordsAffected,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

// =====================================================
// MESSAGES ANONYMIZATION
// =====================================================

/**
 * Anonymizes a message record
 *
 * This function anonymizes the sender and/or receiver in a message,
 * along with the message content. Preserves:
 * - Timestamp (for conversation flow analytics)
 * - Match reference
 * - Read status
 *
 * GDPR Compliance:
 * - Removes PII (user IDs, message content) per Article 17
 * - Preserves conversation structure for platform analytics
 *
 * @param messageId - ID of the message to anonymize
 * @param userId - User ID to anonymize (can be senderId or receiverId)
 * @param options - Anonymization options
 * @returns Result of the anonymization operation
 *
 * @example
 * ```typescript
 * // Anonymize a message from a deleted user
 * await anonymizeMessage('msg-123', 'user-456', {
 *   useSupabase: true,
 *   preserveRecord: true
 * });
 * ```
 */
/**
 * @deprecated Messages are now stored in conversations as JSONB arrays.
 * Conversations will be deleted via CASCADE when matches are deleted.
 * This function is kept for backward compatibility but does not work with the current schema.
 */
export async function anonymizeMessage(
  _messageId: string,
  _userId: string,
  _options: AnonymizationOptions = {}
): Promise<AnonymizationResult> {
  // Messages are now stored inside conversations table as JSONB
  // When a user is deleted, their matches are deleted, which cascades to delete conversations
  console.warn('anonymizeMessage is deprecated: messages are stored in conversations and will be deleted via CASCADE');

  return {
    success: true,
    recordsAffected: 0
  };
}

/**
 * @deprecated Messages are now stored in conversations as JSONB arrays.
 * Conversations will be deleted via CASCADE when matches are deleted.
 * This function is kept for backward compatibility but does not work with the current schema.
 */
export async function anonymizeAllMessagesForUser(
  _userId: string,
  _options: AnonymizationOptions = {}
): Promise<AnonymizationResult> {
  // Messages are now stored inside conversations table as JSONB
  // When a user is deleted, their matches are deleted, which cascades to delete conversations
  console.warn('anonymizeAllMessagesForUser is deprecated: messages are stored in conversations and will be deleted via CASCADE');

  return {
    success: true,
    recordsAffected: 0
  };
}

// =====================================================
// CONVERSATIONS ANONYMIZATION
// =====================================================

/**
 * Anonymizes all conversations associated with a user
 *
 * This function anonymizes all messages within conversations where the user
 * is a participant. The conversation record itself is preserved for analytics.
 *
 * @param userId - User ID to anonymize
 * @param options - Anonymization options
 * @returns Result of the anonymization operation
 *
 * @example
 * ```typescript
 * // Anonymize all conversations for a deleted user
 * const result = await anonymizeUserInConversations('user-123');
 * console.log(`Anonymized messages in ${result.recordsAffected} conversations`);
 * ```
 */
export async function anonymizeUserInConversations(
  userId: string,
  options: AnonymizationOptions = {}
): Promise<AnonymizationResult> {
  // Conversations contain messages, so anonymizing messages handles this
  return await anonymizeAllMessagesForUser(userId, options);
}

// =====================================================
// BATCH ANONYMIZATION
// =====================================================

/**
 * Performs complete anonymization of all user data across all tables
 *
 * This is a comprehensive function that anonymizes:
 * - All ratings (as reviewer or reviewee)
 * - All messages (as sender or receiver)
 * - All conversations (implicitly via messages)
 *
 * Used by DataDeletionService during user deletion process.
 *
 * @param userId - User ID to anonymize
 * @param userType - Type of user (affects which tables to check)
 * @param options - Anonymization options
 * @returns Combined result of all anonymization operations
 *
 * @example
 * ```typescript
 * // Anonymize all data for a renter
 * const result = await anonymizeAllUserData('user-123', 'renter', {
 *   useSupabase: true,
 *   preserveRecord: true
 * });
 *
 * console.log(`Total records anonymized: ${result.recordsAffected}`);
 * ```
 */
export async function anonymizeAllUserData(
  userId: string,
  _userType: UserType,
  options: AnonymizationOptions = {}
): Promise<AnonymizationResult> {
  let totalRecords = 0;
  const allErrors: string[] = [];

  try {
    // Anonymize ratings
    const ratingsResult = await anonymizeAllRatingsForUser(userId, options);
    totalRecords += ratingsResult.recordsAffected;
    if (ratingsResult.errors) {
      allErrors.push(...ratingsResult.errors);
    }

    // Anonymize messages and conversations
    const messagesResult = await anonymizeAllMessagesForUser(userId, options);
    totalRecords += messagesResult.recordsAffected;
    if (messagesResult.errors) {
      allErrors.push(...messagesResult.errors);
    }

    return {
      success: allErrors.length === 0,
      recordsAffected: totalRecords,
      errors: allErrors.length > 0 ? allErrors : undefined
    };
  } catch (error) {
    console.error('Failed to anonymize all user data:', error);
    return {
      success: false,
      recordsAffected: totalRecords,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Validates that an anonymization operation was successful
 *
 * @param result - Result from an anonymization operation
 * @throws Error if anonymization failed
 */
export function assertAnonymizationSuccess(result: AnonymizationResult): void {
  if (!result.success) {
    throw new Error(
      `Anonymization failed: ${result.errors?.join(', ') || 'Unknown error'}`
    );
  }
}

/**
 * Checks if a value is a deleted/anonymized placeholder
 *
 * @param value - Value to check
 * @returns True if the value is a placeholder
 */
export function isAnonymizedValue(value: string): boolean {
  return (
    value === DELETED_USER_PLACEHOLDER ||
    value === DELETED_MESSAGE_CONTENT ||
    value === DELETED_REVIEW_CONTENT ||
    value.startsWith(ANONYMOUS_USER_ID_PREFIX)
  );
}

/**
 * Sanitizes PII from an error message before logging
 *
 * This ensures that error logs don't accidentally expose PII
 *
 * @param errorMessage - Error message that may contain PII
 * @param userId - User ID to redact
 * @returns Sanitized error message
 */
export function sanitizeErrorMessage(errorMessage: string, userId: string): string {
  return errorMessage.replace(new RegExp(userId, 'g'), '[REDACTED_USER_ID]');
}
