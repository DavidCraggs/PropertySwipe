/**
 * Issue Transformer
 * Handles conversion between Supabase snake_case and TypeScript camelCase
 */

import type { Issue, Message } from '../../types';
import type { DbRecord } from './index';

/**
 * Transform a Supabase issues record to a TypeScript Issue object
 */
export const transformIssue = (d: DbRecord): Issue => ({
  id: d.id as string,
  matchId: d.match_id as string,
  propertyId: d.property_id as string,
  renterId: d.renter_id as string,
  landlordId: d.landlord_id as string,
  agencyId: d.agency_id as string | undefined,

  // Issue details
  category: d.category as Issue['category'],
  title: d.title as string,
  description: d.description as string,
  priority: d.priority as Issue['priority'],
  status: d.status as Issue['status'],

  // Media
  images: (d.images as string[]) || [],

  // Communication
  messages: (d.messages as Message[]) || [],

  // SLA tracking
  reportedAt: d.reported_at as string,
  acknowledgedAt: d.acknowledged_at as string | undefined,
  resolvedAt: d.resolved_at as string | undefined,
  slaDeadline: d.sla_deadline as string | undefined,
  slaMet: d.sla_met as boolean | undefined,

  // Resolution
  resolutionNotes: d.resolution_notes as string | undefined,
  resolvedBy: d.resolved_by as string | undefined,

  // Awaab's Law compliance
  isHealthAndSafetyHazard: (d.is_health_and_safety_hazard as boolean) || false,
  hazardType: d.hazard_type as Issue['hazardType'],

  // Timestamps
  createdAt: d.created_at as string,
  updatedAt: d.updated_at as string,

  // Tags
  seedTag: d.seed_tag as string | undefined,
});

/**
 * Transform a TypeScript Issue object to Supabase format for saving
 */
export const transformIssueToDb = (issue: Partial<Issue>): Record<string, unknown> => ({
  id: issue.id,
  match_id: issue.matchId,
  property_id: issue.propertyId,
  renter_id: issue.renterId,
  landlord_id: issue.landlordId,
  agency_id: issue.agencyId || null,

  // Issue details
  category: issue.category,
  title: issue.title,
  description: issue.description,
  priority: issue.priority,
  status: issue.status,

  // Media
  images: issue.images,

  // Communication
  messages: issue.messages,

  // SLA tracking
  reported_at: issue.reportedAt,
  acknowledged_at: issue.acknowledgedAt,
  resolved_at: issue.resolvedAt,
  sla_deadline: issue.slaDeadline,
  sla_met: issue.slaMet,

  // Resolution
  resolution_notes: issue.resolutionNotes,
  resolved_by: issue.resolvedBy,

  // Awaab's Law compliance
  is_health_and_safety_hazard: issue.isHealthAndSafetyHazard,
  hazard_type: issue.hazardType,

  // Tags
  seed_tag: issue.seedTag,
});
