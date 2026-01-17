import React, { useState, useEffect } from 'react';
import { Home, MessageCircle, AlertTriangle, Clock, CheckCircle2, Package, LogOut } from 'lucide-react';
import { useAuthStore } from '../hooks/useAuthStore';
import { Button } from '../components/atoms/Button';
import { useToastStore } from '../components/organisms/toastUtils';
import { IssueDetailsModal } from '../components/organisms/IssueDetailsModal';
import type { RenterProfile, Property, AgencyProfile, Issue, IssueCategory, IssuePriority, IssueStatus, ConversationType } from '../types';
import { getPropertyById, getAgencyProfile, getIssuesForMatch, createIssue, updateIssueStatus } from '../lib/storage';
import { useAppStore } from '../hooks';

interface CurrentRenterDashboardProps {
  onNavigateToMatches?: (matchId?: string, conversationType?: ConversationType) => void;
}

/**
 * Dashboard for current renters (actively in a tenancy)
 * Shows current property, contact options, and issue management
 * Phase 3: Current Renter Experience
 */
export const CurrentRenterDashboard: React.FC<CurrentRenterDashboardProps> = ({ onNavigateToMatches }) => {
  const { currentUser, userType, logout } = useAuthStore();
  const { matches } = useAppStore();
  const { addToast } = useToastStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'issues'>('overview');
  const [currentProperty, setCurrentProperty] = useState<Property | null>(null);
  const [currentAgency, setCurrentAgency] = useState<AgencyProfile | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMatchId, setCurrentMatchId] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const renterProfile = currentUser as RenterProfile;

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        console.log('[CurrentRenterDashboard] Fetching data for renter:', renterProfile.id);

        // Query Supabase directly for this renter's active match
        const { supabase } = await import('../lib/supabase');
        const { data: matchData, error: matchError } = await supabase
          .from('matches')
          .select('*')
          .eq('renter_id', renterProfile.id)
          .eq('tenancy_status', 'active')
          .maybeSingle();

        if (matchError) {
          console.error('[CurrentRenterDashboard] Error fetching match:', matchError);
          addToast({
            type: 'danger',
            title: 'Failed to Load Match',
            message: 'Could not retrieve your current tenancy information. Please try again.'
          });
          return;
        }

        console.log('[CurrentRenterDashboard] Found match data:', matchData);

        if (matchData) {
          // Store match ID for navigation
          setCurrentMatchId(matchData.id);

          // Fetch property by ID (efficient single-row query)
          const property = await getPropertyById(matchData.property_id);
          console.log('[CurrentRenterDashboard] Found property:', property?.id);
          setCurrentProperty(property);

          // Fetch agency if exists
          if (renterProfile.currentAgencyId) {
            const agency = await getAgencyProfile(renterProfile.currentAgencyId);
            setCurrentAgency(agency);
          }

          // Fetch issues for this match (if the column exists)
          try {
            const matchIssues = await getIssuesForMatch(matchData.id);
            setIssues(matchIssues);
          } catch (error) {
            console.log('[CurrentRenterDashboard] Issues feature not available:', error);
            setIssues([]);
          }
        } else {
          console.log('[CurrentRenterDashboard] No active match found in database');
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        addToast({
          type: 'danger',
          title: 'Loading Error',
          message: 'Failed to load dashboard data. Please refresh the page.'
        });
      } finally {
        setIsLoading(false);
      }
    };


    fetchData();
  }, [renterProfile.id, renterProfile.currentAgencyId, matches, addToast]);

  // Type guard - must be after hooks
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

  const hasAgency = !!renterProfile.currentAgencyId;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-success-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  // Handler for updating issue status
  const handleIssueStatusUpdate = async (issueId: string, newStatus: IssueStatus) => {
    try {
      await updateIssueStatus(issueId, newStatus);
      setIssues(prev => prev.map(issue =>
        issue.id === issueId ? { ...issue, status: newStatus } : issue
      ));
      setSelectedIssue(null);
      addToast({ type: 'success', title: 'Status Updated', message: `Issue marked as ${newStatus.replace('_', ' ')}` });
    } catch (error) {
      console.error('Failed to update issue status:', error);
      addToast({ type: 'danger', title: 'Error', message: 'Failed to update issue status' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-success-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-4 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">My Tenancy</h1>
            <p className="text-neutral-600 mt-1">Manage your current rental</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={<LogOut size={18} />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${activeTab === 'overview'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
                }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('issues')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${activeTab === 'issues'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
                }`}
            >
              Issues & Maintenance
              {issues.filter(i => i.status !== 'resolved' && i.status !== 'closed').length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-danger-500 text-white text-xs rounded-full">
                  {issues.filter(i => i.status !== 'resolved' && i.status !== 'closed').length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Current Property Card */}
            <CurrentPropertyCard
              property={currentProperty}
              moveInDate={renterProfile.moveInDate}
            />

            {/* Landlord & Agency Contact */}
            <div className="grid md:grid-cols-2 gap-6">
              <LandlordContactCard
                landlordId={renterProfile.currentLandlordId}
                currentMatchId={currentMatchId}
                onNavigateToMatches={onNavigateToMatches}
              />
              {hasAgency && (
                <AgencyContactCard
                  agency={currentAgency}
                  currentMatchId={currentMatchId}
                  onNavigateToMatches={onNavigateToMatches}
                />
              )}
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
            <IssueSection issues={issues} onViewIssue={setSelectedIssue} />
          </div>
        )}
      </main>

      {/* Issue Details Modal */}
      <IssueDetailsModal
        issue={selectedIssue}
        isOpen={!!selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onStatusUpdate={handleIssueStatusUpdate}
        showStatusActions={true}
      />
    </div>
  );
};

/**
 * Component: CurrentPropertyCard
 * Displays information about the renter's current property
 */
interface CurrentPropertyCardProps {
  property: Property | null;
  moveInDate?: Date;
}

const CurrentPropertyCard: React.FC<CurrentPropertyCardProps> = ({
  property,
  moveInDate,
}) => {
  if (!property) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 border-2 border-dashed border-neutral-200">
        <p className="text-neutral-600 text-center">Property information not available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Property Image */}
      <div className="h-48 bg-gradient-to-br from-primary-100 to-primary-200 relative overflow-hidden">
        {property.images && property.images.length > 0 ? (
          <img
            src={property.images[0]}
            alt={property.address.street}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Home size={64} className="text-primary-600 opacity-50" />
          </div>
        )}
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

        <div className="space-y-2 text-sm text-neutral-600">
          <p className="font-medium text-neutral-900">{property.address.street}</p>
          <p>{property.address.city}, {property.address.postcode}</p>
          <div className="flex gap-4 mt-3">
            <span>{property.bedrooms} bed</span>
            <span>•</span>
            <span>{property.bathrooms} bath</span>
            <span>•</span>
            <span>£{property.rentPcm}/month</span>
          </div>
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
  agency: AgencyProfile | null;
  currentMatchId: string | null;
  onNavigateToMatches?: (matchId?: string, conversationType?: ConversationType) => void;
}

const AgencyContactCard: React.FC<AgencyContactCardProps> = ({ agency, currentMatchId, onNavigateToMatches }) => {
  if (!agency) {
    return null;
  }

  // Calculate SLA display text based on agency performance
  const slaConfig = agency.slaConfiguration;
  const slaText = slaConfig?.emergencyResponseHours
    ? `usually responds within ${slaConfig.emergencyResponseHours} hours`
    : 'usually responds within 24 hours';
  const slaColor = 'text-success-600';

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
          <Home size={24} className="text-primary-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-neutral-900">Managing Agency</h3>
          <p className="text-sm text-neutral-600">{agency.companyName}</p>
        </div>
      </div>

      {/* SLA Performance Indicator */}
      <div className="bg-success-50 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2">
          <Clock size={16} className={slaColor} />
          <span className={`text-sm font-medium ${slaColor}`}>{slaText}</span>
        </div>
      </div>

      <Button
        variant="primary"
        className="w-full"
        icon={<MessageCircle size={18} />}
        onClick={() => onNavigateToMatches?.(currentMatchId || undefined, 'agency')}
      >
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
  currentMatchId: string | null;
  onNavigateToMatches?: (matchId?: string, conversationType?: ConversationType) => void;
}

const LandlordContactCard: React.FC<LandlordContactCardProps> = ({ landlordId, currentMatchId, onNavigateToMatches }) => {
  const [landlordName, setLandlordName] = useState<string>('Loading...');

  console.log('[LandlordContactCard] Received landlordId:', landlordId);

  useEffect(() => {
    if (!landlordId) {
      console.log('[LandlordContactCard] No landlordId provided, skipping fetch');
      return;
    }

    const fetchLandlord = async () => {
      try {
        const { getLandlordProfile } = await import('../lib/storage');
        const landlord = await getLandlordProfile(landlordId);
        setLandlordName(landlord?.names || 'Landlord');
      } catch (error) {
        console.error('Failed to fetch landlord:', error);
        setLandlordName('Landlord');
      }
    };

    fetchLandlord();
  }, [landlordId]);

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
          <p className="text-sm text-neutral-600">{landlordName}</p>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full"
        icon={<MessageCircle size={18} />}
        onClick={() => onNavigateToMatches?.(currentMatchId || undefined, 'landlord')}
      >
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
  propertyId,
  landlordId,
  agencyId,
}) => {
  const { currentUser } = useAuthStore();
  const renterProfile = currentUser as RenterProfile;

  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [formData, setFormData] = useState<{
    category: IssueCategory | '';
    priority: IssuePriority;
    subject: string;
    description: string;
  }>({
    category: '',
    priority: 'routine',
    subject: '',
    description: '',
  });

  const [validationErrors, setValidationErrors] = useState<{
    category?: string;
    subject?: string;
    description?: string;
  }>({});

  /**
   * Validate form fields
   */
  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};

    if (!formData.category) {
      errors.category = 'Please select an issue type';
    }

    if (!formData.subject || formData.subject.trim().length < 5) {
      errors.subject = 'Subject must be at least 5 characters';
    } else if (formData.subject.trim().length > 100) {
      errors.subject = 'Subject must not exceed 100 characters';
    }

    if (!formData.description || formData.description.trim().length < 20) {
      errors.description = 'Description must be at least 20 characters';
    } else if (formData.description.trim().length > 2000) {
      errors.description = 'Description must not exceed 2000 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    // Clear previous states
    setSubmitError(null);
    setSubmitSuccess(false);

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Check required props
    if (!propertyId || !landlordId) {
      setSubmitError('Missing property or landlord information. Please try again later.');
      return;
    }

    setIsSubmitting(true);

    try {
      await createIssue({
        propertyId,
        renterId: renterProfile.id,
        landlordId,
        agencyId,
        category: formData.category as IssueCategory,
        priority: formData.priority,
        subject: formData.subject.trim(),
        description: formData.description.trim(),
        images: [],
        status: 'open',
        raisedAt: new Date(),
      });

      // Success!
      setSubmitSuccess(true);

      // Reset form
      setFormData({
        category: '',
        priority: 'routine',
        subject: '',
        description: '',
      });
      setValidationErrors({});

      // Collapse form after brief delay
      setTimeout(() => {
        setIsExpanded(false);
        setSubmitSuccess(false);
        // Trigger page refresh to show new issue
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Failed to create issue:', error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Failed to submit issue. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Reset form and close
   */
  const handleCancel = () => {
    setFormData({
      category: '',
      priority: 'routine',
      subject: '',
      description: '',
    });
    setValidationErrors({});
    setSubmitError(null);
    setSubmitSuccess(false);
    setIsExpanded(false);
  };

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
        will be notified immediately.
      </p>

      {/* Success Message */}
      {submitSuccess && (
        <div className="mb-4 p-4 bg-success-50 border border-success-200 rounded-lg flex items-start gap-3">
          <CheckCircle2 size={20} className="text-success-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-success-900">Issue Reported Successfully</p>
            <p className="text-sm text-success-700 mt-1">
              Your issue has been submitted and the relevant parties have been notified.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div className="mb-4 p-4 bg-danger-50 border border-danger-200 rounded-lg flex items-start gap-3">
          <AlertTriangle size={20} className="text-danger-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-danger-900">Submission Failed</p>
            <p className="text-sm text-danger-700 mt-1">{submitError}</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Category */}
        <div>
          <label
            htmlFor="issue-category"
            className="block text-sm font-medium text-neutral-700 mb-2"
          >
            Issue Type <span className="text-danger-500">*</span>
          </label>
          <select
            id="issue-category"
            value={formData.category}
            onChange={(e) => {
              setFormData({ ...formData, category: e.target.value as IssueCategory });
              setValidationErrors({ ...validationErrors, category: undefined });
            }}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${validationErrors.category ? 'border-danger-500' : 'border-neutral-300'
              }`}
            disabled={isSubmitting}
            aria-describedby={validationErrors.category ? 'category-error' : undefined}
          >
            <option value="">Select type...</option>
            <option value="maintenance">Maintenance</option>
            <option value="repair">Repair</option>
            <option value="complaint">Complaint</option>
            <option value="query">Query</option>
            <option value="hazard">Hazard</option>
          </select>
          {validationErrors.category && (
            <p id="category-error" className="mt-1 text-sm text-danger-600">
              {validationErrors.category}
            </p>
          )}
        </div>

        {/* Priority */}
        <div>
          <label
            htmlFor="issue-priority"
            className="block text-sm font-medium text-neutral-700 mb-2"
          >
            Priority <span className="text-danger-500">*</span>
          </label>
          <select
            id="issue-priority"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as IssuePriority })}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={isSubmitting}
          >
            <option value="low">Low - Can wait</option>
            <option value="routine">Routine - Within a week</option>
            <option value="urgent">Urgent - Within 24 hours</option>
            <option value="emergency">Emergency - Immediate attention</option>
          </select>
        </div>

        {/* Subject */}
        <div>
          <label
            htmlFor="issue-subject"
            className="block text-sm font-medium text-neutral-700 mb-2"
          >
            Subject <span className="text-danger-500">*</span>
          </label>
          <input
            id="issue-subject"
            type="text"
            value={formData.subject}
            onChange={(e) => {
              setFormData({ ...formData, subject: e.target.value });
              setValidationErrors({ ...validationErrors, subject: undefined });
            }}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${validationErrors.subject ? 'border-danger-500' : 'border-neutral-300'
              }`}
            placeholder="Brief summary of the issue"
            maxLength={100}
            disabled={isSubmitting}
            aria-describedby={validationErrors.subject ? 'subject-error' : undefined}
          />
          <div className="mt-1 flex justify-between items-center">
            {validationErrors.subject ? (
              <p id="subject-error" className="text-sm text-danger-600">
                {validationErrors.subject}
              </p>
            ) : (
              <p className="text-xs text-neutral-500">
                {formData.subject.length}/100 characters
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="issue-description"
            className="block text-sm font-medium text-neutral-700 mb-2"
          >
            Description <span className="text-danger-500">*</span>
          </label>
          <textarea
            id="issue-description"
            value={formData.description}
            onChange={(e) => {
              setFormData({ ...formData, description: e.target.value });
              setValidationErrors({ ...validationErrors, description: undefined });
            }}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${validationErrors.description ? 'border-danger-500' : 'border-neutral-300'
              }`}
            rows={4}
            placeholder="Please describe the issue in detail (minimum 20 characters)..."
            maxLength={2000}
            disabled={isSubmitting}
            aria-describedby={validationErrors.description ? 'description-error' : undefined}
          />
          <div className="mt-1 flex justify-between items-center">
            {validationErrors.description ? (
              <p id="description-error" className="text-sm text-danger-600">
                {validationErrors.description}
              </p>
            ) : (
              <p className="text-xs text-neutral-500">
                {formData.description.length}/2000 characters
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleSubmit}
            disabled={isSubmitting || submitSuccess}
            aria-label="Submit issue report"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Submitting...
              </>
            ) : (
              'Submit Issue'
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
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
  issues: Issue[];
  onViewIssue?: (issue: Issue) => void;
}

const IssueSection: React.FC<IssueSectionProps> = ({ issues, onViewIssue }) => {
  const activeIssues = issues.filter(i => i.status !== 'resolved' && i.status !== 'closed');
  const resolvedIssues = issues.filter(i => i.status === 'resolved' || i.status === 'closed');

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
    <div className="space-y-6">
      {/* Active Issues */}
      {activeIssues.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-xl font-bold text-neutral-900 mb-4">
            Active Issues ({activeIssues.length})
          </h3>
          <div className="space-y-3">
            {activeIssues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} onClick={() => onViewIssue?.(issue)} />
            ))}
          </div>
        </div>
      )}

      {/* Resolved Issues */}
      {resolvedIssues.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-xl font-bold text-neutral-900 mb-4">
            Resolved Issues ({resolvedIssues.length})
          </h3>
          <div className="space-y-3">
            {resolvedIssues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} onClick={() => onViewIssue?.(issue)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Component: IssueCard
 * Individual issue item display
 */
interface IssueCardProps {
  issue: Issue;
  onClick?: () => void;
}

const IssueCard: React.FC<IssueCardProps> = ({ issue, onClick }) => {
  const priorityColors = {
    emergency: 'bg-danger-100 text-danger-700',
    urgent: 'bg-warning-100 text-warning-700',
    routine: 'bg-success-100 text-success-700',
    low: 'bg-neutral-100 text-neutral-700',
  };

  const statusIcons: Record<IssueStatus, React.ReactNode> = {
    open: <Clock size={16} />,
    acknowledged: <Clock size={16} />,
    in_progress: <Clock size={16} />,
    awaiting_parts: <Clock size={16} />,
    awaiting_access: <Clock size={16} />,
    scheduled: <Clock size={16} />,
    resolved: <CheckCircle2 size={16} />,
    closed: <CheckCircle2 size={16} />,
  };

  return (
    <div
      onClick={onClick}
      className="border border-neutral-200 rounded-lg p-4 hover:border-primary-300 transition-colors cursor-pointer"
    >
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

// Export RenterIssueReporter for testing
export { RenterIssueReporter };
