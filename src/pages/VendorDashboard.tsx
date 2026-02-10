import { useState, useCallback, useEffect } from 'react';
import { Home, TrendingUp, Users, Heart, MessageSquare, Calendar, Eye, Clock, Edit, Trash2, LinkIcon, PlusCircle, AlertTriangle, CheckCircle2, UserPlus, Shield, FileText, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../hooks/useAuthStore';
import { useAppStore } from '../hooks';
import type { LandlordProfile, Match, Issue, IssueStatus, Property } from '../types';
import { ViewingScheduler } from '../components/organisms/ViewingScheduler';
import { PropertyLinker } from '../components/organisms/PropertyLinker';
import { PropertyForm } from '../components/organisms/PropertyForm';
import { PropertyImage } from '../components/atoms/PropertyImage';
import { AgencyLinkManager } from '../components/organisms/AgencyLinkManager';
import { CreateRenterInviteModal } from '../components/organisms/CreateRenterInviteModal';
import { IssueDetailsModal } from '../components/organisms/IssueDetailsModal';
import { ConfirmationModal } from '../components/molecules/ConfirmationModal';
import { ManagementContractWizard } from '../components/organisms/management-contract-creator';
import { useToastStore } from '../components/organisms/toastUtils';
import { getIssuesForProperty, updateIssueStatus, saveProperty, getLandlordProperties, getAgencyLinksForLandlord } from '../lib/storage';

interface VendorDashboardProps {
  onNavigateToMatches?: (matchId?: string) => void;
  onNavigateToAgencyMessages?: () => void;
  onNavigateToDashboardBuilder?: () => void;
}

/**
 * Dashboard for landlords showing their rental property listing and interested renters
 * Different from renter swipe interface
 */
export function VendorDashboard({ onNavigateToMatches, onNavigateToAgencyMessages, onNavigateToDashboardBuilder }: VendorDashboardProps) {
  const { currentUser, updateProfile } = useAuthStore();
  const {
    allProperties,
    confirmViewing,
    linkPropertyToLandlord,
    createProperty,
    updateProperty,
    deleteProperty,
    unlinkProperty
  } = useAppStore();
  const { addToast } = useToastStore();
  const [schedulingMatch, setSchedulingMatch] = useState<Match | null>(null);
  const [showPropertyLinker, setShowPropertyLinker] = useState(false);
  const [showPropertyCreator, setShowPropertyCreator] = useState(false);
  const [showPropertyEditor, setShowPropertyEditor] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [landlordProperties, setLandlordProperties] = useState<Property[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  // Confirmation modal states
  const [petApprovalMatch, setPetApprovalMatch] = useState<Match | null>(null);
  const [petRefusalMatch, setPetRefusalMatch] = useState<Match | null>(null);
  const [rightToRentMatch, setRightToRentMatch] = useState<Match | null>(null);
  // Management contract wizard
  const [showContractWizard, setShowContractWizard] = useState(false);
  // Track if landlord has any active agency links (for showing messages button)
  const [hasAgencyLinks, setHasAgencyLinks] = useState(false);

  const landlordProfile = currentUser as LandlordProfile;

  // Fetch landlord's properties from database (single source of truth: landlord_id on properties)
  useEffect(() => {
    const fetchProperties = async () => {
      if (!landlordProfile?.id) return;
      try {
        const props = await getLandlordProperties(landlordProfile.id);
        setLandlordProperties(props);
      } catch (error) {
        console.error('[VendorDashboard] Failed to fetch properties:', error);
      }
    };
    fetchProperties();
  }, [landlordProfile?.id]);

  // Check if landlord has any active agency links (for showing messages button)
  useEffect(() => {
    const checkAgencyLinks = async () => {
      if (!landlordProfile?.id) return;
      try {
        const links = await getAgencyLinksForLandlord(landlordProfile.id);
        const activeLinks = links.filter(link => link.isActive);
        setHasAgencyLinks(activeLinks.length > 0);
      } catch (error) {
        console.error('[VendorDashboard] Failed to check agency links:', error);
      }
    };
    checkAgencyLinks();
  }, [landlordProfile?.id]);

  // Fetch matches for this landlord from Supabase
  useEffect(() => {
    const fetchMatches = async () => {
      if (!landlordProfile?.id) return;
      try {
        const { supabase } = await import('../lib/supabase');
        const { data: matchData, error } = await supabase
          .from('matches')
          .select(`
            *,
            property:properties(*)
          `)
          .eq('landlord_id', landlordProfile.id);

        if (error) {
          console.error('[VendorDashboard] Error fetching matches:', error);
          return;
        }

        if (matchData && matchData.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const transformedMatches = matchData
            .filter((m: any) => m.property)
            .map((m: any) => {
              const p = m.property;
              const matchedAt = m.matched_at ? new Date(m.matched_at) : new Date();
              return {
                id: m.id,
                renterId: m.renter_id,
                landlordId: m.landlord_id,
                landlordName: m.landlord_name || landlordProfile?.names || 'Landlord',
                renterName: m.renter_name || 'Renter',
                propertyId: m.property_id,
                status: m.status || 'pending',
                tenancyStatus: m.tenancy_status || 'prospective',
                applicationStatus: m.application_status || 'pending',
                matchedAt,
                timestamp: matchedAt.toISOString(),
                hasViewingScheduled: m.has_viewing_scheduled || false,
                confirmedViewingDate: m.confirmed_viewing_date ? new Date(m.confirmed_viewing_date) : undefined,
                viewingPreference: m.viewing_preference,
                messages: m.messages || [],
                unreadCount: m.unread_count || 0,
                lastMessageAt: m.last_message_at,
                activeIssueIds: m.active_issue_ids || [],
                canRate: m.can_rate ?? true,
                hasRatedLandlord: m.has_rated_landlord ?? false,
                hasRatedRenter: m.has_rated_renter ?? false,
                hasRatedProperty: m.has_rated_property ?? false,
                hasRenterRated: m.has_renter_rated ?? false,
                hasLandlordRated: m.has_landlord_rated ?? false,
                petRequestStatus: m.pet_request_status,
                petRequestRefusalReason: m.pet_request_refusal_reason,
                rightToRentVerifiedAt: m.right_to_rent_verified_at ? new Date(m.right_to_rent_verified_at) : undefined,
                isUnderEvictionProceedings: m.is_under_eviction_proceedings ?? false,
                rentArrears: m.rent_arrears ?? 0,
                monthlyRentAmount: m.monthly_rent_amount,
                tenancyStartDate: m.tenancy_start_date ? new Date(m.tenancy_start_date) : undefined,
                totalIssuesRaised: m.total_issues_raised ?? 0,
                totalIssuesResolved: m.total_issues_resolved ?? 0,
                property: p ? {
                  id: p.id,
                  address: {
                    street: p.address_street || '',
                    city: p.address_city || '',
                    postcode: p.address_postcode || '',
                  },
                  rentPcm: p.rent_pcm || 0,
                  deposit: p.deposit || 0,
                  bedrooms: p.bedrooms || 0,
                  bathrooms: p.bathrooms || 0,
                  images: p.images || [],
                  propertyType: p.property_type || 'Flat',
                  furnishing: p.furnishing || 'Unfurnished',
                  availableFrom: p.available_from ? new Date(p.available_from) : new Date(),
                  features: p.features || [],
                  description: p.description || '',
                  landlordId: p.landlord_id,
                  maxRentInAdvance: p.max_rent_in_advance ?? 2,
                  epcRating: p.epc_rating || 'C',
                  yearBuilt: p.year_built,
                  tenancyType: p.tenancy_type || 'periodic',
                  petPolicy: p.pet_policy || 'negotiable',
                  petsAllowed: p.pets_allowed ?? true,
                  smokingAllowed: p.smoking_allowed ?? false,
                  dssAccepted: p.dss_accepted ?? true,
                  studentFriendly: p.student_friendly ?? true,
                  minTenancyMonths: p.min_tenancy_months,
                  councilTaxBand: p.council_tax_band,
                  floorArea: p.floor_area,
                  parkingSpaces: p.parking_spaces ?? 0,
                } as unknown as Property : {} as Property,
              } as unknown as Match;
            });

          setMatches(transformedMatches);
          console.log('[VendorDashboard] Loaded matches:', transformedMatches.length);
        } else {
          setMatches([]);
        }
      } catch (error) {
        console.error('[VendorDashboard] Failed to fetch matches:', error);
      }
    };
    fetchMatches();
  }, [landlordProfile?.id]);

  // Handler to navigate to matches page with a specific match selected
  const handleViewMatch = useCallback((match: Match) => {
    if (onNavigateToMatches) {
      sessionStorage.setItem('autoOpenMatchId', match.id);
      onNavigateToMatches(match.id);
    }
  }, [onNavigateToMatches]);

  // Use first property from fetched landlord properties (queries by landlord_id)
  const landlordProperty = landlordProperties[0] || null;

  const handleUnlinkProperty = useCallback(async () => {
    if (!landlordProfile?.id || !landlordProperty) return;
    try {
      unlinkProperty(landlordProperty.id, landlordProfile.id);
      // Remove the property from propertyIds array
      const remainingIds = (landlordProfile.propertyIds || []).filter(id => id !== landlordProperty.id);
      await updateProfile({ propertyIds: remainingIds.length > 0 ? remainingIds : undefined });
      addToast({
        type: 'success',
        title: 'Property Unlinked',
        message: 'Property has been unlinked from your profile'
      });
    } catch (error) {
      console.error('[VendorDashboard] Unlink failed:', error);
      addToast({
        type: 'danger',
        title: 'Cannot Unlink',
        message: error instanceof Error ? error.message : 'Failed to unlink property'
      });
    }
  }, [landlordProfile, landlordProperty, unlinkProperty, updateProfile, addToast]);

  // Get matches where landlord is the property owner
  const allLandlordMatches = matches.filter((m) => m.landlordId === landlordProfile?.id);

  // Phase 4: Separate active tenancies from prospective matches
  const activeTenancies = allLandlordMatches.filter((m) => m.tenancyStatus === 'active');
  const renterInterests = allLandlordMatches.filter((m) => m.tenancyStatus === 'prospective');

  // Fetch issues for all landlord properties
  useEffect(() => {
    const fetchIssues = async () => {
      if (landlordProperties.length === 0) {
        setAllIssues([]);
        return;
      }
      try {
        const issuesPromises = landlordProperties.map(p => getIssuesForProperty(p.id));
        const issuesArrays = await Promise.all(issuesPromises);
        setAllIssues(issuesArrays.flat());
      } catch (error) {
        console.error('Failed to fetch issues:', error);
      }
    };
    fetchIssues();
  }, [landlordProperties.length, landlordProfile?.id]);

  // Handler for updating issue status
  const handleIssueStatusUpdate = async (issueId: string, newStatus: IssueStatus) => {
    try {
      await updateIssueStatus(issueId, newStatus);
      setAllIssues(prev => prev.map(issue =>
        issue.id === issueId ? { ...issue, status: newStatus } : issue
      ));
      setSelectedIssue(null);
      addToast({ type: 'success', title: 'Status Updated', message: `Issue marked as ${newStatus.replace('_', ' ')}` });
    } catch (error) {
      console.error('Failed to update issue status:', error);
      addToast({ type: 'danger', title: 'Error', message: 'Failed to update issue status' });
    }
  };

  // Handler for management delegation settings
  const handleManagementSettingsChange = async (
    isFullyManaged: boolean,
    landlordRetainsEdit: boolean
  ) => {
    if (!landlordProperty) return;

    try {
      const updatedProperty: Property = {
        ...landlordProperty,
        isFullyManagedByAgency: isFullyManaged,
        landlordCanEditWhenManaged: landlordRetainsEdit,
        lastEditedBy: landlordProfile?.id,
        lastEditedAt: new Date(),
      };

      await saveProperty(updatedProperty);
      updateProperty(landlordProperty.id, updatedProperty);

      addToast({
        type: 'success',
        title: 'Settings Updated',
        message: isFullyManaged
          ? 'Full management delegation enabled'
          : 'Standard management restored'
      });
    } catch (error) {
      console.error('Failed to update management settings:', error);
      addToast({
        type: 'danger',
        title: 'Error',
        message: 'Failed to update management settings'
      });
    }
  };

  // Check if landlord can edit based on management settings
  const canLandlordEdit = !landlordProperty?.isFullyManagedByAgency ||
    landlordProperty?.landlordCanEditWhenManaged;

  // FIX BUG #12: Calculate real stats from match data instead of random numbers
  const openIssues = allIssues.filter(i => i.status !== 'resolved' && i.status !== 'closed');
  const stats = {
    // Profile views = interested renters (each renter "viewed" the property by swiping right)
    totalViews: renterInterests.length,
    interestedRenters: renterInterests.length,
    messages: allLandlordMatches.reduce((acc, m) => acc + m.messages.length, 0),
    viewingsScheduled: renterInterests.filter((m) => m.hasViewingScheduled).length,
    viewingRequests: renterInterests.filter((m) => m.viewingPreference && !m.hasViewingScheduled).length,
    // Phase 4: Add active tenancy stats
    activeTenants: activeTenancies.length,
    totalIssuesOpen: openIssues.length,
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)', color: 'var(--color-text)', paddingBottom: 96 }}>
      {/* Header */}
      <header className="px-4 py-6" style={{ background: 'var(--color-card)', borderBottom: '1px solid var(--color-line)' }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: 3, color: 'var(--color-text)', margin: 0 }}>Landlord Dashboard</h1>
            <p style={{ fontFamily: "'Libre Franklin', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--color-sub)', marginTop: 4 }}>Manage your rental listing and connect with renters</p>
          </div>
          {onNavigateToDashboardBuilder && (
            <button
              onClick={onNavigateToDashboardBuilder}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors"
              style={{ background: 'var(--color-teal)', color: '#fff' }}
            >
              <LayoutDashboard size={20} />
              <span className="hidden sm:inline">Custom Dashboard</span>
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Welcome Card */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--color-teal)', color: '#fff' }}>
          <h2 className="mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: 3, color: '#fff', margin: 0, marginBottom: 8 }}>Welcome back, {landlordProfile?.names}!</h2>
          <p style={{ color: 'rgba(255,255,255,0.85)' }}>
            {landlordProfile?.preferredTenantTypes && landlordProfile.preferredTenantTypes.length > 0
              ? `Looking for ${landlordProfile.preferredTenantTypes.join(', ')} tenants`
              : 'Looking for quality tenants'} for your {landlordProfile?.propertyType} property
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="rounded-xl p-5" style={{ background: 'var(--color-card)', border: '1.5px solid var(--color-line)' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(13,148,136,0.06)' }}>
                <Eye className="w-5 h-5" style={{ color: 'var(--color-teal)' }} />
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{stats.totalViews}</div>
            </div>
            <div className="text-sm" style={{ color: 'var(--color-sub)' }}>Profile Views</div>
          </div>

          <div className="rounded-xl p-5" style={{ background: 'var(--color-card)', border: '1.5px solid var(--color-line)' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-success-600" />
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{stats.interestedRenters}</div>
            </div>
            <div className="text-sm" style={{ color: 'var(--color-sub)' }}>Interested Renters</div>
          </div>

          <div className="rounded-xl p-5" style={{ background: 'var(--color-card)', border: '1.5px solid var(--color-line)' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{stats.messages}</div>
            </div>
            <div className="text-sm" style={{ color: 'var(--color-sub)' }}>Messages</div>
          </div>

          <div className="rounded-xl p-5" style={{ background: 'var(--color-card)', border: '1.5px solid var(--color-line)' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-secondary-600" />
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{stats.viewingsScheduled}</div>
            </div>
            <div className="text-sm" style={{ color: 'var(--color-sub)' }}>Viewings Booked</div>
          </div>

          <div className="rounded-xl p-5 relative" style={{ background: 'var(--color-card)', border: '1.5px solid var(--color-line)' }}>
            {stats.viewingRequests > 0 && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-danger-500 text-white rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
                {stats.viewingRequests}
              </div>
            )}
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stats.viewingRequests > 0 ? 'bg-danger-100' : ''
                }`} style={stats.viewingRequests > 0 ? undefined : { background: 'var(--color-bg)' }}>
                <Clock className={`w-5 h-5 ${stats.viewingRequests > 0 ? 'text-danger-600' : ''
                  }`} style={stats.viewingRequests > 0 ? undefined : { color: 'var(--color-sub)' }} />
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{stats.viewingRequests}</div>
            </div>
            <div className="text-sm" style={{ color: 'var(--color-sub)' }}>
              {stats.viewingRequests > 0 ? 'Viewing Requests' : 'No Requests'}
            </div>
          </div>

          <div className="rounded-xl p-5" style={{ background: 'var(--color-card)', border: '1.5px solid var(--color-line)' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stats.totalIssuesOpen > 0 ? 'bg-warning-100' : ''
                }`} style={stats.totalIssuesOpen > 0 ? undefined : { background: 'var(--color-bg)' }}>
                <AlertTriangle className={`w-5 h-5 ${stats.totalIssuesOpen > 0 ? 'text-warning-600' : ''
                  }`} style={stats.totalIssuesOpen > 0 ? undefined : { color: 'var(--color-sub)' }} />
              </div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{stats.totalIssuesOpen}</div>
            </div>
            <div className="text-sm" style={{ color: 'var(--color-sub)' }}>
              {stats.totalIssuesOpen > 0 ? 'Open Issues' : 'No Issues'}
            </div>
          </div>
        </div>

        {/* Property Listing Card */}
        {landlordProperty ? (
          <div className="rounded-2xl" style={{ background: 'var(--color-card)', border: '1.5px solid var(--color-line)' }}>
            <div className="relative h-64 overflow-hidden">
              {/* FIX BUG #13: Use PropertyImage with loading states */}
              <PropertyImage
                src={landlordProperty.images[0]}
                alt={landlordProperty.address?.street || 'Property'}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 backdrop-blur-sm px-4 py-2 rounded-full font-bold text-lg" style={{ background: 'var(--color-card)', color: 'var(--color-text)' }}>
                £{landlordProperty.rentPcm.toLocaleString()} pcm
              </div>
            </div>
            <div className="p-6 relative z-10" style={{ background: 'var(--color-card)' }}>
              <h3 className="mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 2, color: 'var(--color-text)' }}>
                {landlordProperty.address?.street || 'Property Address'}
              </h3>
              <p className="mb-4" style={{ color: 'var(--color-sub)' }}>
                {landlordProperty.address?.city || 'City'}, {landlordProperty.address?.postcode || 'Postcode'}
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 rounded-full text-sm" style={{ background: 'var(--color-bg)', color: 'var(--color-sub)' }}>
                  {landlordProperty.bedrooms || 0} bed
                </span>
                <span className="px-3 py-1 rounded-full text-sm" style={{ background: 'var(--color-bg)', color: 'var(--color-sub)' }}>
                  {landlordProperty.bathrooms || 0} bath
                </span>
                <span className="px-3 py-1 rounded-full text-sm" style={{ background: 'var(--color-bg)', color: 'var(--color-sub)' }}>
                  {landlordProperty.propertyType || 'Property'}
                </span>
                <span className="px-3 py-1 rounded-full text-sm" style={{ background: 'var(--color-bg)', color: 'var(--color-sub)' }}>
                  EPC: {landlordProperty.epcRating || 'N/A'}
                </span>
              </div>
              <p className="line-clamp-3 mb-4" style={{ color: 'var(--color-sub)' }}>{landlordProperty.description || 'No description available'}</p>

              {/* Property Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="flex-1 min-w-[140px] px-4 py-2 bg-success-500 hover:bg-success-600 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Invite Renter
                </button>
                <button
                  onClick={() => setShowPropertyEditor(true)}
                  disabled={!canLandlordEdit}
                  className={`flex-1 min-w-[120px] px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
                    canLandlordEdit
                      ? ''
                      : 'cursor-not-allowed'
                  }`}
                  style={canLandlordEdit
                    ? { background: 'var(--color-teal)', color: '#fff' }
                    : { background: 'var(--color-line)', color: 'var(--color-sub)' }
                  }
                  title={!canLandlordEdit ? 'Property editing is managed by your agency' : undefined}
                >
                  <Edit className="w-4 h-4" />
                  Edit Property
                </button>
                <button
                  onClick={handleUnlinkProperty}
                  className="px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                  style={{ background: 'var(--color-bg)', color: 'var(--color-sub)' }}
                >
                  <LinkIcon className="w-4 h-4" />
                  Unlink
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-danger-500 hover:bg-danger-600 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--color-card)', border: '1.5px solid var(--color-line)' }}>
            <Home size={48} className="mx-auto mb-4" style={{ color: 'var(--color-sub)' }} />
            <h3 className="mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 2, color: 'var(--color-text)' }}>No Property Linked</h3>
            <p className="mb-4" style={{ color: 'var(--color-sub)' }}>
              Create a new property listing or link an existing one to start receiving interest from renters
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowPropertyCreator(true)}
                className="px-6 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
                style={{ background: 'var(--color-teal)', color: '#fff' }}
              >
                <PlusCircle className="w-5 h-5" />
                Create New Property
              </button>
              <button
                onClick={() => setShowPropertyLinker(true)}
                className="px-6 py-2 bg-secondary-500 hover:bg-secondary-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                <LinkIcon className="w-5 h-5" />
                Link Existing
              </button>
            </div>
          </div>
        )}

        {/* Agency Management Delegation Settings */}
        {landlordProperty?.managingAgencyId && (
          <div className="rounded-2xl p-6" style={{ background: 'var(--color-card)', border: '1.5px solid var(--color-line)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Shield size={24} style={{ color: 'var(--color-teal)' }} />
              <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 2, color: 'var(--color-text)' }}>Agency Management Settings</h3>
            </div>

            <p className="text-sm mb-4" style={{ color: 'var(--color-sub)' }}>
              Control how your managing agency can interact with this property.
            </p>

            <div className="space-y-4">
              {/* Full Management Toggle */}
              <label className="flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-colors" style={{ background: 'var(--color-bg)', border: '1.5px solid var(--color-line)' }}>
                <input
                  type="checkbox"
                  checked={landlordProperty?.isFullyManagedByAgency || false}
                  onChange={(e) => handleManagementSettingsChange(
                    e.target.checked,
                    landlordProperty?.landlordCanEditWhenManaged || false
                  )}
                  className="mt-0.5 w-5 h-5 rounded"
                  style={{ accentColor: 'var(--color-teal)' }}
                />
                <div>
                  <div className="font-medium" style={{ color: 'var(--color-text)' }}>
                    Delegate full property management to agency
                  </div>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-sub)' }}>
                    When enabled, the agency can update property details, pricing, and availability on your behalf.
                  </p>
                </div>
              </label>

              {/* Landlord Retains Edit Rights Toggle - only shown when full management is enabled */}
              {landlordProperty?.isFullyManagedByAgency && (
                <label className="flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-colors ml-6" style={{ background: 'rgba(13,148,136,0.06)', border: '1.5px solid var(--color-teal)' }}>
                  <input
                    type="checkbox"
                    checked={landlordProperty?.landlordCanEditWhenManaged || false}
                    onChange={(e) => handleManagementSettingsChange(
                      true,
                      e.target.checked
                    )}
                    className="mt-0.5 w-5 h-5 rounded"
                    style={{ accentColor: 'var(--color-teal)' }}
                  />
                  <div>
                    <div className="font-medium" style={{ color: 'var(--color-text)' }}>
                      I still want to be able to edit property details
                    </div>
                    <p className="text-sm mt-1" style={{ color: 'var(--color-sub)' }}>
                      Keep the ability to edit property details yourself, even with full agency management enabled.
                    </p>
                  </div>
                </label>
              )}

              {/* Status Display */}
              {landlordProperty?.isFullyManagedByAgency && (
                <div className="mt-4 p-4 rounded-lg" style={{ background: 'rgba(13,148,136,0.06)', border: '1.5px solid var(--color-teal)' }}>
                  <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--color-teal)' }}>
                    <Shield size={18} />
                    <span className="font-medium">Full Management Active</span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--color-teal)' }}>
                    {landlordProperty?.landlordCanEditWhenManaged
                      ? 'Your agency has full management control, and you retain editing rights.'
                      : 'Your agency has exclusive control over property details. Contact them to request changes.'}
                  </p>
                  {landlordProperty?.lastEditedAt && (
                    <p className="text-xs mt-2" style={{ color: 'var(--color-sub)' }}>
                      Last edited: {new Date(landlordProperty.lastEditedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Phase 4: Active Tenancies Section */}
        {activeTenancies.length > 0 && (
          <div className="rounded-2xl p-6" style={{ background: 'var(--color-card)', border: '1.5px solid var(--color-line)' }}>
            <div className="flex items-center gap-2 mb-6">
              <Home size={24} className="text-success-600" />
              <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 2, color: 'var(--color-text)' }}>Active Tenancies</h3>
              <span className="ml-auto px-3 py-1 bg-success-100 text-success-700 rounded-full text-sm font-medium">
                {stats.activeTenants} active
              </span>
            </div>

            <div className="space-y-4">
              {activeTenancies.map((match) => (
                <ActiveTenancyCard
                  key={match.id}
                  match={match}
                  issues={allIssues.filter(i => match.activeIssueIds?.includes(i.id))}
                  onViewMessages={handleViewMatch}
                  onViewIssue={setSelectedIssue}
                />
              ))}
            </div>
          </div>
        )}

        {/* Interested Renters */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--color-card)', border: '1.5px solid var(--color-line)' }}>
          <div className="flex items-center gap-2 mb-6">
            <Users size={24} className="text-secondary-600" />
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 2, color: 'var(--color-text)' }}>Interested Renters</h3>
            {stats.interestedRenters > 0 && (
              <span className="ml-auto px-3 py-1 bg-success-100 text-success-700 rounded-full text-sm font-medium">
                {stats.interestedRenters} active
              </span>
            )}
          </div>

          {renterInterests.length === 0 ? (
            <div className="text-center py-12">
              <Heart size={48} className="mx-auto mb-4" style={{ color: 'var(--color-sub)' }} />
              <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>No renters yet</h4>
              <p style={{ color: 'var(--color-sub)' }}>
                When renters express interest in your property, they'll appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {renterInterests.map((match) => (
                <RenterInterestCard
                  key={match.id}
                  match={match}
                  onScheduleViewing={setSchedulingMatch}
                  onViewChat={handleViewMatch}
                  onApprovePet={setPetApprovalMatch}
                  onRefusePet={setPetRefusalMatch}
                  onVerifyRightToRent={setRightToRentMatch}
                />
              ))}
            </div>
          )}
        </div>

        {/* Agency Messages Card */}
        {landlordProfile?.id && hasAgencyLinks && (
          <div className="rounded-2xl p-6" style={{ background: 'var(--color-card)', border: '1.5px solid var(--color-line)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center">
                <MessageSquare size={24} className="text-secondary-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Agency Messages</h3>
                <p className="text-sm" style={{ color: 'var(--color-sub)' }}>
                  Communicate with your linked agencies
                </p>
              </div>
            </div>
            <button
              onClick={onNavigateToAgencyMessages}
              className="w-full px-4 py-3 bg-secondary-500 hover:bg-secondary-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <MessageSquare size={20} />
              Open Agency Messages
            </button>
          </div>
        )}

        {/* Agency Relationships Section */}
        {landlordProfile?.id && landlordProperty && (
          <div>
            <AgencyLinkManager
              landlordId={landlordProfile.id}
              properties={landlordProperty ? [landlordProperty] : []}
            />
          </div>
        )}

        {/* Create Management Contract Button */}
        {landlordProfile?.id && landlordProperties.length > 0 && (
          <div className="rounded-2xl p-6" style={{ background: 'var(--color-card)', border: '1.5px solid var(--color-line)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(13,148,136,0.06)' }}>
                <FileText size={24} style={{ color: 'var(--color-teal)' }} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Agency Management Contracts</h3>
                <p className="text-sm" style={{ color: 'var(--color-sub)' }}>
                  Create formal contracts with management agencies
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowContractWizard(true)}
              className="w-full px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              style={{ background: 'var(--color-teal)', color: '#fff' }}
            >
              <FileText size={20} />
              Create Management Contract
            </button>
          </div>
        )}


        {/* Tips Card */}
        <div className="rounded-2xl p-6" style={{ background: 'rgba(13,148,136,0.06)', border: '1.5px solid var(--color-teal)' }}>
          <div className="flex items-start gap-3">
            <TrendingUp size={24} className="flex-shrink-0" style={{ color: 'var(--color-teal)' }} />
            <div>
              <h4 className="font-bold mb-2" style={{ color: 'var(--color-text)' }}>Tips to attract renters:</h4>
              <ul className="space-y-1 text-sm" style={{ color: 'var(--color-sub)' }}>
                <li>• Respond quickly to messages - renters appreciate fast communication</li>
                <li>• Be flexible with viewing times to accommodate more potential renters</li>
                <li>• Keep your property listing up-to-date with recent photos</li>
                <li>• Highlight unique features that match what renters are looking for</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Create Renter Invite Modal */}
      {showInviteModal && landlordProperty && landlordProfile && (
        <CreateRenterInviteModal
          isOpen={showInviteModal}
          property={landlordProperty}
          landlordId={landlordProfile.id}
          managingAgencyId={landlordProfile.managementAgencyId}
          createdByType="landlord"
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {/* Viewing Scheduler Modal */}
      {schedulingMatch && (
        <ViewingScheduler
          isOpen={true}
          onClose={() => setSchedulingMatch(null)}
          match={schedulingMatch}
          onConfirm={(dateTime) => {
            confirmViewing(schedulingMatch.id, dateTime);
            addToast({
              type: 'success',
              title: 'Viewing Confirmed!',
              message: `Viewing scheduled for ${dateTime.toLocaleDateString('en-GB', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}`
            });
            setSchedulingMatch(null);
          }}
        />
      )}

      {/* Property Linker Modal */}
      {showPropertyLinker && (
        <PropertyLinker
          isOpen={true}
          onClose={() => setShowPropertyLinker(false)}
          availableProperties={allProperties}
          currentPropertyId={landlordProfile?.propertyIds?.[0]}
          onLinkProperty={async (propertyId) => {
            try {
              // Update property's landlordId to match current landlord
              if (landlordProfile?.id) {
                linkPropertyToLandlord(propertyId, landlordProfile.id);
              }
              // Add property to propertyIds array
              const newPropertyIds = [...(landlordProfile?.propertyIds || []), propertyId];
              await updateProfile({ propertyIds: newPropertyIds });
              addToast({
                type: 'success',
                title: 'Property Linked!',
                message: 'Your property has been linked to your vendor profile'
              });
              setShowPropertyLinker(false);
            } catch (error) {
              // Handle ownership validation errors gracefully
              console.error('[VendorDashboard] Property linking failed:', error);
              addToast({
                type: 'danger',
                title: 'Cannot Link Property',
                message: error instanceof Error ? error.message : 'Property is already linked to another vendor'
              });
            }
          }}
        />
      )}

      {/* Property Creator Modal */}
      {showPropertyCreator && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center p-4 py-8">
            <div className="rounded-2xl w-full max-w-3xl shadow-2xl" style={{ background: 'var(--color-card)' }}>
              <PropertyForm
                mode="create"
                onSubmit={async (propertyData) => {
                  try {
                    if (!landlordProfile?.id) {
                      throw new Error('Vendor profile not found');
                    }

                    // Create property and get the new property ID
                    const newPropertyId = await createProperty(propertyData, landlordProfile.id);

                    // Add new property to propertyIds array
                    const newPropertyIds = [...(landlordProfile?.propertyIds || []), newPropertyId];
                    await updateProfile({ propertyIds: newPropertyIds });

                    addToast({
                      type: 'success',
                      title: 'Property Created!',
                      message: 'Your property listing has been created successfully'
                    });

                    setShowPropertyCreator(false);
                  } catch (error) {
                    console.error('[VendorDashboard] Property creation failed:', error);
                    addToast({
                      type: 'danger',
                      title: 'Creation Failed',
                      message: error instanceof Error ? error.message : 'Failed to create property'
                    });
                    throw error; // Re-throw to keep form open
                  }
                }}
                onCancel={() => setShowPropertyCreator(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Property Editor Modal */}
      {showPropertyEditor && landlordProperty && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center p-4 py-8">
            <div className="rounded-2xl w-full max-w-3xl shadow-2xl" style={{ background: 'var(--color-card)' }}>
              <PropertyForm
                mode="edit"
                initialData={landlordProperty}
                onSubmit={async (propertyData) => {
                  try {
                    if (!landlordProperty?.id) {
                      throw new Error('Property not found');
                    }

                    // Update property with new data
                    updateProperty(landlordProperty.id, propertyData);

                    addToast({
                      type: 'success',
                      title: 'Property Updated!',
                      message: 'Your property details have been updated'
                    });

                    setShowPropertyEditor(false);
                  } catch (error) {
                    console.error('[VendorDashboard] Property update failed:', error);
                    addToast({
                      type: 'danger',
                      title: 'Update Failed',
                      message: error instanceof Error ? error.message : 'Failed to update property'
                    });
                    throw error; // Re-throw to keep form open
                  }
                }}
                onCancel={() => setShowPropertyEditor(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && landlordProperty && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 max-w-md w-full" style={{ background: 'var(--color-card)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-danger-600" />
              </div>
              <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 2, color: 'var(--color-text)' }}>Delete Property?</h3>
            </div>

            <p className="mb-2" style={{ color: 'var(--color-sub)' }}>
              Are you sure you want to delete <strong>{landlordProperty.address.street}</strong>?
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--color-sub)' }}>
              This will permanently remove the property and all associated matches. This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors"
                style={{ background: 'var(--color-bg)', color: 'var(--color-sub)' }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    if (!landlordProperty?.id) return;

                    await deleteProperty(landlordProperty.id);
                    // Remove the property from propertyIds array
                    const remainingIds = (landlordProfile?.propertyIds || []).filter(id => id !== landlordProperty.id);
                    await updateProfile({ propertyIds: remainingIds.length > 0 ? remainingIds : undefined });

                    addToast({
                      type: 'success',
                      title: 'Property Deleted',
                      message: 'Property has been permanently removed'
                    });

                    setShowDeleteConfirm(false);
                  } catch (error) {
                    console.error('[VendorDashboard] Delete failed:', error);
                    addToast({
                      type: 'danger',
                      title: 'Delete Failed',
                      message: error instanceof Error ? error.message : 'Failed to delete property'
                    });
                  }
                }}
                className="flex-1 px-4 py-2 bg-danger-500 hover:bg-danger-600 text-white rounded-lg font-medium transition-colors"
              >
                Delete Property
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Details Modal */}
      <IssueDetailsModal
        issue={selectedIssue}
        isOpen={!!selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onStatusUpdate={handleIssueStatusUpdate}
        showStatusActions={true}
      />

      {/* Pet Approval Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!petApprovalMatch}
        onClose={() => setPetApprovalMatch(null)}
        onConfirm={async () => {
          if (petApprovalMatch) {
            await useAppStore.getState().reviewPetRequest(petApprovalMatch.id, 'approved');
            // Update local state
            setMatches(prev => prev.map(m =>
              m.id === petApprovalMatch.id ? { ...m, petRequestStatus: 'approved' as const } : m
            ));
            addToast({ type: 'success', title: 'Pet Request Approved', message: 'The tenant can now keep their pet.' });
          }
          setPetApprovalMatch(null);
        }}
        title="Approve Pet Request"
        message="Are you sure you want to approve this pet request? The tenant will be notified that they can keep their pet at the property."
        confirmText="Approve"
        cancelText="Cancel"
        variant="success"
      />

      {/* Pet Refusal Confirmation Modal (with reason input) */}
      <ConfirmationModal
        isOpen={!!petRefusalMatch}
        onClose={() => setPetRefusalMatch(null)}
        onConfirm={async (reason) => {
          if (petRefusalMatch && reason) {
            await useAppStore.getState().reviewPetRequest(petRefusalMatch.id, 'refused', reason);
            // Update local state
            setMatches(prev => prev.map(m =>
              m.id === petRefusalMatch.id ? { ...m, petRequestStatus: 'refused' as const, petRequestRefusalReason: reason } : m
            ));
            addToast({ type: 'info', title: 'Pet Request Refused', message: 'The tenant has been notified of your decision.' });
          }
          setPetRefusalMatch(null);
        }}
        title="Refuse Pet Request"
        message="Under the Renters' Rights Act 2025, you must provide a valid reason for refusing a pet request."
        confirmText="Refuse Request"
        cancelText="Cancel"
        variant="danger"
        inputLabel="Reason for refusal (Required by RRA 2025)"
        inputPlaceholder="e.g., Property not suitable for pets, building restrictions..."
        inputRequired={true}
        inputMultiline={true}
      />

      {/* Right to Rent Verification Modal */}
      <ConfirmationModal
        isOpen={!!rightToRentMatch}
        onClose={() => setRightToRentMatch(null)}
        onConfirm={async () => {
          if (rightToRentMatch) {
            await useAppStore.getState().verifyRightToRent(rightToRentMatch.id);
            // Update local state
            setMatches(prev => prev.map(m =>
              m.id === rightToRentMatch.id ? { ...m, rightToRentVerifiedAt: new Date() } : m
            ));
            addToast({ type: 'success', title: 'Right to Rent Verified', message: 'Document verification has been recorded.' });
          }
          setRightToRentMatch(null);
        }}
        title="Verify Right to Rent"
        message={
          <div className="space-y-2">
            <p>Please confirm that you have physically seen original documents proving the tenant's right to rent in the UK.</p>
            <p className="text-xs" style={{ color: 'var(--color-sub)' }}>This is a legal requirement. You must keep copies of these documents for the duration of the tenancy and for at least one year after it ends.</p>
          </div>
        }
        confirmText="Confirm Verification"
        cancelText="Cancel"
        variant="warning"
      />

      {/* Management Contract Wizard */}
      {landlordProfile?.id && (
        <ManagementContractWizard
          landlordId={landlordProfile.id}
          isOpen={showContractWizard}
          onClose={() => setShowContractWizard(false)}
          onComplete={() => {
            setShowContractWizard(false);
            addToast({
              type: 'success',
              title: 'Contract Sent',
              message: 'Your management contract has been sent to the agency for review.'
            });
          }}
        />
      )}
    </div>
  );
}

interface RenterInterestCardProps {
  match: Match;
  onScheduleViewing: (match: Match) => void;
  onViewChat?: (match: Match) => void;
  onApprovePet?: (match: Match) => void;
  onRefusePet?: (match: Match) => void;
  onVerifyRightToRent?: (match: Match) => void;
}

function RenterInterestCard({ match, onScheduleViewing, onViewChat, onApprovePet, onRefusePet, onVerifyRightToRent }: RenterInterestCardProps) {
  const lastMessage = match.messages[match.messages.length - 1];

  return (
    <div className="rounded-xl p-4 transition-colors" style={{ border: '1.5px solid var(--color-line)' }}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold" style={{ background: 'var(--color-teal)', color: '#fff' }}>
          {match.renterName?.charAt(0).toUpperCase() || 'R'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold" style={{ color: 'var(--color-text)' }}>{match.renterName || 'Interested Renter'}</h4>
            {match.unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-danger-500 text-white text-xs font-bold rounded-full">
                {match.unreadCount}
              </span>
            )}
          </div>

          <p className="text-sm mb-2" style={{ color: 'var(--color-sub)' }}>
            Interested • {new Date(match.timestamp).toLocaleDateString()}
          </p>

          {/* Viewing Status */}
          {match.hasViewingScheduled && match.confirmedViewingDate && (
            <div className="bg-success-50 border border-success-200 rounded-lg p-3 mb-2">
              <div className="flex items-center gap-2 text-success-700 mb-1">
                <Calendar size={14} />
                <span className="text-xs font-medium">Viewing Scheduled</span>
              </div>
              <p className="text-sm font-semibold text-success-900">
                {new Date(match.confirmedViewingDate).toLocaleDateString('en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          )}
          {match.viewingPreference && !match.hasViewingScheduled && (
            <div className="bg-danger-50 border-2 border-danger-300 rounded-lg p-3 mb-2 animate-pulse">
              <div className="flex items-center gap-2 text-danger-700 mb-1">
                <Clock size={14} />
                <span className="text-xs font-bold">Viewing Request - Action Needed!</span>
              </div>
              <p className="text-xs text-danger-900 mb-1">
                <strong>Flexibility:</strong> {match.viewingPreference.flexibility}
              </p>
              {(match.viewingPreference.preferredTimes ?? []).length > 0 && (
                <div className="text-xs text-danger-900">
                  <strong>Preferred times:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(match.viewingPreference.preferredTimes ?? []).slice(0, 3).map((slot, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-danger-100 rounded text-xs">
                        {slot.dayType} {slot.timeOfDay}
                      </span>
                    ))}
                    {(match.viewingPreference.preferredTimes ?? []).length > 3 && (
                      <span className="px-2 py-0.5 bg-danger-100 rounded text-xs">
                        +{(match.viewingPreference.preferredTimes ?? []).length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              {match.viewingPreference.additionalNotes && (
                <p className="text-xs text-danger-800 mt-2 italic">
                  "{match.viewingPreference.additionalNotes}"
                </p>
              )}
            </div>
          )}

          {/* Pet Request Review (RRA 2025) */}
          {match.petRequestStatus === 'requested' && (
            <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-3 mb-2">
              <div className="flex items-center gap-2 text-secondary-800 mb-2">
                <Clock size={16} />
                <span className="text-sm font-bold">Pet Request Pending</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onApprovePet?.(match)}
                  className="flex-1 px-3 py-1.5 bg-success-500 text-white rounded-lg text-xs font-medium hover:bg-success-600 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => onRefusePet?.(match)}
                  className="flex-1 px-3 py-1.5 bg-danger-500 text-white rounded-lg text-xs font-medium hover:bg-danger-600 transition-colors"
                >
                  Refuse
                </button>
              </div>
            </div>
          )}

          {/* Right to Rent Check (RRA 2025) */}
          {!match.rightToRentVerifiedAt && (
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 mb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-warning-800">Right to Rent Check Needed</span>
                <AlertTriangle size={14} className="text-warning-600" />
              </div>
              <button
                onClick={() => onVerifyRightToRent?.(match)}
                className="w-full px-3 py-1.5 border border-warning-300 text-warning-700 rounded-lg text-xs font-medium hover:bg-warning-50 transition-colors"
                style={{ background: 'var(--color-card)' }}
              >
                Verify Documents
              </button>
            </div>
          )}

          {lastMessage && (
            <div className="rounded-lg p-3 text-sm" style={{ background: 'var(--color-bg)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--color-sub)' }}>
                {lastMessage.senderType === 'renter' ? match.renterName : 'You'}
              </p>
              <p className="line-clamp-2" style={{ color: 'var(--color-sub)' }}>{lastMessage.content}</p>
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => onViewChat?.(match)}
              className="flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
              style={{ background: 'var(--color-teal)', color: '#fff' }}
            >
              View Chat
            </button>
            {!match.hasViewingScheduled && (
              <button
                onClick={() => onScheduleViewing(match)}
                className="px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                style={{ background: 'var(--color-bg)', color: 'var(--color-sub)' }}
              >
                Schedule Viewing
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Phase 4: ActiveTenancyCard Component
 * Displays information about current tenants with issue tracking
 */
interface ActiveTenancyCardProps {
  match: Match;
  issues?: Issue[];
  onViewMessages?: (match: Match) => void;
  onViewIssue?: (issue: Issue) => void;
}

function ActiveTenancyCard({ match, issues = [], onViewMessages, onViewIssue }: ActiveTenancyCardProps) {
  const lastMessage = match.messages[match.messages.length - 1];
  const openIssuesCount = match.activeIssueIds?.length || 0;
  const totalIssues = match.totalIssuesRaised || 0;
  const resolvedIssues = match.totalIssuesResolved || 0;

  // Calculate tenancy duration
  const moveInDate = match.tenancyStartDate ? new Date(match.tenancyStartDate) : null;
  const tenancyDuration = moveInDate
    ? Math.floor((Date.now() - moveInDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
    : 0;

  return (
    <div className="border-2 border-success-200 bg-success-50/30 rounded-xl p-4 hover:border-success-400 transition-colors">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-success-500 rounded-full flex items-center justify-center text-white font-bold">
          {match.renterName?.charAt(0).toUpperCase() || 'T'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold" style={{ color: 'var(--color-text)' }}>{match.renterName || 'Current Tenant'}</h4>
            <span className="px-2 py-0.5 bg-success-500 text-white text-xs font-bold rounded-full">
              ACTIVE
            </span>
            {match.unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-danger-500 text-white text-xs font-bold rounded-full">
                {match.unreadCount}
              </span>
            )}
          </div>

          {/* Tenancy Info */}
          <div className="flex items-center gap-4 mb-3 text-sm" style={{ color: 'var(--color-sub)' }}>
            {moveInDate && (
              <span>
                Moved in: {moveInDate.toLocaleDateString()}
              </span>
            )}
            {tenancyDuration > 0 && (
              <span>
                • {tenancyDuration} month{tenancyDuration !== 1 ? 's' : ''}
              </span>
            )}
            {match.monthlyRentAmount && (
              <span>
                • £{match.monthlyRentAmount.toLocaleString()}/mo
              </span>
            )}
          </div>

          {/* Issue Status Banner */}
          {totalIssues > 0 && (
            <div className={`rounded-lg p-3 mb-3 ${openIssuesCount > 0
              ? 'bg-warning-50 border border-warning-200'
              : 'bg-success-50 border border-success-200'
              }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {openIssuesCount > 0 ? (
                    <AlertTriangle size={16} className="text-warning-600" />
                  ) : (
                    <CheckCircle2 size={16} className="text-success-600" />
                  )}
                  <span className={`text-sm font-medium ${openIssuesCount > 0 ? 'text-warning-700' : 'text-success-700'
                    }`}>
                    {openIssuesCount > 0
                      ? `${openIssuesCount} Open Issue${openIssuesCount !== 1 ? 's' : ''}`
                      : 'No Open Issues'}
                  </span>
                </div>
                <span className="text-xs" style={{ color: 'var(--color-sub)' }}>
                  {resolvedIssues}/{totalIssues} resolved
                </span>
              </div>
            </div>
          )}

          {/* Last Message Preview */}
          {lastMessage && (
            <div className="rounded-lg p-3 text-sm mb-3" style={{ background: 'var(--color-card)', border: '1.5px solid var(--color-line)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--color-sub)' }}>
                {lastMessage.senderType === 'renter' ? match.renterName : 'You'}
              </p>
              <p className="line-clamp-2" style={{ color: 'var(--color-sub)' }}>{lastMessage.content}</p>
            </div>
          )}

          {/* Issues List */}
          {issues.length > 0 && (
            <div className="mb-3 space-y-2">
              <p className="text-xs font-medium" style={{ color: 'var(--color-sub)' }}>Issues:</p>
              {issues.slice(0, 3).map(issue => (
                <button
                  key={issue.id}
                  onClick={() => onViewIssue?.(issue)}
                  className={`w-full text-left p-2 rounded-lg border transition-colors ${
                    issue.status === 'resolved' || issue.status === 'closed'
                      ? 'bg-success-50 border-success-200 hover:border-success-400'
                      : 'bg-warning-50 border-warning-200 hover:border-warning-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{issue.subject}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      issue.status === 'resolved' || issue.status === 'closed'
                        ? 'bg-success-100 text-success-700'
                        : 'bg-warning-100 text-warning-700'
                    }`}>
                      {issue.status.replace('_', ' ')}
                    </span>
                  </div>
                </button>
              ))}
              {issues.length > 3 && (
                <p className="text-xs text-center" style={{ color: 'var(--color-sub)' }}>+{issues.length - 3} more issues</p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => onViewMessages?.(match)}
              className="flex-1 px-4 py-2 bg-success-500 hover:bg-success-600 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              <MessageSquare size={16} />
              View Messages
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
