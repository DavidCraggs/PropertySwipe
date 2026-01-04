/**
 * Real-Time Chat Hook
 *
 * Provides WebSocket-based real-time messaging using Supabase Realtime.
 * Includes typing indicators, read receipts, and presence tracking.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js';

// =====================================================
// TYPES
// =====================================================

export interface ChatMessage {
  id: string;
  matchId: string;
  senderId: string;
  senderName: string;
  senderType: 'renter' | 'landlord' | 'agency';
  content: string;
  messageType: 'text' | 'image' | 'document' | 'system';
  metadata?: Record<string, unknown>;
  createdAt: Date;
  readAt?: Date;
  readBy: string[];
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  isTyping: boolean;
  timestamp: Date;
}

export interface PresenceState {
  oderId: string;
  userName: string;
  userType: 'renter' | 'landlord' | 'agency';
  onlineAt: Date;
  status: 'online' | 'away' | 'offline';
}

export interface ChatState {
  messages: ChatMessage[];
  typingUsers: TypingIndicator[];
  onlineUsers: PresenceState[];
  isConnected: boolean;
  error: string | null;
}

interface UseRealtimeChatOptions {
  matchId: string;
  userId: string;
  userName: string;
  userType: 'renter' | 'landlord' | 'agency';
  onNewMessage?: (message: ChatMessage) => void;
  onTypingChange?: (indicators: TypingIndicator[]) => void;
  onPresenceChange?: (users: PresenceState[]) => void;
}

// =====================================================
// HOOK IMPLEMENTATION
// =====================================================

export function useRealtimeChat({
  matchId,
  userId,
  userName,
  userType,
  onNewMessage,
  onTypingChange,
  onPresenceChange,
}: UseRealtimeChatOptions) {
  const [state, setState] = useState<ChatState>({
    messages: [],
    typingUsers: [],
    onlineUsers: [],
    isConnected: false,
    error: null,
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // =====================================================
  // LOAD INITIAL MESSAGES
  // =====================================================

  const loadMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const messages: ChatMessage[] = (data || []).map((msg) => ({
        id: msg.id,
        matchId: msg.match_id,
        senderId: msg.sender_id,
        senderName: msg.sender_name,
        senderType: msg.sender_type,
        content: msg.content,
        messageType: msg.message_type,
        metadata: msg.metadata,
        createdAt: new Date(msg.created_at),
        readAt: msg.read_at ? new Date(msg.read_at) : undefined,
        readBy: msg.read_by || [],
      }));

      setState((prev) => ({ ...prev, messages }));
    } catch (err) {
      console.error('Failed to load messages:', err);
      setState((prev) => ({ ...prev, error: 'Failed to load messages' }));
    }
  }, [matchId]);

  // =====================================================
  // SEND MESSAGE
  // =====================================================

  const sendMessage = useCallback(
    async (content: string, messageType: 'text' | 'image' | 'document' = 'text', metadata?: Record<string, unknown>) => {
      if (!content.trim()) return;

      try {
        const message = {
          match_id: matchId,
          sender_id: userId,
          sender_name: userName,
          sender_type: userType,
          content: content.trim(),
          message_type: messageType,
          metadata,
          read_by: [userId],
        };

        const { error } = await supabase.from('chat_messages').insert(message);

        if (error) throw error;

        // Stop typing indicator after sending
        await setTyping(false);
      } catch (err) {
        console.error('Failed to send message:', err);
        setState((prev) => ({ ...prev, error: 'Failed to send message' }));
      }
    },
    [matchId, userId, userName, userType]
  );

  // =====================================================
  // TYPING INDICATOR
  // =====================================================

  const setTyping = useCallback(
    async (isTyping: boolean) => {
      if (isTypingRef.current === isTyping) return;
      isTypingRef.current = isTyping;

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      // Broadcast typing status
      channelRef.current?.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId,
          userName,
          isTyping,
          timestamp: new Date().toISOString(),
        },
      });

      // Auto-stop typing after 3 seconds of inactivity
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          setTyping(false);
        }, 3000);
      }
    },
    [userId, userName]
  );

  // =====================================================
  // MARK MESSAGES AS READ
  // =====================================================

  const markAsRead = useCallback(
    async (messageIds: string[]) => {
      if (messageIds.length === 0) return;

      try {
        // Update read_by array for each message
        for (const messageId of messageIds) {
          await supabase.rpc('mark_message_read', {
            p_message_id: messageId,
            p_user_id: userId,
          });
        }

        // Broadcast read receipt
        channelRef.current?.send({
          type: 'broadcast',
          event: 'read_receipt',
          payload: {
            userId,
            messageIds,
            readAt: new Date().toISOString(),
          },
        });
      } catch (err) {
        console.error('Failed to mark messages as read:', err);
      }
    },
    [userId]
  );

  // =====================================================
  // SETUP REALTIME SUBSCRIPTION
  // =====================================================

  useEffect(() => {
    if (!matchId || !userId) return;

    // Create channel for this match
    const channel = supabase.channel(`chat:${matchId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channelRef.current = channel;

    // Listen for new messages
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `match_id=eq.${matchId}`,
      },
      (payload) => {
        const msg = payload.new as Record<string, unknown>;
        const newMessage: ChatMessage = {
          id: msg.id as string,
          matchId: msg.match_id as string,
          senderId: msg.sender_id as string,
          senderName: msg.sender_name as string,
          senderType: msg.sender_type as 'renter' | 'landlord' | 'agency',
          content: msg.content as string,
          messageType: msg.message_type as 'text' | 'image' | 'document' | 'system',
          metadata: msg.metadata as Record<string, unknown>,
          createdAt: new Date(msg.created_at as string),
          readBy: (msg.read_by as string[]) || [],
        };

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, newMessage],
        }));

        onNewMessage?.(newMessage);
      }
    );

    // Listen for message updates (read receipts)
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_messages',
        filter: `match_id=eq.${matchId}`,
      },
      (payload) => {
        const msg = payload.new as Record<string, unknown>;
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === msg.id
              ? {
                  ...m,
                  readAt: msg.read_at ? new Date(msg.read_at as string) : undefined,
                  readBy: (msg.read_by as string[]) || [],
                }
              : m
          ),
        }));
      }
    );

    // Listen for typing indicators
    channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
      const indicator = payload as TypingIndicator;
      if (indicator.userId === userId) return; // Ignore own typing

      setState((prev) => {
        const existing = prev.typingUsers.filter((t) => t.userId !== indicator.userId);
        const updated = indicator.isTyping
          ? [...existing, { ...indicator, timestamp: new Date(indicator.timestamp as unknown as string) }]
          : existing;

        onTypingChange?.(updated);
        return { ...prev, typingUsers: updated };
      });
    });

    // Listen for read receipts
    channel.on('broadcast', { event: 'read_receipt' }, ({ payload }) => {
      const { userId: readerId, messageIds } = payload as { userId: string; messageIds: string[] };

      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((m) =>
          messageIds.includes(m.id) && !m.readBy.includes(readerId)
            ? { ...m, readBy: [...m.readBy, readerId] }
            : m
        ),
      }));
    });

    // Track presence
    channel.on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState() as RealtimePresenceState;
      const onlineUsers: PresenceState[] = Object.entries(presenceState).map(
        ([, presences]) => {
          const presence = (presences as Array<{ userName?: string; userType?: string; onlineAt?: string }>)[0];
          return {
            oderId: presence.userName || 'Unknown',
            userName: presence.userName || 'Unknown',
            userType: (presence.userType as 'renter' | 'landlord' | 'agency') || 'renter',
            onlineAt: presence.onlineAt ? new Date(presence.onlineAt) : new Date(),
            status: 'online' as const,
          };
        }
      );

      setState((prev) => ({ ...prev, onlineUsers }));
      onPresenceChange?.(onlineUsers);
    });

    // Subscribe and track presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setState((prev) => ({ ...prev, isConnected: true, error: null }));

        // Track own presence
        await channel.track({
          userName,
          userType,
          onlineAt: new Date().toISOString(),
        });

        // Load initial messages
        await loadMessages();
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setState((prev) => ({ ...prev, isConnected: false }));
      }
    });

    // Cleanup
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [matchId, userId, userName, userType, loadMessages, onNewMessage, onTypingChange, onPresenceChange]);

  // =====================================================
  // CLEANUP STALE TYPING INDICATORS
  // =====================================================

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setState((prev) => {
        const activeTyping = prev.typingUsers.filter(
          (t) => now - t.timestamp.getTime() < 5000
        );
        if (activeTyping.length !== prev.typingUsers.length) {
          onTypingChange?.(activeTyping);
          return { ...prev, typingUsers: activeTyping };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onTypingChange]);

  return {
    messages: state.messages,
    typingUsers: state.typingUsers,
    onlineUsers: state.onlineUsers,
    isConnected: state.isConnected,
    error: state.error,
    sendMessage,
    setTyping,
    markAsRead,
    loadMessages,
  };
}

export default useRealtimeChat;
