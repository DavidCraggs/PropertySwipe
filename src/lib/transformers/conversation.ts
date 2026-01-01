/**
 * Conversation Transformer
 * Handles conversion between Supabase snake_case and TypeScript camelCase
 */

import type { Conversation, Message, ConversationType } from '../../types';
import type { DbRecord } from './index';

/**
 * Transform a Supabase conversations record to a TypeScript Conversation object
 */
export const transformConversation = (d: DbRecord): Conversation => ({
  id: d.id as string,
  matchId: d.match_id as string,
  conversationType: d.conversation_type as ConversationType,

  // Messages
  messages: (d.messages as Message[]) || [],

  // Timestamps
  lastMessageAt: d.last_message_at as string | undefined,
  createdAt: new Date(d.created_at as string),
  updatedAt: new Date(d.updated_at as string),

  // Unread counts
  unreadCountRenter: (d.unread_count_renter as number) || 0,
  unreadCountOther: (d.unread_count_other as number) || 0,
});

/**
 * Transform a TypeScript Conversation object to Supabase format for saving
 */
export const transformConversationToDb = (
  conversation: Partial<Conversation>
): Record<string, unknown> => ({
  id: conversation.id,
  match_id: conversation.matchId,
  conversation_type: conversation.conversationType,

  // Messages
  messages: conversation.messages,

  // Timestamps
  last_message_at: conversation.lastMessageAt,
  created_at: conversation.createdAt?.toISOString(),
  updated_at: conversation.updatedAt?.toISOString(),

  // Unread counts
  unread_count_renter: conversation.unreadCountRenter,
  unread_count_other: conversation.unreadCountOther,
});
