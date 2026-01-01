/**
 * Match Transformer
 * Handles conversion between Supabase snake_case and TypeScript camelCase
 */

import type { Match, ViewingPreference, Message, RenterProfile, Property, TenancyStatus, EvictionGround } from '../../types';
import type { DbRecord } from './index';

/**
 * Transform a Supabase match record to a TypeScript Match object
 */
export const transformMatch = (m: DbRecord): Match => ({
  id: m.id as string,
  renterId: m.renter_id as string,
  landlordId: m.landlord_id as string,
  propertyId: m.property_id as string,
  property: m.property as Property,

  renterName: (m.renter_name as string) || '',
  landlordName: (m.landlord_name as string) || 'Landlord',
  renterProfile: m.renter_profile as RenterProfile | undefined,

  timestamp: m.created_at as string,

  // Legacy message fields (deprecated but kept for compatibility)
  messages: (m.messages as Message[]) || [],
  lastMessageAt: m.last_message_at as string | undefined,
  unreadCount: (m.unread_count as number) || 0,

  // Dual-conversation system
  conversations: m.conversations as Match['conversations'],

  // Viewing
  viewingPreference: m.viewing_preference as ViewingPreference | undefined,
  hasViewingScheduled: (m.has_viewing_scheduled as boolean) || false,
  confirmedViewingDate: m.confirmed_viewing_date ? new Date(m.confirmed_viewing_date as string) : undefined,

  // Application
  applicationStatus: (m.application_status as Match['applicationStatus']) || 'pending',
  applicationSubmittedAt: m.application_submitted_at ? new Date(m.application_submitted_at as string) : undefined,

  // Tenancy
  tenancyStartDate: m.tenancy_start_date ? new Date(m.tenancy_start_date as string) : undefined,
  tenancyNoticedDate: m.tenancy_noticed_date ? new Date(m.tenancy_noticed_date as string) : undefined,
  expectedMoveOutDate: m.expected_move_out_date ? new Date(m.expected_move_out_date as string) : undefined,
  tenancyCompletedAt: m.tenancy_completed_at ? new Date(m.tenancy_completed_at as string) : undefined,
  tenancyEndReason: m.tenancy_end_reason as 'tenant_notice' | EvictionGround | undefined,
  tenancyStatus: (m.tenancy_status as TenancyStatus) || 'prospective',

  // Ratings
  canRate: (m.can_rate as boolean) || false,
  hasLandlordRated: (m.has_landlord_rated as boolean) || false,
  hasRenterRated: (m.has_renter_rated as boolean) || false,
  landlordRatingId: m.landlord_rating_id as string | undefined,
  renterRatingId: m.renter_rating_id as string | undefined,

  // Eviction tracking
  evictionNotice: m.eviction_notice as Match['evictionNotice'],
  isUnderEvictionProceedings: (m.is_under_eviction_proceedings as boolean) || false,

  // Rent arrears
  rentArrears: {
    totalOwed: (m.rent_arrears_total_owed as number) || 0,
    monthsMissed: (m.rent_arrears_months_missed as number) || 0,
    consecutiveMonthsMissed: (m.rent_arrears_consecutive_months as number) || 0,
    lastPaymentDate: m.rent_arrears_last_payment ? new Date(m.rent_arrears_last_payment as string) : undefined,
  },

  // Agency involvement
  managingAgencyId: m.managing_agency_id as string | undefined,
  marketingAgentId: m.marketing_agent_id as string | undefined,

  // Financial data
  monthlyRentAmount: m.monthly_rent_amount as number | undefined,
  depositAmount: m.deposit_amount as number | undefined,
  depositSchemeReference: m.deposit_scheme_reference as string | undefined,

  // RRA 2025 Compliance
  rightToRentVerifiedAt: m.right_to_rent_verified_at ? new Date(m.right_to_rent_verified_at as string) : undefined,
  petRequestStatus: m.pet_request_status as Match['petRequestStatus'],
  petRefusalReason: m.pet_refusal_reason as string | undefined,

  // Issue tracking
  activeIssueIds: (m.active_issue_ids as string[]) || [],
  totalIssuesRaised: (m.total_issues_raised as number) || 0,
  totalIssuesResolved: (m.total_issues_resolved as number) || 0,
});

/**
 * Transform a TypeScript Match object to Supabase format for saving
 */
export const transformMatchToDb = (match: Partial<Match>): Record<string, unknown> => ({
  id: match.id,
  renter_id: match.renterId,
  landlord_id: match.landlordId,
  property_id: match.propertyId,

  renter_name: match.renterName,
  landlord_name: match.landlordName,
  renter_profile: match.renterProfile,

  // Legacy message fields
  messages: match.messages,
  last_message_at: match.lastMessageAt,
  unread_count: match.unreadCount,

  // Dual-conversation system
  conversations: match.conversations,

  // Viewing
  has_viewing_scheduled: match.hasViewingScheduled,
  confirmed_viewing_date: match.confirmedViewingDate?.toISOString(),
  viewing_preference: match.viewingPreference,

  // Application
  application_status: match.applicationStatus,
  application_submitted_at: match.applicationSubmittedAt?.toISOString(),

  // Tenancy
  tenancy_start_date: match.tenancyStartDate?.toISOString(),
  tenancy_noticed_date: match.tenancyNoticedDate?.toISOString(),
  expected_move_out_date: match.expectedMoveOutDate?.toISOString(),
  tenancy_completed_at: match.tenancyCompletedAt?.toISOString(),
  tenancy_end_reason: match.tenancyEndReason,
  tenancy_status: match.tenancyStatus,

  // Ratings
  can_rate: match.canRate,
  has_landlord_rated: match.hasLandlordRated,
  has_renter_rated: match.hasRenterRated,
  landlord_rating_id: match.landlordRatingId,
  renter_rating_id: match.renterRatingId,

  // Eviction tracking
  eviction_notice: match.evictionNotice,
  is_under_eviction_proceedings: match.isUnderEvictionProceedings,

  // Rent arrears
  rent_arrears_total_owed: match.rentArrears?.totalOwed,
  rent_arrears_months_missed: match.rentArrears?.monthsMissed,
  rent_arrears_consecutive_months: match.rentArrears?.consecutiveMonthsMissed,
  rent_arrears_last_payment: match.rentArrears?.lastPaymentDate?.toISOString(),

  // Agency involvement
  managing_agency_id: match.managingAgencyId,
  marketing_agent_id: match.marketingAgentId,

  // Financial data
  monthly_rent_amount: match.monthlyRentAmount,
  deposit_amount: match.depositAmount,
  deposit_scheme_reference: match.depositSchemeReference,

  // RRA 2025 Compliance
  right_to_rent_verified_at: match.rightToRentVerifiedAt?.toISOString(),
  pet_request_status: match.petRequestStatus,
  pet_refusal_reason: match.petRefusalReason,

  // Issue tracking
  active_issue_ids: match.activeIssueIds,
  total_issues_raised: match.totalIssuesRaised,
  total_issues_resolved: match.totalIssuesResolved,
});
