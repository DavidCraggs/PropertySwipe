import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Send, ChevronLeft, ChevronDown, ChevronRight, Home, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../hooks';
import { Button } from '../components/atoms/Button';
import { pageHeader, card, heading, subText } from '../utils/conceptCStyles';
import {
  getLandlordConversationsGrouped,
  sendPropertyMessage,
  markAgencyLandlordMessagesRead,
} from '../lib/storage';
import type {
  AgencyLandlordMessage,
  LandlordProfile,
  AgencyConversationGroup,
} from '../types';

interface LandlordMessagesPageProps {
  onBack?: () => void;
}

/**
 * LandlordMessagesPage
 * Displays landlord-agency messaging interface with property-level organization
 * Shows list of connected agencies with expandable property threads
 */
export const LandlordMessagesPage: React.FC<LandlordMessagesPageProps> = ({ onBack }) => {
  const { currentUser } = useAuthStore();
  const landlordProfile = currentUser as LandlordProfile;

  const [agencyGroups, setAgencyGroups] = useState<AgencyConversationGroup[]>([]);
  const [expandedAgencies, setExpandedAgencies] = useState<Set<string>>(new Set());
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null | undefined>(undefined);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load agencies and conversations grouped by property
  const loadData = useCallback(async () => {
    if (!landlordProfile?.id) return;

    setLoading(true);
    try {
      const groups = await getLandlordConversationsGrouped(landlordProfile.id);
      setAgencyGroups(groups);

      // Auto-expand agencies with unread messages
      const agenciesWithUnread = new Set<string>();
      groups.forEach(g => {
        if (g.totalUnreadCount > 0) {
          agenciesWithUnread.add(g.agency.id);
        }
      });
      setExpandedAgencies(prev => new Set([...prev, ...agenciesWithUnread]));
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
  }, [selectedAgencyId, selectedPropertyId, agencyGroups]);

  // Mark messages as read when selecting a conversation
  useEffect(() => {
    if (selectedAgencyId === null || selectedPropertyId === undefined) return;

    const agencyGroup = agencyGroups.find(g => g.agency.id === selectedAgencyId);
    const propertyConvo = agencyGroup?.propertyConversations.find(
      pc => pc.propertyId === selectedPropertyId
    );

    if (propertyConvo?.conversation && propertyConvo.unreadCount > 0) {
      markAgencyLandlordMessagesRead(propertyConvo.conversation.id, 'landlord')
        .then(() => loadData())
        .catch(err => console.error('[LandlordMessagesPage] Error marking as read:', err));
    }
  }, [selectedAgencyId, selectedPropertyId, agencyGroups, loadData]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedAgencyId || selectedPropertyId === undefined || !landlordProfile?.id) return;

    setSending(true);
    try {
      await sendPropertyMessage({
        agencyId: selectedAgencyId,
        landlordId: landlordProfile.id,
        propertyId: selectedPropertyId,
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

  const toggleAgencyExpanded = (agencyId: string) => {
    setExpandedAgencies(prev => {
      const next = new Set(prev);
      if (next.has(agencyId)) {
        next.delete(agencyId);
      } else {
        next.add(agencyId);
      }
      return next;
    });
  };

  const handleSelectProperty = (agencyId: string, propertyId: string | null) => {
    setSelectedAgencyId(agencyId);
    setSelectedPropertyId(propertyId);
  };

  const selectedAgencyGroup = agencyGroups.find(g => g.agency.id === selectedAgencyId);
  const selectedPropertyConvo = selectedAgencyGroup?.propertyConversations.find(
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
      <div className="flex items-center justify-center h-[calc(100vh-5rem)]" style={{ background: 'var(--color-bg)' }}>
        <div className="animate-spin rounded-full h-8 w-8" style={{ borderBottom: '2px solid var(--color-teal)' }} />
      </div>
    );
  }

  if (agencyGroups.length === 0) {
    return (
      <div className="flex flex-col h-[calc(100vh-5rem)]" style={{ background: 'var(--color-bg)' }}>
        {onBack && (
          <div className="p-4" style={{ ...pageHeader }}>
            <button
              onClick={onBack}
              className="flex items-center gap-2 transition-colors"
              style={{ color: 'var(--color-sub)' }}
            >
              <ArrowLeft size={20} />
              <span>Back to Dashboard</span>
            </button>
          </div>
        )}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="rounded-2xl p-8 text-center max-w-md" style={{ ...card, padding: 32 }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--color-bg)' }}>
              <MessageSquare size={32} style={{ color: 'var(--color-teal)' }} />
            </div>
            <h2 className="mb-2" style={heading(20)}>No Agencies Connected</h2>
            <p style={{ color: 'var(--color-sub)' }}>
              When you link your properties with an agency, you'll be able to message them here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Mobile view: Show either list or conversation
  const showConversation = selectedAgencyId !== null && selectedPropertyId !== undefined;

  return (
    <div className="flex h-[calc(100vh-5rem)]">
      {/* Agency List with Property Groups - Hidden on mobile when conversation is selected */}
      <div className={`${showConversation ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96`} style={{ background: 'var(--color-bg)', borderRight: '1px solid var(--color-line)' }}>
        <div className="p-4" style={{ ...pageHeader }}>
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 -ml-2 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} style={{ color: 'var(--color-sub)' }} />
              </button>
            )}
            <div>
              <h1 style={heading(18)}>Agency Messages</h1>
              <p style={{ ...subText(14), marginTop: 4 }}>
                {agencyGroups.length} {agencyGroups.length === 1 ? 'agency' : 'agencies'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {agencyGroups.map((group) => {
            const isExpanded = expandedAgencies.has(group.agency.id);
            const mostRecentConvo = group.propertyConversations.find(pc => pc.lastMessageAt);
            const lastMessage = mostRecentConvo?.conversation?.messages[
              mostRecentConvo.conversation.messages.length - 1
            ];

            return (
              <div key={group.agency.id} style={{ borderBottom: '1px solid var(--color-line)' }}>
                {/* Agency Header */}
                <button
                  onClick={() => toggleAgencyExpanded(group.agency.id)}
                  className="w-full p-4 flex items-start gap-3 transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-teal)', opacity: 0.15 }}>
                    <span className="font-semibold" style={{ color: 'var(--color-teal)', opacity: 1 }}>
                      {getInitials(group.agency.companyName)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate" style={{ color: 'var(--color-text)' }}>
                        {group.agency.companyName}
                      </span>
                      <div className="flex items-center gap-2">
                        {group.totalUnreadCount > 0 && (
                          <div className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-teal)' }}>
                            {group.totalUnreadCount > 9 ? '9+' : group.totalUnreadCount}
                          </div>
                        )}
                        {isExpanded ? (
                          <ChevronDown size={18} style={{ color: 'var(--color-sub)' }} />
                        ) : (
                          <ChevronRight size={18} style={{ color: 'var(--color-sub)' }} />
                        )}
                      </div>
                    </div>
                    <p className="text-sm truncate" style={{ color: 'var(--color-sub)' }}>
                      {lastMessage ? lastMessage.content : 'No messages yet'}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-sub)' }}>
                      Managing {group.properties.length} {group.properties.length === 1 ? 'property' : 'properties'}
                    </p>
                  </div>
                </button>

                {/* Property Conversations (Expandable) */}
                {isExpanded && (
                  <div style={{ background: 'var(--color-bg)', borderTop: '1px solid var(--color-line)' }}>
                    {group.propertyConversations.map((propConvo) => {
                      const isSelected = selectedAgencyId === group.agency.id &&
                        selectedPropertyId === propConvo.propertyId;
                      const propLastMessage = propConvo.conversation?.messages[
                        propConvo.conversation.messages.length - 1
                      ];
                      const isGeneral = propConvo.propertyId === null;

                      return (
                        <button
                          key={propConvo.propertyId ?? 'general'}
                          onClick={() => handleSelectProperty(group.agency.id, propConvo.propertyId)}
                          className="w-full pl-8 pr-4 py-3 flex items-start gap-3 text-left transition-colors"
                          style={{
                            background: isSelected ? 'var(--color-card)' : 'transparent',
                            borderLeft: isSelected ? '3px solid var(--color-teal)' : '3px solid transparent',
                          }}
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: isGeneral ? 'var(--color-bg)' : 'var(--color-card)' }}>
                            {isGeneral ? (
                              <MessageSquare size={16} style={{ color: 'var(--color-sub)' }} />
                            ) : (
                              <Home size={16} style={{ color: 'var(--color-teal)' }} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm truncate"
                                style={{ fontWeight: isSelected ? 500 : 400, color: isSelected ? 'var(--color-teal)' : 'var(--color-text)' }}>
                                {propConvo.propertyAddress || 'Unknown Property'}
                              </span>
                              {propConvo.lastMessageAt && (
                                <span className="text-xs shrink-0" style={{ color: 'var(--color-sub)' }}>
                                  {formatRelativeTime(propConvo.lastMessageAt)}
                                </span>
                              )}
                            </div>
                            {propLastMessage ? (
                              <p className="text-xs truncate mt-0.5" style={{ color: 'var(--color-sub)' }}>
                                {propLastMessage.content}
                              </p>
                            ) : (
                              <p className="text-xs italic mt-0.5" style={{ color: 'var(--color-sub)' }}>
                                No messages yet
                              </p>
                            )}
                          </div>
                          {propConvo.unreadCount > 0 && (
                            <div className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center shrink-0" style={{ background: 'var(--color-teal)' }}>
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
      <div className={`${!showConversation ? 'hidden md:flex' : 'flex'} flex-col flex-1`} style={{ background: 'var(--color-bg)' }}>
        {selectedAgencyGroup && selectedPropertyConvo ? (
          <>
            {/* Conversation Header */}
            <div className="p-4" style={{ ...pageHeader }}>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedAgencyId(null);
                    setSelectedPropertyId(undefined);
                  }}
                  className="md:hidden p-2 -ml-2 rounded-lg transition-colors"
                >
                  <ChevronLeft size={20} style={{ color: 'var(--color-sub)' }} />
                </button>
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--color-teal)', opacity: 0.15 }}>
                  <span className="font-semibold text-lg" style={{ color: 'var(--color-teal)', opacity: 1 }}>
                    {getInitials(selectedAgencyGroup.agency.companyName)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold" style={{ color: 'var(--color-text)' }}>
                    {selectedAgencyGroup.agency.companyName}
                  </h2>
                  <p className="text-sm truncate" style={{ color: 'var(--color-sub)' }}>
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
                  <div className="rounded-2xl p-8 text-center max-w-sm" style={{ ...card, padding: 32 }}>
                    <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--color-bg)' }}>
                      <MessageSquare size={28} style={{ color: 'var(--color-teal)' }} />
                    </div>
                    <h3 className="mb-2" style={heading(18)}>No Messages Yet</h3>
                    <p className="text-sm" style={{ color: 'var(--color-sub)' }}>
                      Start a conversation with {selectedAgencyGroup.agency.companyName}
                      {selectedPropertyConvo.propertyId !== null && ` about ${selectedPropertyConvo.propertyAddress}`}
                    </p>
                  </div>
                </div>
              ) : (
                selectedPropertyConvo.conversation.messages.map((message: AgencyLandlordMessage) => {
                  const isLandlord = message.senderType === 'landlord';
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isLandlord ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 ${isLandlord
                          ? 'rounded-2xl rounded-br-none'
                          : 'rounded-2xl rounded-bl-none'
                          }`}
                        style={isLandlord
                          ? { background: 'var(--color-teal)', color: '#fff' }
                          : { background: 'var(--color-card)', border: '1.5px solid var(--color-line)', color: 'var(--color-text)' }
                        }
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-1 ${isLandlord ? 'text-right' : ''}`}
                          style={{ color: isLandlord ? 'rgba(255,255,255,0.7)' : 'var(--color-sub)' }}>
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
            <div className="p-4" style={{ background: 'var(--color-card)', borderTop: '1px solid var(--color-line)' }}>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  style={{ background: 'var(--color-card)', border: '1.5px solid var(--color-line)', color: 'var(--color-text)' }}
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
          <div className="flex flex-col items-center justify-center flex-1 p-8" style={{ background: 'var(--color-bg)' }}>
            <div className="rounded-2xl p-8 text-center max-w-md" style={{ ...card, padding: 32 }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--color-bg)' }}>
                <MessageSquare size={32} style={{ color: 'var(--color-teal)' }} />
              </div>
              <h2 className="mb-2" style={heading(20)}>Select a Conversation</h2>
              <p style={{ color: 'var(--color-sub)' }}>
                Choose an agency and property from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
