import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Send, ChevronLeft, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../hooks';
import { Button } from '../components/atoms/Button';
import {
  getLandlordAgencyConversations,
  sendAgencyLandlordMessage,
  markAgencyLandlordMessagesRead,
  getAgencyLinksForLandlord,
  getAgencyProfile,
} from '../lib/storage';
import type {
  AgencyLandlordConversation,
  AgencyLandlordMessage,
  AgencyPropertyLink,
  AgencyProfile,
  LandlordProfile,
} from '../types';

interface AgencyWithConversation {
  agency: AgencyProfile;
  conversation: AgencyLandlordConversation | null;
  link: AgencyPropertyLink;
  propertyCount: number;
}

interface LandlordMessagesPageProps {
  onBack?: () => void;
}

/**
 * LandlordMessagesPage
 * Displays landlord-agency messaging interface
 * Shows list of connected agencies with conversation threads
 */
export const LandlordMessagesPage: React.FC<LandlordMessagesPageProps> = ({ onBack }) => {
  const { currentUser } = useAuthStore();
  const landlordProfile = currentUser as LandlordProfile;

  const [agencies, setAgencies] = useState<AgencyWithConversation[]>([]);
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load agencies and conversations
  const loadData = useCallback(async () => {
    if (!landlordProfile?.id) return;

    setLoading(true);
    try {
      // Get agency property links to find connected agencies
      const links = await getAgencyLinksForLandlord(landlordProfile.id);
      const activeLinks = links.filter(l => l.isActive);

      // Get unique agency IDs and count properties per agency
      const agencyPropertyCounts = new Map<string, number>();
      activeLinks.forEach(l => {
        agencyPropertyCounts.set(l.agencyId, (agencyPropertyCounts.get(l.agencyId) || 0) + 1);
      });
      const uniqueAgencyIds = [...agencyPropertyCounts.keys()];

      // Fetch all conversations
      const conversations = await getLandlordAgencyConversations(landlordProfile.id);

      // Fetch agency profiles and match with conversations
      const agenciesWithConversations: AgencyWithConversation[] = [];

      for (const agencyId of uniqueAgencyIds) {
        try {
          const agency = await getAgencyProfile(agencyId);
          if (agency) {
            const conversation = conversations.find(c => c.agencyId === agencyId) || null;
            const link = activeLinks.find(l => l.agencyId === agencyId)!;
            const propertyCount = agencyPropertyCounts.get(agencyId) || 1;
            agenciesWithConversations.push({ agency, conversation, link, propertyCount });
          }
        } catch (err) {
          console.error(`[LandlordMessagesPage] Error fetching agency ${agencyId}:`, err);
        }
      }

      // Sort by last message time (most recent first), then by agency name
      agenciesWithConversations.sort((a, b) => {
        const aTime = a.conversation?.lastMessageAt ? new Date(a.conversation.lastMessageAt).getTime() : 0;
        const bTime = b.conversation?.lastMessageAt ? new Date(b.conversation.lastMessageAt).getTime() : 0;
        if (aTime !== bTime) return bTime - aTime;
        return a.agency.companyName.localeCompare(b.agency.companyName);
      });

      setAgencies(agenciesWithConversations);
    } catch (error) {
      console.error('[LandlordMessagesPage] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [landlordProfile?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedAgencyId, agencies]);

  // Mark messages as read when selecting a conversation
  useEffect(() => {
    if (!selectedAgencyId) return;

    const selectedItem = agencies.find(a => a.agency.id === selectedAgencyId);
    if (selectedItem?.conversation && selectedItem.conversation.unreadCountLandlord > 0) {
      markAgencyLandlordMessagesRead(selectedItem.conversation.id, 'landlord')
        .then(() => loadData())
        .catch(err => console.error('[LandlordMessagesPage] Error marking as read:', err));
    }
  }, [selectedAgencyId, agencies, loadData]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedAgencyId || !landlordProfile?.id) return;

    setSending(true);
    try {
      await sendAgencyLandlordMessage({
        agencyId: selectedAgencyId,
        landlordId: landlordProfile.id,
        content: messageText.trim(),
        senderId: landlordProfile.id,
        senderType: 'landlord',
      });

      setMessageText('');
      await loadData();
    } catch (error) {
      console.error('[LandlordMessagesPage] Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectedAgency = agencies.find(a => a.agency.id === selectedAgencyId);

  // Format time relative to now
  const formatRelativeTime = (timestamp: Date | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  // Get initials from company name
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-5rem)] bg-gradient-to-br from-primary-50 via-white to-neutral-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (agencies.length === 0) {
    return (
      <div className="flex flex-col h-[calc(100vh-5rem)] bg-gradient-to-br from-primary-50 via-white to-neutral-50">
        {onBack && (
          <div className="p-4 border-b border-neutral-200 bg-white/80 backdrop-blur-sm">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back to Dashboard</span>
            </button>
          </div>
        )}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={32} className="text-primary-400" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">No Agencies Connected</h2>
            <p className="text-neutral-500">
              When you link your properties with an agency, you'll be able to message them here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Mobile view: Show either list or conversation
  const showConversation = selectedAgencyId !== null;

  return (
    <div className="flex h-[calc(100vh-5rem)]">
      {/* Agency List - Hidden on mobile when conversation is selected */}
      <div className={`${showConversation ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 bg-gradient-to-br from-primary-50 via-white to-neutral-50 border-r border-neutral-200`}>
        <div className="p-4 border-b border-neutral-200 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 -ml-2 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <ArrowLeft size={20} className="text-neutral-600" />
              </button>
            )}
            <div>
              <h1 className="text-lg font-bold text-neutral-900">Agency Messages</h1>
              <p className="text-sm text-neutral-500">{agencies.length} {agencies.length === 1 ? 'agency' : 'agencies'}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {agencies.map(({ agency, conversation, propertyCount }) => {
            const lastMessage = conversation?.messages[conversation.messages.length - 1];
            const unreadCount = conversation?.unreadCountLandlord || 0;
            const isSelected = selectedAgencyId === agency.id;

            return (
              <button
                key={agency.id}
                onClick={() => setSelectedAgencyId(agency.id)}
                className={`w-full p-4 flex items-start gap-3 border-b border-neutral-100 transition-all text-left ${
                  isSelected
                    ? 'bg-white shadow-sm'
                    : 'hover:bg-white/80'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-secondary-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-secondary-700 font-semibold">{getInitials(agency.companyName)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-neutral-900 truncate">{agency.companyName}</span>
                    {lastMessage && (
                      <span className="text-xs text-neutral-400 flex-shrink-0">
                        {formatRelativeTime(lastMessage.timestamp)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-500 truncate">
                    {lastMessage ? lastMessage.content : 'No messages yet'}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Managing {propertyCount} {propertyCount === 1 ? 'property' : 'properties'}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <div className="w-5 h-5 rounded-full bg-danger-500 text-white text-xs flex items-center justify-center flex-shrink-0">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversation View */}
      <div className={`${!showConversation ? 'hidden md:flex' : 'flex'} flex-col flex-1 bg-neutral-50`}>
        {selectedAgency ? (
          <>
            {/* Conversation Header */}
            <div className="p-4 bg-gradient-to-r from-secondary-50 to-neutral-50 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedAgencyId(null)}
                  className="md:hidden p-2 -ml-2 rounded-lg hover:bg-white/50 transition-colors"
                >
                  <ChevronLeft size={20} className="text-neutral-600" />
                </button>
                <div className="w-12 h-12 rounded-full bg-secondary-100 flex items-center justify-center">
                  <span className="text-secondary-700 font-semibold text-lg">
                    {getInitials(selectedAgency.agency.companyName)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-neutral-900">{selectedAgency.agency.companyName}</h2>
                  <p className="text-sm text-neutral-500">
                    Managing {selectedAgency.propertyCount} {selectedAgency.propertyCount === 1 ? 'property' : 'properties'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {(!selectedAgency.conversation || selectedAgency.conversation.messages.length === 0) ? (
                <div className="flex flex-col items-center justify-center flex-1 p-8">
                  <div className="bg-white rounded-2xl shadow-sm p-8 text-center max-w-sm">
                    <div className="w-14 h-14 rounded-full bg-secondary-50 flex items-center justify-center mx-auto mb-4">
                      <MessageSquare size={28} className="text-secondary-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">No Messages Yet</h3>
                    <p className="text-neutral-500 text-sm">
                      Start a conversation with {selectedAgency.agency.companyName}
                    </p>
                  </div>
                </div>
              ) : (
                selectedAgency.conversation.messages.map((message: AgencyLandlordMessage) => {
                  const isLandlord = message.senderType === 'landlord';
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isLandlord ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 shadow-sm ${
                          isLandlord
                            ? 'bg-primary-600 text-white rounded-2xl rounded-br-none'
                            : 'bg-white text-neutral-800 border border-neutral-200 rounded-2xl rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          isLandlord
                            ? 'text-primary-200 text-right'
                            : 'text-neutral-400'
                        }`}>
                          {formatRelativeTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-neutral-200">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 border border-neutral-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-neutral-400"
                  disabled={sending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sending}
                  className="!rounded-full !p-3"
                >
                  <Send size={20} />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 p-8 bg-gradient-to-br from-secondary-50 via-white to-neutral-50">
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center max-w-md">
              <div className="w-16 h-16 rounded-full bg-secondary-50 flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={32} className="text-secondary-400" />
              </div>
              <h2 className="text-xl font-bold text-neutral-900 mb-2">Select a Conversation</h2>
              <p className="text-neutral-500">Choose an agency from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
