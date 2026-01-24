import { useState, useEffect } from 'react';
import { Building2, Users, AlertTriangle, CheckCircle2, Clock, TrendingUp, Home, MessageSquare, Settings, Edit, Shield, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../hooks/useAuthStore';
import type { AgencyProfile, Issue, Property, Match } from '../types';
import { AgencyLandlordManager } from '../components/organisms/AgencyLandlordManager';
import { PropertyDetailsModal } from '../components/organisms/PropertyDetailsModal';
import { IssueDetailsModal } from '../components/organisms/IssueDetailsModal';
import { TenancyDetailsModal } from '../components/organisms/TenancyDetailsModal';
import { SLAConfigurationModal, type SLAConfig } from '../components/organisms/SLAConfigurationModal';
import { PropertyForm } from '../components/organisms/PropertyForm';
import { getPropertiesByIds, getIssuesForProperty, saveAgencyProfile, updateIssueStatus, saveProperty } from '../lib/storage';
import type { IssueStatus } from '../types';
import { useAppStore } from '../hooks';
import { useToast } from '../components/organisms/toastUtils';

interface AgencyDashboardProps {
  onNavigateToDashboardBuilder?: () => void;
}

/**
 * Phase 6: Dashboard for estate agents and management agencies
 * Shows portfolio overview, SLA performance, active issues, and tenant management
 */
export function AgencyDashboard({ onNavigateToDashboardBuilder }: AgencyDashboardProps) {
  const { currentUser, userType, updateProfile } = useAuthStore();
  const { matches } = useAppStore();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'landlords' | 'properties' | 'tenancies' | 'issues'>('overview');
  const [properties, setProperties] = useState<Property[]>([]);
  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [selectedTenancy, setSelectedTenancy] = useState<Match | null>(null);
  const [isSLAModalOpen, setIsSLAModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  const agencyProfile = currentUser as AgencyProfile;

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch only properties managed by this agency (efficient batch query)
        const managedProps = await getPropertiesByIds(agencyProfile.managedPropertyIds || []);
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

  // Type guard - must be after hooks
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
    totalLandlords: agencyProfile.landlordClientIds?.length || 0,
    openIssues: openIssues.length,
    slaComplianceRate: agencyProfile.performanceMetrics?.slaComplianceRate ?? 95,
    averageResponseTime: agencyProfile.slaConfiguration?.urgentResponseHours ?? 24,
    totalIssuesResolved: allIssues.filter(i => i.status === 'resolved' || i.status === 'closed').length,
    totalIssuesRaised: allIssues.length,
  };

  // Handler for saving SLA configuration
  const handleSaveSLA = async (newConfig: SLAConfig) => {
    try {
      const updatedProfile = {
        ...agencyProfile,
        slaConfiguration: newConfig,
      };
      await saveAgencyProfile(updatedProfile);
      await updateProfile(updatedProfile);
      toast.success('SLA configuration updated successfully');
    } catch (error) {
      console.error('Failed to save SLA configuration:', error);
      toast.error('Failed to update SLA configuration');
    }
  };

  // Handler for updating issue status
  const handleIssueStatusUpdate = async (issueId: string, newStatus: IssueStatus) => {
    try {
      await updateIssueStatus(issueId, newStatus);
      // Update local state
      setAllIssues(prev => prev.map(issue =>
        issue.id === issueId ? { ...issue, status: newStatus } : issue
      ));
      setSelectedIssue(null);
      toast.success(`Issue marked as ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      console.error('Failed to update issue status:', error);
      toast.error('Failed to update issue status');
    }
  };

  // Handler for property update (agency editing)
  const handlePropertyUpdate = async (propertyData: Omit<Property, 'id'>) => {
    if (!editingProperty) return;

    try {
      // Merge with existing property and add audit trail
      const updatedProperty: Property = {
        ...editingProperty,
        ...propertyData,
        id: editingProperty.id,
        landlordId: editingProperty.landlordId, // Preserve original landlord
        managingAgencyId: editingProperty.managingAgencyId, // Preserve agency relationship
        lastEditedBy: agencyProfile.id,
        lastEditedAt: new Date(),
      };

      await saveProperty(updatedProperty);

      // Update local state
      setProperties(prev => prev.map(p =>
        p.id === editingProperty.id ? updatedProperty : p
      ));

      setEditingProperty(null);
      toast.success('Property updated successfully');
    } catch (error) {
      console.error('Failed to update property:', error);
      toast.error('Failed to update property');
    }
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-success-50 pb-24 overflow-x-hidden">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-3 sm:px-4 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">{agencyProfile.companyName}</h1>
            <p className="text-neutral-600 mt-1">
              {agencyProfile.agencyType === 'estate_agent' ? 'Estate Agent' : 'Management Agency'} Dashboard
            </p>
          </div>
          {onNavigateToDashboardBuilder && (
            <button
              onClick={onNavigateToDashboardBuilder}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
            >
              <LayoutDashboard size={20} />
              <span className="hidden sm:inline">Custom Dashboard</span>
            </button>
          )}
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex gap-2 sm:gap-6 overflow-x-auto scrollbar-hide pb-px">
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
                className={`py-3 sm:py-4 px-2 shrink-0 whitespace-nowrap text-sm sm:text-base border-b-2 font-medium transition-colors ${activeTab === tab.id
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

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <AgencyStatsCards stats={stats} />

            {/* SLA Performance Section */}
            <SLAPerformanceSection
              complianceRate={stats.slaComplianceRate}
              averageResponseTime={stats.averageResponseTime}
              slaConfig={agencyProfile.slaConfiguration ?? {
                emergencyResponseHours: 4,
                urgentResponseHours: 24,
                routineResponseHours: 72,
                maintenanceResponseDays: 14,
              }}
              onEditSLA={() => setIsSLAModalOpen(true)}
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
              <AgencyIssuesDashboard issues={allIssues} limit={5} onViewIssue={setSelectedIssue} />
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
            <AgencyPropertiesTable
              properties={properties}
              onViewDetails={setSelectedProperty}
              onEditProperty={setEditingProperty}
            />
          </div>
        )}

        {activeTab === 'tenancies' && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
              <Users size={24} className="text-success-600" />
              Active Tenancies
            </h3>
            <AgencyTenanciesTable tenancies={activeTenancies} onViewDetails={setSelectedTenancy} />
          </div>
        )}

        {activeTab === 'issues' && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
              <AlertTriangle size={24} className="text-warning-600" />
              All Issues
            </h3>
            <AgencyIssuesDashboard issues={allIssues} onViewIssue={setSelectedIssue} />
          </div>
        )}
      </main>

      {/* Modals */}
      <PropertyDetailsModal
        property={selectedProperty}
        isOpen={!!selectedProperty}
        onClose={() => setSelectedProperty(null)}
      />

      <IssueDetailsModal
        issue={selectedIssue}
        isOpen={!!selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onStatusUpdate={handleIssueStatusUpdate}
        showStatusActions={true}
      />

      <TenancyDetailsModal
        tenancy={selectedTenancy}
        isOpen={!!selectedTenancy}
        onClose={() => setSelectedTenancy(null)}
      />

      <SLAConfigurationModal
        isOpen={isSLAModalOpen}
        onClose={() => setIsSLAModalOpen(false)}
        currentConfig={agencyProfile.slaConfiguration ?? {
          emergencyResponseHours: 4,
          urgentResponseHours: 24,
          routineResponseHours: 72,
          maintenanceResponseDays: 14,
        }}
        onSave={handleSaveSLA}
      />

      {/* Property Editor Modal */}
      {editingProperty && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center p-4 py-8">
            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl">
              <PropertyForm
                mode="edit"
                initialData={editingProperty}
                onSubmit={handlePropertyUpdate}
                onCancel={() => setEditingProperty(null)}
              />
            </div>
          </div>
        </div>
      )}
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 ${card.bgColor} rounded-lg flex items-center justify-center shrink-0`}>
              <card.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${card.textColor}`} />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-neutral-900">{card.value}</div>
              <div className="text-xs sm:text-sm text-neutral-600">{card.label}</div>
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
  onEditSLA?: () => void;
}

function SLAPerformanceSection({ complianceRate, averageResponseTime, slaConfig, onEditSLA }: SLAPerformanceSectionProps) {
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
      <div className="mt-4 sm:mt-6 grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        <div className="text-center p-2 sm:p-4 bg-danger-50 rounded-lg">
          <div className="text-lg sm:text-2xl font-bold text-danger-700">{slaConfig.emergencyResponseHours}h</div>
          <div className="text-[10px] sm:text-xs text-neutral-600 mt-1">Emergency SLA</div>
        </div>
        <div className="text-center p-2 sm:p-4 bg-warning-50 rounded-lg">
          <div className="text-lg sm:text-2xl font-bold text-warning-700">{slaConfig.urgentResponseHours}h</div>
          <div className="text-[10px] sm:text-xs text-neutral-600 mt-1">Urgent SLA</div>
        </div>
        <div className="text-center p-2 sm:p-4 bg-success-50 rounded-lg">
          <div className="text-lg sm:text-2xl font-bold text-success-700">{slaConfig.routineResponseHours}h</div>
          <div className="text-[10px] sm:text-xs text-neutral-600 mt-1">Routine SLA</div>
        </div>
        <div className="text-center p-2 sm:p-4 bg-neutral-50 rounded-lg">
          <div className="text-lg sm:text-2xl font-bold text-neutral-700">{slaConfig.maintenanceResponseDays}d</div>
          <div className="text-[10px] sm:text-xs text-neutral-600 mt-1">Maintenance SLA</div>
        </div>
      </div>

      {/* Edit SLA Button */}
      {onEditSLA && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={onEditSLA}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <Settings size={16} />
            Edit SLA Configuration
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Phase 6: AgencyPropertiesTable Component
 * List of all properties under management
 */
interface AgencyPropertiesTableProps {
  properties: Property[];
  onViewDetails?: (property: Property) => void;
  onEditProperty?: (property: Property) => void;
}

function AgencyPropertiesTable({ properties, onViewDetails, onEditProperty }: AgencyPropertiesTableProps) {
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
    <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
      <table className="w-full min-w-[600px]">
        <thead className="bg-neutral-50 border-b-2 border-neutral-200">
          <tr>
            <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Address</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Type</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Rent</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Status</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Management</th>
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
                {property.isFullyManagedByAgency ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-700">
                    <Shield size={12} />
                    Full Management
                  </span>
                ) : (
                  <span className="text-xs text-neutral-500">Standard</span>
                )}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewDetails?.(property)}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    View
                  </button>
                  <button
                    onClick={() => onEditProperty?.(property)}
                    className="inline-flex items-center gap-1 text-secondary-600 hover:text-secondary-700 text-sm font-medium"
                  >
                    <Edit size={14} />
                    Edit
                  </button>
                </div>
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
  onViewDetails?: (tenancy: Match) => void;
}

function AgencyTenanciesTable({ tenancies, onViewDetails }: AgencyTenanciesTableProps) {
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
    <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
      <table className="w-full min-w-[600px]">
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
                <button
                  onClick={() => onViewDetails?.(tenancy)}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
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
  onViewIssue?: (issue: Issue) => void;
}

function AgencyIssuesDashboard({ issues, limit, onViewIssue }: AgencyIssuesDashboardProps) {
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
        <AgencyIssueRow key={issue.id} issue={issue} onViewDetails={() => onViewIssue?.(issue)} />
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
  onViewDetails?: () => void;
}

function AgencyIssueRow({ issue, onViewDetails }: AgencyIssueRowProps) {
  const priorityColors = {
    emergency: { bg: 'bg-danger-100', text: 'text-danger-700', border: 'border-danger-300' },
    urgent: { bg: 'bg-warning-100', text: 'text-warning-700', border: 'border-warning-300' },
    routine: { bg: 'bg-success-100', text: 'text-success-700', border: 'border-success-300' },
    low: { bg: 'bg-neutral-100', text: 'text-neutral-700', border: 'border-neutral-300' },
  };

  const statusIcons: Record<IssueStatus, React.ReactNode> = {
    open: <Clock size={16} className="text-warning-600" />,
    acknowledged: <MessageSquare size={16} className="text-primary-600" />,
    in_progress: <TrendingUp size={16} className="text-primary-600" />,
    awaiting_parts: <Clock size={16} className="text-warning-600" />,
    awaiting_access: <Clock size={16} className="text-warning-600" />,
    scheduled: <Clock size={16} className="text-primary-600" />,
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
            Raised {issue.raisedAt ? new Date(issue.raisedAt).toLocaleDateString() : 'N/A'}
          </div>
        </div>
      </div>

      {/* SLA Deadline */}
      <div className="flex items-center justify-between pt-3 border-t border-neutral-200">
        <div className="text-xs text-neutral-600">
          SLA Deadline: {issue.slaDeadline ? new Date(issue.slaDeadline).toLocaleString() : 'N/A'}
        </div>
        <button
          onClick={onViewDetails}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          View Details →
        </button>
      </div>
    </div>
  );
}
