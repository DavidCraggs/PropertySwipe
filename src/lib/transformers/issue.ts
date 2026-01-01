/**
 * Issue Transformer
 * Handles conversion between Supabase snake_case and TypeScript camelCase
 */

import type { Issue, IssueMessage, IssueCategory, IssuePriority, IssueStatus } from '../../types';
import type { DbRecord } from './index';

/**
 * Transform a Supabase issues record to a TypeScript Issue object
 */
export const transformIssue = (d: DbRecord): Issue => ({
  id: d.id as string,
  propertyId: (d.property_id as string) || '',
  renterId: (d.renter_id as string) || '',
  landlordId: (d.landlord_id as string) || '',
  agencyId: d.agency_id as string | undefined,
  assignedToAgentId: d.assigned_to_agent_id as string | undefined,

  // Issue details
  category: (d.category as IssueCategory) || 'other',
  priority: (d.priority as IssuePriority) || 'medium',
  subject: (d.subject as string) || '',
  description: (d.description as string) || '',

  // Media
  images: (d.images as string[]) || [],

  // Timeline
  raisedAt: new Date(d.raised_at as string || d.created_at as string),
  acknowledgedAt: d.acknowledged_at ? new Date(d.acknowledged_at as string) : undefined,
  resolvedAt: d.resolved_at ? new Date(d.resolved_at as string) : undefined,
  closedAt: d.closed_at ? new Date(d.closed_at as string) : undefined,

  // SLA Tracking
  slaDeadline: new Date(d.sla_deadline as string || Date.now() + 24 * 60 * 60 * 1000),
  isOverdue: (d.is_overdue as boolean) || false,
  responseTimeHours: d.response_time_hours as number | undefined,
  resolutionTimeDays: d.resolution_time_days as number | undefined,

  // Status
  status: (d.status as IssueStatus) || 'open',
  statusHistory: (d.status_history as Issue['statusHistory']) || [],

  // Communication
  messages: (d.messages as IssueMessage[]) || [],
  internalNotes: d.internal_notes as string[] | undefined,

  // Resolution
  resolutionSummary: d.resolution_summary as string | undefined,
  resolutionCost: d.resolution_cost as number | undefined,
  renterSatisfactionRating: d.renter_satisfaction_rating as number | undefined,

  // Timestamps
  createdAt: new Date(d.created_at as string),
  updatedAt: new Date(d.updated_at as string),
});

/**
 * Transform a TypeScript Issue object to Supabase format for saving
 */
export const transformIssueToDb = (issue: Partial<Issue>): Record<string, unknown> => ({
  id: issue.id,
  property_id: issue.propertyId,
  renter_id: issue.renterId,
  landlord_id: issue.landlordId,
  agency_id: issue.agencyId || null,
  assigned_to_agent_id: issue.assignedToAgentId || null,

  // Issue details
  category: issue.category,
  priority: issue.priority,
  subject: issue.subject,
  description: issue.description,

  // Media
  images: issue.images,

  // Timeline
  raised_at: issue.raisedAt?.toISOString(),
  acknowledged_at: issue.acknowledgedAt?.toISOString(),
  resolved_at: issue.resolvedAt?.toISOString(),
  closed_at: issue.closedAt?.toISOString(),

  // SLA Tracking
  sla_deadline: issue.slaDeadline?.toISOString(),
  is_overdue: issue.isOverdue,
  response_time_hours: issue.responseTimeHours,
  resolution_time_days: issue.resolutionTimeDays,

  // Status
  status: issue.status,
  status_history: issue.statusHistory,

  // Communication
  messages: issue.messages,
  internal_notes: issue.internalNotes,

  // Resolution
  resolution_summary: issue.resolutionSummary,
  resolution_cost: issue.resolutionCost,
  renter_satisfaction_rating: issue.renterSatisfactionRating,

  // Timestamps
  created_at: issue.createdAt?.toISOString(),
  updated_at: issue.updatedAt?.toISOString(),
});
