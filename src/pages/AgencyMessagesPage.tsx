import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Send, User, ChevronLeft, Clock } from 'lucide-react';
import { useAuthStore } from '../hooks';
import { Button } from '../components/atoms/Button';
import {
  getAgencyLandlordConversations,
  sendAgencyLandlordMessage,
  markAgencyLandlordMessagesRead,
  getAgencyLinksForAgency,
  getLandlordProfile,
} from '../lib/storage';
import type {
  AgencyLandlordConversation,
  AgencyLandlordMessage,
  AgencyPropertyLink,
  LandlordProfile,
  AgencyProfile,
} from '../types';

interface LandlordWithConversation {
  landlord: LandlordProfile;
  conversation: AgencyLandlordConversation | null;
  link: AgencyPropertyLink;
}

/**
 * AgencyMessagesPage
 * Displays agency-landlord messaging interface
 * Shows list of connected landlords with conversation threads
 */
export const AgencyMessagesPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const agencyProfile = currentUser as AgencyProfile;

  const [landlords, setLandlords] = useState<LandlordWithConversation[]>([]);
  const [selectedLandlordId, setSelectedLandlordId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load landlords and conversations
  const loadData = useCallback(async () => {
    if (!agencyProfile?.id) return;

    setLoading(true);
    try {
      // Get agency property links to find connected landlords
      const links = await getAgencyLinksForAgency(agencyProfile.id);
      const activeLinks = links.filter(l => l.isActive);

      // Get unique landlord IDs
      const uniqueLandlordIds = [...new Set(activeLinks.map(l => l.landlordId))];

      // Fetch all conversations
      const conversations = await getAgencyLandlordConversations(agencyProfile.id);

      // Fetch landlord profiles and match with conversations
      const landlordsWithConversations: LandlordWithConversation[] = [];

      for (const landlordId of uniqueLandlordIds) {
        try {
          const landlord = await getLandlordProfile(landlordId);
          if (landlord) {
            const conversation = conversations.find(c => c.landlordId === landlordId) || null;
            const link = activeLinks.find(l => l.landlordId === landlordId)!;
            landlordsWithConversations.push({ landlord, conversation, link });
          }
        } catch (err) {
          console.error(`[AgencyMessagesPage] Error fetching landlord ${landlordId}:`, err);
        }
      }

      // Sort by last message time (most recent first), then by landlord name
      landlordsWithConversations.sort((a, b) => {
        const aTime = a.conversation?.lastMessageAt ? new Date(a.conversation.lastMessageAt).getTime() : 0;
        const bTime = b.conversation?.lastMessageAt ? new Date(b.conversation.lastMessageAt).getTime() : 0;
        if (aTime !== bTime) return bTime - aTime;
        return a.landlord.names.localeCompare(b.landlord.names);
      });

      setLandlords(landlordsWithConversations);
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
  }, [selectedLandlordId, landlords]);

  // Mark messages as read when selecting a conversation
  useEffect(() => {
    if (!selectedLandlordId) return;

    const selectedItem = landlords.find(l => l.landlord.id === selectedLandlordId);
    if (selectedItem?.conversation && selectedItem.conversation.unreadCountAgency > 0) {
      markAgencyLandlordMessagesRead(selectedItem.conversation.id, 'agency')
        .then(() => loadData())
        .catch(err => console.error('[AgencyMessagesPage] Error marking as read:', err));
    }
  }, [selectedLandlordId, landlords, loadData]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedLandlordId || !agencyProfile?.id) return;

    setSending(true);
    try {
      await sendAgencyLandlordMessage({
        agencyId: agencyProfile.id,
        landlordId: selectedLandlordId,
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

  const selectedLandlord = landlords.find(l => l.landlord.id === selectedLandlordId);

  const formatMessageTime = (timestamp: Date | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    } else if (diffHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (landlords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <MessageSquare size={48} className="text-neutral-300 mb-4" />
        <h2 className="text-xl font-bold text-neutral-900 mb-2">No Landlords Connected</h2>
        <p className="text-neutral-600 max-w-md">
          When landlords link their properties with your agency, you'll be able to message them here.
        </p>
      </div>
    );
  }

  // Mobile view: Show either list or conversation
  const showConversation = selectedLandlordId !== null;

  return (
    <div className="flex h-full bg-neutral-50">
      {/* Landlord List - Hidden on mobile when conversation is selected */}
      <div className={`${showConversation ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 bg-white border-r border-neutral-200`}>
        <div className="p-4 border-b border-neutral-200">
          <h1 className="text-lg font-bold text-neutral-900">Messages</h1>
          <p className="text-sm text-neutral-500">{landlords.length} landlord{landlords.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {landlords.map(({ landlord, conversation }) => {
            const lastMessage = conversation?.messages[conversation.messages.length - 1];
            const unreadCount = conversation?.unreadCountAgency || 0;

            return (
              <button
                key={landlord.id}
                onClick={() => setSelectedLandlordId(landlord.id)}
                className={`w-full p-4 flex items-start gap-3 border-b border-neutral-100 hover:bg-neutral-50 transition-colors text-left ${
                  selectedLandlordId === landlord.id ? 'bg-primary-50' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <User size={20} className="text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-neutral-900 truncate">{landlord.names}</span>
                    {lastMessage && (
                      <span className="text-xs text-neutral-500 flex-shrink-0 ml-2">
                        {formatMessageTime(lastMessage.timestamp)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-500 truncate">
                    {lastMessage ? lastMessage.content : 'No messages yet'}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <div className="w-5 h-5 rounded-full bg-primary-600 text-white text-xs flex items-center justify-center flex-shrink-0">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversation View */}
      <div className={`${!showConversation ? 'hidden md:flex' : 'flex'} flex-col flex-1`}>
        {selectedLandlord ? (
          <>
            {/* Conversation Header */}
            <div className="p-4 bg-white border-b border-neutral-200 flex items-center gap-3">
              <button
                onClick={() => setSelectedLandlordId(null)}
                className="md:hidden p-2 -ml-2 rounded-lg hover:bg-neutral-100"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <User size={20} className="text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-medium text-neutral-900">{selectedLandlord.landlord.names}</h2>
                <p className="text-sm text-neutral-500">{selectedLandlord.landlord.email}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {(!selectedLandlord.conversation || selectedLandlord.conversation.messages.length === 0) ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare size={32} className="text-neutral-300 mb-2" />
                  <p className="text-neutral-500">No messages yet</p>
                  <p className="text-sm text-neutral-400">Start a conversation with {selectedLandlord.landlord.names}</p>
                </div>
              ) : (
                selectedLandlord.conversation.messages.map((message: AgencyLandlordMessage) => {
                  const isAgency = message.senderType === 'agency';
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isAgency ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                          isAgency
                            ? 'bg-primary-600 text-white rounded-br-md'
                            : 'bg-white text-neutral-900 border border-neutral-200 rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <div className={`flex items-center gap-1 mt-1 ${isAgency ? 'justify-end' : 'justify-start'}`}>
                          <Clock size={10} className={isAgency ? 'text-primary-200' : 'text-neutral-400'} />
                          <span className={`text-xs ${isAgency ? 'text-primary-200' : 'text-neutral-400'}`}>
                            {formatMessageTime(message.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-neutral-200">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-neutral-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={sending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sending}
                  size="md"
                  className="!rounded-full !p-3"
                >
                  <Send size={18} />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <MessageSquare size={48} className="text-neutral-300 mb-4" />
            <h2 className="text-xl font-bold text-neutral-900 mb-2">Select a Conversation</h2>
            <p className="text-neutral-600">Choose a landlord from the list to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};
