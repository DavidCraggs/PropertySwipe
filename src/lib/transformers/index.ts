/**
 * Centralized Database Transformers
 *
 * These functions handle the transformation between Supabase's snake_case column names
 * and the TypeScript camelCase interface properties.
 *
 * Usage:
 * - Import individual transformers: import { transformProperty } from '../lib/transformers';
 * - Import all: import * as transformers from '../lib/transformers';
 */

export { transformProperty, transformPropertyToDb } from './property';
export { transformMatch, transformMatchToDb } from './match';
export { transformRenterProfile, transformRenterProfileToDb } from './renterProfile';
export { transformLandlordProfile, transformLandlordProfileToDb } from './landlordProfile';
export { transformAgencyProfile, transformAgencyProfileToDb } from './agencyProfile';
export { transformIssue, transformIssueToDb } from './issue';
export { transformConversation, transformConversationToDb } from './conversation';

// Utility types for database records
export type DbRecord = Record<string, unknown>;
