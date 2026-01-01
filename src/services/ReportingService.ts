/**
 * Reporting Service
 * Phase 4: World-Class Reporting & Analytics
 *
 * Provides comprehensive reporting capabilities for agencies, landlords,
 * and admin users. Supports multiple export formats and scheduled reports.
 */

// Types imported for future use in complete implementation
// import type { Property, Match, Issue, AgencyProfile } from '../types';

// =====================================================
// TYPES
// =====================================================

export type ReportType =
  | 'portfolio_overview'
  | 'property_performance'
  | 'tenant_activity'
  | 'issue_resolution'
  | 'sla_compliance'
  | 'financial_summary'
  | 'market_comparison'
  | 'compliance_audit';

export type ReportFormat = 'pdf' | 'xlsx' | 'csv' | 'json';

export type ReportSchedule = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export interface ReportConfig {
  type: ReportType;
  dateRange: {
    from: Date;
    to: Date;
  };
  filters: {
    propertyIds?: string[];
    landlordIds?: string[];
    agencyId?: string;
    cities?: string[];
  };
  format: ReportFormat;
  schedule?: ReportSchedule;
  recipients?: string[];
}

export interface ReportResult {
  id: string;
  type: ReportType;
  generatedAt: Date;
  downloadUrl: string;
  expiresAt: Date;
  fileSizeBytes: number;
  recordCount: number;
  dateRange: {
    from: Date;
    to: Date;
  };
}

export interface ScheduledReport {
  id: string;
  config: ReportConfig;
  createdAt: Date;
  nextRunAt: Date;
  lastRunAt?: Date;
  isActive: boolean;
}

// =====================================================
// DASHBOARD METRICS
// =====================================================

export interface PortfolioMetrics {
  totalProperties: number;
  availableProperties: number;
  letProperties: number;
  totalMonthlyRent: number;
  averageRent: number;
  occupancyRate: number;
  vacancyRate: number;
}

export interface PerformanceMetrics {
  totalInterests: number;
  totalMatches: number;
  matchConversionRate: number;
  averageDaysToLet: number;
  renewalRate: number;
}

export interface SLAMetrics {
  totalIssues: number;
  resolvedIssues: number;
  openIssues: number;
  overdueIssues: number;
  slaComplianceRate: number;
  averageResponseTimeHours: number;
  averageResolutionTimeHours: number;
}

export interface FinancialMetrics {
  totalRentManaged: number;
  projectedAnnualRent: number;
  commissionRate: number;
  totalCommissionEarned: number;
  arrearsValue: number;
  arrearsCount: number;
}

export interface TrendData {
  metric: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  isPositive: boolean;
}

export interface DashboardData {
  portfolio: PortfolioMetrics;
  performance: PerformanceMetrics;
  sla: SLAMetrics;
  financial: FinancialMetrics;
  trends: TrendData[];
  topProperties: PropertyPerformance[];
  recentIssues: IssueSnapshot[];
}

export interface PropertyPerformance {
  propertyId: string;
  address: string;
  rent: number;
  interestCount: number;
  matchCount: number;
  daysOnMarket: number;
  status: 'let' | 'available' | 'pending';
}

export interface IssueSnapshot {
  issueId: string;
  propertyAddress: string;
  category: string;
  priority: string;
  status: string;
  raisedAt: Date;
  isOverdue: boolean;
}

// =====================================================
// SLA REPORT
// =====================================================

export interface SLAReportData {
  period: { from: Date; to: Date };
  overall: {
    totalIssues: number;
    resolved: number;
    slaCompliance: number;
    averageResolutionTime: number;
  };
  byPriority: {
    priority: string;
    count: number;
    avgResolutionTime: number;
    slaTarget: number;
    achieved: number;
    complianceRate: number;
  }[];
  byCategory: {
    category: string;
    count: number;
    avgResolutionTime: number;
  }[];
  breaches: {
    issueId: string;
    propertyAddress: string;
    priority: string;
    targetHours: number;
    actualHours: number;
    reason?: string;
  }[];
  topPerformers: {
    agentId: string;
    name: string;
    resolved: number;
    avgTime: number;
  }[];
  areasForImprovement: string[];
}

// =====================================================
// REPORTING SERVICE CLASS
// =====================================================

class ReportingServiceClass {
  private reportHistory: ReportResult[] = [];
  private scheduledReports: ScheduledReport[] = [];

  /**
   * Generate a report based on configuration
   */
  async generateReport(config: ReportConfig): Promise<ReportResult> {
    console.log('[ReportingService] Generating report:', config.type);

    // In production, this would:
    // 1. Query the database via Supabase
    // 2. Aggregate data based on report type
    // 3. Format output (PDF/Excel/CSV)
    // 4. Upload to storage
    // 5. Return download URL

    const result: ReportResult = {
      id: `report-${Date.now()}`,
      type: config.type,
      generatedAt: new Date(),
      downloadUrl: `/reports/report-${Date.now()}.${config.format}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      fileSizeBytes: Math.floor(Math.random() * 500000) + 10000,
      recordCount: Math.floor(Math.random() * 1000) + 10,
      dateRange: config.dateRange,
    };

    this.reportHistory.push(result);

    console.log('[ReportingService] Report generated:', result.id);
    return result;
  }

  /**
   * Schedule a recurring report
   */
  async scheduleReport(config: ReportConfig): Promise<ScheduledReport> {
    console.log('[ReportingService] Scheduling report:', config.type, config.schedule);

    const nextRunAt = this.calculateNextRun(config.schedule || 'monthly');

    const scheduled: ScheduledReport = {
      id: `scheduled-${Date.now()}`,
      config,
      createdAt: new Date(),
      nextRunAt,
      isActive: true,
    };

    this.scheduledReports.push(scheduled);

    console.log('[ReportingService] Report scheduled:', scheduled.id);
    return scheduled;
  }

  /**
   * Get report generation history
   */
  async getReportHistory(_userId: string, limit: number = 10): Promise<ReportResult[]> {
    // In production, filter by user access permissions based on _userId
    return this.reportHistory.slice(0, limit);
  }

  /**
   * Get dashboard metrics for an agency
   */
  async getAgencyDashboard(agencyId: string): Promise<DashboardData> {
    console.log('[ReportingService] Fetching dashboard for agency:', agencyId);

    // In production, this would query the materialized views
    // For now, return mock data structure
    return {
      portfolio: {
        totalProperties: 45,
        availableProperties: 8,
        letProperties: 37,
        totalMonthlyRent: 52350,
        averageRent: 1163,
        occupancyRate: 82.2,
        vacancyRate: 17.8,
      },
      performance: {
        totalInterests: 234,
        totalMatches: 89,
        matchConversionRate: 38.0,
        averageDaysToLet: 12.5,
        renewalRate: 76.0,
      },
      sla: {
        totalIssues: 156,
        resolvedIssues: 142,
        openIssues: 14,
        overdueIssues: 2,
        slaComplianceRate: 95.5,
        averageResponseTimeHours: 2.3,
        averageResolutionTimeHours: 18.7,
      },
      financial: {
        totalRentManaged: 52350,
        projectedAnnualRent: 628200,
        commissionRate: 10.0,
        totalCommissionEarned: 5235,
        arrearsValue: 1850,
        arrearsCount: 2,
      },
      trends: [
        {
          metric: 'New Matches',
          current: 12,
          previous: 9,
          change: 3,
          changePercent: 33.3,
          isPositive: true,
        },
        {
          metric: 'Vacancy Rate',
          current: 17.8,
          previous: 22.4,
          change: -4.6,
          changePercent: -20.5,
          isPositive: true,
        },
        {
          metric: 'SLA Compliance',
          current: 95.5,
          previous: 92.1,
          change: 3.4,
          changePercent: 3.7,
          isPositive: true,
        },
      ],
      topProperties: [
        {
          propertyId: '1',
          address: '42 Oak Lane, Liverpool',
          rent: 1200,
          interestCount: 18,
          matchCount: 3,
          daysOnMarket: 5,
          status: 'available',
        },
        {
          propertyId: '2',
          address: '15 High Street, Manchester',
          rent: 1450,
          interestCount: 12,
          matchCount: 2,
          daysOnMarket: 8,
          status: 'pending',
        },
      ],
      recentIssues: [
        {
          issueId: '1',
          propertyAddress: '8 Garden Road',
          category: 'maintenance',
          priority: 'routine',
          status: 'in_progress',
          raisedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          isOverdue: false,
        },
        {
          issueId: '2',
          propertyAddress: '22 River View',
          category: 'repair',
          priority: 'urgent',
          status: 'open',
          raisedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          isOverdue: false,
        },
      ],
    };
  }

  /**
   * Get SLA compliance report
   */
  async getSLAReport(
    agencyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SLAReportData> {
    console.log('[ReportingService] Generating SLA report for agency:', agencyId);

    return {
      period: { from: startDate, to: endDate },
      overall: {
        totalIssues: 156,
        resolved: 142,
        slaCompliance: 95.5,
        averageResolutionTime: 18.7,
      },
      byPriority: [
        {
          priority: 'emergency',
          count: 8,
          avgResolutionTime: 2.1,
          slaTarget: 4,
          achieved: 8,
          complianceRate: 100,
        },
        {
          priority: 'urgent',
          count: 23,
          avgResolutionTime: 16.4,
          slaTarget: 24,
          achieved: 21,
          complianceRate: 91.3,
        },
        {
          priority: 'routine',
          count: 89,
          avgResolutionTime: 42.8,
          slaTarget: 72,
          achieved: 86,
          complianceRate: 96.6,
        },
        {
          priority: 'low',
          count: 36,
          avgResolutionTime: 120.5,
          slaTarget: 336,
          achieved: 35,
          complianceRate: 97.2,
        },
      ],
      byCategory: [
        { category: 'maintenance', count: 67, avgResolutionTime: 28.4 },
        { category: 'repair', count: 45, avgResolutionTime: 52.1 },
        { category: 'complaint', count: 22, avgResolutionTime: 8.6 },
        { category: 'query', count: 18, avgResolutionTime: 4.2 },
        { category: 'hazard', count: 4, avgResolutionTime: 3.1 },
      ],
      breaches: [
        {
          issueId: 'ISS-123',
          propertyAddress: '15 Park Avenue',
          priority: 'urgent',
          targetHours: 24,
          actualHours: 28.5,
          reason: 'Contractor delay',
        },
        {
          issueId: 'ISS-145',
          propertyAddress: '8 Mill Lane',
          priority: 'routine',
          targetHours: 72,
          actualHours: 76.2,
          reason: 'Parts on order',
        },
      ],
      topPerformers: [
        { agentId: 'agent-1', name: 'Sarah Johnson', resolved: 34, avgTime: 14.2 },
        { agentId: 'agent-2', name: 'Mike Peters', resolved: 28, avgTime: 16.8 },
        { agentId: 'agent-3', name: 'Emma Wilson', resolved: 26, avgTime: 15.5 },
      ],
      areasForImprovement: [
        'Reduce urgent issue response time by 15%',
        'Improve contractor scheduling for weekend issues',
        'Increase first-contact resolution rate',
      ],
    };
  }

  /**
   * Get landlord portfolio report
   */
  async getLandlordPortfolio(landlordId: string): Promise<{
    properties: PropertyPerformance[];
    summary: PortfolioMetrics;
    financial: FinancialMetrics;
    trends: TrendData[];
  }> {
    console.log('[ReportingService] Fetching portfolio for landlord:', landlordId);

    // Mock data - in production would query database
    return {
      properties: [
        {
          propertyId: '1',
          address: '42 Oak Lane, Liverpool',
          rent: 1200,
          interestCount: 18,
          matchCount: 3,
          daysOnMarket: 5,
          status: 'available',
        },
      ],
      summary: {
        totalProperties: 3,
        availableProperties: 1,
        letProperties: 2,
        totalMonthlyRent: 3450,
        averageRent: 1150,
        occupancyRate: 66.7,
        vacancyRate: 33.3,
      },
      financial: {
        totalRentManaged: 3450,
        projectedAnnualRent: 41400,
        commissionRate: 10,
        totalCommissionEarned: 345,
        arrearsValue: 0,
        arrearsCount: 0,
      },
      trends: [
        {
          metric: 'Monthly Rent',
          current: 3450,
          previous: 3200,
          change: 250,
          changePercent: 7.8,
          isPositive: true,
        },
      ],
    };
  }

  /**
   * Export data to specified format
   */
  async exportData(
    _data: unknown[],
    format: ReportFormat,
    filename: string
  ): Promise<string> {
    console.log('[ReportingService] Exporting data as:', format);
    // In production, _data would be converted to the specified format

    // In production, this would:
    // 1. Convert data to format (using libraries like xlsx, pdfmake)
    // 2. Upload to Supabase storage
    // 3. Return download URL

    const downloadUrl = `/exports/${filename}.${format}`;
    return downloadUrl;
  }

  // =====================================================
  // PRIVATE HELPERS
  // =====================================================

  private calculateNextRun(schedule: ReportSchedule): Date {
    const now = new Date();

    switch (schedule) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1);
        return nextMonth;
      case 'quarterly':
        const nextQuarter = new Date(now);
        nextQuarter.setMonth(Math.ceil((nextQuarter.getMonth() + 1) / 3) * 3);
        nextQuarter.setDate(1);
        return nextQuarter;
      default:
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
  }
}

// Export singleton instance
export const ReportingService = new ReportingServiceClass();

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Format currency for display
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Format duration in hours
 */
export function formatDuration(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)} min`;
  } else if (hours < 24) {
    return `${hours.toFixed(1)} hrs`;
  } else {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours.toFixed(0)}h`;
  }
}

/**
 * Get trend indicator
 */
export function getTrendIndicator(change: number): {
  direction: 'up' | 'down' | 'neutral';
  color: string;
  icon: string;
} {
  if (change > 0) {
    return { direction: 'up', color: 'text-success-600', icon: '↑' };
  } else if (change < 0) {
    return { direction: 'down', color: 'text-danger-600', icon: '↓' };
  } else {
    return { direction: 'neutral', color: 'text-neutral-500', icon: '→' };
  }
}

/**
 * Get SLA status color
 */
export function getSLAStatusColor(complianceRate: number): string {
  if (complianceRate >= 95) return 'text-success-600';
  if (complianceRate >= 80) return 'text-warning-600';
  return 'text-danger-600';
}

/**
 * Generate report filename
 */
export function generateReportFilename(
  type: ReportType,
  dateRange: { from: Date; to: Date }
): string {
  const fromStr = dateRange.from.toISOString().split('T')[0];
  const toStr = dateRange.to.toISOString().split('T')[0];
  return `${type}_${fromStr}_${toStr}`;
}
