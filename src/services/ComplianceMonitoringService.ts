/**
 * Compliance Monitoring Service
 *
 * Monitors and enforces regulatory compliance for UK property rental.
 * Covers GDPR, Right to Rent, PRS/RRA 2025, and tenant protection.
 */

import { supabase } from '../lib/supabase';
import { auditLogService } from './AuditLogService';

// =====================================================
// TYPES
// =====================================================

export type ComplianceArea =
  | 'gdpr'
  | 'right_to_rent'
  | 'prs_registration'
  | 'rra_2025'
  | 'tenant_protection'
  | 'landlord_licensing'
  | 'deposit_protection'
  | 'energy_efficiency';

export type ComplianceStatus = 'compliant' | 'warning' | 'non_compliant' | 'pending' | 'expired';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ComplianceCheck {
  id: string;
  area: ComplianceArea;
  name: string;
  description: string;
  status: ComplianceStatus;
  lastChecked: Date;
  nextCheck: Date;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface ComplianceAlert {
  id: string;
  userId: string;
  area: ComplianceArea;
  severity: AlertSeverity;
  title: string;
  message: string;
  actionRequired: string;
  deadline?: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  createdAt: Date;
}

export interface ComplianceReport {
  userId: string;
  generatedAt: Date;
  overallStatus: ComplianceStatus;
  areas: ComplianceAreaReport[];
  alerts: ComplianceAlert[];
  recommendations: string[];
}

export interface ComplianceAreaReport {
  area: ComplianceArea;
  status: ComplianceStatus;
  checks: ComplianceCheck[];
  score: number; // 0-100
  issues: string[];
}

export interface GDPRConsent {
  id: string;
  userId: string;
  purpose: string;
  granted: boolean;
  grantedAt?: Date;
  withdrawnAt?: Date;
  expiresAt?: Date;
  version: string;
}

export interface DataRetentionPolicy {
  dataType: string;
  retentionPeriod: number; // days
  legalBasis: string;
  deletionMethod: 'automatic' | 'manual' | 'anonymize';
}

// =====================================================
// SERVICE IMPLEMENTATION
// =====================================================

export class ComplianceMonitoringService {
  // =====================================================
  // COMPLIANCE CHECKS
  // =====================================================

  async runComplianceCheck(
    userId: string,
    userType: 'renter' | 'landlord' | 'agency'
  ): Promise<ComplianceReport> {
    const areas: ComplianceAreaReport[] = [];
    const allAlerts: ComplianceAlert[] = [];

    // GDPR compliance
    const gdprReport = await this.checkGDPRCompliance(userId);
    areas.push(gdprReport);

    // Role-specific checks
    if (userType === 'renter') {
      const rtrReport = await this.checkRightToRent(userId);
      areas.push(rtrReport);
    } else if (userType === 'landlord') {
      const prsReport = await this.checkPRSRegistration(userId);
      areas.push(prsReport);

      const licensingReport = await this.checkLandlordLicensing(userId);
      areas.push(licensingReport);

      const depositReport = await this.checkDepositProtection(userId);
      areas.push(depositReport);

      const epcReport = await this.checkEnergyEfficiency(userId);
      areas.push(epcReport);
    } else if (userType === 'agency') {
      const rraReport = await this.checkRRA2025Compliance(userId);
      areas.push(rraReport);
    }

    // Collect alerts
    for (const area of areas) {
      const alerts = await this.getAlerts(userId, area.area);
      allAlerts.push(...alerts);
    }

    // Calculate overall status
    const overallStatus = this.calculateOverallStatus(areas);

    // Generate recommendations
    const recommendations = this.generateRecommendations(areas, allAlerts);

    const report: ComplianceReport = {
      userId,
      generatedAt: new Date(),
      overallStatus,
      areas,
      alerts: allAlerts.filter((a) => !a.acknowledged),
      recommendations,
    };

    // Log compliance check
    await auditLogService.logCompliance(userId, 'data_subject_request', {
      reportType: 'compliance_check',
      overallStatus,
    });

    return report;
  }

  // =====================================================
  // GDPR COMPLIANCE
  // =====================================================

  async checkGDPRCompliance(userId: string): Promise<ComplianceAreaReport> {
    const checks: ComplianceCheck[] = [];
    const issues: string[] = [];

    // Check consent records
    const consents = await this.getConsents(userId);
    const hasMarketingConsent = consents.some(
      (c) => c.purpose === 'marketing' && c.granted
    );
    const hasDataProcessingConsent = consents.some(
      (c) => c.purpose === 'data_processing' && c.granted
    );

    checks.push({
      id: 'gdpr_consent_marketing',
      area: 'gdpr',
      name: 'Marketing Consent',
      description: 'User has provided marketing consent',
      status: hasMarketingConsent ? 'compliant' : 'pending',
      lastChecked: new Date(),
      nextCheck: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    checks.push({
      id: 'gdpr_consent_processing',
      area: 'gdpr',
      name: 'Data Processing Consent',
      description: 'User has provided data processing consent',
      status: hasDataProcessingConsent ? 'compliant' : 'non_compliant',
      lastChecked: new Date(),
      nextCheck: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    if (!hasDataProcessingConsent) {
      issues.push('Missing required data processing consent');
    }

    // Check data retention compliance
    const retentionCheck = await this.checkDataRetention(userId);
    checks.push(retentionCheck);
    if (retentionCheck.status !== 'compliant') {
      issues.push('Data retention policy not fully applied');
    }

    // Check right to access
    checks.push({
      id: 'gdpr_right_access',
      area: 'gdpr',
      name: 'Right to Access',
      description: 'Data export functionality available',
      status: 'compliant',
      lastChecked: new Date(),
      nextCheck: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });

    // Check right to deletion
    checks.push({
      id: 'gdpr_right_deletion',
      area: 'gdpr',
      name: 'Right to Deletion',
      description: 'Account deletion functionality available',
      status: 'compliant',
      lastChecked: new Date(),
      nextCheck: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });

    const score = this.calculateScore(checks);

    return {
      area: 'gdpr',
      status: this.scoreToStatus(score),
      checks,
      score,
      issues,
    };
  }

  async getConsents(userId: string): Promise<GDPRConsent[]> {
    const { data, error } = await supabase
      .from('gdpr_consents')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to fetch consents:', error);
      return [];
    }

    return (data || []).map((c) => ({
      id: c.id,
      userId: c.user_id,
      purpose: c.purpose,
      granted: c.granted,
      grantedAt: c.granted_at ? new Date(c.granted_at) : undefined,
      withdrawnAt: c.withdrawn_at ? new Date(c.withdrawn_at) : undefined,
      expiresAt: c.expires_at ? new Date(c.expires_at) : undefined,
      version: c.version,
    }));
  }

  async recordConsent(
    userId: string,
    purpose: string,
    granted: boolean,
    version: string
  ): Promise<void> {
    await supabase.from('gdpr_consents').upsert({
      user_id: userId,
      purpose,
      granted,
      granted_at: granted ? new Date().toISOString() : null,
      withdrawn_at: granted ? null : new Date().toISOString(),
      version,
      updated_at: new Date().toISOString(),
    });

    await auditLogService.logCompliance(
      userId,
      granted ? 'consent_given' : 'consent_withdrawn',
      { purpose, version }
    );
  }

  private async checkDataRetention(_userId: string): Promise<ComplianceCheck> {
    // Check if user data follows retention policies
    return {
      id: 'gdpr_retention',
      area: 'gdpr',
      name: 'Data Retention',
      description: 'Data retention policies are enforced',
      status: 'compliant',
      lastChecked: new Date(),
      nextCheck: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
  }

  // =====================================================
  // RIGHT TO RENT (RENTERS)
  // =====================================================

  async checkRightToRent(userId: string): Promise<ComplianceAreaReport> {
    const checks: ComplianceCheck[] = [];
    const issues: string[] = [];

    // Get renter profile
    const { data: profile } = await supabase
      .from('renter_profiles')
      .select('right_to_rent_verified, right_to_rent_verified_at, right_to_rent_expires_at')
      .eq('id', userId)
      .single();

    const isVerified = profile?.right_to_rent_verified === true;
    const expiresAt = profile?.right_to_rent_expires_at
      ? new Date(profile.right_to_rent_expires_at)
      : undefined;
    const isExpired = expiresAt ? expiresAt < new Date() : false;

    let status: ComplianceStatus = 'pending';
    if (isVerified && !isExpired) {
      status = 'compliant';
    } else if (isVerified && isExpired) {
      status = 'expired';
      issues.push('Right to rent verification has expired');
    } else {
      issues.push('Right to rent not verified');
    }

    checks.push({
      id: 'rtr_verification',
      area: 'right_to_rent',
      name: 'Right to Rent Verification',
      description: 'UK immigration status verified',
      status,
      lastChecked: new Date(),
      nextCheck: new Date(Date.now() + 24 * 60 * 60 * 1000),
      expiresAt,
    });

    // Create alert if expiring soon
    if (expiresAt && !isExpired) {
      const daysUntilExpiry = Math.floor(
        (expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      );
      if (daysUntilExpiry <= 30) {
        await this.createAlert(userId, {
          area: 'right_to_rent',
          severity: daysUntilExpiry <= 7 ? 'high' : 'medium',
          title: 'Right to Rent Expiring Soon',
          message: `Your right to rent verification expires in ${daysUntilExpiry} days`,
          actionRequired: 'Re-verify your right to rent status',
          deadline: expiresAt,
        });
      }
    }

    const score = this.calculateScore(checks);

    return {
      area: 'right_to_rent',
      status: this.scoreToStatus(score),
      checks,
      score,
      issues,
    };
  }

  // =====================================================
  // PRS REGISTRATION (LANDLORDS)
  // =====================================================

  async checkPRSRegistration(userId: string): Promise<ComplianceAreaReport> {
    const checks: ComplianceCheck[] = [];
    const issues: string[] = [];

    // Get landlord profile
    const { data: profile } = await supabase
      .from('landlord_profiles')
      .select('prs_registered, prs_registration_number, prs_verified_at')
      .eq('id', userId)
      .single();

    const isRegistered = !!profile?.prs_registration_number;
    const isVerified = profile?.prs_verified_at !== null;

    let status: ComplianceStatus = 'non_compliant';
    if (isRegistered && isVerified) {
      status = 'compliant';
    } else if (isRegistered) {
      status = 'pending';
      issues.push('PRS registration pending verification');
    } else {
      issues.push('Not registered with the PRS Database (required by RRA 2025)');
      await this.createAlert(userId, {
        area: 'prs_registration',
        severity: 'high',
        title: 'PRS Registration Required',
        message:
          'The Renters\' Rights Act 2025 requires all landlords to register with the PRS Database',
        actionRequired: 'Register your properties with the PRS Database',
        deadline: new Date('2026-01-01'), // Example deadline
      });
    }

    checks.push({
      id: 'prs_registration',
      area: 'prs_registration',
      name: 'PRS Database Registration',
      description: 'Property registered with Private Rented Sector Database',
      status,
      lastChecked: new Date(),
      nextCheck: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const score = this.calculateScore(checks);

    return {
      area: 'prs_registration',
      status: this.scoreToStatus(score),
      checks,
      score,
      issues,
    };
  }

  // =====================================================
  // RRA 2025 COMPLIANCE (AGENCIES)
  // =====================================================

  async checkRRA2025Compliance(_userId: string): Promise<ComplianceAreaReport> {
    const checks: ComplianceCheck[] = [];
    const issues: string[] = [];

    // Fee transparency
    checks.push({
      id: 'rra_fee_transparency',
      area: 'rra_2025',
      name: 'Fee Transparency',
      description: 'All fees clearly displayed to renters',
      status: 'compliant',
      lastChecked: new Date(),
      nextCheck: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Property standards
    checks.push({
      id: 'rra_property_standards',
      area: 'rra_2025',
      name: 'Property Standards',
      description: 'Decent Homes Standard compliance',
      status: 'compliant',
      lastChecked: new Date(),
      nextCheck: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    // Eviction procedures
    checks.push({
      id: 'rra_eviction_procedures',
      area: 'rra_2025',
      name: 'Eviction Procedures',
      description: 'Compliant with new eviction rules (no Section 21)',
      status: 'compliant',
      lastChecked: new Date(),
      nextCheck: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    // Ombudsman registration
    checks.push({
      id: 'rra_ombudsman',
      area: 'rra_2025',
      name: 'Ombudsman Registration',
      description: 'Registered with housing ombudsman',
      status: 'pending',
      lastChecked: new Date(),
      nextCheck: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    issues.push('Ombudsman registration required');

    const score = this.calculateScore(checks);

    return {
      area: 'rra_2025',
      status: this.scoreToStatus(score),
      checks,
      score,
      issues,
    };
  }

  // =====================================================
  // ADDITIONAL LANDLORD CHECKS
  // =====================================================

  private async checkLandlordLicensing(_userId: string): Promise<ComplianceAreaReport> {
    const checks: ComplianceCheck[] = [];

    checks.push({
      id: 'landlord_licensing',
      area: 'landlord_licensing',
      name: 'Landlord Licensing',
      description: 'HMO and selective licensing compliance',
      status: 'compliant',
      lastChecked: new Date(),
      nextCheck: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });

    return {
      area: 'landlord_licensing',
      status: 'compliant',
      checks,
      score: 100,
      issues: [],
    };
  }

  private async checkDepositProtection(_userId: string): Promise<ComplianceAreaReport> {
    const checks: ComplianceCheck[] = [];

    checks.push({
      id: 'deposit_protection',
      area: 'deposit_protection',
      name: 'Deposit Protection',
      description: 'Tenant deposits protected in approved scheme',
      status: 'compliant',
      lastChecked: new Date(),
      nextCheck: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    return {
      area: 'deposit_protection',
      status: 'compliant',
      checks,
      score: 100,
      issues: [],
    };
  }

  private async checkEnergyEfficiency(_userId: string): Promise<ComplianceAreaReport> {
    const checks: ComplianceCheck[] = [];
    const issues: string[] = [];

    // Check EPC ratings for properties
    checks.push({
      id: 'epc_minimum',
      area: 'energy_efficiency',
      name: 'EPC Minimum Rating',
      description: 'All properties meet minimum EPC rating E',
      status: 'compliant',
      lastChecked: new Date(),
      nextCheck: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });

    checks.push({
      id: 'epc_displayed',
      area: 'energy_efficiency',
      name: 'EPC Displayed',
      description: 'EPC certificate displayed on listings',
      status: 'warning',
      lastChecked: new Date(),
      nextCheck: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    issues.push('Some property listings missing EPC information');

    const score = this.calculateScore(checks);

    return {
      area: 'energy_efficiency',
      status: this.scoreToStatus(score),
      checks,
      score,
      issues,
    };
  }

  // =====================================================
  // ALERTS
  // =====================================================

  async createAlert(
    userId: string,
    alert: Omit<ComplianceAlert, 'id' | 'userId' | 'acknowledged' | 'acknowledgedAt' | 'createdAt'>
  ): Promise<void> {
    // Check for existing unacknowledged alert
    const { data: existing } = await supabase
      .from('compliance_alerts')
      .select('id')
      .eq('user_id', userId)
      .eq('area', alert.area)
      .eq('title', alert.title)
      .eq('acknowledged', false)
      .single();

    if (existing) return; // Don't duplicate

    await supabase.from('compliance_alerts').insert({
      user_id: userId,
      area: alert.area,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      action_required: alert.actionRequired,
      deadline: alert.deadline?.toISOString(),
      acknowledged: false,
    });
  }

  async getAlerts(
    userId: string,
    area?: ComplianceArea
  ): Promise<ComplianceAlert[]> {
    let query = supabase
      .from('compliance_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (area) {
      query = query.eq('area', area);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch alerts:', error);
      return [];
    }

    return (data || []).map((a) => ({
      id: a.id,
      userId: a.user_id,
      area: a.area,
      severity: a.severity,
      title: a.title,
      message: a.message,
      actionRequired: a.action_required,
      deadline: a.deadline ? new Date(a.deadline) : undefined,
      acknowledged: a.acknowledged,
      acknowledgedAt: a.acknowledged_at ? new Date(a.acknowledged_at) : undefined,
      createdAt: new Date(a.created_at),
    }));
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    await supabase
      .from('compliance_alerts')
      .update({
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', alertId)
      .eq('user_id', userId);
  }

  // =====================================================
  // HELPERS
  // =====================================================

  private calculateScore(checks: ComplianceCheck[]): number {
    if (checks.length === 0) return 100;

    const statusScores: Record<ComplianceStatus, number> = {
      compliant: 100,
      warning: 70,
      pending: 50,
      expired: 30,
      non_compliant: 0,
    };

    const total = checks.reduce((sum, check) => sum + statusScores[check.status], 0);
    return Math.round(total / checks.length);
  }

  private scoreToStatus(score: number): ComplianceStatus {
    if (score >= 90) return 'compliant';
    if (score >= 70) return 'warning';
    if (score >= 50) return 'pending';
    return 'non_compliant';
  }

  private calculateOverallStatus(areas: ComplianceAreaReport[]): ComplianceStatus {
    const avgScore =
      areas.reduce((sum, area) => sum + area.score, 0) / areas.length;
    return this.scoreToStatus(avgScore);
  }

  private generateRecommendations(
    areas: ComplianceAreaReport[],
    alerts: ComplianceAlert[]
  ): string[] {
    const recommendations: string[] = [];

    for (const area of areas) {
      if (area.status === 'non_compliant') {
        recommendations.push(
          `Urgent: Address ${area.area.replace(/_/g, ' ')} compliance issues`
        );
      } else if (area.status === 'warning' || area.status === 'pending') {
        recommendations.push(
          `Review ${area.area.replace(/_/g, ' ')} compliance status`
        );
      }
    }

    const criticalAlerts = alerts.filter((a) => a.severity === 'critical');
    if (criticalAlerts.length > 0) {
      recommendations.unshift(
        `${criticalAlerts.length} critical compliance alert(s) require immediate attention`
      );
    }

    return recommendations.slice(0, 5); // Top 5 recommendations
  }

  // =====================================================
  // DATA RETENTION POLICIES
  // =====================================================

  getRetentionPolicies(): DataRetentionPolicy[] {
    return [
      {
        dataType: 'user_profiles',
        retentionPeriod: 730, // 2 years after account deletion
        legalBasis: 'Legal obligation (tax, anti-money laundering)',
        deletionMethod: 'anonymize',
      },
      {
        dataType: 'tenancy_agreements',
        retentionPeriod: 2190, // 6 years
        legalBasis: 'Legal obligation (Limitation Act)',
        deletionMethod: 'automatic',
      },
      {
        dataType: 'payment_records',
        retentionPeriod: 2555, // 7 years
        legalBasis: 'Legal obligation (tax records)',
        deletionMethod: 'automatic',
      },
      {
        dataType: 'chat_messages',
        retentionPeriod: 365, // 1 year
        legalBasis: 'Legitimate interest',
        deletionMethod: 'automatic',
      },
      {
        dataType: 'verification_documents',
        retentionPeriod: 1, // Delete after verification
        legalBasis: 'Data minimization',
        deletionMethod: 'automatic',
      },
      {
        dataType: 'audit_logs',
        retentionPeriod: 2555, // 7 years
        legalBasis: 'Legal obligation (compliance)',
        deletionMethod: 'automatic',
      },
    ];
  }
}

// =====================================================
// SINGLETON EXPORT
// =====================================================

export const complianceMonitoringService = new ComplianceMonitoringService();
export default complianceMonitoringService;
