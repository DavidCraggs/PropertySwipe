import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Heart, MessageCircle, MapPin, Calendar, Clock, CheckCircle, Star, AlertTriangle } from 'lucide-react';
import { useAppStore, useAuthStore } from '../hooks';
import { useToastStore } from '../components/organisms/Toast';
import { formatRelativeTime } from '../utils/formatters';
import { Badge } from '../components/atoms/Badge';
import { ViewingsList } from '../components/organisms/ViewingsList';
import { RatingModal } from '../components/organisms/RatingModal';
import { ConversationSelector } from '../components/molecules/ConversationSelector';
import { getConversations, sendMessageToConversation, getUnreadCounts } from '../lib/storage';
import type { Match, Conversation, ConversationType } from '../types';

type TabType = 'matches' | 'viewings';

interface SupabaseMatch {
  id: string;
  renter_id: string;
  landlord_id: string;
  property_id: string;
  renter_name: string;
  created_at: string;
  messages?: string[];
  unread_count?: number;
  has_viewing_scheduled?: boolean;
  application_status?: string;
  application_submitted_at?: string;
  tenancy_status?: string;
  can_rate?: boolean;
  has_renter_rated?: boolean;
  has_landlord_rated?: boolean;
  is_under_eviction_proceedings?: boolean;
  rent_arrears?: number;
  active_issue_ids?: string[];
  total_issues_raised?: number;
  total_issues_resolved?: number;
}

export const MatchesPage: React.FC = () => {
  const { matches: storeMatches, submitRating } = useAppStore();
  const { userType, currentUser } = useAuthStore();
  const { addToast } = useToastStore();
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('matches');
  const [ratingModalMatch, setRatingModalMatch] = useState<Match | null>(null);
  const [ratingType, setRatingType] = useState<'landlord' | 'renter'>('landlord');
  const [loadedMatches, setLoadedMatches] = useState<Match[]>([]);

  // Dual-conversation state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationType>('landlord');
  const [unreadCounts, setUnreadCounts] = useState<{ landlord: number; agency: number }>({ landlord: 0, agency: 0 });
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const messageInputRef = useRef<HTMLInputElement>(null); // Moved to top level to follow Rules of Hooks


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
        // For renters, query Supabase directly
        if (userType === 'renter') {
          const { supabase } = await import('../lib/supabase');
          const { getAllProperties } = await import('../lib/storage');

          console.log('[ MatchesPage] Querying matches for renter:', currentUser.id);
          const { data: matchData, error } = await supabase
            .from('matches')
            .select('*')
            .eq('renter_id', currentUser.id);

          console.log('[MatchesPage] Query result:', { matchData, error, count: matchData?.length });

          if (error) {
            console.error('[MatchesPage] Error fetching matches:', error);
            setLoadedMatches([]);
            return;
          }

          if (matchData && matchData.length > 0) {
            // Fetch properties to build full Match objects
            const properties = await getAllProperties();
            console.log('[MatchesPage] Fetched properties:', properties.length);

            const matches: Match[] = matchData.map((m: SupabaseMatch) => {
              const property = properties.find(p => p.id === m.property_id);
              if (!property) {
                console.warn(`[MatchesPage] Property not found for property_id: ${m.property_id}`);
              }
              return {
                id: m.id,
                renterId: m.renter_id,
                landlordId: m.landlord_id,
                landlordName: 'Landlord', // Placeholder, could fetch from landlord profile
                propertyId: m.property_id,
                renterName: m.renter_name,
                timestamp: m.created_at,
                messages: m.messages || [],
                unreadCount: m.unread_count || 0,
                hasViewingScheduled: m.has_viewing_scheduled || false,
                applicationStatus: m.application_status,
                applicationSubmittedAt: m.application_submitted_at,
                tenancyStatus: (m.tenancy_status || 'prospective') as Match['tenancyStatus'],
                canRate: m.can_rate || false,
                hasRenterRated: m.has_renter_rated || false,
                hasLandlordRated: m.has_landlord_rated || false,
                isUnderEvictionProceedings: m.is_under_eviction_proceedings || false,
                rentArrears: m.rent_arrears || 0,
                activeIssueIds: m.active_issue_ids || [],
                totalIssuesRaised: m.total_issues_raised || 0,
                totalIssuesResolved: m.total_issues_resolved || 0,
                property: property!,
              };
            }).filter(m => m.property); // Only include matches where property was found

            console.log('[MatchesPage] Mapped matches (after property filter):', matches.length);
            setLoadedMatches(matches);
          } else {
            console.log('[MatchesPage] No match data returned from query');
            setLoadedMatches([]);
          }
        } else {
          // For landlords/agencies, use store matches
          setLoadedMatches(storeMatches);
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
  }, [currentUser, userType, storeMatches]);

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
        senderType: userType as any,
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
        {activeTab === 'viewings' && <ViewingsList />}

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

                  <button className="flex items-center gap-1 px-3 py-1.5 bg-neutral-100 text-neutral-700 rounded-full text-xs font-medium hover:bg-neutral-200 transition-colors whitespace-nowrap">
                    📅 Request Viewing
                  </button>
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
    </div>
  );
};
