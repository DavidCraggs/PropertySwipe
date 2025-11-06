import React, { useState } from 'react';
import { Home, MessageCircle, AlertTriangle, Clock, CheckCircle2, Package } from 'lucide-react';
import { useAuthStore } from '../hooks/useAuthStore';
import { Button } from '../components/atoms/Button';
import type { RenterProfile, Property, AgencyProfile, Issue } from '../types';

/**
 * Dashboard for current renters (actively in a tenancy)
 * Shows current property, contact options, and issue management
 * Phase 3: Current Renter Experience
 */
export const CurrentRenterDashboard: React.FC = () => {
  const { currentUser, userType } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'issues'>('overview');

  // Type guards
  if (userType !== 'renter') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-success-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Package className="mx-auto text-neutral-400 mb-4" size={64} />
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Access Denied</h2>
          <p className="text-neutral-600">This page is only accessible to renters.</p>
        </div>
      </div>
    );
  }

  const renterProfile = currentUser as RenterProfile;

  // Check if renter is current (not prospective)
  if (renterProfile.status !== 'current') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-success-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Home className="mx-auto text-neutral-400 mb-4" size={64} />
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">No Active Tenancy</h2>
          <p className="text-neutral-600">
            You don't have an active tenancy yet. Continue swiping to find your next home!
          </p>
        </div>
      </div>
    );
  }

  // TODO: Fetch actual property, agency, and issues data from storage
  // For now, using placeholder values
  const hasAgency = !!renterProfile.currentAgencyId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-success-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-neutral-900">My Tenancy</h1>
          <p className="text-neutral-600 mt-1">Manage your current rental</p>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('issues')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'issues'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Issues & Maintenance
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Current Property Card */}
            <CurrentPropertyCard
              propertyId={renterProfile.currentPropertyId}
              moveInDate={renterProfile.moveInDate}
            />

            {/* Contact Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Agency Contact */}
              {hasAgency && (
                <AgencyContactCard agencyId={renterProfile.currentAgencyId} />
              )}

              {/* Landlord Contact */}
              <LandlordContactCard landlordId={renterProfile.currentLandlordId} />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-neutral-900 mb-4">Quick Actions</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  icon={<AlertTriangle size={20} />}
                  onClick={() => setActiveTab('issues')}
                  className="justify-start"
                >
                  Report an Issue
                </Button>
                <Button
                  variant="outline"
                  icon={<MessageCircle size={20} />}
                  disabled
                  className="justify-start"
                >
                  Message Landlord
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'issues' && (
          <div className="space-y-6">
            {/* Issue Reporter */}
            <RenterIssueReporter
              propertyId={renterProfile.currentPropertyId}
              landlordId={renterProfile.currentLandlordId}
              agencyId={renterProfile.currentAgencyId}
            />

            {/* Active Issues Section */}
            <IssueSection renterId={renterProfile.id} />
          </div>
        )}
      </main>
    </div>
  );
};

/**
 * Component: CurrentPropertyCard
 * Displays information about the renter's current property
 */
interface CurrentPropertyCardProps {
  propertyId?: string;
  moveInDate?: Date;
}

const CurrentPropertyCard: React.FC<CurrentPropertyCardProps> = ({
  propertyId,
  moveInDate,
}) => {
  // TODO: Fetch property details from storage
  const property: Property | null = null;

  if (!property && !propertyId) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 border-2 border-dashed border-neutral-200">
        <p className="text-neutral-600 text-center">Property information not available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Property Image */}
      <div className="h-48 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
        <Home size={64} className="text-primary-600 opacity-50" />
      </div>

      {/* Property Info */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-neutral-900">Your Current Home</h3>
            {moveInDate && (
              <p className="text-sm text-neutral-600 mt-1">
                Living here since {new Date(moveInDate).toLocaleDateString()}
              </p>
            )}
          </div>
          <span className="px-3 py-1 bg-success-100 text-success-700 rounded-full text-sm font-medium">
            Active
          </span>
        </div>

        {/* TODO: Display actual property details when fetched */}
        <div className="space-y-2 text-sm text-neutral-600">
          <p>Property ID: {propertyId || 'Not available'}</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Component: AgencyContactCard
 * Displays agency contact information with SLA performance
 */
interface AgencyContactCardProps {
  agencyId?: string;
}

const AgencyContactCard: React.FC<AgencyContactCardProps> = ({ agencyId }) => {
  // TODO: Fetch agency details from storage
  const agency: AgencyProfile | null = null;

  if (!agency && !agencyId) {
    return null;
  }

  // TODO: Calculate SLA display text based on agency performance
  const slaText = 'usually responds within 24 hours';
  const slaColor = 'text-success-600';

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
          <Home size={24} className="text-primary-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-neutral-900">Managing Agency</h3>
          <p className="text-sm text-neutral-600">Agency ID: {agencyId || 'Not available'}</p>
        </div>
      </div>

      {/* SLA Performance Indicator */}
      <div className="bg-success-50 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2">
          <Clock size={16} className={slaColor} />
          <span className={`text-sm font-medium ${slaColor}`}>{slaText}</span>
        </div>
      </div>

      <Button variant="primary" className="w-full" icon={<MessageCircle size={18} />} disabled>
        Contact Agency
      </Button>
    </div>
  );
};

/**
 * Component: LandlordContactCard
 * Displays landlord contact information
 */
interface LandlordContactCardProps {
  landlordId?: string;
}

const LandlordContactCard: React.FC<LandlordContactCardProps> = ({ landlordId }) => {
  if (!landlordId) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-secondary-100 flex items-center justify-center">
          <Home size={24} className="text-secondary-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-neutral-900">Your Landlord</h3>
          <p className="text-sm text-neutral-600">Landlord ID: {landlordId}</p>
        </div>
      </div>

      <Button variant="outline" className="w-full" icon={<MessageCircle size={18} />} disabled>
        Contact Landlord
      </Button>
    </div>
  );
};

/**
 * Component: RenterIssueReporter
 * Form for renters to report issues
 */
interface RenterIssueReporterProps {
  propertyId?: string;
  landlordId?: string;
  agencyId?: string;
}

const RenterIssueReporter: React.FC<RenterIssueReporterProps> = ({
  agencyId,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isExpanded) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <Button
          variant="primary"
          icon={<AlertTriangle size={20} />}
          onClick={() => setIsExpanded(true)}
          className="w-full"
        >
          Report New Issue
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-xl font-bold text-neutral-900 mb-4">Report an Issue</h3>
      <p className="text-sm text-neutral-600 mb-4">
        Describe the issue you're experiencing. Your {agencyId ? 'managing agency' : 'landlord'}{' '}
        will be notified.
      </p>

      {/* TODO: Implement full issue reporting form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Issue Type</label>
          <select className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option value="">Select type...</option>
            <option value="maintenance">Maintenance</option>
            <option value="repair">Repair</option>
            <option value="complaint">Complaint</option>
            <option value="query">Query</option>
            <option value="hazard">Hazard</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Priority</label>
          <select className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option value="low">Low - Can wait</option>
            <option value="routine">Routine - Within a week</option>
            <option value="urgent">Urgent - Within 24 hours</option>
            <option value="emergency">Emergency - Immediate attention</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Description</label>
          <textarea
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows={4}
            placeholder="Please describe the issue in detail..."
          />
        </div>

        <div className="flex gap-3">
          <Button variant="primary" className="flex-1" disabled>
            Submit Issue
          </Button>
          <Button variant="outline" onClick={() => setIsExpanded(false)}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * Component: IssueSection
 * Displays list of active and resolved issues
 */
interface IssueSectionProps {
  renterId: string;
}

const IssueSection: React.FC<IssueSectionProps> = () => {
  // TODO: Fetch issues from storage
  const issues: Issue[] = [];

  if (issues.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-xl font-bold text-neutral-900 mb-4">Your Issues</h3>
        <div className="text-center py-8">
          <CheckCircle2 size={48} className="mx-auto text-neutral-400 mb-4" />
          <p className="text-neutral-600">No issues reported yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-xl font-bold text-neutral-900 mb-4">Your Issues</h3>
      <div className="space-y-3">
        {issues.map((issue) => (
          <IssueCard key={issue.id} issue={issue} />
        ))}
      </div>
    </div>
  );
};

/**
 * Component: IssueCard
 * Individual issue item display
 */
interface IssueCardProps {
  issue: Issue;
}

const IssueCard: React.FC<IssueCardProps> = ({ issue }) => {
  const priorityColors = {
    emergency: 'bg-danger-100 text-danger-700',
    urgent: 'bg-warning-100 text-warning-700',
    routine: 'bg-success-100 text-success-700',
    low: 'bg-neutral-100 text-neutral-700',
  };

  const statusIcons = {
    open: <Clock size={16} />,
    acknowledged: <Clock size={16} />,
    in_progress: <Clock size={16} />,
    awaiting_parts: <Clock size={16} />,
    awaiting_access: <Clock size={16} />,
    resolved: <CheckCircle2 size={16} />,
    closed: <CheckCircle2 size={16} />,
  };

  return (
    <div className="border border-neutral-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-neutral-900">{issue.subject}</h4>
        <span className={`px-2 py-1 text-xs font-medium rounded ${priorityColors[issue.priority]}`}>
          {issue.priority}
        </span>
      </div>

      <p className="text-sm text-neutral-600 mb-3 line-clamp-2">{issue.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          {statusIcons[issue.status]}
          <span className="capitalize">{issue.status.replace('_', ' ')}</span>
        </div>
        <span className="text-xs text-neutral-500">
          {new Date(issue.raisedAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};
