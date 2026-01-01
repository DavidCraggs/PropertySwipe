/**
 * Data Deletion Service
 *
 * Implements GDPR Article 17 "Right to Erasure" requirements.
 * Handles complete user data deletion with 30-day grace period.
 *
 * @see {@link https://gdpr-info.eu/art-17-gdpr/} GDPR Article 17
 */

import { supabase } from '../lib/supabase';
import type { UserType } from '../types';

/**
 * Status of a deletion request
 */
export type DeletionStatus =
  | 'pending_verification'
  | 'verified'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Request to delete user data
 */
export interface DeletionRequest {
  id: string;
  userId: string;
  userType: UserType;
  requestedAt: Date;
  verifiedAt?: Date;
  scheduledDeletionDate: Date;
  executedAt?: Date;
  status: DeletionStatus;
  reason?: string;
  verificationToken: string;
  cancellationToken?: string;
}

/**
 * Result of a deletion operation
 */
export interface DeletionResult {
  success: boolean;
  requestId: string;
  tablesAffected: string[];
  recordsDeleted: number;
  anonymizedRecords: number;
  backupsScheduledForDeletion: string[];
  estimatedCompletionDate: Date;
  errors?: string[];
}

/**
 * Configuration for deletion request
 */
export interface DeletionOptions {
  /** Skip 30-day grace period (admin only) */
  skipGracePeriod?: boolean;
  /** Send verification email */
  sendVerificationEmail?: boolean;
  /** Reason for deletion (optional) */
  reason?: string;
}

const GRACE_PERIOD_DAYS = 30;
const VERIFICATION_TOKEN_LENGTH = 32;

/**
 * Data Deletion Service
 *
 * Provides methods for requesting, verifying, and executing user data deletion.
 */
export class DataDeletionService {
  /**
   * Request deletion of user data
   *
   * Creates a deletion request with verification token and schedules
   * deletion after grace period.
   *
   * @param userId - ID of user to delete
   * @param userType - Type of user account
   * @param options - Optional configuration
   * @returns Promise resolving to deletion request
   *
   * @throws {Error} If user not found
   * @throws {Error} If deletion request already exists
   *
   * @example
   * ```typescript
   * const request = await DataDeletionService.requestDeletion(
   *   'user-123',
   *   'renter',
   *   { sendVerificationEmail: true }
   * );
   * ```
   */
  static async requestDeletion(
    userId: string,
    userType: UserType,
    options: DeletionOptions = {}
  ): Promise<DeletionRequest> {
    const { skipGracePeriod = false, sendVerificationEmail = true, reason } = options;

    // Validate user exists
    const userExists = await this.validateUserExists(userId, userType);
    if (!userExists) {
      throw new Error(`User ${userId} not found`);
    }

    // Check for existing deletion request
    const existingRequest = await this.getActiveDeletionRequest(userId);
    if (existingRequest) {
      throw new Error('Deletion request already exists for this user');
    }

    // Generate tokens
    const verificationToken = this.generateToken(VERIFICATION_TOKEN_LENGTH);
    const cancellationToken = this.generateToken(VERIFICATION_TOKEN_LENGTH);

    // Calculate scheduled deletion date
    const gracePeriodDays = skipGracePeriod ? 0 : GRACE_PERIOD_DAYS;
    const scheduledDeletionDate = new Date();
    scheduledDeletionDate.setDate(scheduledDeletionDate.getDate() + gracePeriodDays);

    // Create deletion request
    const request: DeletionRequest = {
      id: crypto.randomUUID(),
      userId,
      userType,
      requestedAt: new Date(),
      scheduledDeletionDate,
      status: 'pending_verification',
      verificationToken,
      cancellationToken,
      reason,
    };

    // Save to database
    if (supabase) {
      const { error } = await supabase.from('deletion_requests').insert({
        id: request.id,
        user_id: userId,
        user_type: userType,
        requested_at: request.requestedAt.toISOString(),
        scheduled_deletion_date: scheduledDeletionDate.toISOString(),
        status: request.status,
        verification_token: verificationToken,
        cancellation_token: cancellationToken,
        reason,
      });

      if (error) {
        console.error('[DataDeletion] Failed to create deletion request:', error);
        throw new Error('Failed to create deletion request');
      }
    } else {
      // Fallback to localStorage for testing
      const requests = this.getLocalRequests();
      requests.push(request);
      localStorage.setItem('deletion_requests', JSON.stringify(requests));
    }

    // Send verification email
    if (sendVerificationEmail) {
      await this.sendVerificationEmail(userId, userType, verificationToken, cancellationToken);
    }

    console.log(`[DataDeletion] Deletion request created for user ${userId}`);
    console.log(`[DataDeletion] Scheduled deletion date: ${scheduledDeletionDate.toISOString()}`);

    return request;
  }

  /**
   * Verify deletion request with token
   *
   * @param verificationToken - Token sent to user's email
   * @returns Promise resolving to updated deletion request
   *
   * @throws {Error} If token is invalid or expired
   */
  static async verifyDeletion(verificationToken: string): Promise<DeletionRequest> {
    // Find request by verification token
    let request: DeletionRequest | null = null;

    if (supabase) {
      const { data, error } = await supabase
        .from('deletion_requests')
        .select('*')
        .eq('verification_token', verificationToken)
        .eq('status', 'pending_verification')
        .single();

      if (error || !data) {
        throw new Error('Invalid or expired verification token');
      }

      // Update status
      const { error: updateError } = await supabase
        .from('deletion_requests')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
        })
        .eq('id', data.id);

      if (updateError) {
        throw new Error('Failed to verify deletion request');
      }

      request = this.mapFromDatabase(data);
    } else {
      // localStorage fallback
      const requests = this.getLocalRequests();
      const index = requests.findIndex(
        (r) => r.verificationToken === verificationToken && r.status === 'pending_verification'
      );

      if (index === -1) {
        throw new Error('Invalid or expired verification token');
      }

      requests[index].status = 'verified';
      requests[index].verifiedAt = new Date();
      localStorage.setItem('deletion_requests', JSON.stringify(requests));
      request = requests[index];
    }

    console.log(`[DataDeletion] Deletion verified for request ${request.id}`);
    return request;
  }

  /**
   * Cancel pending deletion request
   *
   * @param cancellationToken - Token sent to user's email
   * @returns Promise resolving to cancelled request
   *
   * @throws {Error} If token is invalid or deletion already executed
   */
  static async cancelDeletion(cancellationToken: string): Promise<DeletionRequest> {
    if (supabase) {
      const { data, error } = await supabase
        .from('deletion_requests')
        .select('*')
        .eq('cancellation_token', cancellationToken)
        .in('status', ['pending_verification', 'verified'])
        .single();

      if (error || !data) {
        throw new Error('Invalid cancellation token or deletion already executed');
      }

      // Update status
      const { error: updateError } = await supabase
        .from('deletion_requests')
        .update({ status: 'cancelled' })
        .eq('id', data.id);

      if (updateError) {
        throw new Error('Failed to cancel deletion request');
      }

      console.log(`[DataDeletion] Deletion cancelled for request ${data.id}`);
      return this.mapFromDatabase(data);
    } else {
      // localStorage fallback
      const requests = this.getLocalRequests();
      const index = requests.findIndex(
        (r) =>
          r.cancellationToken === cancellationToken &&
          ['pending_verification', 'verified'].includes(r.status)
      );

      if (index === -1) {
        throw new Error('Invalid cancellation token or deletion already executed');
      }

      requests[index].status = 'cancelled';
      localStorage.setItem('deletion_requests', JSON.stringify(requests));
      return requests[index];
    }
  }

  /**
   * Execute pending deletion requests
   *
   * Should be called by scheduled job to process verified requests
   * past their grace period.
   *
   * @returns Promise resolving to array of deletion results
   */
  static async executePendingDeletions(): Promise<DeletionResult[]> {
    const now = new Date();
    const results: DeletionResult[] = [];

    // Get verified requests past grace period
    const pendingRequests = await this.getPendingDeletions(now);

    console.log(`[DataDeletion] Processing ${pendingRequests.length} pending deletions`);

    for (const request of pendingRequests) {
      try {
        // Update status to processing
        await this.updateRequestStatus(request.id, 'processing');

        // Execute deletion
        const result = await this.executeDeletion(request);
        results.push(result);

        // Update status to completed
        await this.updateRequestStatus(request.id, 'completed', new Date());
      } catch (error) {
        console.error(`[DataDeletion] Failed to delete user ${request.userId}:`, error);
        await this.updateRequestStatus(request.id, 'failed');
        results.push({
          success: false,
          requestId: request.id,
          tablesAffected: [],
          recordsDeleted: 0,
          anonymizedRecords: 0,
          backupsScheduledForDeletion: [],
          estimatedCompletionDate: new Date(),
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        });
      }
    }

    return results;
  }

  /**
   * Execute deletion for a single user
   *
   * @param request - Deletion request to execute
   * @returns Promise resolving to deletion result
   */
  private static async executeDeletion(request: DeletionRequest): Promise<DeletionResult> {
    const { userId, userType } = request;
    const tablesAffected: string[] = [];
    let recordsDeleted = 0;
    let anonymizedRecords = 0;

    console.log(`[DataDeletion] Executing deletion for user ${userId} (${userType})`);

    if (supabase) {
      // Delete from all related tables
      const deletionTables = this.getDeletionTables(userType);

      for (const table of deletionTables) {
        try {
          const { error, count } = await supabase
            .from(table.name)
            .delete({ count: 'exact' })
            .eq(table.userIdColumn, userId);

          if (error) {
            console.error(`[DataDeletion] Error deleting from ${table.name}:`, error);
          } else {
            tablesAffected.push(table.name);
            recordsDeleted += count ?? 0;
            console.log(`[DataDeletion] Deleted ${count} records from ${table.name}`);
          }
        } catch (error) {
          console.error(`[DataDeletion] Exception deleting from ${table.name}:`, error);
        }
      }

      // Anonymize data that cannot be deleted (e.g., ratings, aggregate stats)
      const anonymizationResult = await this.anonymizeUserData(userId, userType);
      anonymizedRecords = anonymizationResult.recordsAnonymized;
      tablesAffected.push(...anonymizationResult.tablesAffected);

    } else {
      // localStorage fallback - clear all user data
      const keysToRemove = Object.keys(localStorage).filter((key) =>
        key.includes(userId)
      );
      keysToRemove.forEach((key) => localStorage.removeItem(key));
      recordsDeleted = keysToRemove.length;
      tablesAffected.push('localStorage');
    }

    console.log(`[DataDeletion] Deletion complete for user ${userId}`);
    console.log(`[DataDeletion] Tables affected: ${tablesAffected.length}`);
    console.log(`[DataDeletion] Records deleted: ${recordsDeleted}`);
    console.log(`[DataDeletion] Records anonymized: ${anonymizedRecords}`);

    return {
      success: true,
      requestId: request.id,
      tablesAffected,
      recordsDeleted,
      anonymizedRecords,
      backupsScheduledForDeletion: [], // TODO: Integrate with backup system
      estimatedCompletionDate: new Date(),
    };
  }

  /**
   * Get tables that need deletion for a user type
   */
  private static getDeletionTables(
    userType: UserType
  ): Array<{ name: string; userIdColumn: string }> {
    const commonTables = [
      { name: 'matches', userIdColumn: 'renter_id' },
      { name: 'interests', userIdColumn: 'renter_id' },
      { name: 'conversations', userIdColumn: 'renter_id' }, // Will cascade to messages
      { name: 'viewing_requests', userIdColumn: 'renter_id' },
      { name: 'issues', userIdColumn: 'renter_id' },
      { name: 'agency_link_invitations', userIdColumn: 'landlord_id' },
      { name: 'email_notifications', userIdColumn: 'recipient_id' },
    ];

    switch (userType) {
      case 'renter':
        return [
          { name: 'renter_profiles', userIdColumn: 'id' },
          ...commonTables.filter((t) => t.userIdColumn === 'renter_id'),
          { name: 'renter_invites', userIdColumn: 'accepted_by_renter_id' },
        ];

      case 'landlord':
        return [
          { name: 'landlord_profiles', userIdColumn: 'id' },
          { name: 'properties', userIdColumn: 'landlord_id' },
          { name: 'matches', userIdColumn: 'landlord_id' },
          { name: 'interests', userIdColumn: 'landlord_id' },
          { name: 'agency_link_invitations', userIdColumn: 'landlord_id' },
          { name: 'agency_property_links', userIdColumn: 'landlord_id' },
        ];

      case 'estate_agent':
      case 'management_agency':
        return [
          { name: 'agency_profiles', userIdColumn: 'id' },
          { name: 'agency_link_invitations', userIdColumn: 'agency_id' },
          { name: 'agency_property_links', userIdColumn: 'agency_id' },
          { name: 'issues', userIdColumn: 'agency_id' },
        ];

      case 'admin':
        return [{ name: 'admin_profiles', userIdColumn: 'id' }];

      default:
        return [];
    }
  }

  /**
   * Anonymize user data that cannot be deleted
   */
  private static async anonymizeUserData(
    userId: string,
    _userType: UserType
  ): Promise<{ recordsAnonymized: number; tablesAffected: string[] }> {
    let recordsAnonymized = 0;
    const tablesAffected: string[] = [];

    if (!supabase) {
      return { recordsAnonymized: 0, tablesAffected: [] };
    }

    // Anonymize ratings (keep for aggregate stats)
    const { error: ratingError, count: ratingCount } = await supabase
      .from('ratings')
      .update({
        from_user_id: '[DELETED]',
        to_user_id: '[DELETED]',
        review: '[User deleted their account]',
      })
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);

    if (!ratingError && ratingCount) {
      recordsAnonymized += ratingCount;
      tablesAffected.push('ratings');
    }

    // Note: Messages are now stored inside conversations as JSONB arrays
    // When matches are deleted (CASCADE), conversations are also deleted
    // So we don't need to anonymize individual messages here
    // They will be removed when the user's matches are deleted in the full deletion process

    return { recordsAnonymized, tablesAffected };
  }

  /**
   * Validate user exists
   */
  private static async validateUserExists(userId: string, userType: UserType): Promise<boolean> {
    const table = this.getUserTable(userType);

    if (supabase) {
      const { data, error } = await supabase.from(table).select('id').eq('id', userId).single();
      return !error && !!data;
    } else {
      // localStorage fallback
      const stored = localStorage.getItem(`${userType}_profiles`);
      if (!stored) return false;
      const profiles = JSON.parse(stored);
      return profiles.some((p: { id: string }) => p.id === userId);
    }
  }

  /**
   * Get active deletion request for user
   */
  private static async getActiveDeletionRequest(
    userId: string
  ): Promise<DeletionRequest | null> {
    if (supabase) {
      const { data, error } = await supabase
        .from('deletion_requests')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['pending_verification', 'verified', 'processing'])
        .single();

      if (error || !data) return null;
      return this.mapFromDatabase(data);
    } else {
      const requests = this.getLocalRequests();
      return (
        requests.find(
          (r) =>
            r.userId === userId &&
            ['pending_verification', 'verified', 'processing'].includes(r.status)
        ) ?? null
      );
    }
  }

  /**
   * Get pending deletions past grace period
   */
  private static async getPendingDeletions(now: Date): Promise<DeletionRequest[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('deletion_requests')
        .select('*')
        .eq('status', 'verified')
        .lte('scheduled_deletion_date', now.toISOString());

      if (error || !data) return [];
      return data.map(this.mapFromDatabase);
    } else {
      const requests = this.getLocalRequests();
      return requests.filter(
        (r) => r.status === 'verified' && r.scheduledDeletionDate <= now
      );
    }
  }

  /**
   * Update deletion request status
   */
  private static async updateRequestStatus(
    requestId: string,
    status: DeletionStatus,
    executedAt?: Date
  ): Promise<void> {
    if (supabase) {
      const updates: Record<string, string> = { status };
      if (executedAt) {
        updates.executed_at = executedAt.toISOString();
      }

      await supabase.from('deletion_requests').update(updates).eq('id', requestId);
    } else {
      const requests = this.getLocalRequests();
      const index = requests.findIndex((r) => r.id === requestId);
      if (index !== -1) {
        requests[index].status = status;
        if (executedAt) {
          requests[index].executedAt = executedAt;
        }
        localStorage.setItem('deletion_requests', JSON.stringify(requests));
      }
    }
  }

  /**
   * Send verification email
   */
  private static async sendVerificationEmail(
    userId: string,
    _userType: UserType,
    verificationToken: string,
    cancellationToken: string
  ): Promise<void> {
    // TODO: Integrate with EmailService
    const verificationUrl = `${window.location.origin}/verify-deletion?token=${verificationToken}`;
    const cancellationUrl = `${window.location.origin}/cancel-deletion?token=${cancellationToken}`;

    console.log(`[DataDeletion] Verification email would be sent to user ${userId}`);
    console.log(`[DataDeletion] Verification URL: ${verificationUrl}`);
    console.log(`[DataDeletion] Cancellation URL: ${cancellationUrl}`);

    // Email content would include:
    // - Grace period explanation (30 days)
    // - Verification link
    // - Cancellation link
    // - What data will be deleted
  }

  /**
   * Generate secure random token
   */
  private static generateToken(length: number): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get user table name for user type
   */
  private static getUserTable(userType: UserType): string {
    switch (userType) {
      case 'renter':
        return 'renter_profiles';
      case 'landlord':
        return 'landlord_profiles';
      case 'estate_agent':
      case 'management_agency':
        return 'agency_profiles';
      case 'admin':
        return 'admin_profiles';
      default:
        throw new Error(`Unknown user type: ${userType}`);
    }
  }

  /**
   * Get deletion requests from localStorage
   */
  private static getLocalRequests(): DeletionRequest[] {
    const stored = localStorage.getItem('deletion_requests');
    if (!stored) return [];

    const requests = JSON.parse(stored);
    return requests.map((r: DeletionRequest) => ({
      ...r,
      requestedAt: new Date(r.requestedAt),
      verifiedAt: r.verifiedAt ? new Date(r.verifiedAt) : undefined,
      scheduledDeletionDate: new Date(r.scheduledDeletionDate),
      executedAt: r.executedAt ? new Date(r.executedAt) : undefined,
    }));
  }

  /**
   * Map database record to DeletionRequest
   */
  private static mapFromDatabase(data: Record<string, unknown>): DeletionRequest {
    return {
      id: data.id as string,
      userId: data.user_id as string,
      userType: data.user_type as UserType,
      requestedAt: new Date(data.requested_at as string),
      verifiedAt: data.verified_at ? new Date(data.verified_at as string) : undefined,
      scheduledDeletionDate: new Date(data.scheduled_deletion_date as string),
      executedAt: data.executed_at ? new Date(data.executed_at as string) : undefined,
      status: data.status as DeletionStatus,
      reason: data.reason as string | undefined,
      verificationToken: data.verification_token as string,
      cancellationToken: data.cancellation_token as string | undefined,
    };
  }
}
