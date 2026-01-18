import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, MapPin, Calendar, Clock, CheckCircle, Star, AlertTriangle, Users, ArrowRight } from 'lucide-react';
import { useAppStore, useAuthStore } from '../hooks';
import { useToastStore } from '../components/organisms/toastUtils';
import { formatRelativeTime } from '../utils/formatters';
import { Badge } from '../components/atoms/Badge';
import { ViewingsList } from '../components/organisms/ViewingsList';
import { RatingModal } from '../components/organisms/RatingModal';
import { ConversationSelector } from '../components/molecules/ConversationSelector';
import { TenancyOfferModal } from '../components/organisms/TenancyOfferModal';
import { ActivateTenancyModal } from '../components/organisms/ActivateTenancyModal';
import { AcceptOfferModal } from '../components/organisms/AcceptOfferModal';
import { UploadAgreementModal } from '../components/organisms/UploadAgreementModal';
import { SignAgreementModal } from '../components/organisms/SignAgreementModal';
import { AgreementsList } from '../components/organisms/AgreementsList';
import { AgreementCreatorWizard } from '../components/organisms/agreement-creator';
import { getConversations, sendMessageToConversation, getUnreadCounts } from '../lib/storage';
import type { Match, Conversation, ConversationType, UserType, TenancyAgreement } from '../types';

type TabType = 'matches' | 'viewings';


export const MatchesPage: React.FC = () => {
  const navigate = useNavigate();
  const { submitRating, getPendingInterestsCount, setViewingPreference } = useAppStore();
  const { userType, currentUser } = useAuthStore();
  const { addToast } = useToastStore();
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('matches');
  const [ratingModalMatch, setRatingModalMatch] = useState<Match | null>(null);
  const [ratingType, setRatingType] = useState<'landlord' | 'renter'>('landlord');
  const [loadedMatches, setLoadedMatches] = useState<Match[]>([]);
  const [showViewingModal, setShowViewingModal] = useState(false);
  const [showConfirmViewingModal, setShowConfirmViewingModal] = useState(false);
  const [confirmViewingMatchId, setConfirmViewingMatchId] = useState<string | null>(null);
  const [viewingDate, setViewingDate] = useState('');
  const [viewingTime, setViewingTime] = useState('14:00');

  // Tenancy modals
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showAcceptOfferModal, setShowAcceptOfferModal] = useState(false);
  const [tenancyModalMatch, setTenancyModalMatch] = useState<Match | null>(null);

  // Agreement modals
  const [showUploadAgreementModal, setShowUploadAgreementModal] = useState(false);
  const [showSignAgreementModal, setShowSignAgreementModal] = useState(false);
  const [showAgreementCreatorWizard, setShowAgreementCreatorWizard] = useState(false);
  const [agreementModalMatch, setAgreementModalMatch] = useState<Match | null>(null);
  const [agreementToSign, setAgreementToSign] = useState<TenancyAgreement | null>(null);
  const [agreementsRefreshKey, setAgreementsRefreshKey] = useState(0);

  // Dual-conversation state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationType>('landlord');
  const [unreadCounts, setUnreadCounts] = useState<{ landlord: number; agency: number }>({ landlord: 0, agency: 0 });
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const messageInputRef = useRef<HTMLInputElement>(null); // Moved to top level to follow Rules of Hooks


  // State to trigger refetch
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Function to refetch matches
  const refetchMatches = useCallback(() => {
    setRefetchTrigger(prev => prev + 1);
  }, []);

  // Load matches for current user
  useEffect(() => {
    console.log('[MatchesPage] useEffect triggered. State:', {
      currentUser: !!currentUser,
      userType,
      currentUserId: currentUser?.id
    });

    const fetchMatches = async () => {
      if (!currentUser) {
        console.log('[MatchesPage] Exiting early: no currentUser');
        return;
      }

      try {
        const { supabase } = await import('../lib/supabase');

        // Build query based on user type
        let query = supabase
          .from('matches')
          .select(`
            *,
            property:properties(*)
          `);

        if (userType === 'renter') {
          console.log('[MatchesPage] Querying matches for renter:', currentUser.id);
          query = query.eq('renter_id', currentUser.id);
        } else if (userType === 'landlord') {
          console.log('[MatchesPage] Querying matches for landlord:', currentUser.id);
          query = query.eq('landlord_id', currentUser.id);
        } else if (userType === 'estate_agent' || userType === 'management_agency') {
          // For agencies, get matches for properties they manage
          console.log('[MatchesPage] Querying matches for agency:', currentUser.id);
          // First get properties managed by this agency
          const { data: managedProperties } = await supabase
            .from('properties')
            .select('id')
            .eq('managing_agency_id', currentUser.id);

          if (managedProperties && managedProperties.length > 0) {
            const propertyIds = managedProperties.map(p => p.id);
            query = query.in('property_id', propertyIds);
          } else {
            setLoadedMatches([]);
            return;
          }
        }

        const { data: matchData, error } = await query;

        console.log('[MatchesPage] Query result:', { matchData, error, count: matchData?.length });

        if (error) {
          console.error('[MatchesPage] Error fetching matches:', error);
          setLoadedMatches([]);
          return;
        }

        if (matchData && matchData.length > 0) {
          // Transform joined data - property is already embedded in each match
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const matches: Match[] = matchData
            .filter((m: any) => m.property) // Only include matches where property exists
            .map((m: any) => {
              const p = m.property;
              return {
                id: m.id,
                renterId: m.renter_id,
                landlordId: m.landlord_id,
                landlordName: 'Landlord', // TODO: Add landlord JOIN if needed
                propertyId: m.property_id,
                renterName: m.renter_name,
                timestamp: m.created_at,
                messages: m.messages || [],
                unreadCount: m.unread_count || 0,
                hasViewingScheduled: m.has_viewing_scheduled || false,
                confirmedViewingDate: m.confirmed_viewing_date ? new Date(m.confirmed_viewing_date) : undefined,
                viewingPreference: m.viewing_preference || undefined,
                applicationStatus: m.application_status || 'pending',
                applicationSubmittedAt: m.application_submitted_at ? new Date(m.application_submitted_at) : undefined,
                tenancyStatus: (m.tenancy_status || 'prospective') as Match['tenancyStatus'],
                canRate: m.can_rate || false,
                hasRenterRated: m.has_renter_rated || false,
                hasLandlordRated: m.has_landlord_rated || false,
                isUnderEvictionProceedings: m.is_under_eviction_proceedings || false,
                petRequestStatus: m.pet_request_status || 'none',
                rentArrears: {
                  totalOwed: m.rent_arrears_total_owed || 0,
                  monthsMissed: m.rent_arrears_months_missed || 0,
                  consecutiveMonthsMissed: m.rent_arrears_consecutive_months || 0,
                  lastPaymentDate: m.rent_arrears_last_payment ? new Date(m.rent_arrears_last_payment) : undefined,
                },
                activeIssueIds: m.active_issue_ids || [],
                totalIssuesRaised: m.total_issues_raised || 0,
                totalIssuesResolved: m.total_issues_resolved || 0,
                // Transform property from snake_case to camelCase
                property: {
                  id: p.id,
                  landlordId: p.landlord_id,
                  managingAgencyId: p.managing_agency_id,
                  marketingAgentId: p.marketing_agent_id,
                  address: {
                    street: p.street || '',
                    city: p.city || '',
                    postcode: p.postcode || '',
                    council: p.council || '',
                  },
                  rentPcm: p.rent_pcm || 0,
                  deposit: p.deposit || 0,
                  maxRentInAdvance: 1 as const, // RRA 2025: Max 1 month
                  bedrooms: p.bedrooms || 1,
                  bathrooms: p.bathrooms || 1,
                  propertyType: p.property_type || 'house',
                  availableFrom: p.available_from || new Date().toISOString(),
                  images: p.images || [],
                  features: p.features || [],
                  description: p.description || '',
                  epcRating: p.epc_rating || 'C',
                  yearBuilt: p.year_built || 2000,
                  furnishing: p.furnishing || 'unfurnished',
                  tenancyType: p.tenancy_type || 'Periodic',
                  maxOccupants: p.max_occupants || 4,
                  petsPolicy: {
                    willConsiderPets: true,
                    preferredPetTypes: p.preferred_pet_types || [],
                    requiresPetInsurance: p.requires_pet_insurance || false,
                    maxPetsAllowed: p.max_pets_allowed || 2,
                  },
                  bills: {
                    councilTaxBand: p.council_tax_band || 'C',
                    gasElectricIncluded: p.gas_electric_included || false,
                    waterIncluded: p.water_included || false,
                    internetIncluded: p.internet_included || false,
                  },
                  meetsDecentHomesStandard: p.meets_decent_homes_standard || false,
                  awaabsLawCompliant: p.awaabs_law_compliant || false,
                  prsPropertyRegistrationStatus: p.prs_property_registration_status || 'not_registered',
                  isAvailable: p.is_available ?? true,
                  canBeMarketed: p.can_be_marketed || false,
                  listingDate: p.listing_date || new Date().toISOString(),
                },
              } as Match;
            });

          console.log('[MatchesPage] Mapped matches with joined properties:', matches.length);
          setLoadedMatches(matches);
        } else {
          console.log('[MatchesPage] No match data returned from query');
          setLoadedMatches([]);
        }
      } catch (error) {
        console.error('[MatchesPage] Failed to fetch matches:', error);
        addToast({
          type: 'danger',
          title: 'Failed to Load Matches',
          message: 'Could not retrieve your matches. Please try again.'
        });
        setLoadedMatches([]);
      }
    };

    fetchMatches();
  }, [currentUser, userType, addToast, refetchTrigger]);

  // Subscribe to realtime match updates (for offer notifications, etc.)
  useEffect(() => {
    if (!currentUser) return;

    let channel: ReturnType<typeof import('../lib/supabase').supabase.channel> | null = null;

    const setupRealtimeSubscription = async () => {
      const { supabase } = await import('../lib/supabase');

      // Determine filter based on user type
      const filterColumn = userType === 'renter' ? 'renter_id' : 'landlord_id';

      channel = supabase
        .channel(`matches-${currentUser.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'matches',
            filter: `${filterColumn}=eq.${currentUser.id}`,
          },
          (payload) => {
            console.log('[MatchesPage] Realtime update received:', payload);
            const newStatus = payload.new.application_status;
            const oldStatus = payload.old?.application_status;

            // Show notification for important status changes
            if (newStatus !== oldStatus) {
              if (userType === 'renter' && newStatus === 'offer_made') {
                addToast({
                  type: 'success',
                  title: '🎉 You have a new offer!',
                  message: 'A landlord has offered you a tenancy. Check your matches!',
                });
              } else if (userType === 'landlord' && newStatus === 'offer_accepted') {
                addToast({
                  type: 'success',
                  title: '✅ Offer Accepted!',
                  message: 'The tenant has accepted your offer. You can now activate the tenancy.',
                });
              }
            }

            // Refetch to get updated data
            refetchMatches();
          }
        )
        .subscribe((status) => {
          console.log('[MatchesPage] Realtime subscription status:', status);
        });
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [currentUser, userType, addToast, refetchMatches]);

  // Subscribe to realtime agreement updates (for signing notifications)
  useEffect(() => {
    if (!currentUser) return;

    let channel: ReturnType<typeof import('../lib/supabase').supabase.channel> | null = null;

    const setupAgreementSubscription = async () => {
      const { supabase } = await import('../lib/supabase');

      // Determine filter based on user type
      const filterColumn = userType === 'renter' ? 'renter_id' : 'landlord_id';

      channel = supabase
        .channel(`agreements-${currentUser.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'tenancy_agreements',
            filter: `${filterColumn}=eq.${currentUser.id}`,
          },
          (payload) => {
            console.log('[MatchesPage] New agreement received:', payload);
            if (userType === 'renter') {
              addToast({
                type: 'info',
                title: '📄 New Agreement',
                message: 'You have a new tenancy agreement to review and sign.',
              });
            }
            setAgreementsRefreshKey((k) => k + 1);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'tenancy_agreements',
            filter: `${filterColumn}=eq.${currentUser.id}`,
          },
          (payload) => {
            console.log('[MatchesPage] Agreement updated:', payload);
            const newStatus = payload.new.status;
            const oldStatus = payload.old?.status;

            if (newStatus !== oldStatus) {
              if (newStatus === 'fully_signed') {
                addToast({
                  type: 'success',
                  title: '✅ Agreement Fully Signed!',
                  message: 'All parties have signed. You can now download the agreement.',
                });
              } else if (newStatus === 'partially_signed' && userType === 'landlord') {
                addToast({
                  type: 'info',
                  title: '✍️ Agreement Signed',
                  message: 'The tenant has signed the agreement.',
                });
              }
            }
            setAgreementsRefreshKey((k) => k + 1);
          }
        )
        .subscribe((status) => {
          console.log('[MatchesPage] Agreement subscription status:', status);
        });
    };

    setupAgreementSubscription();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [currentUser, userType, addToast]);

  // Use loaded matches instead of store matches
  const matches = loadedMatches;

  // Auto-open conversation if navigating from My Tenancy
  useEffect(() => {
    const autoOpenMatchId = sessionStorage.getItem('autoOpenMatchId');
    const autoOpenConversationType = sessionStorage.getItem('autoOpenConversationType') as ConversationType;
    if (autoOpenMatchId && matches.length > 0) {
      setSelectedMatch(autoOpenMatchId);
      if (autoOpenConversationType) {
        setActiveConversation(autoOpenConversationType);
        sessionStorage.removeItem('autoOpenConversationType');
      }
      sessionStorage.removeItem('autoOpenMatchId');
    }
  }, [matches]);

  // Load conversations when a match is selected
  useEffect(() => {
    const loadConversations = async () => {
      if (!selectedMatch) {
        setConversations([]);
        return;
      }

      setIsLoadingConversations(true);
      try {
        const [convs, counts] = await Promise.all([
          getConversations(selectedMatch),
          getUnreadCounts(selectedMatch)
        ]);
        setConversations(convs);
        setUnreadCounts(counts);
      } catch (error) {
        console.error('[MatchesPage] Failed to load conversations:', error);
        addToast({
          type: 'danger',
          title: 'Failed to Load Messages',
          message: 'Could not load your conversation. Please try again.'
        });
        setConversations([]);
      } finally {
        setIsLoadingConversations(false);
      }
    };

    loadConversations();
  }, [selectedMatch, addToast]);

  // Sort matches by most recent (memoized to prevent unnecessary re-sorting)
  const sortedMatches = useMemo(
    () => [...matches].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ),
    [matches]
  );

  const handleOpenRatingModal = useCallback(
    (match: Match, type: 'landlord' | 'renter') => {
      setRatingModalMatch(match);
      setRatingType(type);
    },
    []
  );

  const handleCloseRatingModal = useCallback(() => {
    setRatingModalMatch(null);
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!messageInputRef.current || !currentUser) return;
    const content = messageInputRef.current.value.trim();
    if (!content || !selectedMatch) return;

    try {
      await sendMessageToConversation({
        matchId: selectedMatch,
        conversationType: activeConversation,
        content,
        senderId: currentUser.id,
        senderType: userType as UserType,
      });
      messageInputRef.current.value = '';
      // Reload conversations to show new message
      const [convs, counts] = await Promise.all([
        getConversations(selectedMatch),
        getUnreadCounts(selectedMatch)
      ]);
      setConversations(convs);
      setUnreadCounts(counts);
    } catch (error) {
      console.error('[MatchesPage] Failed to send message:', error);
      addToast({
        type: 'danger',
        title: 'Message Failed',
        message: 'Could not send your message. Please try again.'
      });
    }
  }, [currentUser, selectedMatch, userType, activeConversation, addToast]);

  const handleMessageKeyDown = useCallback(async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && messageInputRef.current) {
      e.preventDefault();
      await handleSendMessage();
    }
  }, [handleSendMessage]);

  if (matches.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-success-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart size={48} className="text-neutral-400" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">No Matches Yet</h2>
          <p className="text-neutral-600 mb-6">
            Keep swiping! When you like a property and the seller is interested, you'll see your
            matches here.
          </p>
          <div className="bg-success-50 border border-success-200 rounded-xl p-4">
            <p className="text-sm text-success-700">
              💡 <strong>Tip:</strong> You have a 30% chance of matching when you like a property!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-success-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-neutral-900">Matches & Viewings</h1>
          <p className="text-neutral-600 mt-1">
            {matches.length} {matches.length === 1 ? 'match' : 'matches'}
          </p>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('matches')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${activeTab === 'matches'
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
            >
              <Heart className="w-4 h-4" />
              Matches
            </button>
            <button
              onClick={() => setActiveTab('viewings')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${activeTab === 'viewings'
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
            >
              <Calendar className="w-4 h-4" />
              Viewings
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Pending Interests Banner (Landlords Only) */}
        {userType === 'landlord' && currentUser && (() => {
          const pendingCount = getPendingInterestsCount(currentUser.id);
          if (pendingCount === 0) return null;

          return (
            <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">
                      {pendingCount} Interested Renter{pendingCount !== 1 ? 's' : ''} to Review
                    </h3>
                    <p className="text-sm text-neutral-600">
                      Renters have shown interest in your properties
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/landlord/discover')}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Review Now
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })()}

        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedMatches.map((match) => {
              const unreadCount = match.unreadCount || 0;
              const lastMessage = match.messages[match.messages.length - 1];

              // Determine if user can rate and hasn't rated yet
              const canRateAsRenter = userType === 'renter' && match.canRate && !match.hasRenterRated && match.tenancyStatus === 'ended';
              const canRateAsLandlord = userType === 'landlord' && match.canRate && !match.hasLandlordRated && match.tenancyStatus === 'ended';
              const hasRatedAsRenter = userType === 'renter' && match.hasRenterRated;
              const hasRatedAsLandlord = userType === 'landlord' && match.hasLandlordRated;

              return (
                <div
                  key={match.id}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => setSelectedMatch(match.id)}
                >
                  {/* Property Image */}
                  <div className="relative h-48 bg-neutral-200">
                    {match.property.images?.[0] && (
                      <img
                        src={match.property.images[0]}
                        alt={match.property.address.street}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    {unreadCount > 0 && (
                      <div className="absolute top-3 right-3 w-8 h-8 bg-danger-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {unreadCount}
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      <Badge variant="success" size="sm">
                        ✨ Match!
                      </Badge>
                      {match.hasViewingScheduled && match.confirmedViewingDate && (
                        <Badge variant="success" size="sm">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Viewing Confirmed
                        </Badge>
                      )}
                      {match.viewingPreference && !match.hasViewingScheduled && (
                        <Badge variant="secondary" size="sm">
                          <Clock className="w-3 h-3 mr-1" />
                          Viewing Pending
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Property Info */}
                  <div className="p-4">
                    <div className="text-2xl font-bold text-neutral-900 mb-1">
                      £{match.property.rentPcm.toLocaleString()} <span className="text-lg font-medium text-neutral-600">pcm</span>
                    </div>
                    <div className="flex items-start gap-2 text-neutral-600 mb-3">
                      <MapPin size={16} className="flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{match.property.address.street}</span>
                    </div>

                    {/* Viewing Info */}
                    {match.hasViewingScheduled && match.confirmedViewingDate && (
                      <div className="bg-success-50 border border-success-200 rounded-lg p-3 mb-3">
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
                      <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2 text-secondary-700 mb-1">
                          <Clock size={14} />
                          <span className="text-xs font-medium">Viewing Request Sent</span>
                        </div>
                        <p className="text-xs text-secondary-900">
                          {match.viewingPreference.flexibility} • {match.viewingPreference.preferredTimes?.length || 0} time{(match.viewingPreference.preferredTimes?.length || 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )}

                    {/* Last Message Preview */}
                    {lastMessage && (
                      <div className="bg-neutral-50 rounded-lg p-3 mb-3">
                        <p className="text-xs text-neutral-500 mb-1">
                          {lastMessage.senderType === 'landlord' ? 'Landlord' : 'You'}
                        </p>
                        <p className="text-sm text-neutral-700 line-clamp-2">
                          {lastMessage.content}
                        </p>
                        <p className="text-xs text-neutral-400 mt-1">
                          {formatRelativeTime(lastMessage.timestamp)}
                        </p>
                      </div>
                    )}

                    {/* Rating Section - Show for completed tenancies */}
                    {match.tenancyStatus === 'ended' && (
                      <div className="mb-3">
                        {canRateAsRenter && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenRatingModal(match, 'landlord');
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-warning-500 hover:bg-warning-600 text-white py-2 px-4 rounded-lg transition-colors font-medium"
                          >
                            <Star size={18} />
                            Rate Landlord
                          </button>
                        )}
                        {canRateAsLandlord && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenRatingModal(match, 'renter');
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-warning-500 hover:bg-warning-600 text-white py-2 px-4 rounded-lg transition-colors font-medium"
                          >
                            <Star size={18} />
                            Rate Tenant
                          </button>
                        )}
                        {hasRatedAsRenter && (
                          <div className="w-full flex items-center justify-center gap-2 bg-success-100 text-success-700 py-2 px-4 rounded-lg font-medium">
                            <CheckCircle size={18} />
                            Rated ✓
                          </div>
                        )}
                        {hasRatedAsLandlord && (
                          <div className="w-full flex items-center justify-center gap-2 bg-success-100 text-success-700 py-2 px-4 rounded-lg font-medium">
                            <CheckCircle size={18} />
                            Rated ✓
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMatch(match.id);
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-lg transition-colors font-medium"
                    >
                      <MessageCircle size={18} />
                      {unreadCount > 0 ? `${unreadCount} New Messages` : 'View Conversation'}
                    </button>
                  </div>

                  {/* Match Info Footer */}
                  <div className="px-4 pb-4 text-center">
                    <p className="text-xs text-neutral-500">
                      Matched {formatRelativeTime(match.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Viewings Tab */}
        {activeTab === 'viewings' && <ViewingsList refetchTrigger={refetchTrigger} onViewingConfirmed={refetchMatches} />}

        {/* Info Box - only show on matches tab */}
        {activeTab === 'matches' && (
          <div className="mt-8 bg-primary-50 border border-primary-200 rounded-xl p-6">
            <h3 className="font-bold text-neutral-900 mb-2">What happens next?</h3>
            <ul className="space-y-2 text-sm text-neutral-700">
              <li>✅ Click on a match to start a conversation</li>
              <li>✅ Ask questions about the property</li>
              <li>✅ Arrange a viewing if you're interested</li>
              <li>✅ The landlord will respond to your messages</li>
              <li>✅ Rate your experience after the tenancy ends</li>
            </ul>
          </div>
        )}
      </main>

      {/* Conversation View Modal */}
      {selectedMatch && (() => {
        const match = matches.find(m => m.id === selectedMatch);
        if (!match) return null;

        const currentConversation = conversations.find(c => c.conversationType === activeConversation);
        const conversationMessages = currentConversation?.messages || [];
        const hasAgency = !!match.property.managingAgencyId;

        // Determine recipient name based on active conversation
        const recipientName = activeConversation === 'landlord'
          ? match.landlordName
          : 'Managing Agency';

        return (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedMatch(null)}
          >
            <div
              className="bg-white rounded-2xl w-full max-w-2xl h-[600px] flex flex-col shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="border-b border-neutral-200 bg-neutral-50">
                <div className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
                      {recipientName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-900">{recipientName}</h3>
                      <p className="text-xs text-neutral-500">{match.property.address.street}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMatch(null)}
                    className="p-2 hover:bg-neutral-200 rounded-full transition-colors"
                  >
                    <span className="sr-only">Close</span>
                    ✕
                  </button>
                </div>

                {/* Conversation Selector */}
                <ConversationSelector
                  activeConversation={activeConversation}
                  onSelectConversation={setActiveConversation}
                  landlordUnreadCount={unreadCounts.landlord}
                  agencyUnreadCount={unreadCounts.agency}
                  hasAgency={hasAgency}
                />
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50">
                {isLoadingConversations ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                      <p className="text-sm text-neutral-600">Loading messages...</p>
                    </div>
                  </div>
                ) : conversationMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageCircle size={48} className="mx-auto text-neutral-400 mb-4" />
                      <p className="text-neutral-600">No messages yet</p>
                      <p className="text-sm text-neutral-500 mt-1">Start the conversation!</p>
                    </div>
                  </div>
                ) : (
                  conversationMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderType === (userType === 'renter' ? 'renter' : 'landlord') ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-2xl ${msg.senderType === (userType === 'renter' ? 'renter' : 'landlord')
                          ? 'bg-primary-500 text-white rounded-tr-none'
                          : 'bg-white border border-neutral-200 text-neutral-800 rounded-tl-none shadow-sm'
                          }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${msg.senderType === (userType === 'renter' ? 'renter' : 'landlord') ? 'text-primary-100' : 'text-neutral-400'}`}>
                          {formatRelativeTime(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pet Request Status Banner */}
              {(() => {
                if (match.petRequestStatus === 'requested') {
                  return (
                    <div className="bg-secondary-50 border-t border-secondary-200 p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-secondary-800">
                        <Clock size={16} />
                        <span className="text-sm font-medium">Pet Request Pending</span>
                      </div>
                      <span className="text-xs text-secondary-600">Landlord reviewing...</span>
                    </div>
                  );
                }
                if (match.petRequestStatus === 'approved') {
                  return (
                    <div className="bg-success-50 border-t border-success-200 p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-success-800">
                        <CheckCircle size={16} />
                        <span className="text-sm font-medium">Pet Request Approved! 🐾</span>
                      </div>
                    </div>
                  );
                }
                if (match.petRequestStatus === 'refused') {
                  return (
                    <div className="bg-danger-50 border-t border-danger-200 p-3">
                      <div className="flex items-center gap-2 text-danger-800 mb-1">
                        <AlertTriangle size={16} />
                        <span className="text-sm font-medium">Pet Request Refused</span>
                      </div>
                      <p className="text-xs text-danger-700">Reason: {match.petRefusalReason}</p>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Agreements Section - Compact view in conversation */}
              {(match.applicationStatus === 'offer_made' ||
                match.applicationStatus === 'offer_accepted' ||
                match.applicationStatus === 'tenancy_signed' ||
                match.tenancyStatus === 'active') && currentUser && (
                <div className="border-t border-neutral-200 p-4 bg-neutral-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-neutral-700">Agreements</h4>
                    {(userType === 'landlord' || userType === 'estate_agent' || userType === 'management_agency') && (
                      <button
                        onClick={() => {
                          setAgreementModalMatch(match);
                          setShowUploadAgreementModal(true);
                        }}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        + Upload New
                      </button>
                    )}
                  </div>
                  <AgreementsList
                    key={agreementsRefreshKey}
                    matchId={match.id}
                    userId={currentUser.id}
                    userType={userType as 'landlord' | 'agency' | 'renter'}
                    showUploadButton={false}
                    compact={true}
                    onSignAgreement={(agreement) => {
                      setAgreementToSign(agreement);
                      setShowSignAgreementModal(true);
                    }}
                  />
                </div>
              )}

              {/* Action Bar */}
              <div className="p-4 bg-white border-t border-neutral-200">
                <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                  {/* Pet Request Button (RRA 2025) */}
                  {userType === 'renter' && match.petRequestStatus === 'none' && (
                    <button
                      onClick={() => {
                        const details = prompt('Please describe your pet(s) (Type, Breed, Age):');
                        if (details) {
                          useAppStore.getState().requestPet(match.id, details);
                        }
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-secondary-100 text-secondary-700 rounded-full text-xs font-medium hover:bg-secondary-200 transition-colors whitespace-nowrap"
                    >
                      🐾 Request Pet
                    </button>
                  )}

                  {userType === 'renter' && !match.viewingPreference && !match.hasViewingScheduled && (
                    <button
                      onClick={() => setShowViewingModal(true)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium hover:bg-primary-200 transition-colors whitespace-nowrap"
                    >
                      📅 Request Viewing
                    </button>
                  )}
                  {match.viewingPreference && !match.hasViewingScheduled && (
                    <span className="flex items-center gap-1 px-3 py-1.5 bg-secondary-100 text-secondary-700 rounded-full text-xs font-medium whitespace-nowrap">
                      ⏳ Viewing Requested
                    </span>
                  )}
                  {match.hasViewingScheduled && match.applicationStatus !== 'offer_made' && match.applicationStatus !== 'tenancy_signed' && (
                    <span className="flex items-center gap-1 px-3 py-1.5 bg-success-100 text-success-700 rounded-full text-xs font-medium whitespace-nowrap">
                      ✅ Viewing Confirmed
                    </span>
                  )}

                  {/* Renter: Offer received - Accept button */}
                  {userType === 'renter' && match.applicationStatus === 'offer_made' && (
                    <button
                      onClick={async () => {
                        setTenancyModalMatch(match);
                        setShowAcceptOfferModal(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-success-500 text-white rounded-full text-xs font-medium hover:bg-success-600 transition-colors whitespace-nowrap animate-pulse"
                    >
                      🎉 Accept Offer
                    </button>
                  )}

                  {/* Landlord Actions - Application Progress */}
                  {userType === 'landlord' && match.tenancyStatus === 'prospective' && (
                    <>
                      {/* Confirm Viewing if requested */}
                      {match.viewingPreference && !match.hasViewingScheduled && (
                        <button
                          onClick={() => {
                            setConfirmViewingMatchId(match.id);
                            // Set default date to tomorrow
                            const tomorrow = new Date();
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            setViewingDate(tomorrow.toISOString().split('T')[0]);
                            setViewingTime('14:00');
                            setShowConfirmViewingModal(true);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-success-100 text-success-700 rounded-full text-xs font-medium hover:bg-success-200 transition-colors whitespace-nowrap"
                        >
                          ✓ Confirm Viewing
                        </button>
                      )}

                      {/* Offer Tenancy button */}
                      {match.hasViewingScheduled && match.applicationStatus !== 'tenancy_signed' && match.applicationStatus !== 'offer_made' && (
                        <button
                          onClick={() => {
                            setTenancyModalMatch(match);
                            setShowOfferModal(true);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium hover:bg-primary-200 transition-colors whitespace-nowrap"
                        >
                          📝 Offer Tenancy
                        </button>
                      )}

                      {/* Activate Tenancy button */}
                      {match.applicationStatus === 'offer_made' && (
                        <button
                          onClick={() => {
                            setTenancyModalMatch(match);
                            setShowActivateModal(true);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-success-500 text-white rounded-full text-xs font-medium hover:bg-success-600 transition-colors whitespace-nowrap"
                        >
                          🏠 Activate Tenancy
                        </button>
                      )}

                      {/* Create/Upload Agreement buttons - available after offer accepted */}
                      {(match.applicationStatus === 'offer_accepted' || match.applicationStatus === 'offer_made') && (
                        <>
                          <button
                            onClick={() => {
                              setAgreementModalMatch(match);
                              setShowAgreementCreatorWizard(true);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium hover:bg-primary-200 transition-colors whitespace-nowrap"
                          >
                            ✨ Create Agreement
                          </button>
                          <button
                            onClick={() => {
                              setAgreementModalMatch(match);
                              setShowUploadAgreementModal(true);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-secondary-100 text-secondary-700 rounded-full text-xs font-medium hover:bg-secondary-200 transition-colors whitespace-nowrap"
                          >
                            📄 Upload Agreement
                          </button>
                        </>
                      )}
                    </>
                  )}

                  {/* Show tenancy status badge */}
                  {match.tenancyStatus === 'active' && (
                    <span className="flex items-center gap-1 px-3 py-1.5 bg-success-500 text-white rounded-full text-xs font-medium whitespace-nowrap">
                      🏠 Active Tenant
                    </span>
                  )}
                  {match.tenancyStatus === 'notice_given' && (
                    <span className="flex items-center gap-1 px-3 py-1.5 bg-warning-100 text-warning-700 rounded-full text-xs font-medium whitespace-nowrap">
                      ⚠️ Notice Given
                    </span>
                  )}
                </div>

                {/* Message Input */}
                <div className="flex gap-2">
                  <input
                    ref={messageInputRef}
                    type="text"
                    placeholder={`Message ${activeConversation === 'landlord' ? 'landlord' : 'agency'}...`}
                    className="flex-1 border border-neutral-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    onKeyDown={handleMessageKeyDown}
                  />
                  <button
                    onClick={handleSendMessage}
                    className="px-6 py-2 bg-primary-600 text-white rounded-full font-medium hover:bg-primary-700 transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Rating Modal */}
      {ratingModalMatch && (
        <RatingModal
          isOpen={true}
          onClose={handleCloseRatingModal}
          match={ratingModalMatch}
          ratingType={ratingType}
          onSubmit={submitRating}
        />
      )}

      {/* Viewing Request Modal */}
      {showViewingModal && selectedMatch && (() => {
        const match = matches.find(m => m.id === selectedMatch);
        if (!match) return null;

        return (
          <div
            className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
            onClick={() => setShowViewingModal(false)}
          >
            <div
              className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-neutral-900 mb-4">Request a Viewing</h3>
              <p className="text-sm text-neutral-600 mb-4">
                {match.property.address.street}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    When are you available?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => {
                        setViewingPreference(match.id, {
                          flexibility: 'ASAP',
                          preferredTimes: [{ dayType: 'Any Day', timeOfDay: 'Flexible' }],
                        });
                        setShowViewingModal(false);
                        addToast({
                          type: 'success',
                          title: 'Viewing Requested',
                          message: 'The landlord will be notified of your request.',
                        });
                      }}
                      className="py-3 px-4 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium hover:bg-primary-200 transition-colors"
                    >
                      ASAP
                    </button>
                    <button
                      onClick={() => {
                        setViewingPreference(match.id, {
                          flexibility: 'Flexible',
                          preferredTimes: [
                            { dayType: 'Weekday', timeOfDay: 'Evening' },
                            { dayType: 'Weekend', timeOfDay: 'Flexible' },
                          ],
                        });
                        setShowViewingModal(false);
                        addToast({
                          type: 'success',
                          title: 'Viewing Requested',
                          message: 'The landlord will be notified of your request.',
                        });
                      }}
                      className="py-3 px-4 bg-neutral-100 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors"
                    >
                      Flexible
                    </button>
                    <button
                      onClick={() => {
                        setViewingPreference(match.id, {
                          flexibility: 'Flexible',
                          preferredTimes: [{ dayType: 'Weekend', timeOfDay: 'Flexible' }],
                        });
                        setShowViewingModal(false);
                        addToast({
                          type: 'success',
                          title: 'Viewing Requested',
                          message: 'The landlord will be notified of your request.',
                        });
                      }}
                      className="py-3 px-4 bg-neutral-100 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors"
                    >
                      Weekends
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setShowViewingModal(false)}
                  className="w-full py-2 text-neutral-600 hover:text-neutral-800 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Confirm Viewing Modal (Landlord) */}
      {showConfirmViewingModal && confirmViewingMatchId && (() => {
        const match = matches.find(m => m.id === confirmViewingMatchId);
        if (!match) return null;

        const handleConfirmViewing = async () => {
          if (!viewingDate || !viewingTime) {
            addToast({
              type: 'warning',
              title: 'Missing Information',
              message: 'Please select both a date and time for the viewing.',
            });
            return;
          }

          const dateTime = new Date(`${viewingDate}T${viewingTime}`);
          if (isNaN(dateTime.getTime())) {
            addToast({
              type: 'danger',
              title: 'Invalid Date',
              message: 'Please enter a valid date and time.',
            });
            return;
          }

          await useAppStore.getState().confirmViewing(confirmViewingMatchId, dateTime);
          addToast({
            type: 'success',
            title: 'Viewing Confirmed',
            message: `Viewing scheduled for ${dateTime.toLocaleDateString('en-GB')} at ${dateTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`,
          });
          setShowConfirmViewingModal(false);
          setConfirmViewingMatchId(null);
          // Refetch matches to update the UI with the confirmed viewing
          refetchMatches();
        };

        return (
          <div
            className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
            onClick={() => setShowConfirmViewingModal(false)}
          >
            <div
              className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Confirm Viewing</h3>
              <p className="text-sm text-neutral-600 mb-6">
                {match.property.address.street}
              </p>

              <div className="space-y-4">
                {/* Date Picker */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={viewingDate}
                    onChange={(e) => setViewingDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-neutral-900"
                  />
                </div>

                {/* Time Picker */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={viewingTime}
                    onChange={(e) => setViewingTime(e.target.value)}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-neutral-900"
                  />
                </div>

                {/* Quick Time Buttons */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Quick Select
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['10:00', '12:00', '14:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setViewingTime(time)}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          viewingTime === time
                            ? 'bg-primary-500 text-white'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Renter's Preference Info */}
                {match.viewingPreference && (
                  <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-secondary-700 mb-1">Renter's preference:</p>
                    <p className="text-sm text-secondary-900">
                      {match.viewingPreference.flexibility === 'ASAP' && 'Available as soon as possible'}
                      {match.viewingPreference.flexibility === 'Flexible' && 'Flexible timing'}
                      {match.viewingPreference.flexibility === 'Specific' && 'Specific time requested'}
                      {match.viewingPreference.preferredTimes && match.viewingPreference.preferredTimes.length > 0 && (
                        <span className="block text-xs text-secondary-600 mt-1">
                          Prefers: {match.viewingPreference.preferredTimes.map(t => `${t.dayType} ${t.timeOfDay}`).join(', ')}
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowConfirmViewingModal(false);
                      setConfirmViewingMatchId(null);
                    }}
                    className="flex-1 py-3 text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmViewing}
                    className="flex-1 py-3 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors text-sm font-medium"
                  >
                    Confirm Viewing
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tenancy Offer Modal */}
      <TenancyOfferModal
        isOpen={showOfferModal}
        onClose={() => {
          setShowOfferModal(false);
          setTenancyModalMatch(null);
        }}
        onConfirm={async () => {
          if (tenancyModalMatch) {
            await useAppStore.getState().updateApplicationStatus(tenancyModalMatch.id, 'offer_made');
            addToast({
              type: 'success',
              title: 'Offer Sent',
              message: 'The tenant has been notified of your offer.',
            });
            refetchMatches();
          }
        }}
        match={tenancyModalMatch}
      />

      {/* Activate Tenancy Modal */}
      <ActivateTenancyModal
        isOpen={showActivateModal}
        onClose={() => {
          setShowActivateModal(false);
          setTenancyModalMatch(null);
        }}
        onConfirm={async (startDate) => {
          if (tenancyModalMatch) {
            await useAppStore.getState().activateTenancy(tenancyModalMatch.id, startDate);
            addToast({
              type: 'success',
              title: 'Tenancy Activated',
              message: 'The tenant is now an active tenant!',
            });
            refetchMatches();
          }
        }}
        match={tenancyModalMatch}
      />

      {/* Accept Offer Modal (Renter) */}
      <AcceptOfferModal
        isOpen={showAcceptOfferModal}
        onClose={() => {
          setShowAcceptOfferModal(false);
          setTenancyModalMatch(null);
        }}
        onAccept={async () => {
          if (tenancyModalMatch) {
            await useAppStore.getState().updateApplicationStatus(tenancyModalMatch.id, 'offer_accepted');
            addToast({
              type: 'success',
              title: 'Offer Accepted!',
              message: 'Congratulations! The landlord will be in touch shortly.',
            });
            refetchMatches();
          }
        }}
        match={tenancyModalMatch}
      />

      {/* Upload Agreement Modal (Landlord/Agency) */}
      {agreementModalMatch && currentUser && (
        <UploadAgreementModal
          isOpen={showUploadAgreementModal}
          onClose={() => {
            setShowUploadAgreementModal(false);
            setAgreementModalMatch(null);
          }}
          match={agreementModalMatch}
          currentUserId={currentUser.id}
          currentUserType={userType === 'landlord' ? 'landlord' : 'agency'}
          currentUserName={'names' in currentUser ? currentUser.names : ('companyName' in currentUser ? currentUser.companyName : currentUser.email) || 'User'}
          currentUserEmail={currentUser.email || ''}
          onSuccess={() => {
            setAgreementsRefreshKey((k) => k + 1);
            addToast({
              type: 'success',
              title: 'Agreement Uploaded',
              message: 'The tenant has been notified to sign.',
            });
          }}
        />
      )}

      {/* Sign Agreement Modal (Renter) */}
      {currentUser && (
        <SignAgreementModal
          isOpen={showSignAgreementModal}
          onClose={() => {
            setShowSignAgreementModal(false);
            setAgreementToSign(null);
          }}
          agreement={agreementToSign}
          currentUserId={currentUser.id}
          currentUserName={'names' in currentUser ? currentUser.names : ('companyName' in currentUser ? currentUser.companyName : currentUser.email) || 'User'}
          onSuccess={() => {
            setAgreementsRefreshKey((k) => k + 1);
            refetchMatches();
          }}
        />
      )}

      {/* Agreement Creator Wizard (Landlord/Agency) */}
      {agreementModalMatch && currentUser && (
        <AgreementCreatorWizard
          isOpen={showAgreementCreatorWizard}
          onClose={() => {
            setShowAgreementCreatorWizard(false);
            setAgreementModalMatch(null);
          }}
          match={agreementModalMatch}
          currentUserId={currentUser.id}
          currentUserType={userType as 'landlord' | 'agency'}
          onComplete={() => {
            setAgreementsRefreshKey((k) => k + 1);
            addToast({
              type: 'success',
              title: 'Agreement Created',
              message: 'Your RRA 2025 compliant agreement has been created and sent for signing.',
            });
          }}
        />
      )}
    </div>
  );
};
