/**
 * Password Validation Tests
 * CRITICAL: Security-sensitive password validation logic
 *
 * Tests cover:
 * - Password strength requirements (6 rules)
 * - Password strength calculation
 * - SHA-256 hashing and verification
 * - Edge cases and security vulnerabilities
 */

import { describe, it, expect } from 'vitest';
import {
  validatePassword,
  getPasswordStrength,
  hashPassword,
  verifyPassword,
} from '../../../src/utils/validation';

describe('validatePassword', () => {
  describe('Minimum Length Requirement (8 characters)', () => {
    it('should reject passwords shorter than 8 characters', () => {
      const result = validatePassword('Short1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should accept passwords exactly 8 characters', () => {
      const result = validatePassword('Valid1!@');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept passwords longer than 8 characters', () => {
      const result = validatePassword('VeryLongPassword123!@#');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty string', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });
  });

  describe('Uppercase Letter Requirement', () => {
    it('should reject passwords without uppercase letters', () => {
      const result = validatePassword('lowercase123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should accept passwords with one uppercase letter', () => {
      const result = validatePassword('Password123!');
      expect(result.isValid).toBe(true);
    });

    it('should accept passwords with multiple uppercase letters', () => {
      const result = validatePassword('PASSword123!');
      expect(result.isValid).toBe(true);
    });

    it('should accept uppercase letters in any position', () => {
      expect(validatePassword('Aassword123!').isValid).toBe(true);
      expect(validatePassword('pAssword123!').isValid).toBe(true);
      expect(validatePassword('passworD123!').isValid).toBe(true);
    });
  });

  describe('Lowercase Letter Requirement', () => {
    it('should reject passwords without lowercase letters', () => {
      const result = validatePassword('UPPERCASE123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should accept passwords with one lowercase letter', () => {
      const result = validatePassword('PASSWORd123!');
      expect(result.isValid).toBe(true);
    });

    it('should accept passwords with multiple lowercase letters', () => {
      const result = validatePassword('Passwordabc123!');
      expect(result.isValid).toBe(true);
    });
  });

  describe('Number Requirement', () => {
    it('should reject passwords without numbers', () => {
      const result = validatePassword('Password!@#');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should accept passwords with one number', () => {
      const result = validatePassword('Password1!');
      expect(result.isValid).toBe(true);
    });

    it('should accept passwords with multiple numbers', () => {
      const result = validatePassword('Password123!');
      expect(result.isValid).toBe(true);
    });

    it('should accept numbers in any position', () => {
      expect(validatePassword('1Password!').isValid).toBe(true);
      expect(validatePassword('Pass1word!').isValid).toBe(true);
      expect(validatePassword('Password1!').isValid).toBe(true);
    });
  });

  describe('Special Character Requirement', () => {
    it('should reject passwords without special characters', () => {
      const result = validatePassword('Password123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should accept all common special characters from password generators', () => {
      // Test a comprehensive set of special characters that password generators commonly use
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '-', '=', '[', ']', '{', '}', '|', ';', ':', "'", '"', ',', '.', '<', '>', '?', '/', '~', '`'];

      specialChars.forEach((char) => {
        const result = validatePassword(`Password1${char}`);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should accept passwords with multiple special characters', () => {
      const result = validatePassword('Password123!@#$');
      expect(result.isValid).toBe(true);
    });

    it('should accept passwords with extended special characters like ?', () => {
      const result = validatePassword('Password123?');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Multiple Validation Errors', () => {
    it('should return all applicable errors for completely invalid password', () => {
      const result = validatePassword('abc');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(4); // Length, uppercase, number, special char (lowercase passes)
      expect(result.errors).toContain('Password must be at least 8 characters long');
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one number');
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should return multiple errors for partially valid password', () => {
      const result = validatePassword('Pass1'); // Missing: length, special char
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain('Password must be at least 8 characters long');
      expect(result.errors).toContain('Password must contain at least one special character');
    });
  });

  describe('Valid Password Examples', () => {
    const validPasswords = [
      'Password123!',
      'MyP@ssw0rd',
      'Secure#Pass1',
      'C0mpl3x!ty',
      'Test1234!@#$',
      'aB3!xyZqW',
      '12345678Aa!',
    ];

    validPasswords.forEach((password) => {
      it(`should accept valid password: "${password}"`, () => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });

  describe('Security Edge Cases', () => {
    it('should handle passwords with whitespace', () => {
      const result = validatePassword('Pass word123!');
      expect(result.isValid).toBe(true); // Whitespace is allowed
    });

    it('should handle passwords with unicode characters', () => {
      const result = validatePassword('Pàsswörd123!');
      expect(result.isValid).toBe(true);
    });

    it('should handle very long passwords (>100 characters)', () => {
      const longPassword = 'A'.repeat(40) + 'a'.repeat(40) + '1'.repeat(20) + '!';
      const result = validatePassword(longPassword);
      expect(result.isValid).toBe(true);
    });

    it('should handle null or undefined gracefully', () => {
      const resultNull = validatePassword(null as any);
      const resultUndefined = validatePassword(undefined as any);

      expect(resultNull.isValid).toBe(false);
      expect(resultUndefined.isValid).toBe(false);
    });
  });
});

describe('getPasswordStrength', () => {
  describe('Weak Passwords', () => {
    it('should classify minimum requirement password as weak', () => {
      expect(getPasswordStrength('Pass123!')).toBe('weak');
    });

    it('should classify short valid password as weak', () => {
      expect(getPasswordStrength('aB1!cdef')).toBe('weak');
    });

    it('should classify password with only basic requirements as weak', () => {
      expect(getPasswordStrength('Password1!')).toBe('weak');
    });
  });

  describe('Medium Passwords', () => {
    it('should classify 12+ character password with variety as medium', () => {
      expect(getPasswordStrength('MyP@ssw0rd12')).toBe('medium');
    });

    it('should classify password with good mix of characters as medium', () => {
      expect(getPasswordStrength('Secure#Pass123')).toBe('medium');
    });
  });

  describe('Strong Passwords', () => {
    it('should classify 16+ character password with high variety as strong', () => {
      expect(getPasswordStrength('MyV3ry$ecur3P@ssw0rd!')).toBe('strong');
    });

    it('should classify complex password as strong', () => {
      expect(getPasswordStrength('C0mpl3x!tyRul3s#2024')).toBe('strong');
    });

    it('should classify long password with all character types as strong', () => {
      expect(getPasswordStrength('ThisIsAVerySecurePassword123!@#')).toBe('strong');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      expect(getPasswordStrength('')).toBe('weak');
    });

    it('should handle very short string', () => {
      expect(getPasswordStrength('a')).toBe('weak');
    });
  });
});

describe('hashPassword', () => {
  it('should hash a password using SHA-256', async () => {
    const password = 'MyPassword123!';
    const hash = await hashPassword(password);

    // SHA-256 produces 64 hex characters
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should produce different hashes for different passwords', async () => {
    const hash1 = await hashPassword('Password1!');
    const hash2 = await hashPassword('Password2!');

    expect(hash1).not.toBe(hash2);
  });

  it('should produce consistent hashes for same password', async () => {
    const password = 'ConsistentPassword123!';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).toBe(hash2);
  });

  it('should handle empty string', async () => {
    const hash = await hashPassword('');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should handle special characters', async () => {
    const hash = await hashPassword('P@$$w0rd!#$%^&*');
    expect(hash).toHaveLength(64);
  });

  it('should handle unicode characters', async () => {
    const hash = await hashPassword('Pàsswörd123!');
    expect(hash).toHaveLength(64);
  });

  it('should handle very long passwords', async () => {
    const longPassword = 'A'.repeat(1000) + '1!';
    const hash = await hashPassword(longPassword);
    expect(hash).toHaveLength(64);
  });
});

describe('verifyPassword', () => {
  it('should verify correct password against hash', async () => {
    const password = 'MyPassword123!';
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(password, hash);

    expect(isValid).toBe(true);
  });

  it('should reject incorrect password against hash', async () => {
    const password = 'MyPassword123!';
    const hash = await hashPassword(password);
    const isValid = await verifyPassword('WrongPassword123!', hash);

    expect(isValid).toBe(false);
  });

  it('should be case-sensitive', async () => {
    const password = 'MyPassword123!';
    const hash = await hashPassword(password);
    const isValid = await verifyPassword('mypassword123!', hash);

    expect(isValid).toBe(false);
  });

  it('should detect single character difference', async () => {
    const password = 'MyPassword123!';
    const hash = await hashPassword(password);
    const isValid = await verifyPassword('MyPassword124!', hash);

    expect(isValid).toBe(false);
  });

  it('should handle empty password verification', async () => {
    const hash = await hashPassword('');
    const isValid = await verifyPassword('', hash);

    expect(isValid).toBe(true);
  });

  it('should reject empty password against non-empty hash', async () => {
    const hash = await hashPassword('Password123!');
    const isValid = await verifyPassword('', hash);

    expect(isValid).toBe(false);
  });

  it('should handle special characters correctly', async () => {
    const password = 'P@$$w0rd!#$%^&*';
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(password, hash);

    expect(isValid).toBe(true);
  });

  it('should handle unicode characters correctly', async () => {
    const password = 'Pàsswörd123!';
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(password, hash);

    expect(isValid).toBe(true);
  });

  it('should reject tampered hash', async () => {
    const password = 'MyPassword123!';
    const hash = await hashPassword(password);
    // Change last character - if it's 'a' change to 'b', otherwise change to 'a'
    const lastChar = hash[hash.length - 1];
    const newLastChar = lastChar === 'a' ? 'b' : 'a';
    const tamperedHash = hash.slice(0, -1) + newLastChar;
    const isValid = await verifyPassword(password, tamperedHash);

    expect(isValid).toBe(false);
  });

  it('should reject malformed hash', async () => {
    const password = 'MyPassword123!';
    const malformedHash = 'not-a-valid-hash';
    const isValid = await verifyPassword(password, malformedHash);

    expect(isValid).toBe(false);
  });
});

describe('Password Security Integration Tests', () => {
  it('should complete full password lifecycle: validate -> hash -> verify', async () => {
    const password = 'SecurePassword123!';

    // Step 1: Validate
    const validation = validatePassword(password);
    expect(validation.isValid).toBe(true);

    // Step 2: Hash
    const hash = await hashPassword(password);
    expect(hash).toHaveLength(64);

    // Step 3: Verify
    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it('should prevent weak password from being used', async () => {
    const weakPassword = 'weak';

    // Validation should fail
    const validation = validatePassword(weakPassword);
    expect(validation.isValid).toBe(false);

    // In real app, we would not proceed to hashing
    // But if we did, the hash would still work technically
    const hash = await hashPassword(weakPassword);
    const isValid = await verifyPassword(weakPassword, hash);
    expect(isValid).toBe(true); // Hash works, but validation prevents this path
  });

  it('should handle multiple users with same password (different hashes in production)', async () => {
    // NOTE: In production, use bcrypt with salts to ensure different hashes
    // SHA-256 alone produces same hash for same password (no salt)
    const password = 'SharedPassword123!';

    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    // With SHA-256 (no salt), hashes are identical
    expect(hash1).toBe(hash2);

    // Both should verify correctly
    expect(await verifyPassword(password, hash1)).toBe(true);
    expect(await verifyPassword(password, hash2)).toBe(true);

    // Security note: This test documents current behavior
    // TODO: Upgrade to bcrypt for production (adds unique salt per hash)
  });
});
