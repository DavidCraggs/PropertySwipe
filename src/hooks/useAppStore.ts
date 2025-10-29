import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Property, User, Match, Message, UserPreferences } from '../types';
import { mockProperties } from '../data/mockProperties';
import {
  STORAGE_KEYS,
  MATCH_PROBABILITY,
  SELLER_MESSAGE_TEMPLATES,
  DEFAULT_PREFERENCES,
} from '../utils/constants';
import { filterProperties } from '../utils/filters';

interface AppState {
  // User
  user: User | null;

  // Properties
  allProperties: Property[];
  availableProperties: Property[];
  currentPropertyIndex: number;

  // Interactions
  likedProperties: string[];
  passedProperties: string[];

  // Matches & Messages
  matches: Match[];

  // UI State
  isOnboarded: boolean;

  // Actions
  initializeUser: (name: string, email: string) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;

  // Swipe actions
  likeProperty: (propertyId: string) => void;
  dislikeProperty: (propertyId: string) => void;

  // Matching
  checkForMatch: (propertyId: string) => boolean;

  // Messages
  sendMessage: (matchId: string, content: string) => void;
  markMessagesAsRead: (matchId: string) => void;

  // Property deck management
  loadNextProperties: () => void;
  resetDeck: () => void;

  // Stats
  getStats: () => {
    propertiesViewed: number;
    propertiesLiked: number;
    propertiesPassed: number;
    matchesCount: number;
  };

  // Reset
  resetApp: () => void;
}

/**
 * Main Zustand store for PropertySwipe application
 * Handles user state, properties, matching logic, and persistence
 */
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      allProperties: mockProperties,
      availableProperties: mockProperties,
      currentPropertyIndex: 0,
      likedProperties: [],
      passedProperties: [],
      matches: [],
      isOnboarded: false,

      // Initialize user
      initializeUser: (name, email) => {
        const newUser: User = {
          id: `user-${Date.now()}`,
          name,
          email,
          type: 'buyer',
          preferences: DEFAULT_PREFERENCES,
          likedProperties: [],
          passedProperties: [],
          matches: [],
          createdAt: new Date().toISOString(),
          hasCompletedOnboarding: true,
        };

        set({
          user: newUser,
          isOnboarded: true,
        });
      },

      // Update user preferences and filter properties
      updatePreferences: (preferences) => {
        const { user, allProperties } = get();
        if (!user) return;

        const updatedPreferences = {
          ...user.preferences,
          ...preferences,
        };

        const filteredProperties = filterProperties(allProperties, updatedPreferences);

        set({
          user: {
            ...user,
            preferences: updatedPreferences,
          },
          availableProperties: filteredProperties,
          currentPropertyIndex: 0,
        });
      },

      // Like a property
      likeProperty: (propertyId) => {
        const { likedProperties, user } = get();
        if (likedProperties.includes(propertyId)) return;

        set({
          likedProperties: [...likedProperties, propertyId],
          currentPropertyIndex: get().currentPropertyIndex + 1,
        });

        if (user) {
          set({
            user: {
              ...user,
              likedProperties: [...user.likedProperties, propertyId],
            },
          });
        }

        // Check for match
        get().checkForMatch(propertyId);
      },

      // Dislike a property
      dislikeProperty: (propertyId) => {
        const { passedProperties, user } = get();
        if (passedProperties.includes(propertyId)) return;

        set({
          passedProperties: [...passedProperties, propertyId],
          currentPropertyIndex: get().currentPropertyIndex + 1,
        });

        if (user) {
          set({
            user: {
              ...user,
              passedProperties: [...user.passedProperties, propertyId],
            },
          });
        }
      },

      // Check for match (simulated with probability)
      checkForMatch: (propertyId) => {
        const { allProperties, matches, user } = get();
        if (!user) return false;

        // Random match probability for demo
        const isMatch = Math.random() < MATCH_PROBABILITY;

        if (isMatch) {
          const property = allProperties.find((p) => p.id === propertyId);
          if (!property) return false;

          // Create match
          const newMatch: Match = {
            id: `match-${Date.now()}`,
            propertyId,
            property,
            sellerId: property.sellerId,
            sellerName: `Seller for ${property.address.street}`,
            buyerId: user.id,
            timestamp: new Date().toISOString(),
            messages: [
              {
                id: `msg-${Date.now()}`,
                senderId: property.sellerId,
                senderType: 'seller',
                content:
                  SELLER_MESSAGE_TEMPLATES[
                    Math.floor(Math.random() * SELLER_MESSAGE_TEMPLATES.length)
                  ],
                timestamp: new Date().toISOString(),
                read: false,
              },
            ],
            lastMessageAt: new Date().toISOString(),
            unreadCount: 1,
          };

          set({
            matches: [newMatch, ...matches],
            user: {
              ...user,
              matches: [newMatch.id, ...user.matches],
            },
          });

          return true;
        }

        return false;
      },

      // Send message in a match
      sendMessage: (matchId, content) => {
        const { matches, user } = get();
        if (!user) return;

        const matchIndex = matches.findIndex((m) => m.id === matchId);
        if (matchIndex === -1) return;

        const newMessage: Message = {
          id: `msg-${Date.now()}`,
          senderId: user.id,
          senderType: 'buyer',
          content,
          timestamp: new Date().toISOString(),
          read: true,
        };

        const updatedMatches = [...matches];
        updatedMatches[matchIndex] = {
          ...updatedMatches[matchIndex],
          messages: [...updatedMatches[matchIndex].messages, newMessage],
          lastMessageAt: new Date().toISOString(),
        };

        set({ matches: updatedMatches });

        // Simulate seller response after 3 seconds
        setTimeout(() => {
          const sellerReply: Message = {
            id: `msg-${Date.now()}`,
            senderId: updatedMatches[matchIndex].sellerId,
            senderType: 'seller',
            content: "Thanks for your message! I'll get back to you shortly.",
            timestamp: new Date().toISOString(),
            read: false,
          };

          const currentMatches = get().matches;
          const currentMatchIndex = currentMatches.findIndex((m) => m.id === matchId);
          if (currentMatchIndex === -1) return;

          const finalMatches = [...currentMatches];
          finalMatches[currentMatchIndex] = {
            ...finalMatches[currentMatchIndex],
            messages: [...finalMatches[currentMatchIndex].messages, sellerReply],
            lastMessageAt: new Date().toISOString(),
            unreadCount: finalMatches[currentMatchIndex].unreadCount + 1,
          };

          set({ matches: finalMatches });
        }, 3000);
      },

      // Mark messages as read
      markMessagesAsRead: (matchId) => {
        const { matches } = get();
        const matchIndex = matches.findIndex((m) => m.id === matchId);
        if (matchIndex === -1) return;

        const updatedMatches = [...matches];
        updatedMatches[matchIndex] = {
          ...updatedMatches[matchIndex],
          messages: updatedMatches[matchIndex].messages.map((msg) => ({
            ...msg,
            read: true,
          })),
          unreadCount: 0,
        };

        set({ matches: updatedMatches });
      },

      // Load next batch of properties
      loadNextProperties: () => {
        // In a real app, this would fetch from API
        console.log('Loading next properties batch...');
      },

      // Reset property deck
      resetDeck: () => {
        const { user, allProperties } = get();
        if (!user) {
          set({
            availableProperties: allProperties,
            currentPropertyIndex: 0,
            likedProperties: [],
            passedProperties: [],
          });
          return;
        }

        const filteredProperties = filterProperties(allProperties, user.preferences);
        set({
          availableProperties: filteredProperties,
          currentPropertyIndex: 0,
          likedProperties: [],
          passedProperties: [],
        });
      },

      // Get statistics
      getStats: () => {
        const { likedProperties, passedProperties, matches } = get();
        return {
          propertiesViewed: likedProperties.length + passedProperties.length,
          propertiesLiked: likedProperties.length,
          propertiesPassed: passedProperties.length,
          matchesCount: matches.length,
        };
      },

      // Reset entire app
      resetApp: () => {
        set({
          user: null,
          availableProperties: mockProperties,
          currentPropertyIndex: 0,
          likedProperties: [],
          passedProperties: [],
          matches: [],
          isOnboarded: false,
        });
      },
    }),
    {
      name: STORAGE_KEYS.USER,
      partialize: (state) => ({
        user: state.user,
        likedProperties: state.likedProperties,
        passedProperties: state.passedProperties,
        matches: state.matches,
        isOnboarded: state.isOnboarded,
        currentPropertyIndex: state.currentPropertyIndex,
      }),
    }
  )
);
