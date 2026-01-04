/**
 * Audit Log Service
 *
 * Comprehensive audit logging for compliance and security.
 * Tracks all significant user actions and system events.
 */

import { supabase } from '../lib/supabase';

// =====================================================
// TYPES
// =====================================================

export type AuditCategory =
  | 'authentication'
  | 'authorization'
  | 'data_access'
  | 'data_modification'
  | 'data_deletion'
  | 'verification'
  | 'payment'
  | 'communication'
  | 'system'
  | 'compliance';

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

export type AuditAction =
  // Authentication
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'password_change'
  | 'password_reset'
  | 'mfa_enabled'
  | 'mfa_disabled'
  | 'biometric_registered'
  | 'biometric_used'
  // Authorization
  | 'role_changed'
  | 'permission_granted'
  | 'permission_revoked'
  | 'access_denied'
  // Data Access
  | 'profile_viewed'
  | 'property_viewed'
  | 'document_viewed'
  | 'report_generated'
  | 'data_exported'
  // Data Modification
  | 'profile_updated'
  | 'property_created'
  | 'property_updated'
  | 'match_created'
  | 'viewing_scheduled'
  | 'document_uploaded'
  // Data Deletion
  | 'profile_deleted'
  | 'property_deleted'
  | 'data_deletion_requested'
  | 'data_deletion_completed'
  // Verification
  | 'id_verification_started'
  | 'id_verification_completed'
  | 'right_to_rent_verified'
  | 'prs_registration_verified'
  // Payment
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_cancelled'
  | 'payment_processed'
  | 'payment_failed'
  // Communication
  | 'message_sent'
  | 'notification_sent'
  | 'email_sent'
  // System
  | 'system_error'
  | 'rate_limit_exceeded'
  | 'suspicious_activity'
  // Compliance
  | 'consent_given'
  | 'consent_withdrawn'
  | 'data_subject_request'
  | 'retention_policy_applied';

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId?: string;
  userEmail?: string;
  userType?: 'renter' | 'landlord' | 'agency' | 'admin' | 'system';
  action: AuditAction;
  category: AuditCategory;
  severity: AuditSeverity;
  resourceType?: string;
  resourceId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  success: boolean;
  errorMessage?: string;
}

export interface AuditLogFilter {
  userId?: string;
  action?: AuditAction;
  category?: AuditCategory;
  severity?: AuditSeverity;
  resourceType?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  success?: boolean;
}

export interface AuditStats {
  totalEvents: number;
  byCategory: Record<AuditCategory, number>;
  bySeverity: Record<AuditSeverity, number>;
  failedAttempts: number;
  uniqueUsers: number;
}

// =====================================================
// SERVICE IMPLEMENTATION
// =====================================================

export class AuditLogService {
  private batchQueue: Partial<AuditLogEntry>[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 10;
  private readonly BATCH_DELAY = 5000; // 5 seconds

  // =====================================================
  // LOGGING METHODS
  // =====================================================

  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const fullEntry: Partial<AuditLogEntry> = {
      ...entry,
      timestamp: new Date(),
      ipAddress: await this.getClientIP(),
      userAgent: navigator.userAgent,
      sessionId: this.getSessionId(),
    };

    // Critical and error events are logged immediately
    if (entry.severity === 'critical' || entry.severity === 'error') {
      await this.writeToDatabase([fullEntry]);
    } else {
      this.addToBatch(fullEntry);
    }

    // Also log to console in development
    if (import.meta.env.DEV) {
      console.log('[Audit]', entry.action, entry.description, entry.metadata);
    }
  }

  // =====================================================
  // CONVENIENCE METHODS
  // =====================================================

  async logAuthentication(
    action: 'login' | 'logout' | 'login_failed' | 'password_change' | 'password_reset',
    userId: string | undefined,
    success: boolean,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      userId,
      action,
      category: 'authentication',
      severity: success ? 'info' : 'warning',
      description: `User ${action.replace('_', ' ')}`,
      metadata,
      success,
    });
  }

  async logDataAccess(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: 'profile_viewed' | 'property_viewed' | 'document_viewed' | 'report_generated' | 'data_exported',
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      userId,
      action,
      category: 'data_access',
      severity: 'info',
      resourceType,
      resourceId,
      description: `${resourceType} ${resourceId} accessed`,
      metadata,
      success: true,
    });
  }

  async logDataModification(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: 'profile_updated' | 'property_created' | 'property_updated' | 'match_created' | 'viewing_scheduled' | 'document_uploaded',
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      userId,
      action,
      category: 'data_modification',
      severity: 'info',
      resourceType,
      resourceId,
      description: `${resourceType} ${resourceId} ${action.split('_')[1]}`,
      metadata,
      success: true,
    });
  }

  async logDataDeletion(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: 'profile_deleted' | 'property_deleted' | 'data_deletion_requested' | 'data_deletion_completed',
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      userId,
      action,
      category: 'data_deletion',
      severity: 'warning',
      resourceType,
      resourceId,
      description: `${resourceType} ${resourceId} deletion: ${action}`,
      metadata,
      success: true,
    });
  }

  async logVerification(
    userId: string,
    action: 'id_verification_started' | 'id_verification_completed' | 'right_to_rent_verified' | 'prs_registration_verified',
    success: boolean,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      userId,
      action,
      category: 'verification',
      severity: success ? 'info' : 'warning',
      description: `Verification: ${action.replace(/_/g, ' ')}`,
      metadata,
      success,
    });
  }

  async logPayment(
    userId: string,
    action: 'subscription_created' | 'subscription_updated' | 'subscription_cancelled' | 'payment_processed' | 'payment_failed',
    success: boolean,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      userId,
      action,
      category: 'payment',
      severity: success ? 'info' : 'error',
      description: `Payment: ${action.replace(/_/g, ' ')}`,
      metadata,
      success,
    });
  }

  async logCompliance(
    userId: string,
    action: 'consent_given' | 'consent_withdrawn' | 'data_subject_request' | 'retention_policy_applied',
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      userId,
      action,
      category: 'compliance',
      severity: 'info',
      description: `Compliance: ${action.replace(/_/g, ' ')}`,
      metadata,
      success: true,
    });
  }

  async logSecurityEvent(
    action: 'access_denied' | 'rate_limit_exceeded' | 'suspicious_activity',
    userId: string | undefined,
    description: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      userId,
      action,
      category: action === 'access_denied' ? 'authorization' : 'system',
      severity: 'warning',
      description,
      metadata,
      success: false,
    });
  }

  async logSystemError(
    error: Error,
    context: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      action: 'system_error',
      category: 'system',
      severity: 'error',
      description: `${context}: ${error.message}`,
      metadata: {
        ...metadata,
        errorName: error.name,
        errorStack: error.stack?.slice(0, 500),
      },
      success: false,
      errorMessage: error.message,
    });
  }

  // =====================================================
  // QUERY METHODS
  // =====================================================

  async query(
    filter: AuditLogFilter,
    limit = 100,
    offset = 0
  ): Promise<AuditLogEntry[]> {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filter.userId) query = query.eq('user_id', filter.userId);
    if (filter.action) query = query.eq('action', filter.action);
    if (filter.category) query = query.eq('category', filter.category);
    if (filter.severity) query = query.eq('severity', filter.severity);
    if (filter.resourceType) query = query.eq('resource_type', filter.resourceType);
    if (filter.resourceId) query = query.eq('resource_id', filter.resourceId);
    if (filter.success !== undefined) query = query.eq('success', filter.success);
    if (filter.startDate) query = query.gte('timestamp', filter.startDate.toISOString());
    if (filter.endDate) query = query.lte('timestamp', filter.endDate.toISOString());

    const { data, error } = await query;

    if (error) {
      console.error('Failed to query audit logs:', error);
      return [];
    }

    return (data || []).map(this.mapFromDatabase);
  }

  async getByUser(userId: string, limit = 50): Promise<AuditLogEntry[]> {
    return this.query({ userId }, limit);
  }

  async getByResource(
    resourceType: string,
    resourceId: string,
    limit = 50
  ): Promise<AuditLogEntry[]> {
    return this.query({ resourceType, resourceId }, limit);
  }

  async getRecentSecurityEvents(hours = 24): Promise<AuditLogEntry[]> {
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.query({
      category: 'authorization',
      success: false,
      startDate,
    });
  }

  // =====================================================
  // STATISTICS
  // =====================================================

  async getStats(filter: AuditLogFilter): Promise<AuditStats> {
    let query = supabase.from('audit_logs').select('*');

    if (filter.startDate) query = query.gte('timestamp', filter.startDate.toISOString());
    if (filter.endDate) query = query.lte('timestamp', filter.endDate.toISOString());
    if (filter.userId) query = query.eq('user_id', filter.userId);

    const { data, error } = await query;

    if (error || !data) {
      return {
        totalEvents: 0,
        byCategory: {} as Record<AuditCategory, number>,
        bySeverity: {} as Record<AuditSeverity, number>,
        failedAttempts: 0,
        uniqueUsers: 0,
      };
    }

    const byCategory: Partial<Record<AuditCategory, number>> = {};
    const bySeverity: Partial<Record<AuditSeverity, number>> = {};
    const userIds = new Set<string>();
    let failedAttempts = 0;

    for (const log of data) {
      byCategory[log.category as AuditCategory] = (byCategory[log.category as AuditCategory] || 0) + 1;
      bySeverity[log.severity as AuditSeverity] = (bySeverity[log.severity as AuditSeverity] || 0) + 1;

      if (log.user_id) userIds.add(log.user_id);
      if (!log.success) failedAttempts++;
    }

    return {
      totalEvents: data.length,
      byCategory: byCategory as Record<AuditCategory, number>,
      bySeverity: bySeverity as Record<AuditSeverity, number>,
      failedAttempts,
      uniqueUsers: userIds.size,
    };
  }

  // =====================================================
  // EXPORT & RETENTION
  // =====================================================

  async exportLogs(filter: AuditLogFilter, format: 'json' | 'csv'): Promise<string> {
    const logs = await this.query(filter, 10000);

    if (format === 'csv') {
      const headers = [
        'timestamp',
        'user_id',
        'action',
        'category',
        'severity',
        'resource_type',
        'resource_id',
        'description',
        'success',
        'ip_address',
      ].join(',');

      const rows = logs.map((log) =>
        [
          log.timestamp.toISOString(),
          log.userId || '',
          log.action,
          log.category,
          log.severity,
          log.resourceType || '',
          log.resourceId || '',
          `"${log.description.replace(/"/g, '""')}"`,
          log.success,
          log.ipAddress || '',
        ].join(',')
      );

      return [headers, ...rows].join('\n');
    }

    return JSON.stringify(logs, null, 2);
  }

  async applyRetentionPolicy(retentionDays: number): Promise<number> {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    const { error, count } = await supabase
      .from('audit_logs')
      .delete()
      .lt('timestamp', cutoffDate.toISOString())
      .neq('severity', 'critical'); // Never delete critical events

    if (error) {
      console.error('Failed to apply retention policy:', error);
      return 0;
    }

    await this.log({
      action: 'retention_policy_applied',
      category: 'compliance',
      severity: 'info',
      description: `Deleted ${count || 0} audit logs older than ${retentionDays} days`,
      metadata: { retentionDays, deletedCount: count },
      success: true,
    });

    return count || 0;
  }

  // =====================================================
  // PRIVATE METHODS
  // =====================================================

  private addToBatch(entry: Partial<AuditLogEntry>): void {
    this.batchQueue.push(entry);

    if (this.batchQueue.length >= this.BATCH_SIZE) {
      this.flushBatch();
    } else if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => this.flushBatch(), this.BATCH_DELAY);
    }
  }

  private async flushBatch(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    if (this.batchQueue.length === 0) return;

    const batch = [...this.batchQueue];
    this.batchQueue = [];

    await this.writeToDatabase(batch);
  }

  private async writeToDatabase(entries: Partial<AuditLogEntry>[]): Promise<void> {
    const records = entries.map((entry) => ({
      user_id: entry.userId,
      user_email: entry.userEmail,
      user_type: entry.userType,
      action: entry.action,
      category: entry.category,
      severity: entry.severity,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId,
      description: entry.description,
      metadata: entry.metadata,
      ip_address: entry.ipAddress,
      user_agent: entry.userAgent,
      session_id: entry.sessionId,
      success: entry.success,
      error_message: entry.errorMessage,
      timestamp: entry.timestamp?.toISOString(),
    }));

    const { error } = await supabase.from('audit_logs').insert(records);

    if (error) {
      console.error('Failed to write audit logs:', error);
    }
  }

  private mapFromDatabase(row: Record<string, unknown>): AuditLogEntry {
    return {
      id: row.id as string,
      timestamp: new Date(row.timestamp as string),
      userId: row.user_id as string | undefined,
      userEmail: row.user_email as string | undefined,
      userType: row.user_type as AuditLogEntry['userType'],
      action: row.action as AuditAction,
      category: row.category as AuditCategory,
      severity: row.severity as AuditSeverity,
      resourceType: row.resource_type as string | undefined,
      resourceId: row.resource_id as string | undefined,
      description: row.description as string,
      metadata: row.metadata as Record<string, unknown> | undefined,
      ipAddress: row.ip_address as string | undefined,
      userAgent: row.user_agent as string | undefined,
      sessionId: row.session_id as string | undefined,
      success: row.success as boolean,
      errorMessage: row.error_message as string | undefined,
    };
  }

  private async getClientIP(): Promise<string | undefined> {
    // In production, get from server headers
    // For demo, return undefined
    return undefined;
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('audit_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem('audit_session_id', sessionId);
    }
    return sessionId;
  }

  // Cleanup on page unload
  setupBeforeUnload(): void {
    window.addEventListener('beforeunload', () => {
      if (this.batchQueue.length > 0) {
        // Use sendBeacon for reliable delivery
        const records = this.batchQueue.map((entry) => ({
          user_id: entry.userId,
          action: entry.action,
          category: entry.category,
          severity: entry.severity,
          description: entry.description,
          metadata: entry.metadata,
          success: entry.success,
          timestamp: entry.timestamp?.toISOString(),
        }));

        navigator.sendBeacon(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/audit_logs`,
          JSON.stringify(records)
        );
      }
    });
  }
}

// =====================================================
// SINGLETON EXPORT
// =====================================================

export const auditLogService = new AuditLogService();

// Setup before unload handler
if (typeof window !== 'undefined') {
  auditLogService.setupBeforeUnload();
}

export default auditLogService;
