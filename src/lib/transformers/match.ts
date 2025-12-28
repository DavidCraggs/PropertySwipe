/**
 * Match Transformer
 * Handles conversion between Supabase snake_case and TypeScript camelCase
 */

import type { Match, ViewingPreference, Message, RenterProfile } from '../../types';
import type { DbRecord } from './index';

/**
 * Transform a Supabase match record to a TypeScript Match object
 */
export const transformMatch = (m: DbRecord): Match => ({
  id: m.id as string,
  renterId: m.renter_id as string,
  landlordId: m.landlord_id as string,
  propertyId: m.property_id as string,
  managingAgencyId: (m.managing_agency_id as string) || undefined,
  marketingAgentId: (m.marketing_agent_id as string) || undefined,

  renterName: m.renter_name as string,
  landlordName: (m.landlord_name as string) || 'Landlord',
  renterProfile: m.renter_profile as RenterProfile | undefined,

  timestamp: m.created_at as string,
  messages: (m.messages as Message[]) || [],
  lastMessageAt: m.last_message_at as string,
  unreadCount: (m.unread_count as number) || 0,

  // Viewing
  hasViewingScheduled: (m.has_viewing_scheduled as boolean) || false,
  confirmedViewingDate: m.confirmed_viewing_date as string | undefined,
  viewingPreference: m.viewing_preference as ViewingPreference | undefined,

  // Application
  applicationStatus: m.application_status as Match['applicationStatus'],
  applicationSubmittedAt: m.application_submitted_at as string | undefined,
  depositPaid: (m.deposit_paid as boolean) || false,
  depositPaidDate: m.deposit_paid_date as string | undefined,
  firstMonthRentPaid: (m.first_month_rent_paid as boolean) || false,
  firstMonthRentPaidDate: m.first_month_rent_paid_date as string | undefined,

  // Tenancy
  tenancyStartDate: m.tenancy_start_date as string | undefined,
  tenancyEndDate: m.tenancy_end_date as string | undefined,
  tenancyStatus: (m.tenancy_status as Match['tenancyStatus']) || 'prospective',

  // Ratings
  canRate: (m.can_rate as boolean) || false,
  hasLandlordRated: (m.has_landlord_rated as boolean) || false,
  hasRenterRated: (m.has_renter_rated as boolean) || false,
  landlordRatingId: m.landlord_rating_id as string | undefined,
  renterRatingId: m.renter_rating_id as string | undefined,

  // Issues
  isUnderEvictionProceedings: (m.is_under_eviction_proceedings as boolean) || false,
  rentArrears: (m.rent_arrears as number) || 0,
  activeIssueIds: (m.active_issue_ids as string[]) || [],
  totalIssuesRaised: (m.total_issues_raised as number) || 0,
  totalIssuesResolved: (m.total_issues_resolved as number) || 0,

  // Pet request
  petRequestStatus: (m.pet_request_status as Match['petRequestStatus']) || 'none',
  petRequestDetails: m.pet_request_details as string | undefined,
  petRefusalReason: m.pet_refusal_reason as string | undefined,
});

/**
 * Transform a TypeScript Match object to Supabase format for saving
 */
export const transformMatchToDb = (match: Partial<Match>): Record<string, unknown> => ({
  id: match.id,
  renter_id: match.renterId,
  landlord_id: match.landlordId,
  property_id: match.propertyId,
  managing_agency_id: match.managingAgencyId || null,
  marketing_agent_id: match.marketingAgentId || null,

  renter_name: match.renterName,
  landlord_name: match.landlordName,
  renter_profile: match.renterProfile,

  messages: match.messages,
  last_message_at: match.lastMessageAt,
  unread_count: match.unreadCount,

  // Viewing
  has_viewing_scheduled: match.hasViewingScheduled,
  confirmed_viewing_date: match.confirmedViewingDate,
  viewing_preference: match.viewingPreference,

  // Application
  application_status: match.applicationStatus,
  application_submitted_at: match.applicationSubmittedAt,
  deposit_paid: match.depositPaid,
  deposit_paid_date: match.depositPaidDate,
  first_month_rent_paid: match.firstMonthRentPaid,
  first_month_rent_paid_date: match.firstMonthRentPaidDate,

  // Tenancy
  tenancy_start_date: match.tenancyStartDate,
  tenancy_end_date: match.tenancyEndDate,
  tenancy_status: match.tenancyStatus,

  // Ratings
  can_rate: match.canRate,
  has_landlord_rated: match.hasLandlordRated,
  has_renter_rated: match.hasRenterRated,
  landlord_rating_id: match.landlordRatingId,
  renter_rating_id: match.renterRatingId,

  // Issues
  is_under_eviction_proceedings: match.isUnderEvictionProceedings,
  rent_arrears: match.rentArrears,
  active_issue_ids: match.activeIssueIds,
  total_issues_raised: match.totalIssuesRaised,
  total_issues_resolved: match.totalIssuesResolved,

  // Pet request
  pet_request_status: match.petRequestStatus,
  pet_request_details: match.petRequestDetails,
  pet_refusal_reason: match.petRefusalReason,
});
