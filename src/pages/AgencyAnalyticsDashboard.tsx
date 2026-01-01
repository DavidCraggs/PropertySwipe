/**
 * Agency Analytics Dashboard
 * Phase 4: World-Class Reporting & Analytics
 *
 * Comprehensive analytics dashboard for estate agents and management agencies.
 * Displays portfolio metrics, performance KPIs, SLA compliance, and trends.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Users,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  PoundSterling,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import {
  MetricCard,
  ProgressBar,
  BarChart,
  DonutChart,
  TrendList,
  ExportButton,
} from '../components/organisms/AnalyticsCharts';
import { useAuthStore } from '../hooks/useAuthStore';
import { useToastStore } from '../components/organisms/toastUtils';
import {
  ReportingService,
  type DashboardData,
  formatCurrency,
  formatPercentage,
} from '../services/ReportingService';

type DateRange = '7d' | '30d' | '90d' | '365d';

/**
 * Main Analytics Dashboard Component
 */
export const AgencyAnalyticsDashboard: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { addToast } = useToastStore();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, [currentUser?.id, dateRange]);

  const loadDashboardData = async () => {
    if (!currentUser?.id) return;

    setIsLoading(true);
    try {
      const data = await ReportingService.getAgencyDashboard(currentUser.id);
      setDashboardData(data);
    } catch (error) {
      console.error('[Dashboard] Failed to load data:', error);
      addToast({
        type: 'error',
        title: 'Failed to load analytics',
        message: 'Please try again later',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
    addToast({
      type: 'success',
      title: 'Dashboard refreshed',
      message: 'Data has been updated',
      duration: 2000,
    });
  };

  const handleExport = async (format: 'pdf' | 'xlsx' | 'csv') => {
    addToast({
      type: 'info',
      title: 'Generating report...',
      message: `Your ${format.toUpperCase()} report is being generated`,
      duration: 3000,
    });

    try {
      await ReportingService.generateReport({
        type: 'portfolio_overview',
        dateRange: {
          from: getDateRangeStart(dateRange),
          to: new Date(),
        },
        filters: { agencyId: currentUser?.id },
        format,
      });

      addToast({
        type: 'success',
        title: 'Report ready',
        message: 'Your report has been generated and is ready for download',
        duration: 5000,
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Export failed',
        message: 'Please try again later',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-neutral-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center p-8">
          <BarChart3 className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">No Data Available</h2>
          <p className="text-neutral-600">Analytics will appear once you have properties.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Analytics Dashboard</h1>
              <p className="text-sm text-neutral-500">
                Performance insights and reporting
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Date Range Selector */}
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as DateRange)}
                className="px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="365d">Last 12 months</option>
              </select>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <RefreshCw
                  size={20}
                  className={`text-neutral-600 ${isRefreshing ? 'animate-spin' : ''}`}
                />
              </button>

              {/* Export Button */}
              <ExportButton onExport={handleExport} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Key Metrics Row */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Portfolio Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Total Properties"
              value={dashboardData.portfolio.totalProperties}
              subtitle={`${dashboardData.portfolio.letProperties} let, ${dashboardData.portfolio.availableProperties} available`}
              icon={<Building2 size={20} />}
              color="primary"
            />
            <MetricCard
              title="Occupancy Rate"
              value={formatPercentage(dashboardData.portfolio.occupancyRate)}
              trend={{
                value: dashboardData.trends.find((t) => t.metric.includes('Vacancy'))?.changePercent || 0,
                isPositive: true,
              }}
              icon={<CheckCircle size={20} />}
              color="success"
            />
            <MetricCard
              title="Monthly Rent"
              value={formatCurrency(dashboardData.portfolio.totalMonthlyRent)}
              subtitle={`Avg: ${formatCurrency(dashboardData.portfolio.averageRent)}`}
              icon={<PoundSterling size={20} />}
              color="success"
            />
            <MetricCard
              title="Match Rate"
              value={formatPercentage(dashboardData.performance.matchConversionRate)}
              trend={{
                value: dashboardData.trends.find((t) => t.metric === 'New Matches')?.changePercent || 0,
                isPositive: true,
              }}
              icon={<Users size={20} />}
              color="primary"
            />
          </div>
        </section>

        {/* Performance & SLA Row */}
        <section className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Performance Metrics */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-neutral-100">
            <h3 className="text-sm font-medium text-neutral-700 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-primary-500" />
              Performance Metrics
            </h3>
            <div className="space-y-4">
              <ProgressBar
                label="Interests → Matches"
                value={dashboardData.performance.matchConversionRate}
                max={100}
                color="primary"
              />
              <ProgressBar
                label="Tenant Renewal Rate"
                value={dashboardData.performance.renewalRate}
                max={100}
                color="success"
              />
              <div className="pt-2 border-t border-neutral-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600">Avg. Days to Let</span>
                  <span className="text-lg font-semibold text-neutral-900">
                    {dashboardData.performance.averageDaysToLet.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SLA Compliance */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-neutral-100">
            <h3 className="text-sm font-medium text-neutral-700 mb-4 flex items-center gap-2">
              <Clock size={18} className="text-warning-500" />
              SLA Compliance
            </h3>
            <div className="flex items-center justify-center mb-4">
              <DonutChart
                value={dashboardData.sla.slaComplianceRate}
                max={100}
                title="Compliance Rate"
                subtitle={`Target: 95%`}
                color={dashboardData.sla.slaComplianceRate >= 95 ? 'success' : dashboardData.sla.slaComplianceRate >= 80 ? 'warning' : 'danger'}
                size={120}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-neutral-900">
                  {dashboardData.sla.averageResponseTimeHours.toFixed(1)}h
                </div>
                <div className="text-xs text-neutral-500">Avg Response</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-neutral-900">
                  {dashboardData.sla.averageResolutionTimeHours.toFixed(1)}h
                </div>
                <div className="text-xs text-neutral-500">Avg Resolution</div>
              </div>
            </div>
            {dashboardData.sla.overdueIssues > 0 && (
              <div className="mt-4 p-2 bg-danger-50 rounded-lg flex items-center gap-2">
                <AlertTriangle size={16} className="text-danger-600" />
                <span className="text-sm text-danger-600">
                  {dashboardData.sla.overdueIssues} overdue issues need attention
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Charts Row */}
        <section className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Issues by Category */}
          <BarChart
            title="Issues by Category"
            data={[
              { label: 'Maintenance', value: 67, color: '#6366f1' },
              { label: 'Repair', value: 45, color: '#8b5cf6' },
              { label: 'Complaint', value: 22, color: '#a855f7' },
              { label: 'Query', value: 18, color: '#c084fc' },
              { label: 'Hazard', value: 4, color: '#ef4444' },
            ]}
            height={180}
          />

          {/* Trends */}
          <TrendList
            title="Key Trends vs Last Period"
            trends={dashboardData.trends}
          />
        </section>

        {/* Financial & Properties Row */}
        <section className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Financial Summary */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-neutral-100">
            <h3 className="text-sm font-medium text-neutral-700 mb-4 flex items-center gap-2">
              <PoundSterling size={18} className="text-success-500" />
              Financial Summary
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Monthly Rent</span>
                <span className="font-semibold text-neutral-900">
                  {formatCurrency(dashboardData.financial.totalRentManaged)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Annual Projection</span>
                <span className="font-semibold text-neutral-900">
                  {formatCurrency(dashboardData.financial.projectedAnnualRent)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Commission ({dashboardData.financial.commissionRate}%)</span>
                <span className="font-semibold text-success-600">
                  {formatCurrency(dashboardData.financial.totalCommissionEarned)}
                </span>
              </div>
              {dashboardData.financial.arrearsValue > 0 && (
                <div className="flex justify-between items-center pt-2 border-t border-neutral-100">
                  <span className="text-sm text-danger-600">Arrears</span>
                  <span className="font-semibold text-danger-600">
                    {formatCurrency(dashboardData.financial.arrearsValue)} ({dashboardData.financial.arrearsCount})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Top Properties */}
          <div className="md:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-neutral-100">
            <h3 className="text-sm font-medium text-neutral-700 mb-4 flex items-center gap-2">
              <Building2 size={18} className="text-primary-500" />
              Top Performing Properties
            </h3>
            <div className="space-y-3">
              {dashboardData.topProperties.map((property, index) => (
                <motion.div
                  key={property.propertyId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                >
                  <div>
                    <div className="text-sm font-medium text-neutral-900">{property.address}</div>
                    <div className="text-xs text-neutral-500">
                      {property.interestCount} interests · {property.matchCount} matches
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-neutral-900">
                      {formatCurrency(property.rent)}/pcm
                    </div>
                    <StatusBadge status={property.status} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Recent Issues */}
        <section className="bg-white rounded-xl p-5 shadow-sm border border-neutral-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-neutral-700 flex items-center gap-2">
              <AlertTriangle size={18} className="text-warning-500" />
              Recent Issues
            </h3>
            <button className="text-sm text-primary-600 hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 border-b border-neutral-100">
                  <th className="pb-2 font-medium">Property</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium">Priority</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Raised</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.recentIssues.map((issue) => (
                  <tr key={issue.issueId} className="border-b border-neutral-50">
                    <td className="py-3">{issue.propertyAddress}</td>
                    <td className="py-3 capitalize">{issue.category}</td>
                    <td className="py-3">
                      <PriorityBadge priority={issue.priority} />
                    </td>
                    <td className="py-3">
                      <IssueStatusBadge status={issue.status} isOverdue={issue.isOverdue} />
                    </td>
                    <td className="py-3 text-neutral-500">
                      {formatRelativeTime(issue.raisedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

// =====================================================
// HELPER COMPONENTS
// =====================================================

const StatusBadge: React.FC<{ status: 'let' | 'available' | 'pending' }> = ({ status }) => {
  const styles = {
    let: 'bg-success-100 text-success-700',
    available: 'bg-primary-100 text-primary-700',
    pending: 'bg-warning-100 text-warning-700',
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${styles[status]}`}>
      {status === 'let' ? 'Let' : status === 'available' ? 'Available' : 'Pending'}
    </span>
  );
};

const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  const styles: Record<string, string> = {
    emergency: 'bg-danger-100 text-danger-700',
    urgent: 'bg-warning-100 text-warning-700',
    routine: 'bg-neutral-100 text-neutral-700',
    low: 'bg-neutral-50 text-neutral-500',
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${styles[priority] || styles.routine}`}>
      {priority}
    </span>
  );
};

const IssueStatusBadge: React.FC<{ status: string; isOverdue: boolean }> = ({
  status,
  isOverdue,
}) => {
  if (isOverdue) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-danger-100 text-danger-700">
        Overdue
      </span>
    );
  }

  const styles: Record<string, string> = {
    open: 'bg-primary-100 text-primary-700',
    acknowledged: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-warning-100 text-warning-700',
    resolved: 'bg-success-100 text-success-700',
    closed: 'bg-neutral-100 text-neutral-700',
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${styles[status] || styles.open}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function getDateRangeStart(range: DateRange): Date {
  const now = new Date();
  switch (range) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case '365d':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
