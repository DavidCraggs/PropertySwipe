import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Property, User, Match, Message, UserPreferences, ViewingPreference, ViewingTimeSlot } from '../types';
import { mockProperties } from '../data/mockProperties';
import {
  STORAGE_KEYS,
  MATCH_PROBABILITY,
  SELLER_MESSAGE_TEMPLATES,
  DEFAULT_PREFERENCES,
} from '../utils/constants';
import { filterProperties } from '../utils/filters';
import {
  getAllProperties,
  saveProperty,
  deleteProperty as deletePropertyFromStorage,
} from '../lib/storage';

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

  // Viewing Preferences
  viewingPreferences: ViewingPreference[];

  // UI State
  isOnboarded: boolean;

  // Actions
  initializeUser: (name: string, email: string) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;

  // Swipe actions
  likeProperty: (propertyId: string) => void;
  dislikeProperty: (propertyId: string) => void;

  // Matching
  checkForMatch: (propertyId: string, buyerProfile?: {
    situation: string;
    ages: string;
    localArea: string;
    buyerType: string;
    purchaseType: string;
  }) => boolean;

  // Messages
  sendMessage: (matchId: string, content: string) => void;
  markMessagesAsRead: (matchId: string) => void;

  // Viewing preferences
  setViewingPreference: (matchId: string, preference: {
    flexibility: 'Flexible' | 'Specific' | 'ASAP';
    preferredTimes: ViewingTimeSlot[];
    additionalNotes: string;
  }) => void;
  confirmViewing: (matchId: string, dateTime: Date) => void;
  getUpcomingViewings: () => Match[];

  // Property deck management
  loadNextProperties: () => void;
  resetDeck: () => void;

  // Vendor actions
  linkPropertyToVendor: (propertyId: string, vendorId: string) => void;
  updateMatchesVendorId: (propertyId: string, vendorId: string) => void;

  // Property CRUD operations
  loadProperties: () => Promise<void>;
  createProperty: (propertyData: Omit<Property, 'id'>, vendorId: string) => Promise<string>;
  updateProperty: (propertyId: string, updates: Partial<Property>) => Promise<void>;
  deleteProperty: (propertyId: string) => Promise<void>;
  unlinkProperty: (propertyId: string, vendorId: string) => void;

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
      viewingPreferences: [],
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

        // FIX BUG #8 & #9: Get buyer profile from useAuthStore to pass to checkForMatch
        let buyerProfile: any = undefined;
        try {
          const authData = localStorage.getItem('get-on-auth');
          if (authData) {
            const parsed = JSON.parse(authData);
            const currentUser = parsed.state?.currentUser;
            if (currentUser && 'situation' in currentUser) {
              // It's a BuyerProfile
              buyerProfile = {
                situation: currentUser.situation,
                ages: currentUser.ages,
                localArea: currentUser.localArea,
                buyerType: currentUser.buyerType,
                purchaseType: currentUser.purchaseType,
              };
            }
          }
        } catch (e) {
          console.warn('[Like] Could not retrieve buyer profile from auth store');
        }

        // Check for match with buyer profile
        get().checkForMatch(propertyId, buyerProfile);
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
      checkForMatch: (propertyId, buyerProfile) => {
        const { allProperties, matches, user } = get();
        if (!user) return false;

        const property = allProperties.find((p) => p.id === propertyId);
        if (!property) return false;

        // CRITICAL FIX: Only create matches for properties with linked vendors
        // Empty vendorId means no vendor has claimed this property yet
        if (!property.vendorId || property.vendorId.trim() === '') {
          console.warn(
            `[Matching] Property ${propertyId} has no vendor linked. Match cannot be created.`
          );
          return false;
        }

        // DEMO LIMITATION: Using random matching for demonstration purposes
        // PRODUCTION TODO: Implement two-sided matching system where:
        // 1. Buyer likes property → creates "PendingInterest"
        // 2. Vendor reviews interested buyers
        // 3. Vendor approves/rejects → creates Match if approved
        // 4. Both parties must show interest for a match
        const isMatch = Math.random() < MATCH_PROBABILITY;

        if (isMatch) {
          // FIX BUG #9: Get real vendor name from useAuthStore if available
          // For now, we'll use a placeholder - will be updated when vendor profile is accessed
          let vendorName = `Vendor for ${property.address.street}`;

          // Try to get vendor name from localStorage (useAuthStore persists there)
          try {
            const authData = localStorage.getItem('get-on-auth');
            if (authData) {
              const parsed = JSON.parse(authData);
              if (parsed.state?.currentUser?.id === property.vendorId && parsed.state?.currentUser?.names) {
                vendorName = parsed.state.currentUser.names;
              }
            }
          } catch (e) {
            console.warn('[Matching] Could not retrieve vendor name from auth store');
          }

          console.log(
            `[Matching] Creating match for buyer ${user.id} and vendor ${property.vendorId} (${vendorName}) on property ${propertyId}`
          );

          // FIX BUG #8: Include full buyer profile in match data
          const newMatch: Match = {
            id: `match-${Date.now()}`,
            propertyId,
            property,
            vendorId: property.vendorId,
            vendorName, // Now uses real vendor name if available
            buyerId: user.id,
            buyerName: user.name,
            // Include buyer profile if provided
            buyerProfile: buyerProfile ? {
              situation: buyerProfile.situation as any,
              ages: buyerProfile.ages,
              localArea: buyerProfile.localArea as any,
              buyerType: buyerProfile.buyerType as any,
              purchaseType: buyerProfile.purchaseType as any,
            } : undefined,
            timestamp: new Date().toISOString(),
            messages: [
              {
                id: `msg-${Date.now()}`,
                senderId: property.vendorId,
                senderType: 'vendor',
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
            hasViewingScheduled: false,
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

        // Simulate vendor response after 3 seconds
        setTimeout(() => {
          const vendorReply: Message = {
            id: `msg-${Date.now()}`,
            senderId: updatedMatches[matchIndex].vendorId,
            senderType: 'vendor',
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
            messages: [...finalMatches[currentMatchIndex].messages, vendorReply],
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

      // Set viewing preference for a match
      setViewingPreference: (matchId, preference) => {
        const { matches, viewingPreferences } = get();
        const matchIndex = matches.findIndex((m) => m.id === matchId);
        if (matchIndex === -1) return;

        const match = matches[matchIndex];
        const newPreference: ViewingPreference = {
          id: `viewing-${Date.now()}`,
          matchId,
          buyerId: match.buyerId,
          vendorId: match.vendorId,
          propertyId: match.propertyId,
          preferredTimes: preference.preferredTimes,
          flexibility: preference.flexibility,
          additionalNotes: preference.additionalNotes,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Update match with viewing preference
        const updatedMatches = [...matches];
        updatedMatches[matchIndex] = {
          ...match,
          viewingPreference: newPreference,
        };

        set({
          matches: updatedMatches,
          viewingPreferences: [...viewingPreferences, newPreference],
        });

        // Send automated message to vendor
        get().sendMessage(
          matchId,
          `I'd like to schedule a viewing! ${
            preference.flexibility === 'ASAP'
              ? "I'm available as soon as possible."
              : preference.flexibility === 'Flexible'
                ? `I'm flexible with times. ${preference.preferredTimes.map((slot) => `${slot.dayType} ${slot.timeOfDay.toLowerCase()}s`).join(', ')} work best for me.`
                : 'I have specific times in mind.'
          }${preference.additionalNotes ? ` ${preference.additionalNotes}` : ''}`
        );
      },

      // Confirm a viewing with specific date/time
      confirmViewing: (matchId, dateTime) => {
        const { matches } = get();
        const matchIndex = matches.findIndex((m) => m.id === matchId);
        if (matchIndex === -1) return;

        const updatedMatches = [...matches];
        updatedMatches[matchIndex] = {
          ...updatedMatches[matchIndex],
          hasViewingScheduled: true,
          confirmedViewingDate: dateTime,
        };

        set({ matches: updatedMatches });
      },

      // Get upcoming confirmed viewings
      getUpcomingViewings: () => {
        const { matches } = get();
        return matches.filter(
          (m) => m.hasViewingScheduled && m.confirmedViewingDate && new Date(m.confirmedViewingDate) > new Date()
        );
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

      // Link property to vendor with ownership validation
      linkPropertyToVendor: (propertyId, vendorId) => {
        const { allProperties, availableProperties } = get();

        // Find the property to validate
        const property = allProperties.find((p) => p.id === propertyId);

        if (!property) {
          console.error(`[Linking] Property ${propertyId} not found`);
          throw new Error(`Property ${propertyId} not found`);
        }

        // CRITICAL: Validate property ownership before linking
        if (property.vendorId && property.vendorId.trim() !== '') {
          // Property is already linked to another vendor
          if (property.vendorId !== vendorId) {
            console.error(
              `[Linking] Property ${propertyId} is already linked to vendor ${property.vendorId}. Cannot link to ${vendorId}`
            );
            throw new Error(
              `Property is already linked to another vendor. Please contact support if you believe this is an error.`
            );
          } else {
            // Same vendor trying to link again - this is OK (idempotent)
            console.log(
              `[Linking] Property ${propertyId} is already linked to vendor ${vendorId}`
            );
            return;
          }
        }

        // Property is available - proceed with linking
        console.log(
          `[Linking] Linking property ${propertyId} to vendor ${vendorId}`
        );

        // Update vendorId in both property lists
        const updateVendorId = (properties: Property[]) =>
          properties.map((p) =>
            p.id === propertyId ? { ...p, vendorId } : p
          );

        set({
          allProperties: updateVendorId(allProperties),
          availableProperties: updateVendorId(availableProperties),
        });

        // CRITICAL: Also update existing matches for this property
        // This ensures vendors can see historical buyer interest
        get().updateMatchesVendorId(propertyId, vendorId);
      },

      // Update vendorId for all existing matches of a property
      // Called when vendor links property to ensure historical matches become visible
      updateMatchesVendorId: (propertyId, vendorId) => {
        const { matches } = get();

        const updatedMatches = matches.map((match) => {
          if (match.propertyId === propertyId) {
            console.log(
              `[Matching] Updating match ${match.id} vendorId from '${match.vendorId}' to '${vendorId}'`
            );
            return {
              ...match,
              vendorId,
              // Also update the vendorId in nested property object for consistency
              property: {
                ...match.property,
                vendorId,
              },
              // Update senderId in messages if it was the old vendorId
              messages: match.messages.map((msg) =>
                msg.senderType === 'vendor'
                  ? { ...msg, senderId: vendorId }
                  : msg
              ),
            };
          }
          return match;
        });

        set({ matches: updatedMatches });
      },

      // ========================================
      // PROPERTY CRUD OPERATIONS
      // ========================================

      /**
       * Load all properties from storage
       * Uses Supabase if configured, falls back to localStorage
       */
      loadProperties: async () => {
        try {
          const properties = await getAllProperties();
          console.log(`[Storage] Loaded ${properties.length} properties from storage`);

          // If storage is empty, initialize with mock properties
          if (properties.length === 0) {
            console.log('[Storage] No properties found, initializing with mock properties');
            set({
              allProperties: mockProperties,
              availableProperties: mockProperties,
            });

            // Save mock properties to storage for future use
            for (const property of mockProperties) {
              await saveProperty(property);
            }
          } else {
            set({
              allProperties: properties,
              availableProperties: properties,
            });
          }
        } catch (error) {
          console.error('[Storage] Failed to load properties:', error);
          // Fall back to mock properties on error
          set({
            allProperties: mockProperties,
            availableProperties: mockProperties,
          });
        }
      },

      /**
       * Create a new property listing
       * Automatically links the property to the specified vendor
       * @returns Property ID of the newly created property
       */
      createProperty: async (propertyData, vendorId) => {
        const { allProperties, availableProperties } = get();

        // Generate unique property ID
        const newPropertyId = `property-${Date.now()}`;

        // Create complete property object
        const newProperty: Property = {
          id: newPropertyId,
          ...propertyData,
          vendorId, // Automatically link to vendor
        };

        console.log(`[CRUD] Creating new property ${newPropertyId} for vendor ${vendorId}`);

        // Save to storage (Supabase if configured, localStorage otherwise)
        await saveProperty(newProperty);

        // Add to both property lists
        set({
          allProperties: [newProperty, ...allProperties],
          availableProperties: [newProperty, ...availableProperties],
        });

        return newPropertyId;
      },

      /**
       * Update an existing property
       * Validates ownership before allowing updates
       */
      updateProperty: async (propertyId, updates) => {
        const { allProperties, availableProperties } = get();

        // Find the property to validate it exists
        const property = allProperties.find((p) => p.id === propertyId);

        if (!property) {
          console.error(`[CRUD] Property ${propertyId} not found for update`);
          throw new Error(`Property ${propertyId} not found`);
        }

        // IMPORTANT: Don't allow changing vendorId through update
        // Use linkPropertyToVendor or unlinkProperty instead
        if (updates.vendorId !== undefined) {
          console.warn(
            `[CRUD] Cannot change vendorId through updateProperty. Use linkPropertyToVendor instead.`
          );
          delete updates.vendorId;
        }

        console.log(`[CRUD] Updating property ${propertyId}`, updates);

        // Create updated property object
        const updatedProperty = { ...property, ...updates };

        // Save to storage (Supabase if configured, localStorage otherwise)
        await saveProperty(updatedProperty);

        // Update in both property lists
        const updatePropertyInList = (properties: Property[]) =>
          properties.map((p) =>
            p.id === propertyId ? updatedProperty : p
          );

        set({
          allProperties: updatePropertyInList(allProperties),
          availableProperties: updatePropertyInList(availableProperties),
        });

        // CRITICAL: Also update property in existing matches
        // So buyers see updated property information
        const { matches } = get();
        const updatedMatches = matches.map((match) => {
          if (match.propertyId === propertyId) {
            return {
              ...match,
              property: {
                ...match.property,
                ...updates,
              },
            };
          }
          return match;
        });
        set({ matches: updatedMatches });
      },

      /**
       * Delete a property from the system
       * This is a hard delete - the property is permanently removed
       * Use unlinkProperty if you just want to remove vendor association
       */
      deleteProperty: async (propertyId) => {
        const { allProperties, availableProperties, matches } = get();

        console.log(`[CRUD] Deleting property ${propertyId}`);

        // Delete from storage (Supabase if configured, localStorage otherwise)
        await deletePropertyFromStorage(propertyId);

        // Remove from property lists
        set({
          allProperties: allProperties.filter((p) => p.id !== propertyId),
          availableProperties: availableProperties.filter((p) => p.id !== propertyId),
        });

        // CRITICAL: Also remove all matches associated with this property
        // This prevents orphaned matches from appearing in dashboards
        const updatedMatches = matches.filter((m) => m.propertyId !== propertyId);
        set({ matches: updatedMatches });

        console.log(
          `[CRUD] Property ${propertyId} deleted. Removed ${matches.length - updatedMatches.length} associated matches.`
        );
      },

      /**
       * Unlink a property from a vendor
       * Sets vendorId to empty string, making property available for other vendors
       * Does NOT delete the property
       */
      unlinkProperty: (propertyId, vendorId) => {
        const { allProperties, availableProperties } = get();

        // Find the property to validate ownership
        const property = allProperties.find((p) => p.id === propertyId);

        if (!property) {
          console.error(`[CRUD] Property ${propertyId} not found for unlinking`);
          throw new Error(`Property ${propertyId} not found`);
        }

        // Validate that the vendor actually owns this property
        if (property.vendorId !== vendorId) {
          console.error(
            `[CRUD] Cannot unlink property ${propertyId}. It belongs to vendor ${property.vendorId}, not ${vendorId}`
          );
          throw new Error(
            `You can only unlink properties that belong to you.`
          );
        }

        console.log(`[CRUD] Unlinking property ${propertyId} from vendor ${vendorId}`);

        // Set vendorId to empty string
        const unlinkInList = (properties: Property[]) =>
          properties.map((p) =>
            p.id === propertyId ? { ...p, vendorId: '' } : p
          );

        set({
          allProperties: unlinkInList(allProperties),
          availableProperties: unlinkInList(availableProperties),
        });

        // IMPORTANT: Do NOT delete matches when unlinking
        // The matches are historical data that buyers may still want to see
        // Just log for awareness
        const { matches } = get();
        const affectedMatches = matches.filter((m) => m.propertyId === propertyId);
        console.log(
          `[CRUD] Property unlinked. ${affectedMatches.length} existing matches will remain visible to buyers.`
        );
      },

      // Reset entire app to initial state
      // NOTE: This intentionally resets properties to mock data (empty vendorIds)
      // All vendor-property links will be lost. This is expected for a full reset.
      // In production, this should prompt "Are you sure?" confirmation
      resetApp: () => {
        console.warn('[Reset] Resetting app to initial state. All data will be lost.');
        set({
          user: null,
          allProperties: mockProperties, // Resets to empty vendorIds
          availableProperties: mockProperties,
          currentPropertyIndex: 0,
          likedProperties: [],
          passedProperties: [],
          matches: [],
          viewingPreferences: [],
          isOnboarded: false,
        });
      },
    }),
    {
      name: STORAGE_KEYS.USER,
      partialize: (state) => ({
        user: state.user,
        allProperties: state.allProperties,
        availableProperties: state.availableProperties,
        likedProperties: state.likedProperties,
        passedProperties: state.passedProperties,
        matches: state.matches,
        viewingPreferences: state.viewingPreferences,
        isOnboarded: state.isOnboarded,
        currentPropertyIndex: state.currentPropertyIndex,
      }),
    }
  )
);
