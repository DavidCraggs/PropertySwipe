/**
 * RRA 2025 Message Validation Tests
 * CRITICAL: Rent bidding detection and prevention (legal compliance)
 *
 * Tests cover:
 * - Rent bidding pattern detection (landlords requesting above advertised rent)
 * - Numeric rent amount validation against advertised price
 * - False positive prevention (allowed phrases)
 * - Sender type enforcement (only validate landlord messages)
 * - Edge cases and boundary conditions
 * - Error message formatting
 *
 * Legal Context:
 * The Renters' Rights Act 2025 prohibits landlords from requesting or accepting
 * rent above the advertised price. Violations can result in fines up to £7,000.
 * This test suite ensures PropertySwipe enforces this prohibition.
 */

import { describe, it, expect } from 'vitest';
import {
  validateMessage,
  sanitizeMessage,
  getValidationErrorMessage,
  type ValidationResult,
} from '../../../src/utils/messageValidation';

describe('RRA 2025 Message Validation', () => {
  describe('Sender Type Validation', () => {
    it('should allow all renter messages without validation', () => {
      const result = validateMessage(
        'I can offer £100 more per month',
        'renter',
        1000
      );

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should allow renters to mention higher amounts', () => {
      const result = validateMessage(
        'I am willing to pay above the asking rent of £1200',
        'renter',
        1200
      );

      expect(result.isValid).toBe(true);
    });

    it('should validate landlord messages for rent bidding', () => {
      const result = validateMessage(
        'Can you offer more than £1000?',
        'landlord',
        1000
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Renters\' Rights Act 2025');
    });
  });

  describe('Direct Rent Bidding Patterns', () => {
    it('should detect "offer more" pattern', () => {
      const result = validateMessage(
        'Would you be willing to offer more?',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toContain('offer more');
    });

    it('should detect "offer above" pattern', () => {
      const result = validateMessage(
        'Can you offer above the asking price?',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toContain('offer above');
    });

    it('should detect "offer higher" pattern', () => {
      const result = validateMessage(
        'We need you to offer higher than listed',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toContain('offer higher');
    });

    it('should detect "offer extra" pattern', () => {
      const result = validateMessage(
        'Could you offer extra per month?',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toContain('offer extra');
    });
  });

  describe('Willingness to Pay Patterns', () => {
    it('should detect "willing to pay more" from landlord', () => {
      const result = validateMessage(
        'Are you willing to pay more?',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toContain('willing to pay more');
    });

    it('should detect "willing to pay extra" pattern', () => {
      const result = validateMessage(
        'If you\'re willing to pay extra, I can prioritize your application',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toContain('willing to pay extra');
    });

    it('should detect "willing to pay higher" pattern', () => {
      const result = validateMessage(
        'Are you willing to pay higher than the advertised rent?',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toContain('willing to pay higher');
    });
  });

  describe('Direct Request Patterns', () => {
    it('should detect "can you pay more" pattern', () => {
      const result = validateMessage(
        'Can you pay more than the listed price?',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      // Matched phrase retains original case
      expect(result.bannedPhrases).toContain('Can you pay more');
    });

    it('should detect "can you pay extra" pattern', () => {
      const result = validateMessage(
        'Can you pay extra for the property?',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toContain('Can you pay extra');
    });

    it('should detect "can you pay higher" pattern', () => {
      const result = validateMessage(
        'Can you pay higher rent?',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toContain('Can you pay higher');
    });
  });

  describe('Increase Patterns', () => {
    it('should detect "increase your offer" pattern', () => {
      const result = validateMessage(
        'Could you increase your offer?',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toContain('increase your offer');
    });

    it('should detect "increase the offer" pattern', () => {
      const result = validateMessage(
        'We\'d like you to increase the offer',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toContain('increase the offer');
    });
  });

  describe('Bidding Language Patterns', () => {
    it('should detect "bid higher" pattern', () => {
      const result = validateMessage(
        'You\'ll need to bid higher',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toContain('bid higher');
    });

    it('should detect "outbid" pattern', () => {
      const result = validateMessage(
        'You\'ll have to outbid the other applicants',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toContain('outbid');
    });

    it('should detect "best offer" pattern', () => {
      const result = validateMessage(
        'We\'re accepting best offer',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toContain('best offer');
    });

    it('should detect "highest bidder" pattern', () => {
      const result = validateMessage(
        'The property goes to the highest bidder',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toContain('highest bidder');
    });

    it('should detect "highest offer" pattern', () => {
      const result = validateMessage(
        'Accepting highest offer',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toContain('highest offer');
    });

    it('should detect "bidding war" pattern', () => {
      const result = validateMessage(
        'There\'s a bidding war for this property',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toContain('bidding war');
    });

    it('should detect "rent auction" pattern', () => {
      const result = validateMessage(
        'This is basically a rent auction',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toContain('rent auction');
    });
  });

  describe('Numeric Amount Validation', () => {
    it('should detect rent amount above advertised (with £ symbol)', () => {
      const result = validateMessage(
        'The rent would be £1200 per month',
        'landlord',
        1000
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('£1,200');
      expect(result.error).toContain('above the advertised rent of £1,000');
    });

    it('should detect rent amount above advertised (without per month)', () => {
      const result = validateMessage(
        'Actually the rent is £1500',
        'landlord',
        1200
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('£1,500');
    });

    it('should allow rent amount equal to advertised', () => {
      const result = validateMessage(
        'The rent is £1000 per month as advertised',
        'landlord',
        1000
      );

      expect(result.isValid).toBe(true);
    });

    it('should allow rent amount below advertised', () => {
      const result = validateMessage(
        'I can offer £900 per month instead',
        'landlord',
        1000
      );

      expect(result.isValid).toBe(true);
    });

    it('should detect amount with PCM notation', () => {
      const result = validateMessage(
        'Rent is £1300 pcm',
        'landlord',
        1200
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('£1,300');
    });

    it('should detect amount with "monthly" notation', () => {
      const result = validateMessage(
        'Would be £1400 monthly',
        'landlord',
        1200
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('£1,400');
    });

    it('should detect amount with "/month" notation', () => {
      const result = validateMessage(
        'The rent is £1350/month',
        'landlord',
        1200
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('£1,350');
    });

    it('should handle multiple rent mentions correctly', () => {
      const result = validateMessage(
        'The deposit is £1000 and rent is £1500 per month',
        'landlord',
        1200
      );

      // Should catch the £1500 which is above £1200
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('£1,500');
    });

    it('should validate when no advertised rent provided', () => {
      const result = validateMessage(
        'The rent is £1500',
        'landlord'
        // No advertisedRent parameter
      );

      // Without advertised rent, can't validate numeric amounts
      // Only pattern-based validation applies
      expect(result.isValid).toBe(true);
    });
  });

  describe('Conditional Patterns', () => {
    it('should detect "if you pay more" pattern', () => {
      const result = validateMessage(
        'You can move in sooner if you pay more',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toContain('if you pay more');
    });

    it('should detect "if you pay extra" pattern', () => {
      const result = validateMessage(
        'I\'ll accept your application if you pay extra',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toContain('if you pay extra');
    });

    it('should detect "provided you pay" pattern', () => {
      const result = validateMessage(
        'The property is yours provided you pay above asking',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toContain('provided you pay');
    });

    it('should detect "only if you offer more" pattern', () => {
      const result = validateMessage(
        'I can hold it only if you offer more',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toContain('only if you offer more');
    });

    it('should detect "only if you pay higher" pattern', () => {
      const result = validateMessage(
        'Only if you pay higher than others',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toContain('Only if you pay higher');
    });
  });

  describe('Explicit Amount Patterns', () => {
    it('should detect "pay £X more" pattern', () => {
      const result = validateMessage(
        'Could you pay £100 more?',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toContain('pay £100 more');
    });

    it('should detect "additional £X" pattern', () => {
      const result = validateMessage(
        'We need additional £150',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toContain('additional £150');
    });

    it('should detect "extra £X per month" pattern', () => {
      const result = validateMessage(
        'Can you do extra £200 per month?',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toContain('extra £200 per month');
    });

    it('should detect "extra £X monthly" pattern', () => {
      const result = validateMessage(
        'Looking for extra £100 monthly',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toContain('extra £100 monthly');
    });

    it('should detect "extra £X pcm" pattern', () => {
      const result = validateMessage(
        'Need extra £50 pcm',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toContain('extra £50 pcm');
    });
  });

  describe('Comparative Patterns', () => {
    it('should detect "pay more than £X" pattern', () => {
      const result = validateMessage(
        'Can you pay more than £1200?',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toContain('pay more than £1200');
    });

    it('should detect "above the asking rent" pattern', () => {
      const result = validateMessage(
        'Looking for someone to pay above the asking rent',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toContain('above the asking rent');
    });

    it('should detect "above the advertised price" pattern', () => {
      const result = validateMessage(
        'Need above the advertised price',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toContain('above the advertised price');
    });

    it('should detect "above the listed rent" pattern', () => {
      const result = validateMessage(
        'Expecting above the listed rent',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toContain('above the listed rent');
    });

    it('should detect "more than asking" pattern', () => {
      const result = validateMessage(
        'Will you pay more than asking?',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toContain('more than asking');
    });

    it('should detect "more than advertised" pattern', () => {
      const result = validateMessage(
        'Can you do more than advertised?',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toContain('more than advertised');
    });

    it('should detect "more than listed" pattern', () => {
      const result = validateMessage(
        'Seeking more than listed',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toContain('more than listed');
    });

    it('should detect "higher than £X" pattern', () => {
      const result = validateMessage(
        'Need higher than £1000',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toContain('higher than £1000');
    });
  });

  describe('False Positive Prevention', () => {
    it('should allow "no more" pattern', () => {
      const result = validateMessage(
        'There are no more viewings available',
        'landlord'
      );

      expect(result.isValid).toBe(true);
    });

    it('should allow "not willing to pay more" pattern', () => {
      const result = validateMessage(
        'I understand you\'re not willing to pay more',
        'landlord'
      );

      expect(result.isValid).toBe(true);
    });

    it('should allow "not able to pay more" pattern', () => {
      const result = validateMessage(
        'If you\'re not able to pay more, that\'s fine',
        'landlord'
      );

      expect(result.isValid).toBe(true);
    });

    it('should allow "cannot pay more" pattern', () => {
      const result = validateMessage(
        'I understand you cannot pay more',
        'landlord'
      );

      expect(result.isValid).toBe(true);
    });

    it('should allow "won\'t pay more" pattern', () => {
      const result = validateMessage(
        'That\'s okay if you won\'t pay more',
        'landlord'
      );

      expect(result.isValid).toBe(true);
    });
  });

  describe('Legitimate Landlord Messages', () => {
    it('should allow general property information', () => {
      const result = validateMessage(
        'The property has 2 bedrooms and is available from next month',
        'landlord'
      );

      expect(result.isValid).toBe(true);
    });

    it('should allow viewing arrangements', () => {
      const result = validateMessage(
        'I can arrange a viewing for Tuesday at 3pm',
        'landlord'
      );

      expect(result.isValid).toBe(true);
    });

    it('should allow standard questions', () => {
      const result = validateMessage(
        'Do you have any questions about the property?',
        'landlord'
      );

      expect(result.isValid).toBe(true);
    });

    it('should allow deposit information at advertised rate', () => {
      const result = validateMessage(
        'The deposit is £1000 (one month\'s rent) and rent is £1000 pcm',
        'landlord',
        1000
      );

      expect(result.isValid).toBe(true);
    });

    it('should allow references discussion', () => {
      const result = validateMessage(
        'I\'ll need references from your previous landlord',
        'landlord'
      );

      expect(result.isValid).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject empty message', () => {
      const result = validateMessage('', 'landlord');

      // Empty string is falsy, so (!message) returns true
      // Implementation treats empty string as invalid format
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid message format');
    });

    it('should handle whitespace-only message', () => {
      const result = validateMessage('   ', 'landlord');

      expect(result.isValid).toBe(true);
    });

    it('should handle null/undefined message gracefully', () => {
      const result = validateMessage(null as any, 'landlord');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid message format');
    });

    it('should handle non-string message', () => {
      const result = validateMessage(123 as any, 'landlord');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid message format');
    });

    it('should be case-insensitive for pattern matching', () => {
      const result = validateMessage(
        'CAN YOU OFFER MORE?',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toBeDefined();
    });

    it('should handle very long messages', () => {
      const longMessage = 'This is a legitimate message. '.repeat(100) + 'Can you offer more?';
      const result = validateMessage(longMessage, 'landlord');

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases).toContain('offer more');
    });

    it('should detect multiple violations in single message', () => {
      const result = validateMessage(
        'Can you offer more? We have other bidders willing to pay higher',
        'landlord'
      );

      expect(result.isValid).toBe(false);
      expect(result.bannedPhrases!.length).toBeGreaterThan(0);
    });

    it('should handle advertised rent of 0 (edge case)', () => {
      const result = validateMessage(
        'The rent is £100',
        'landlord',
        0
      );

      // When advertised rent is 0 (invalid/edge case), the numeric check
      // technically flags £100 as above £0, but this is an invalid scenario
      // in real usage. Pattern-based validation still applies.
      // The implementation correctly validates this case
      expect(result.isValid).toBe(true);
    });

    it('should handle very high rent amounts', () => {
      const result = validateMessage(
        'The rent is £15000 per month',
        'landlord',
        10000
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('£15,000');
    });
  });

  describe('Error Message Formatting', () => {
    it('should return empty string for valid messages', () => {
      const result: ValidationResult = { isValid: true };
      const errorMsg = getValidationErrorMessage(result);

      expect(errorMsg).toBe('');
    });

    it('should format error message with banned phrases', () => {
      const result: ValidationResult = {
        isValid: false,
        error: 'This violates RRA 2025',
        bannedPhrases: ['offer more', 'pay extra'],
      };
      const errorMsg = getValidationErrorMessage(result);

      expect(errorMsg).toContain('This violates RRA 2025');
      expect(errorMsg).toContain('Detected phrases:');
      expect(errorMsg).toContain('"offer more"');
      expect(errorMsg).toContain('"pay extra"');
      expect(errorMsg).toContain('Renters\' Rights Act 2025');
      expect(errorMsg).toContain('£7,000');
    });

    it('should format error message without banned phrases', () => {
      const result: ValidationResult = {
        isValid: false,
        error: 'Invalid message',
      };
      const errorMsg = getValidationErrorMessage(result);

      expect(errorMsg).toContain('Invalid message');
      expect(errorMsg).toContain('Renters\' Rights Act 2025');
      expect(errorMsg).not.toContain('Detected phrases:');
    });

    it('should provide default error if none specified', () => {
      const result: ValidationResult = {
        isValid: false,
      };
      const errorMsg = getValidationErrorMessage(result);

      expect(errorMsg).toContain('Message violates RRA 2025 compliance rules');
      expect(errorMsg).toContain('£7,000');
    });
  });

  describe('Sanitize Message (Deprecated)', () => {
    it('should replace banned phrases with warning', () => {
      const sanitized = sanitizeMessage('Can you offer more than asking?');

      expect(sanitized).toContain('[REMOVED - VIOLATES RRA 2025]');
      expect(sanitized).not.toContain('offer more');
    });

    it('should handle multiple banned phrases', () => {
      const sanitized = sanitizeMessage('Can you offer more? I need you to bid higher');

      expect(sanitized).toContain('[REMOVED - VIOLATES RRA 2025]');
    });

    it('should leave clean messages unchanged', () => {
      const clean = 'The property is available next month';
      const sanitized = sanitizeMessage(clean);

      expect(sanitized).toBe(clean);
    });
  });
});
