/**
 * Unit tests for seed helpers
 */

import { describe, it, expect } from 'vitest';
import {
    generateSeedId,
    isSeedId,
    generatePropertyDescription,
    daysAgo,
    daysFromNow,
    dateAtTime,
    calculateSLADeadline,
    isValidFutureDate,
    isValidPastDate,
    generatePlaceholderImage,
    validateSeedRecord,
    SEED_CONSTANTS,
} from '../../src/utils/seedHelpers';
import { isAfter, isBefore, differenceInHours } from 'date-fns';

describe('seedHelpers', () => {
    describe('generateSeedId', () => {
        it('should generate ID with seed- prefix', () => {
            const id = generateSeedId('user');
            expect(id).toMatch(/^seed-user-/);
        });

        it('should generate unique IDs', () => {
            const id1 = generateSeedId('property');
            const id2 = generateSeedId('property');
            expect(id1).not.toBe(id2);
        });

        it('should include index when provided', () => {
            const id = generateSeedId('match', 5);
            expect(id).toContain('-005');
        });
    });

    describe('isSeedId', () => {
        it('should return true for seed IDs', () => {
            expect(isSeedId('seed-user-123')).toBe(true);
            expect(isSeedId('seed-property-abc')).toBe(true);
        });

        it('should return false for non-seed IDs', () => {
            expect(isSeedId('user-123')).toBe(false);
            expect(isSeedId('regular-id')).toBe(false);
        });
    });

    describe('generatePropertyDescription', () => {
        it('should generate description with all parameters', () => {
            const description = generatePropertyDescription({
                bedrooms: 2,
                propertyType: 'Flat',
                area: 'Liverpool',
                features: ['Parking', 'Garden', 'Modern'],
            });

            expect(description).toContain('2-bedroom');
            expect(description).toContain('Flat');
            expect(description).toContain('Liverpool');
            expect(description).toContain('parking');
            expect(description).toContain('garden');
            expect(description).toContain('modern');
        });

        it('should generate description without features', () => {
            const description = generatePropertyDescription({
                bedrooms: 1,
                propertyType: 'Studio',
                area: 'City Center',
                features: [],
            });

            expect(description).toContain('1-bedroom');
            expect(description.length).toBeGreaterThan(50);
        });
    });

    describe('Date helpers', () => {
        it('daysAgo should return past date', () => {
            const past = daysAgo(5);
            expect(isBefore(past, new Date())).toBe(true);
        });

        it('daysFromNow should return future date', () => {
            const future = daysFromNow(5);
            expect(isAfter(future, new Date())).toBe(true);
        });

        it('dateAtTime should set specific time', () => {
            const date = new Date('2025-01-15');
            const result = dateAtTime(date, 14, 30);

            expect(result.getHours()).toBe(14);
            expect(result.getMinutes()).toBe(30);
            expect(result.getSeconds()).toBe(0);
        });
    });

    describe('calculateSLADeadline', () => {
        it('should calculate emergency SLA (4 hours)', () => {
            const now = new Date();
            const deadline = calculateSLADeadline(now, 'emergency');
            const hours = differenceInHours(deadline, now);

            expect(hours).toBe(4);
        });

        it('should calculate urgent SLA (24 hours)', () => {
            const now = new Date();
            const deadline = calculateSLADeadline(now, 'urgent');
            const hours = differenceInHours(deadline, now);

            expect(hours).toBe(24);
        });

        it('should calculate routine SLA (5 days)', () => {
            const now = new Date();
            const deadline = calculateSLADeadline(now, 'routine');
            const hours = differenceInHours(deadline, now);

            expect(hours).toBe(24 * 5);
        });

        it('should calculate low priority SLA (7 days)', () => {
            const now = new Date();
            const deadline = calculateSLADeadline(now, 'low');
            const hours = differenceInHours(deadline, now);

            expect(hours).toBe(24 * 7);
        });
    });

    describe('Date validation', () => {
        it('isValidFutureDate should validate future dates', () => {
            const future = daysFromNow(1);
            const past = daysAgo(1);

            expect(isValidFutureDate(future)).toBe(true);
            expect(isValidFutureDate(past)).toBe(false);
        });

        it('isValidPastDate should validate past dates', () => {
            const future = daysFromNow(1);
            const past = daysAgo(1);

            expect(isValidPastDate(past)).toBe(true);
            expect(isValidPastDate(future)).toBe(false);
        });
    });

    describe('generatePlaceholderImage', () => {
        it('should generate valid data URI', () => {
            const dataUri = generatePlaceholderImage();

            expect(dataUri).toMatch(/^data:image\/svg\+xml;base64,/);
        });

        it('should accept custom dimensions', () => {
            const dataUri = generatePlaceholderImage(1200, 800);

            // Decode base64 to verify dimensions are in SVG
            const svgString = atob(dataUri.replace('data:image/svg+xml;base64,', ''));
            expect(svgString).toContain('width="1200"');
            expect(svgString).toContain('height="800"');
        });

        it('should accept custom color', () => {
            const dataUri = generatePlaceholderImage(800, 600, 'ff0000');

            // Decode base64 to verify color is in SVG
            const svgString = atob(dataUri.replace('data:image/svg+xml;base64,', ''));
            expect(svgString).toContain('#ff0000');
        });
    });

    describe('validateSeedRecord', () => {
        it('should validate complete record', () => {
            const record = {
                id: 'seed-test-001',
                name: 'Test',
                email: 'test@test.com',
            };

            const result = validateSeedRecord(record, ['id', 'name', 'email']);

            expect(result.isValid).toBe(true);
            expect(result.missingFields).toHaveLength(0);
        });

        it('should detect missing fields', () => {
            const record = {
                id: 'seed-test-001',
                name: '',
                email: null,
            };

            const result = validateSeedRecord(record, ['id', 'name', 'email']);

            expect(result.isValid).toBe(false);
            expect(result.missingFields).toContain('name');
            expect(result.missingFields).toContain('email');
        });
    });

    describe('SEED_CONSTANTS', () => {
        it('should have all user IDs', () => {
            expect(SEED_CONSTANTS.RENTER_TAG).toBe('seed-renter-001');
            expect(SEED_CONSTANTS.LANDLORD_TAG).toBe('seed-landlord-001');
            expect(SEED_CONSTANTS.ESTATE_AGENT_TAG).toBe('seed-agent-001');
            expect(SEED_CONSTANTS.MANAGEMENT_AGENCY_TAG).toBe('seed-mgmt-001');
        });

        it('should have all property IDs', () => {
            expect(SEED_CONSTANTS.PROPERTY_1_TAG).toBe('seed-property-001');
            expect(SEED_CONSTANTS.PROPERTY_2_TAG).toBe('seed-property-002');
            expect(SEED_CONSTANTS.PROPERTY_3_TAG).toBe('seed-property-003');
            expect(SEED_CONSTANTS.PROPERTY_4_TAG).toBe('seed-property-004');
            expect(SEED_CONSTANTS.PROPERTY_5_TAG).toBe('seed-property-005');
        });

        it('should have default password', () => {
            expect(SEED_CONSTANTS.DEFAULT_PASSWORD).toBe('TestUser123!');
        });
    });
});
