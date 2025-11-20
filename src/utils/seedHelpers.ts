/**
 * Helper utilities for seeding test data
 * All seed data uses IDs with 'seed-' prefix for easy identification and cleanup
 */

import { addDays, addHours, subDays, set } from 'date-fns';

/**
 * Generate a UUID with 'seed-' prefix for test data
 */
export function generateSeedId(type: string, index?: number): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    const suffix = index !== undefined ? `-${index.toString().padStart(3, '0')}` : '';
    return `seed-${type}-${timestamp}${random}${suffix}`;
}

/**
 * Check if an ID is a seed data ID
 */
export function isSeedId(id: string): boolean {
    return id.startsWith('seed-');
}

/**
 * Generate realistic property descriptions
 */
export function generatePropertyDescription(params: {
    bedrooms: number;
    propertyType: string;
    area: string;
    features: string[];
}): string {
    const { bedrooms, propertyType, area, features } = params;

    const intros = [
        `Stunning ${bedrooms}-bedroom ${propertyType} located in the heart of ${area}.`,
        `Beautiful ${bedrooms}-bedroom ${propertyType} in desirable ${area}.`,
        `Exceptional ${bedrooms}-bedroom ${propertyType} offering modern living in ${area}.`,
    ];

    const descriptions = [
        `This property has been recently renovated to a high standard throughout.`,
        `The accommodation is presented in excellent decorative order.`,
        `Benefiting from modern fixtures and fittings throughout.`,
    ];

    const featureText = features.length > 0
        ? `Key features include ${features.join(', ').toLowerCase()}.`
        : '';

    const outro = `Early viewing is highly recommended to avoid disappointment. Available for immediate occupation.`;

    return `${intros[Math.floor(Math.random() * intros.length)]} ${descriptions[Math.floor(Math.random() * descriptions.length)]} ${featureText} ${outro}`.trim();
}

/**
 * Generate a date in the past (for historical data)
 */
export function daysAgo(days: number): Date {
    return subDays(new Date(), days);
}

/**
 * Generate a date in the future (for scheduled events)
 */
export function daysFromNow(days: number): Date {
    return addDays(new Date(), days);
}

/**
 * Generate a date with specific time
 */
export function dateAtTime(date: Date, hours: number, minutes: number = 0): Date {
    return set(date, { hours, minutes, seconds: 0, milliseconds: 0 });
}

/**
 * Generate a realistic timestamp for a message based on conversation day
 */
export function conversationTimestamp(dayOffset: number, messageIndex: number): Date {
    const baseDate = daysAgo(Math.abs(dayOffset));
    // Spread messages throughout the day (9am - 8pm)
    const hour = 9 + (messageIndex % 2) * 5; // Alternate between morning and afternoon
    const minute = Math.floor(Math.random() * 60);
    return set(baseDate, { hours: hour, minutes: minute, seconds: 0, milliseconds: 0 });
}

/**
 * Calculate SLA deadline based on priority
 */
export function calculateSLADeadline(
    raisedAt: Date,
    priority: 'emergency' | 'urgent' | 'routine' | 'low'
): Date {
    const slaHours: Record<typeof priority, number> = {
        emergency: 4,
        urgent: 24,
        routine: 24 * 5, // 5 days
        low: 24 * 7, // 7 days
    };

    return addHours(raisedAt, slaHours[priority]);
}

/**
 * Validate that a date is not in the past (for future events)
 */
export function isValidFutureDate(date: Date): boolean {
    return date > new Date();
}

/**
 * Validate that a date is in the past (for historical events)
 */
export function isValidPastDate(date: Date): boolean {
    return date < new Date();
}

/**
 * Generate a realistic UK postcode (Liverpool area)
 */
export function generateLiverpoolPostcode(area: string = 'L1'): string {
    const districts = ['L1', 'L2', 'L3', 'L8', 'L18'];
    const selectedArea = districts.includes(area) ? area : districts[0];
    const number = Math.floor(Math.random() * 9) + 1;
    const letters = 'ABDEFGHJLNPQRSTUWXYZ';
    const letter1 = letters[Math.floor(Math.random() * letters.length)];
    const letter2 = letters[Math.floor(Math.random() * letters.length)];

    return `${selectedArea} ${number}${letter1}${letter2}`;
}

/**
 * Generate placeholder image data URI (solid color for property images)
 */
export function generatePlaceholderImage(
    width: number = 800,
    height: number = 600,
    color: string = '4f46e5' // Indigo
): string {
    // Create a simple SVG placeholder
    const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#${color}"/>
      <text
        x="50%"
        y="50%"
        font-family="Arial, sans-serif"
        font-size="24"
        fill="white"
        text-anchor="middle"
        dominant-baseline="middle"
      >
        Property Image
      </text>
    </svg>
  `.trim();

    return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Validate seed data completeness
 */
export function validateSeedRecord<T extends Record<string, any>>(
    record: T,
    requiredFields: (keyof T)[]
): { isValid: boolean; missingFields: string[] } {
    const missingFields: string[] = [];

    for (const field of requiredFields) {
        if (record[field] === undefined || record[field] === null || record[field] === '') {
            missingFields.push(String(field));
        }
    }

    return {
        isValid: missingFields.length === 0,
        missingFields,
    };
}

/**
 * Constants for seed data
 * These are seed_tag values, not IDs (IDs are auto-generated UUIDs)
 */
export const SEED_CONSTANTS = {
    // User seed tags
    RENTER_TAG: 'seed-renter-001',
    LANDLORD_TAG: 'seed-landlord-001',
    ESTATE_AGENT_TAG: 'seed-agent-001',
    MANAGEMENT_AGENCY_TAG: 'seed-mgmt-001',

    // Property seed tags
    PROPERTY_1_TAG: 'seed-property-001',
    PROPERTY_2_TAG: 'seed-property-002',
    PROPERTY_3_TAG: 'seed-property-003',
    PROPERTY_4_TAG: 'seed-property-004',
    PROPERTY_5_TAG: 'seed-property-005',

    // Match seed tags
    MATCH_1_TAG: 'seed-match-001',
    MATCH_2_TAG: 'seed-match-002',
    MATCH_3_TAG: 'seed-match-003',
    MATCH_4_TAG: 'seed-match-004',
    MATCH_PAST_TAG: 'seed-match-past-001', // For rating demo

    // Common
    EMAIL_DOMAIN: 'test.geton.com',
    DEFAULT_PASSWORD: 'TestUser123!',
} as const;

