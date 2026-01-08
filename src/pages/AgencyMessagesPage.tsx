import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Send, ChevronLeft, ChevronDown, ChevronRight, Home } from 'lucide-react';
import { useAuthStore } from '../hooks';
import { Button } from '../components/atoms/Button';
import {
  getAgencyConversationsGrouped,
  sendPropertyMessage,
  markAgencyLandlordMessagesRead,
} from '../lib/storage';
import type {
  AgencyLandlordMessage,
  AgencyProfile,
  LandlordConversationGroup,
} from '../types';

/**
 * AgencyMessagesPage
 * Displays agency-landlord messaging interface with property-level organization
 * Shows list of connected landlords with expandable property threads
 */
export const AgencyMessagesPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const agencyProfile = currentUser as AgencyProfile;

  const [landlordGroups, setLandlordGroups] = useState<LandlordConversationGroup[]>([]);
  const [expandedLandlords, setExpandedLandlords] = useState<Set<string>>(new Set());
  const [selectedLandlordId, setSelectedLandlordId] = useState<string | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null | undefined>(undefined);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load landlords and conversations grouped by property
  const loadData = useCallback(async () => {
    if (!agencyProfile?.id) return;

    setLoading(true);
    try {
      const groups = await getAgencyConversationsGrouped(agencyProfile.id);
      setLandlordGroups(groups);

      // Auto-expand landlords with unread messages
      const landlordsWithUnread = new Set<string>();
      groups.forEach(g => {
        if (g.totalUnreadCount > 0) {
          landlordsWithUnread.add(g.landlord.id);
        }
      });
      setExpandedLandlords(prev => new Set([...prev, ...landlordsWithUnread]));
    } catch (error) {
      console.error('[AgencyMessagesPage] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [agencyProfile?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedLandlordId, selectedPropertyId, landlordGroups]);

  // Mark messages as read when selecting a conversation
  useEffect(() => {
    if (selectedLandlordId === null || selectedPropertyId === undefined) return;

    const landlordGroup = landlordGroups.find(g => g.landlord.id === selectedLandlordId);
    const propertyConvo = landlordGroup?.propertyConversations.find(
      pc => pc.propertyId === selectedPropertyId
    );

    if (propertyConvo?.conversation && propertyConvo.unreadCount > 0) {
      markAgencyLandlordMessagesRead(propertyConvo.conversation.id, 'agency')
        .then(() => loadData())
        .catch(err => console.error('[AgencyMessagesPage] Error marking as read:', err));
    }
  }, [selectedLandlordId, selectedPropertyId, landlordGroups, loadData]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedLandlordId || selectedPropertyId === undefined || !agencyProfile?.id) return;

    setSending(true);
    try {
      await sendPropertyMessage({
        agencyId: agencyProfile.id,
        landlordId: selectedLandlordId,
        propertyId: selectedPropertyId,
        content: messageText.trim(),
        senderId: agencyProfile.id,
        senderType: 'agency',
      });

      setMessageText('');
      await loadData();
    } catch (error) {
      console.error('[AgencyMessagesPage] Error sending message:', error);
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

  const toggleLandlordExpanded = (landlordId: string) => {
    setExpandedLandlords(prev => {
      const next = new Set(prev);
      if (next.has(landlordId)) {
        next.delete(landlordId);
      } else {
        next.add(landlordId);
      }
      return next;
    });
  };

  const handleSelectProperty = (landlordId: string, propertyId: string | null) => {
    setSelectedLandlordId(landlordId);
    setSelectedPropertyId(propertyId);
  };

  const selectedLandlordGroup = landlordGroups.find(g => g.landlord.id === selectedLandlordId);
  const selectedPropertyConvo = selectedLandlordGroup?.propertyConversations.find(
    pc => pc.propertyId === selectedPropertyId
  );

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

  // Get initials from name
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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

  if (landlordGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-5rem)] p-8 bg-gradient-to-br from-primary-50 via-white to-neutral-50">
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={32} className="text-primary-400" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">No Landlords Connected</h2>
          <p className="text-neutral-500">
            When landlords link their properties with your agency, you'll be able to message them here.
          </p>
        </div>
      </div>
    );
  }

  // Mobile view: Show either list or conversation
  const showConversation = selectedLandlordId !== null && selectedPropertyId !== undefined;

  return (
    <div className="flex h-[calc(100vh-5rem)]">
      {/* Landlord List with Property Groups - Hidden on mobile when conversation is selected */}
      <div className={`${showConversation ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 bg-gradient-to-br from-primary-50 via-white to-neutral-50 border-r border-neutral-200`}>
        <div className="p-4 border-b border-neutral-200 bg-white/80 backdrop-blur-sm">
          <h1 className="text-lg font-bold text-neutral-900">Messages</h1>
          <p className="text-sm text-neutral-500">
            {landlordGroups.length} landlord{landlordGroups.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {landlordGroups.map((group) => {
            const isExpanded = expandedLandlords.has(group.landlord.id);
            const mostRecentConvo = group.propertyConversations.find(pc => pc.lastMessageAt);
            const lastMessage = mostRecentConvo?.conversation?.messages[
              mostRecentConvo.conversation.messages.length - 1
            ];

            return (
              <div key={group.landlord.id} className="border-b border-neutral-100">
                {/* Landlord Header */}
                <button
                  onClick={() => toggleLandlordExpanded(group.landlord.id)}
                  className={`w-full p-4 flex items-start gap-3 transition-all text-left hover:bg-white/80`}
                >
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-700 font-semibold">
                      {getInitials(group.landlord.names)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-neutral-900 truncate">
                        {group.landlord.names}
                      </span>
                      <div className="flex items-center gap-2">
                        {group.totalUnreadCount > 0 && (
                          <div className="w-5 h-5 rounded-full bg-danger-500 text-white text-xs flex items-center justify-center flex-shrink-0">
                            {group.totalUnreadCount > 9 ? '9+' : group.totalUnreadCount}
                          </div>
                        )}
                        {isExpanded ? (
                          <ChevronDown size={18} className="text-neutral-400" />
                        ) : (
                          <ChevronRight size={18} className="text-neutral-400" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-neutral-500 truncate">
                      {lastMessage ? lastMessage.content : 'No messages yet'}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {group.properties.length} {group.properties.length === 1 ? 'property' : 'properties'} linked
                    </p>
                  </div>
                </button>

                {/* Property Conversations (Expandable) */}
                {isExpanded && (
                  <div className="bg-neutral-50/50 border-t border-neutral-100">
                    {group.propertyConversations.map((propConvo) => {
                      const isSelected = selectedLandlordId === group.landlord.id &&
                        selectedPropertyId === propConvo.propertyId;
                      const propLastMessage = propConvo.conversation?.messages[
                        propConvo.conversation.messages.length - 1
                      ];
                      const isGeneral = propConvo.propertyId === null;

                      return (
                        <button
                          key={propConvo.propertyId ?? 'general'}
                          onClick={() => handleSelectProperty(group.landlord.id, propConvo.propertyId)}
                          className={`w-full pl-8 pr-4 py-3 flex items-start gap-3 text-left transition-colors ${isSelected
                            ? 'bg-primary-50 border-l-3 border-primary-500'
                            : 'hover:bg-white/80 border-l-3 border-transparent'
                            }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isGeneral ? 'bg-neutral-100' : 'bg-primary-50'
                            }`}>
                            {isGeneral ? (
                              <MessageSquare size={16} className="text-neutral-500" />
                            ) : (
                              <Home size={16} className="text-primary-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-sm truncate ${isSelected ? 'font-medium text-primary-700' : 'text-neutral-700'
                                }`}>
                                {propConvo.propertyAddress || 'Unknown Property'}
                              </span>
                              {propConvo.lastMessageAt && (
                                <span className="text-xs text-neutral-400 shrink-0">
                                  {formatRelativeTime(propConvo.lastMessageAt)}
                                </span>
                              )}
                            </div>
                            {propLastMessage ? (
                              <p className="text-xs text-neutral-500 truncate mt-0.5">
                                {propLastMessage.content}
                              </p>
                            ) : (
                              <p className="text-xs text-neutral-400 italic mt-0.5">
                                No messages yet
                              </p>
                            )}
                          </div>
                          {propConvo.unreadCount > 0 && (
                            <div className="w-5 h-5 rounded-full bg-danger-500 text-white text-xs flex items-center justify-center shrink-0">
                              {propConvo.unreadCount > 9 ? '9+' : propConvo.unreadCount}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Conversation View */}
      <div className={`${!showConversation ? 'hidden md:flex' : 'flex'} flex-col flex-1 bg-neutral-50`}>
        {selectedLandlordGroup && selectedPropertyConvo ? (
          <>
            {/* Conversation Header */}
            <div className="p-4 bg-gradient-to-r from-primary-50 to-neutral-50 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedLandlordId(null);
                    setSelectedPropertyId(undefined);
                  }}
                  className="md:hidden p-2 -ml-2 rounded-lg hover:bg-white/50 transition-colors"
                >
                  <ChevronLeft size={20} className="text-neutral-600" />
                </button>
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-700 font-semibold text-lg">
                    {getInitials(selectedLandlordGroup.landlord.names)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-neutral-900">
                    {selectedLandlordGroup.landlord.names}
                  </h2>
                  <p className="text-sm text-neutral-500 truncate">
                    {selectedPropertyConvo.propertyId === null
                      ? 'General Discussion'
                      : selectedPropertyConvo.propertyAddress}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {(!selectedPropertyConvo.conversation || selectedPropertyConvo.conversation.messages.length === 0) ? (
                <div className="flex flex-col items-center justify-center flex-1 p-8">
                  <div className="bg-white rounded-2xl shadow-sm p-8 text-center max-w-sm">
                    <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
                      <MessageSquare size={28} className="text-primary-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">No Messages Yet</h3>
                    <p className="text-neutral-500 text-sm">
                      Start a conversation with {selectedLandlordGroup.landlord.names.split(' ')[0]}
                      {selectedPropertyConvo.propertyId !== null && ` about ${selectedPropertyConvo.propertyAddress}`}
                    </p>
                  </div>
                </div>
              ) : (
                selectedPropertyConvo.conversation.messages.map((message: AgencyLandlordMessage) => {
                  const isAgency = message.senderType === 'agency';
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isAgency ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 shadow-sm ${isAgency
                          ? 'bg-primary-600 text-white rounded-2xl rounded-br-none'
                          : 'bg-white text-neutral-800 border border-neutral-200 rounded-2xl rounded-bl-none'
                          }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-1 ${isAgency
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
          <div className="flex flex-col items-center justify-center flex-1 p-8 bg-gradient-to-br from-primary-50 via-white to-neutral-50">
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center max-w-md">
              <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={32} className="text-primary-400" />
              </div>
              <h2 className="text-xl font-bold text-neutral-900 mb-2">Select a Conversation</h2>
              <p className="text-neutral-500">
                Choose a landlord and property from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
