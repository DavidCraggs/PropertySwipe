import { useState, useEffect } from 'react';
import { Building2, Users, AlertTriangle, CheckCircle2, Clock, TrendingUp, Home, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../hooks/useAuthStore';
import type { AgencyProfile, Issue, Property, Match } from '../types';
import { AgencyLandlordManager } from '../components/organisms/AgencyLandlordManager';
import { getAllProperties, getIssuesForProperty } from '../lib/storage';
import { useAppStore } from '../hooks';

/**
 * Phase 6: Dashboard for estate agents and management agencies
 * Shows portfolio overview, SLA performance, active issues, and tenant management
 */
export function AgencyDashboard() {
  const { currentUser, userType } = useAuthStore();
  const { matches } = useAppStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'landlords' | 'properties' | 'tenancies' | 'issues'>('overview');
  const [properties, setProperties] = useState<Property[]>([]);
  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Type guard
  if (userType !== 'estate_agent' && userType !== 'management_agency') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-success-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Building2 className="mx-auto text-neutral-400 mb-4" size={64} />
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Access Denied</h2>
          <p className="text-neutral-600">This page is only accessible to agencies.</p>
        </div>
      </div>
    );
  }

  const agencyProfile = currentUser as AgencyProfile;

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch all properties
        const allProps = await getAllProperties();

        // Filter properties managed by this agency
        const managedProps = allProps.filter(p =>
          agencyProfile.managedPropertyIds.includes(p.id)
        );
        setProperties(managedProps);

        // Fetch issues for all managed properties
        const issuesPromises = managedProps.map(p => getIssuesForProperty(p.id));
        const issuesArrays = await Promise.all(issuesPromises);
        const flatIssues = issuesArrays.flat();
        setAllIssues(flatIssues);
      } catch (error) {
        console.error('Failed to fetch agency data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [agencyProfile.id, agencyProfile.managedPropertyIds]);

  // Calculate stats from real data
  const activeTenancies = matches.filter(m =>
    m.tenancyStatus === 'active' &&
    properties.some(p => p.id === m.propertyId)
  );

  const openIssues = allIssues.filter(i =>
    i.status !== 'resolved' && i.status !== 'closed'
  );

  const stats = {
    totalProperties: properties.length,
    activeTenancies: activeTenancies.length,
    totalLandlords: agencyProfile.landlordClientIds.length,
    openIssues: openIssues.length,
    slaComplianceRate: agencyProfile.performanceMetrics.slaComplianceRate,
    averageResponseTime: agencyProfile.performanceMetrics.averageResponseTimeHours,
    totalIssuesResolved: allIssues.filter(i => i.status === 'resolved' || i.status === 'closed').length,
    totalIssuesRaised: allIssues.length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-success-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading agency dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-success-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-neutral-900">{agencyProfile.companyName}</h1>
          <p className="text-neutral-600 mt-1">
            {agencyProfile.agencyType === 'estate_agent' ? 'Estate Agent' : 'Management Agency'} Dashboard
          </p>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-6">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'landlords', label: 'Landlords' },
              { id: 'properties', label: 'Properties' },
              { id: 'tenancies', label: 'Tenancies' },
              { id: 'issues', label: 'Issues', badge: openIssues.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-4 px-2 border-b-2 font-medium transition-colors ${activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900'
                  }`}
              >
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-danger-500 text-white text-xs rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <AgencyStatsCards stats={stats} />

            {/* SLA Performance Section */}
            <SLAPerformanceSection
              complianceRate={stats.slaComplianceRate}
              averageResponseTime={stats.averageResponseTime}
              slaConfig={agencyProfile.slaConfiguration}
            />

            {/* Recent Issues Summary */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                  <AlertTriangle size={24} className="text-warning-600" />
                  Recent Issues
                </h3>
                <button
                  onClick={() => setActiveTab('issues')}
                  className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                >
                  View All →
                </button>
              </div>
              <AgencyIssuesDashboard issues={allIssues} limit={5} />
            </div>
          </div>
        )}

        {activeTab === 'landlords' && (
          <AgencyLandlordManager
            agencyId={agencyProfile.id}
            agencyType={agencyProfile.agencyType}
          />
        )}

        {activeTab === 'properties' && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
              <Home size={24} className="text-primary-600" />
              Managed Properties
            </h3>
            <AgencyPropertiesTable properties={properties} />
          </div>
        )}

        {activeTab === 'tenancies' && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
              <Users size={24} className="text-success-600" />
              Active Tenancies
            </h3>
            <AgencyTenanciesTable tenancies={activeTenancies} />
          </div>
        )}

        {activeTab === 'issues' && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
              <AlertTriangle size={24} className="text-warning-600" />
              All Issues
            </h3>
            <AgencyIssuesDashboard issues={allIssues} />
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * Phase 6: AgencyStatsCards Component
 * Grid of key performance metrics
 */
interface AgencyStatsCardsProps {
  stats: {
    totalProperties: number;
    activeTenancies: number;
    totalLandlords: number;
    openIssues: number;
    slaComplianceRate: number;
    averageResponseTime: number;
    totalIssuesResolved: number;
    totalIssuesRaised: number;
  };
}

function AgencyStatsCards({ stats }: AgencyStatsCardsProps) {
  const cards = [
    {
      icon: Home,
      label: 'Properties',
      value: stats.totalProperties,
      color: 'primary',
      bgColor: 'bg-primary-100',
      textColor: 'text-primary-600',
    },
    {
      icon: Users,
      label: 'Active Tenancies',
      value: stats.activeTenancies,
      color: 'success',
      bgColor: 'bg-success-100',
      textColor: 'text-success-600',
    },
    {
      icon: Building2,
      label: 'Landlords',
      value: stats.totalLandlords,
      color: 'secondary',
      bgColor: 'bg-secondary-100',
      textColor: 'text-secondary-600',
    },
    {
      icon: AlertTriangle,
      label: 'Open Issues',
      value: stats.openIssues,
      color: stats.openIssues > 0 ? 'warning' : 'success',
      bgColor: stats.openIssues > 0 ? 'bg-warning-100' : 'bg-success-100',
      textColor: stats.openIssues > 0 ? 'text-warning-600' : 'text-success-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
              <card.icon className={`w-6 h-6 ${card.textColor}`} />
            </div>
            <div>
              <div className="text-3xl font-bold text-neutral-900">{card.value}</div>
              <div className="text-sm text-neutral-600">{card.label}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Phase 6: SLAPerformanceSection Component
 * Visual representation of SLA compliance with color-coded indicators
 */
interface SLAPerformanceSectionProps {
  complianceRate: number;
  averageResponseTime: number;
  slaConfig: {
    emergencyResponseHours: number;
    urgentResponseHours: number;
    routineResponseHours: number;
    maintenanceResponseDays: number;
  };
}

function SLAPerformanceSection({ complianceRate, averageResponseTime, slaConfig }: SLAPerformanceSectionProps) {
  // Determine color based on compliance rate (per plan: 80%+ green, 60-80% yellow, <60% red)
  const getComplianceColor = (rate: number) => {
    if (rate >= 80) return { bg: 'bg-success-100', border: 'border-success-500', text: 'text-success-700' };
    if (rate >= 60) return { bg: 'bg-warning-100', border: 'border-warning-500', text: 'text-warning-700' };
    return { bg: 'bg-danger-100', border: 'border-danger-500', text: 'text-danger-700' };
  };

  const colors = getComplianceColor(complianceRate);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
        <TrendingUp size={24} className="text-primary-600" />
        SLA Performance
      </h3>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Compliance Rate Card */}
        <div className={`${colors.bg} border-2 ${colors.border} rounded-xl p-6`}>
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle2 className={`${colors.text}`} size={32} />
            <div>
              <div className="text-4xl font-bold text-neutral-900">{complianceRate.toFixed(1)}%</div>
              <div className={`text-sm font-medium ${colors.text}`}>SLA Compliance Rate</div>
            </div>
          </div>
          <p className="text-sm text-neutral-600">
            {complianceRate >= 80
              ? 'Excellent! You are meeting your SLA commitments.'
              : complianceRate >= 60
                ? 'Good, but there is room for improvement.'
                : 'Action needed: Focus on reducing response times.'}
          </p>
        </div>

        {/* Average Response Time Card */}
        <div className="bg-neutral-50 border-2 border-neutral-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="text-neutral-600" size={32} />
            <div>
              <div className="text-4xl font-bold text-neutral-900">{averageResponseTime.toFixed(1)}h</div>
              <div className="text-sm font-medium text-neutral-600">Average Response Time</div>
            </div>
          </div>
          <p className="text-sm text-neutral-600">
            Across all issue types and priorities
          </p>
        </div>
      </div>

      {/* SLA Configuration Display */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-danger-50 rounded-lg">
          <div className="text-2xl font-bold text-danger-700">{slaConfig.emergencyResponseHours}h</div>
          <div className="text-xs text-neutral-600 mt-1">Emergency SLA</div>
        </div>
        <div className="text-center p-4 bg-warning-50 rounded-lg">
          <div className="text-2xl font-bold text-warning-700">{slaConfig.urgentResponseHours}h</div>
          <div className="text-xs text-neutral-600 mt-1">Urgent SLA</div>
        </div>
        <div className="text-center p-4 bg-success-50 rounded-lg">
          <div className="text-2xl font-bold text-success-700">{slaConfig.routineResponseHours}h</div>
          <div className="text-xs text-neutral-600 mt-1">Routine SLA</div>
        </div>
        <div className="text-center p-4 bg-neutral-50 rounded-lg">
          <div className="text-2xl font-bold text-neutral-700">{slaConfig.maintenanceResponseDays}d</div>
          <div className="text-xs text-neutral-600 mt-1">Maintenance SLA</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Phase 6: AgencyPropertiesTable Component
 * List of all properties under management
 */
interface AgencyPropertiesTableProps {
  properties: Property[];
}

function AgencyPropertiesTable({ properties }: AgencyPropertiesTableProps) {
  if (properties.length === 0) {
    return (
      <div className="text-center py-12">
        <Home size={48} className="mx-auto text-neutral-400 mb-4" />
        <h4 className="text-lg font-semibold text-neutral-700 mb-2">No Properties Yet</h4>
        <p className="text-neutral-500">Properties will appear here when landlords link them to your agency</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-neutral-50 border-b-2 border-neutral-200">
          <tr>
            <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Address</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Type</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Rent</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Status</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((property) => (
            <tr key={property.id} className="border-b border-neutral-200 hover:bg-neutral-50">
              <td className="py-3 px-4">
                <div className="font-medium text-neutral-900">{property.address.street}</div>
                <div className="text-sm text-neutral-600">{property.address.city}, {property.address.postcode}</div>
              </td>
              <td className="py-3 px-4 text-sm text-neutral-700">{property.propertyType}</td>
              <td className="py-3 px-4 text-sm font-medium text-neutral-900">
                £{property.rentPcm.toLocaleString()}/mo
              </td>
              <td className="py-3 px-4">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${property.isAvailable
                    ? 'bg-success-100 text-success-700'
                    : 'bg-neutral-100 text-neutral-700'
                  }`}>
                  {property.isAvailable ? 'Available' : 'Occupied'}
                </span>
              </td>
              <td className="py-3 px-4">
                <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Phase 6: AgencyTenanciesTable Component
 * List of all active tenancies
 */
interface AgencyTenanciesTableProps {
  tenancies: Match[];
}

function AgencyTenanciesTable({ tenancies }: AgencyTenanciesTableProps) {
  if (tenancies.length === 0) {
    return (
      <div className="text-center py-12">
        <Users size={48} className="mx-auto text-neutral-400 mb-4" />
        <h4 className="text-lg font-semibold text-neutral-700 mb-2">No Active Tenancies</h4>
        <p className="text-neutral-500">Active tenancies will appear here</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-neutral-50 border-b-2 border-neutral-200">
          <tr>
            <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Tenant</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Property</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Move In</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Rent</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Issues</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tenancies.map((tenancy) => (
            <tr key={tenancy.id} className="border-b border-neutral-200 hover:bg-neutral-50">
              <td className="py-3 px-4">
                <div className="font-medium text-neutral-900">{tenancy.renterName}</div>
              </td>
              <td className="py-3 px-4 text-sm text-neutral-700">
                {tenancy.property?.address.street || 'Property address'}
              </td>
              <td className="py-3 px-4 text-sm text-neutral-600">
                {tenancy.tenancyStartDate
                  ? new Date(tenancy.tenancyStartDate).toLocaleDateString()
                  : 'N/A'}
              </td>
              <td className="py-3 px-4 text-sm font-medium text-neutral-900">
                £{tenancy.property?.rentPcm?.toLocaleString() || '0'}/mo
              </td>
              <td className="py-3 px-4">
                {tenancy.activeIssueIds?.length > 0 ? (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-warning-100 text-warning-700">
                    {tenancy.activeIssueIds.length} open
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-success-100 text-success-700">
                    No issues
                  </span>
                )}
              </td>
              <td className="py-3 px-4">
                <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Phase 6: AgencyIssuesDashboard Component
 * List of all issues with filtering and status
 */
interface AgencyIssuesDashboardProps {
  issues: Issue[];
  limit?: number;
}

function AgencyIssuesDashboard({ issues, limit }: AgencyIssuesDashboardProps) {
  const displayIssues = limit ? issues.slice(0, limit) : issues;

  if (issues.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle2 size={48} className="mx-auto text-neutral-400 mb-4" />
        <h4 className="text-lg font-semibold text-neutral-700 mb-2">No Issues</h4>
        <p className="text-neutral-500">All clear! No issues have been reported yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayIssues.map((issue) => (
        <AgencyIssueRow key={issue.id} issue={issue} />
      ))}
    </div>
  );
}

/**
 * Phase 6: AgencyIssueRow Component
 * Individual issue display with priority, status, and SLA indicator
 */
interface AgencyIssueRowProps {
  issue: Issue;
}

function AgencyIssueRow({ issue }: AgencyIssueRowProps) {
  const priorityColors = {
    emergency: { bg: 'bg-danger-100', text: 'text-danger-700', border: 'border-danger-300' },
    urgent: { bg: 'bg-warning-100', text: 'text-warning-700', border: 'border-warning-300' },
    routine: { bg: 'bg-success-100', text: 'text-success-700', border: 'border-success-300' },
    low: { bg: 'bg-neutral-100', text: 'text-neutral-700', border: 'border-neutral-300' },
  };

  const statusIcons = {
    open: <Clock size={16} className="text-warning-600" />,
    acknowledged: <MessageSquare size={16} className="text-primary-600" />,
    in_progress: <TrendingUp size={16} className="text-primary-600" />,
    awaiting_parts: <Clock size={16} className="text-warning-600" />,
    awaiting_access: <Clock size={16} className="text-warning-600" />,
    resolved: <CheckCircle2 size={16} className="text-success-600" />,
    closed: <CheckCircle2 size={16} className="text-neutral-600" />,
  };

  const colors = priorityColors[issue.priority];
  const isOverdue = issue.isOverdue && issue.status !== 'resolved' && issue.status !== 'closed';

  return (
    <div
      className={`border-2 ${colors.border} ${colors.bg} rounded-lg p-4 hover:shadow-md transition-shadow ${isOverdue ? 'ring-2 ring-danger-500 ring-offset-2' : ''
        }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 ${colors.bg} ${colors.text} text-xs font-bold rounded uppercase`}>
              {issue.priority}
            </span>
            <span className="px-2 py-1 bg-neutral-100 text-neutral-700 text-xs font-medium rounded">
              {issue.category}
            </span>
            {isOverdue && (
              <span className="px-2 py-1 bg-danger-500 text-white text-xs font-bold rounded animate-pulse">
                OVERDUE
              </span>
            )}
          </div>
          <h4 className="font-semibold text-neutral-900 mb-1">{issue.subject}</h4>
          <p className="text-sm text-neutral-600 line-clamp-2">{issue.description}</p>
        </div>
        <div className="ml-4 text-right">
          <div className="flex items-center gap-2 text-sm text-neutral-600 mb-1">
            {statusIcons[issue.status]}
            <span className="capitalize">{issue.status.replace('_', ' ')}</span>
          </div>
          <div className="text-xs text-neutral-500">
            Raised {new Date(issue.raisedAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* SLA Deadline */}
      <div className="flex items-center justify-between pt-3 border-t border-neutral-200">
        <div className="text-xs text-neutral-600">
          SLA Deadline: {new Date(issue.slaDeadline).toLocaleString()}
        </div>
        <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
          View Details →
        </button>
      </div>
    </div>
  );
}
