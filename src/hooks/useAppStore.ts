import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Property,
  User,
  Match,
  Message,
  UserPreferences,
  ViewingPreference,
  ViewingTimeSlot,
  Rating,
  AgencyLinkInvitation,
  AgencyPropertyLink,
  InvitationType,
  Interest,
  RenterCard,
  RenterProfile,
} from '../types';
import { calculateCompatibility } from '../utils/matchScoring';
import { mockProperties } from '../data/mockProperties';
import {
  STORAGE_KEYS,
  MATCH_PROBABILITY,
  LANDLORD_MESSAGE_TEMPLATES,
  DEFAULT_RENTAL_PREFERENCES,
} from '../utils/constants';
import { filterProperties } from '../utils/filters';
import { validateMessage, getValidationErrorMessage } from '../utils/messageValidation';
import {
  getAllProperties,
  saveProperty,
  deleteProperty as deletePropertyFromStorage,
  saveRating,
  getRatingsForUser,
  // Agency linking functions
  createAgencyInvitation,
  getAgencyInvitationsForLandlord,
  getAgencyInvitationsForAgency,
  updateAgencyInvitation,
  deleteAgencyInvitation,
  createAgencyPropertyLink,
  getAgencyLinksForLandlord,
  getAgencyLinksForAgency,
  getAgencyLinksForProperty,
  terminateAgencyPropertyLink,
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

  // Two-Sided Matching (Phase 3)
  interests: Interest[];

  // UI State
  isOnboarded: boolean;

  // Actions
  initializeUser: (name: string, email: string) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;

  // Swipe actions
  likeProperty: (propertyId: string) => void;
  dislikeProperty: (propertyId: string) => void;

  // Matching (rental platform: renter ↔ landlord)
  checkForMatch: (propertyId: string, renterProfile?: {
    situation?: string;
    ages?: string;
    localArea?: string;
    renterType?: string;
    employmentStatus?: string;
  }) => boolean;

  // Rating System (NEW)
  submitRating: (rating: Omit<Rating, 'id' | 'createdAt'>) => Promise<void>;
  getUserRatings: (userId: string, userType: 'landlord' | 'renter') => Promise<Rating[]>;

  // Messages
  sendMessage: (matchId: string, content: string) => void;
  markMessagesAsRead: (matchId: string) => void;

  // Viewing preferences
  setViewingPreference: (matchId: string, preference: {
    flexibility: 'Flexible' | 'Specific' | 'ASAP';
    preferredTimes: ViewingTimeSlot[];
    additionalNotes?: string;
  }) => Promise<void>;
  confirmViewing: (matchId: string, dateTime: Date) => Promise<void>;
  getUpcomingViewings: () => Match[];

  // Property deck management
  loadNextProperties: () => void;
  resetDeck: () => void;

  // Landlord actions (formerly Vendor)
  linkPropertyToLandlord: (propertyId: string, landlordId: string) => void;
  updateMatchesLandlordId: (propertyId: string, landlordId: string) => void;

  // Legacy aliases (DEPRECATED)
  linkPropertyToVendor: (propertyId: string, vendorId: string) => void;
  updateMatchesVendorId: (propertyId: string, vendorId: string) => void;

  // Property CRUD operations
  loadProperties: () => Promise<void>;
  createProperty: (propertyData: Omit<Property, 'id'>, landlordId: string) => Promise<string>;
  updateProperty: (propertyId: string, updates: Partial<Property>) => Promise<void>;
  deleteProperty: (propertyId: string) => Promise<void>;
  unlinkProperty: (propertyId: string, landlordId: string) => void;

  // Agency Linking System
  inviteAgency: (
    landlordId: string,
    agencyId: string,
    invitationType: InvitationType,
    propertyId?: string,
    proposedCommissionRate?: number,
    proposedContractLengthMonths?: number,
    message?: string
  ) => Promise<AgencyLinkInvitation>;
  acceptAgencyInvitation: (invitationId: string, responseMessage?: string) => Promise<void>;
  declineAgencyInvitation: (invitationId: string, responseMessage?: string) => Promise<void>;
  cancelAgencyInvitation: (invitationId: string) => Promise<void>;
  getLandlordInvitations: (landlordId: string) => Promise<AgencyLinkInvitation[]>;
  getAgencyInvitations: (agencyId: string) => Promise<AgencyLinkInvitation[]>;
  getLandlordLinks: (landlordId: string) => Promise<AgencyPropertyLink[]>;
  getAgencyLinks: (agencyId: string) => Promise<AgencyPropertyLink[]>;
  getPropertyLinks: (propertyId: string) => Promise<AgencyPropertyLink[]>;
  terminateAgencyLink: (linkId: string, reason: string) => Promise<void>;

  // Stats
  getStats: () => {
    propertiesViewed: number;
    propertiesLiked: number;
    propertiesPassed: number;
    matchesCount: number;
  };

  // RRA 2025: Compliance Actions
  requestPet: (matchId: string, petDetails: string) => void;
  reviewPetRequest: (matchId: string, status: 'approved' | 'refused', refusalReason?: string) => void;
  verifyRightToRent: (matchId: string) => void;

  // Two-Sided Matching (Phase 3)
  createInterest: (propertyId: string, renterId: string, renterProfile: RenterProfile) => Promise<Interest | null>;
  getInterestedRenters: (landlordId: string, propertyId?: string) => Promise<RenterCard[]>;
  confirmMatch: (interestId: string) => Promise<Match | null>;
  declineInterest: (interestId: string) => Promise<void>;
  getPendingInterestsCount: (landlordId: string) => number;

  // Tenancy Lifecycle Management
  updateApplicationStatus: (matchId: string, status: Match['applicationStatus']) => Promise<void>;
  activateTenancy: (matchId: string, startDate?: Date) => Promise<void>;
  giveNotice: (matchId: string, givenBy: 'tenant' | 'landlord') => Promise<void>;
  endTenancy: (matchId: string) => Promise<void>;

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
      allProperties: [],
      availableProperties: [],
      currentPropertyIndex: 0,
      likedProperties: [],
      passedProperties: [],
      matches: [],
      viewingPreferences: [],
      interests: [],
      isOnboarded: false,

      // Initialize user (defaults to renter type for rental platform)
      initializeUser: (name, email) => {
        const newUser: User = {
          id: `user-${Date.now()}`,
          name,
          email,
          type: 'renter', // Changed from 'buyer' to 'renter'
          preferences: DEFAULT_RENTAL_PREFERENCES,
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

        // Get full renter profile for two-sided matching
        let renterProfile: RenterProfile | undefined = undefined;
        try {
          const authData = localStorage.getItem('get-on-auth');
          if (authData) {
            const parsed = JSON.parse(authData);
            const currentUser = parsed.state?.currentUser;
            if (currentUser && 'situation' in currentUser) {
              renterProfile = currentUser as RenterProfile;
            }
          }
        } catch {
          console.warn('[Like] Could not retrieve renter profile from auth store');
        }

        // Two-sided matching: Create interest instead of random match
        // The landlord will review and approve/decline this interest
        if (renterProfile && user) {
          get().createInterest(propertyId, user.id, renterProfile);
        } else {
          // Fallback to random match for demo/anonymous users
          get().checkForMatch(propertyId);
        }
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

      // Check for match (rental platform: renter ↔ landlord)
      checkForMatch: (propertyId) => {
        const { allProperties, matches, user } = get();
        if (!user) return false;

        const property = allProperties.find((p) => p.id === propertyId);
        if (!property) return false;

        // CRITICAL: Only create matches for properties with linked landlords
        // Empty landlordId means no landlord has claimed this property yet
        if (!property.landlordId || property.landlordId.trim() === '') {
          console.warn(
            `[Matching] Property ${propertyId} has no landlord linked. Match cannot be created.`
          );
          return false;
        }

        // DEMO LIMITATION: Using random matching for demonstration purposes
        // PRODUCTION TODO: Implement two-sided matching system where:
        // 1. Renter likes property → creates "PendingInterest"
        // 2. Landlord reviews interested renters
        // 3. Landlord approves/rejects → creates Match if approved
        // 4. Both parties must show interest for a match
        const isMatch = Math.random() < MATCH_PROBABILITY;

        if (isMatch) {
          // Get landlord name from useAuthStore if available
          let landlordName = `Landlord for ${property.address.street}`;

          try {
            const authData = localStorage.getItem('get-on-auth');
            if (authData) {
              const parsed = JSON.parse(authData);
              if (parsed.state?.currentUser?.id === property.landlordId && parsed.state?.currentUser?.names) {
                landlordName = parsed.state.currentUser.names;
              }
            }
          } catch {
            console.warn('[Matching] Could not retrieve landlord name from auth store');
          }

          console.log(
            `[Matching] Creating rental match for renter ${user.id} and landlord ${property.landlordId} (${landlordName}) on property ${propertyId}`
          );

          const newMatchId = `match-${Date.now()}`;

          // Create rental match with full renter profile
          const newMatch: Match = {
            id: newMatchId,
            propertyId,
            property,
            landlordId: property.landlordId,
            landlordName,
            renterId: user.id,
            renterName: user.name,
            // Include renter profile if provided (optional)
            renterProfile: undefined, // Will be populated from full profile later
            timestamp: new Date().toISOString(),
            tenancyStatus: 'prospective', // New matches start as prospective
            activeIssueIds: [], // No issues at match creation
            totalIssuesRaised: 0,
            totalIssuesResolved: 0,
            messages: [
              {
                id: `msg-${Date.now()}`,
                matchId: newMatchId,
                senderId: property.landlordId,
                receiverId: user.id,
                senderType: 'landlord',
                content:
                  LANDLORD_MESSAGE_TEMPLATES[
                  Math.floor(Math.random() * LANDLORD_MESSAGE_TEMPLATES.length)
                  ],
                timestamp: new Date().toISOString(),
                isRead: false,
              },
            ],
            lastMessageAt: new Date().toISOString(),
            unreadCount: 1,
            hasViewingScheduled: false,
            // Rental-specific fields
            applicationStatus: 'pending',
            applicationSubmittedAt: undefined,
            tenancyStartDate: undefined,
            tenancyNoticedDate: undefined,
            isUnderEvictionProceedings: false,
            rentArrears: {
              totalOwed: 0,
              monthsMissed: 0,
              consecutiveMonthsMissed: 0,
            },
            canRate: false,
            hasLandlordRated: false,
            hasRenterRated: false,
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

      // Send message in a rental match
      sendMessage: (matchId, content) => {
        const { matches, user } = get();
        if (!user) return;

        const matchIndex = matches.findIndex((m) => m.id === matchId);
        if (matchIndex === -1) return;

        const senderType = user.type === 'renter' ? 'renter' : 'landlord';
        const currentMatch = matches[matchIndex];

        // RRA 2025: Validate message for rent bidding ban (landlords only)
        const validationResult = validateMessage(
          content,
          senderType,
          currentMatch.property.rentPcm
        );

        if (!validationResult.isValid) {
          const errorMsg = getValidationErrorMessage(validationResult);
          console.error('[RRA 2025 Violation] Message blocked:', errorMsg);
          // In a real app, this would show a toast/alert to the user
          alert(`MESSAGE BLOCKED\n\n${errorMsg}`);
          return; // Block the message from being sent
        }

        const newMessage: Message = {
          id: `msg-${Date.now()}`,
          matchId,
          senderId: user.id,
          receiverId: senderType === 'renter' ? currentMatch.landlordId : currentMatch.renterId,
          senderType,
          content,
          timestamp: new Date().toISOString(),
          isRead: true,
        };

        const updatedMatches = [...matches];
        updatedMatches[matchIndex] = {
          ...updatedMatches[matchIndex],
          messages: [...updatedMatches[matchIndex].messages, newMessage],
          lastMessageAt: new Date().toISOString(),
        };

        set({ matches: updatedMatches });

        // Simulate landlord/renter response after 3 seconds
        setTimeout(() => {
          const replyType = senderType === 'renter' ? 'landlord' : 'renter';
          const replySenderId = replyType === 'landlord'
            ? updatedMatches[matchIndex].landlordId
            : updatedMatches[matchIndex].renterId;

          const reply: Message = {
            id: `msg-${Date.now()}`,
            matchId,
            senderId: replySenderId,
            receiverId: user.id,
            senderType: replyType,
            content: "Thanks for your message! I'll get back to you shortly.",
            timestamp: new Date().toISOString(),
            isRead: false,
          };

          const currentMatches = get().matches;
          const currentMatchIndex = currentMatches.findIndex((m) => m.id === matchId);
          if (currentMatchIndex === -1) return;

          const finalMatches = [...currentMatches];
          finalMatches[currentMatchIndex] = {
            ...finalMatches[currentMatchIndex],
            messages: [...finalMatches[currentMatchIndex].messages, reply],
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
            isRead: true,
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
      setViewingPreference: async (matchId, preference) => {
        const { matches, viewingPreferences } = get();
        const matchIndex = matches.findIndex((m) => m.id === matchId);
        if (matchIndex === -1) return;

        const match = matches[matchIndex];
        const newPreference: ViewingPreference = {
          id: `viewing-${Date.now()}`,
          matchId,
          renterId: match.renterId,
          landlordId: match.landlordId,
          propertyId: match.propertyId,
          preferredTimes: preference.preferredTimes,
          flexibility: preference.flexibility,
          additionalNotes: preference.additionalNotes,
          requiresVirtualViewing: false, // Default value
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

        // Persist to Supabase
        try {
          const { supabase } = await import('../lib/supabase');
          if (supabase) {
            await supabase
              .from('matches')
              .update({
                viewing_preference: newPreference,
                application_status: 'viewing_requested',
              })
              .eq('id', matchId);
            console.log('[ViewingPreference] Persisted to Supabase');
          }
        } catch (error) {
          console.error('[ViewingPreference] Failed to persist:', error);
        }

        // Send automated message to vendor
        get().sendMessage(
          matchId,
          `I'd like to schedule a viewing! ${preference.flexibility === 'ASAP'
            ? "I'm available as soon as possible."
            : preference.flexibility === 'Flexible'
              ? `I'm flexible with times. ${preference.preferredTimes.map((slot) => `${slot.dayType} ${slot.timeOfDay.toLowerCase()}s`).join(', ')} work best for me.`
              : 'I have specific times in mind.'
          }${preference.additionalNotes ? ` ${preference.additionalNotes}` : ''}`
        );
      },

      // Confirm a viewing with specific date/time
      confirmViewing: async (matchId, dateTime) => {
        console.log('[ConfirmViewing] Starting for matchId:', matchId, 'dateTime:', dateTime);

        // Update local store if match exists there
        const { matches } = get();
        const matchIndex = matches.findIndex((m) => m.id === matchId);
        if (matchIndex !== -1) {
          const updatedMatches = [...matches];
          updatedMatches[matchIndex] = {
            ...updatedMatches[matchIndex],
            hasViewingScheduled: true,
            confirmedViewingDate: dateTime,
          };
          set({ matches: updatedMatches });
        }

        // Always persist to Supabase (even if not in local store)
        try {
          const { supabase } = await import('../lib/supabase');
          if (supabase) {
            const { data, error } = await supabase
              .from('matches')
              .update({
                has_viewing_scheduled: true,
                confirmed_viewing_date: dateTime.toISOString(),
              })
              .eq('id', matchId)
              .select();

            if (error) {
              console.error('[ConfirmViewing] Supabase error:', error);
              throw error;
            }
            console.log('[ConfirmViewing] Persisted to Supabase:', data);
          }
        } catch (error) {
          console.error('[ConfirmViewing] Failed to persist:', error);
          throw error;
        }
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

      // Link property to landlord with ownership validation
      linkPropertyToLandlord: (propertyId, landlordId) => {
        const { allProperties, availableProperties } = get();

        const property = allProperties.find((p) => p.id === propertyId);

        if (!property) {
          console.error(`[Linking] Property ${propertyId} not found`);
          throw new Error(`Property ${propertyId} not found`);
        }

        // CRITICAL: Validate property ownership before linking
        if (property.landlordId && property.landlordId.trim() !== '') {
          if (property.landlordId !== landlordId) {
            console.error(
              `[Linking] Property ${propertyId} is already linked to landlord ${property.landlordId}. Cannot link to ${landlordId}`
            );
            throw new Error(
              `Property is already linked to another landlord. Please contact support if you believe this is an error.`
            );
          } else {
            console.log(
              `[Linking] Property ${propertyId} is already linked to landlord ${landlordId}`
            );
            return;
          }
        }

        console.log(
          `[Linking] Linking property ${propertyId} to landlord ${landlordId}`
        );

        // Update landlordId in both property lists
        const updateLandlordId = (properties: Property[]) =>
          properties.map((p) =>
            p.id === propertyId ? { ...p, landlordId } : p
          );

        set({
          allProperties: updateLandlordId(allProperties),
          availableProperties: updateLandlordId(availableProperties),
        });

        // CRITICAL: Also update existing matches for this property
        get().updateMatchesLandlordId(propertyId, landlordId);
      },

      // Update landlordId for all existing matches of a property
      updateMatchesLandlordId: (propertyId, landlordId) => {
        const { matches } = get();

        const updatedMatches = matches.map((match) => {
          if (match.propertyId === propertyId) {
            console.log(
              `[Matching] Updating match ${match.id} landlordId from '${match.landlordId}' to '${landlordId}'`
            );
            return {
              ...match,
              landlordId,
              property: {
                ...match.property,
                landlordId,
              },
              messages: match.messages.map((msg) =>
                msg.senderType === 'landlord'
                  ? { ...msg, senderId: landlordId }
                  : msg
              ),
            };
          }
          return match;
        });

        set({ matches: updatedMatches });
      },

      // Legacy aliases (DEPRECATED)
      linkPropertyToVendor: (propertyId, vendorId) => {
        console.warn('[DEPRECATED] Use linkPropertyToLandlord instead of linkPropertyToVendor');
        get().linkPropertyToLandlord(propertyId, vendorId);
      },

      updateMatchesVendorId: (propertyId, vendorId) => {
        console.warn('[DEPRECATED] Use updateMatchesLandlordId instead of updateMatchesVendorId');
        get().updateMatchesLandlordId(propertyId, vendorId);
      },

      // ========================================
      // RATING SYSTEM (NEW)
      // ========================================

      /**
       * Submit a rating for a landlord or renter after tenancy
       */
      submitRating: async (rating) => {
        const ratingWithId: Rating = {
          ...rating,
          id: `rating-${Date.now()}`,
          createdAt: new Date(),
          isHidden: false,
        };

        await saveRating(ratingWithId);

        // Update match to reflect rating submitted
        const { matches } = get();
        const matchIndex = matches.findIndex((m) => m.id === rating.matchId);
        if (matchIndex !== -1) {
          const updatedMatches = [...matches];
          if (rating.fromUserType === 'landlord') {
            updatedMatches[matchIndex].hasLandlordRated = true;
            updatedMatches[matchIndex].landlordRatingId = ratingWithId.id;
          } else {
            updatedMatches[matchIndex].hasRenterRated = true;
            updatedMatches[matchIndex].renterRatingId = ratingWithId.id;
          }
          set({ matches: updatedMatches });
        }
      },

      /**
       * Get all ratings for a user
       */
      getUserRatings: async (userId, userType) => {
        return await getRatingsForUser(userId, userType);
      },

      // ========================================
      // PROPERTY CRUD OPERATIONS
      // ========================================

      /**
       * Load all properties from storage
       * Uses Supabase if configured, falls back to localStorage
       */
      loadProperties: async () => {
        console.log('[AppStore] loadProperties called');
        try {
          const properties = await getAllProperties();
          console.log(`[AppStore] Loaded ${properties.length} properties from storage`);

          if (properties.length > 0) {
            console.log('[AppStore] Property sample:', {
              id: properties[0].id,
              street: properties[0].address?.street,
              city: properties[0].address?.city,
            });
          }

          // Load properties from storage (Supabase or localStorage)
          set({
            allProperties: properties,
            availableProperties: properties,
          });

          if (properties.length === 0) {
            console.log('[AppStore] No properties found in storage');
          } else {
            console.log('[AppStore] Properties successfully set in state');
          }
        } catch (error) {
          console.error('[AppStore] Failed to load properties:', error);
          // Don't load mock properties - just leave empty
          set({
            allProperties: [],
            availableProperties: [],
          });
        }
      },

      /**
       * Create a new rental property listing
       * Automatically links the property to the specified landlord
       * @returns Property ID of the newly created property
       */
      createProperty: async (propertyData, landlordId) => {
        const { allProperties, availableProperties } = get();

        // Generate temporary property ID (will be replaced by Supabase UUID)
        const tempPropertyId = `property-${Date.now()}`;

        // Create complete property object
        const newProperty: Property = {
          id: tempPropertyId,
          ...propertyData,
          landlordId, // Automatically link to landlord
        };

        console.log(`[CRUD] Creating new rental property ${tempPropertyId} for landlord ${landlordId}`);

        // Save to storage (Supabase if configured, localStorage otherwise)
        // CRITICAL: Capture the returned property with the Supabase-generated UUID
        const savedProperty = await saveProperty(newProperty);
        console.log(`[CRUD] Property saved with UUID: ${savedProperty.id}`);

        // Add to both property lists (use savedProperty with correct UUID)
        set({
          allProperties: [savedProperty, ...allProperties],
          availableProperties: [savedProperty, ...availableProperties],
        });

        // Return the Supabase-generated UUID, not the temporary ID
        return savedProperty.id;
      },

      /**
       * Update an existing rental property
       * Validates ownership before allowing updates
       */
      updateProperty: async (propertyId, updates) => {
        const { allProperties, availableProperties } = get();

        const property = allProperties.find((p) => p.id === propertyId);

        if (!property) {
          console.error(`[CRUD] Property ${propertyId} not found for update`);
          throw new Error(`Property ${propertyId} not found`);
        }

        // IMPORTANT: Don't allow changing landlordId through update
        // Use linkPropertyToLandlord or unlinkProperty instead
        if (updates.landlordId !== undefined) {
          console.warn(
            `[CRUD] Cannot change landlordId through updateProperty. Use linkPropertyToLandlord instead.`
          );
          delete updates.landlordId;
        }

        console.log(`[CRUD] Updating rental property ${propertyId}`, updates);

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
        // So renters see updated property information
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
       * Unlink a property from a landlord
       * Sets landlordId to empty string, making property available for other landlords
       * Does NOT delete the property
       */
      unlinkProperty: (propertyId, landlordId) => {
        const { allProperties, availableProperties } = get();

        const property = allProperties.find((p) => p.id === propertyId);

        if (!property) {
          console.error(`[CRUD] Property ${propertyId} not found for unlinking`);
          throw new Error(`Property ${propertyId} not found`);
        }

        // Validate that the landlord actually owns this property
        if (property.landlordId !== landlordId) {
          console.error(
            `[CRUD] Cannot unlink property ${propertyId}. It belongs to landlord ${property.landlordId}, not ${landlordId}`
          );
          throw new Error(
            `You can only unlink properties that belong to you.`
          );
        }

        console.log(`[CRUD] Unlinking property ${propertyId} from landlord ${landlordId}`);

        // Set landlordId to empty string
        const unlinkInList = (properties: Property[]) =>
          properties.map((p) =>
            p.id === propertyId ? { ...p, landlordId: '' } : p
          );

        set({
          allProperties: unlinkInList(allProperties),
          availableProperties: unlinkInList(availableProperties),
        });

        // IMPORTANT: Do NOT delete matches when unlinking
        // The matches are historical data that renters may still want to see
        const { matches } = get();
        const affectedMatches = matches.filter((m) => m.propertyId === propertyId);
        console.log(
          `[CRUD] Property unlinked. ${affectedMatches.length} existing matches will remain visible to renters.`
        );
      },

      // =====================================================
      // AGENCY LINKING SYSTEM
      // =====================================================

      /**
       * Create an invitation for an agency to manage properties
       * Used by landlords to invite estate agents or management agencies
       */
      inviteAgency: async (
        landlordId,
        agencyId,
        invitationType,
        propertyId,
        proposedCommissionRate,
        proposedContractLengthMonths,
        message
      ) => {
        console.log('[AgencyLink] Creating agency invitation:', {
          landlordId,
          agencyId,
          invitationType,
          propertyId,
        });

        const invitation = await createAgencyInvitation({
          landlordId,
          agencyId,
          propertyId,
          invitationType,
          initiatedBy: 'landlord',
          status: 'pending',
          proposedCommissionRate,
          proposedContractLengthMonths,
          message,
        });

        console.log('[AgencyLink] Agency invitation created successfully:', invitation.id);
        return invitation;
      },

      /**
       * Accept an agency invitation and create the property link
       */
      acceptAgencyInvitation: async (invitationId, responseMessage) => {
        console.log('[AgencyLink] Accepting invitation:', invitationId);

        // Update invitation status
        const invitation = await updateAgencyInvitation(invitationId, {
          status: 'accepted',
          responseMessage,
          respondedAt: new Date(),
        });

        // Create the agency property link
        await createAgencyPropertyLink({
          landlordId: invitation.landlordId,
          agencyId: invitation.agencyId,
          propertyId: invitation.propertyId || '', // Handle "all properties" case
          linkType: invitation.invitationType,
          commissionRate: invitation.proposedCommissionRate || 10,
          contractStartDate: new Date(),
          contractEndDate: invitation.proposedContractLengthMonths
            ? new Date(Date.now() + invitation.proposedContractLengthMonths * 30 * 24 * 60 * 60 * 1000)
            : undefined,
          isActive: true,
        });

        console.log('[AgencyLink] Invitation accepted and link created');
      },

      /**
       * Decline an agency invitation
       */
      declineAgencyInvitation: async (invitationId, responseMessage) => {
        console.log('[AgencyLink] Declining invitation:', invitationId);

        await updateAgencyInvitation(invitationId, {
          status: 'declined',
          responseMessage,
          respondedAt: new Date(),
        });

        console.log('[AgencyLink] Invitation declined');
      },

      /**
       * Cancel an agency invitation (by the initiator)
       */
      cancelAgencyInvitation: async (invitationId) => {
        console.log('[AgencyLink] Cancelling invitation:', invitationId);
        await deleteAgencyInvitation(invitationId);
        console.log('[AgencyLink] Invitation cancelled');
      },

      /**
       * Get all invitations for a landlord
       */
      getLandlordInvitations: async (landlordId) => {
        console.log('[AgencyLink] Fetching invitations for landlord:', landlordId);
        const invitations = await getAgencyInvitationsForLandlord(landlordId);
        console.log('[AgencyLink] Found', invitations.length, 'invitations');
        return invitations;
      },

      /**
       * Get all invitations for an agency
       */
      getAgencyInvitations: async (agencyId) => {
        console.log('[AgencyLink] Fetching invitations for agency:', agencyId);
        const invitations = await getAgencyInvitationsForAgency(agencyId);
        console.log('[AgencyLink] Found', invitations.length, 'invitations');
        return invitations;
      },

      /**
       * Get all active links for a landlord
       */
      getLandlordLinks: async (landlordId) => {
        console.log('[AgencyLink] Fetching links for landlord:', landlordId);
        const links = await getAgencyLinksForLandlord(landlordId);
        console.log('[AgencyLink] Found', links.length, 'links');
        return links;
      },

      /**
       * Get all active links for an agency
       */
      getAgencyLinks: async (agencyId) => {
        console.log('[AgencyLink] Fetching links for agency:', agencyId);
        const links = await getAgencyLinksForAgency(agencyId);
        console.log('[AgencyLink] Found', links.length, 'links');
        return links;
      },

      /**
       * Get all active links for a specific property
       */
      getPropertyLinks: async (propertyId) => {
        console.log('[AgencyLink] Fetching links for property:', propertyId);
        const links = await getAgencyLinksForProperty(propertyId);
        console.log('[AgencyLink] Found', links.length, 'links');
        return links;
      },

      /**
       * Terminate an agency property link
       */
      terminateAgencyLink: async (linkId, reason) => {
        console.log('[AgencyLink] Terminating link:', linkId, 'Reason:', reason);
        await terminateAgencyPropertyLink(linkId, reason);
        console.log('[AgencyLink] Link terminated');
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
          interests: [],
          isOnboarded: false,
        });
      },

      // ========================================
      // RRA 2025: COMPLIANCE ACTIONS
      // ========================================

      requestPet: (matchId, petDetails) => {
        const { matches } = get();
        const matchIndex = matches.findIndex((m) => m.id === matchId);
        if (matchIndex === -1) return;

        const updatedMatches = [...matches];
        updatedMatches[matchIndex] = {
          ...updatedMatches[matchIndex],
          petRequestStatus: 'requested',
        };

        set({ matches: updatedMatches });

        // Send automated message
        get().sendMessage(
          matchId,
          `I would like to request permission to keep a pet. Details: ${petDetails}`
        );
      },

      reviewPetRequest: (matchId, status, refusalReason) => {
        const { matches } = get();
        const matchIndex = matches.findIndex((m) => m.id === matchId);
        if (matchIndex === -1) return;

        const updatedMatches = [...matches];
        updatedMatches[matchIndex] = {
          ...updatedMatches[matchIndex],
          petRequestStatus: status,
          petRefusalReason: refusalReason,
        };

        set({ matches: updatedMatches });

        // Send automated message
        const message = status === 'approved'
          ? 'Good news! Your pet request has been approved.'
          : `Regarding your pet request: It has been refused. Reason: ${refusalReason}`;

        get().sendMessage(matchId, message);
      },

      verifyRightToRent: (matchId) => {
        const { matches } = get();
        const matchIndex = matches.findIndex((m) => m.id === matchId);
        if (matchIndex === -1) return;

        const updatedMatches = [...matches];
        updatedMatches[matchIndex] = {
          ...updatedMatches[matchIndex],
          rightToRentVerifiedAt: new Date(),
        };

        set({ matches: updatedMatches });
      },

      // ========================================
      // TENANCY LIFECYCLE MANAGEMENT
      // ========================================

      /**
       * Update the application status of a match
       * Flow: pending → viewing_requested → viewing_completed → application_submitted
       *       → referencing → offer_made → offer_accepted → tenancy_signed
       */
      updateApplicationStatus: async (matchId, status) => {
        // Persist to Supabase first (source of truth)
        try {
          const { supabase } = await import('../lib/supabase');
          if (supabase) {
            const { error } = await supabase
              .from('matches')
              .update({
                application_status: status,
                ...(status === 'application_submitted' && { application_submitted_at: new Date().toISOString() }),
              })
              .eq('id', matchId);

            if (error) {
              console.error('[TenancyLifecycle] Failed to update application status:', error);
              return;
            }
            console.log('[TenancyLifecycle] Updated application status in Supabase:', matchId, status);
          }
        } catch (error) {
          console.error('[TenancyLifecycle] Failed to persist application status:', error);
          return;
        }

        // Also update local store if match exists there
        const { matches } = get();
        const matchIndex = matches.findIndex((m) => m.id === matchId);
        if (matchIndex !== -1) {
          const updatedMatches = [...matches];
          updatedMatches[matchIndex] = {
            ...updatedMatches[matchIndex],
            applicationStatus: status,
            ...(status === 'application_submitted' && { applicationSubmittedAt: new Date() }),
          };
          set({ matches: updatedMatches });
        }
      },

      /**
       * Activate a tenancy - transitions from prospective to active
       * This is called when tenant signs the tenancy agreement
       */
      activateTenancy: async (matchId, startDate = new Date()) => {
        // Persist to Supabase first (source of truth)
        try {
          const { supabase } = await import('../lib/supabase');
          if (supabase) {
            // First fetch the match data from Supabase to get renter/property info
            const { data: matchData, error: fetchError } = await supabase
              .from('matches')
              .select('*, property:properties(*)')
              .eq('id', matchId)
              .single();

            if (fetchError || !matchData) {
              console.error('[TenancyLifecycle] Failed to fetch match:', fetchError);
              return;
            }

            // Update the match status
            const { error: updateError } = await supabase
              .from('matches')
              .update({
                application_status: 'tenancy_signed',
                tenancy_status: 'active',
                tenancy_start_date: startDate.toISOString(),
              })
              .eq('id', matchId);

            if (updateError) {
              console.error('[TenancyLifecycle] Failed to update match:', updateError);
              return;
            }

            // Also update renter profile to reflect current tenancy
            await supabase
              .from('renter_profiles')
              .update({
                renter_status: 'current',
                current_property_id: matchData.property_id,
                current_landlord_id: matchData.landlord_id,
                tenancy_start_date: startDate.toISOString(),
                current_rent: matchData.property?.rent_pcm,
              })
              .eq('id', matchData.renter_id);

            console.log('[TenancyLifecycle] Tenancy activated in Supabase:', matchId);
          }
        } catch (error) {
          console.error('[TenancyLifecycle] Failed to persist tenancy activation:', error);
          return;
        }

        // Update local store if match exists there
        const { matches } = get();
        const matchIndex = matches.findIndex((m) => m.id === matchId);
        if (matchIndex !== -1) {
          const match = matches[matchIndex];
          const updatedMatches = [...matches];
          updatedMatches[matchIndex] = {
            ...match,
            applicationStatus: 'tenancy_signed',
            tenancyStatus: 'active',
            tenancyStartDate: startDate,
          };
          set({ matches: updatedMatches });

          // Send welcome message
          get().sendMessage(matchId, `Welcome to your new home! Your tenancy officially starts on ${startDate.toLocaleDateString('en-GB')}.`);
        }
      },

      /**
       * Give notice - RRA 2025 requires 2 months notice from either party
       */
      giveNotice: async (matchId, givenBy) => {
        const { matches } = get();
        const matchIndex = matches.findIndex((m) => m.id === matchId);
        if (matchIndex === -1) {
          console.error('[TenancyLifecycle] Match not found:', matchId);
          return;
        }

        const noticedDate = new Date();
        const expectedMoveOutDate = new Date(noticedDate);
        expectedMoveOutDate.setDate(expectedMoveOutDate.getDate() + 56); // 8 weeks / 2 months

        const updatedMatches = [...matches];
        updatedMatches[matchIndex] = {
          ...updatedMatches[matchIndex],
          tenancyStatus: 'notice_given',
          tenancyNoticedDate: noticedDate,
          expectedMoveOutDate: expectedMoveOutDate,
          tenancyEndReason: givenBy === 'tenant' ? 'tenant_notice' : undefined,
        };

        set({ matches: updatedMatches });

        const message = givenBy === 'tenant'
          ? `Notice has been given by tenant. Expected move-out date: ${expectedMoveOutDate.toLocaleDateString('en-GB')}`
          : `Notice has been given by landlord. Expected move-out date: ${expectedMoveOutDate.toLocaleDateString('en-GB')}`;
        get().sendMessage(matchId, message);

        // Persist to Supabase if configured
        try {
          const { supabase } = await import('../lib/supabase');
          if (supabase) {
            await supabase
              .from('matches')
              .update({
                tenancy_status: 'notice_given',
                tenancy_noticed_date: noticedDate.toISOString(),
                expected_move_out_date: expectedMoveOutDate.toISOString(),
                tenancy_end_reason: givenBy === 'tenant' ? 'tenant_notice' : null,
              })
              .eq('id', matchId);
          }
        } catch (error) {
          console.error('[TenancyLifecycle] Failed to persist notice:', error);
        }
      },

      /**
       * End a tenancy - marks it as complete
       */
      endTenancy: async (matchId) => {
        const { matches } = get();
        const matchIndex = matches.findIndex((m) => m.id === matchId);
        if (matchIndex === -1) {
          console.error('[TenancyLifecycle] Match not found:', matchId);
          return;
        }

        const match = matches[matchIndex];
        const updatedMatches = [...matches];
        updatedMatches[matchIndex] = {
          ...match,
          tenancyStatus: 'ended',
          tenancyCompletedAt: new Date(),
          canRate: true, // Enable ratings after tenancy ends
        };

        set({ matches: updatedMatches });

        // Persist to Supabase if configured
        try {
          const { supabase } = await import('../lib/supabase');
          if (supabase) {
            await supabase
              .from('matches')
              .update({
                tenancy_status: 'ended',
                tenancy_completed_at: new Date().toISOString(),
                can_rate: true,
              })
              .eq('id', matchId);

            // Update renter status back to prospective
            await supabase
              .from('renter_profiles')
              .update({
                renter_status: 'former',
                current_property_id: null,
                current_landlord_id: null,
              })
              .eq('id', match.renterId);
          }
        } catch (error) {
          console.error('[TenancyLifecycle] Failed to persist tenancy end:', error);
        }
      },

      // ========================================
      // TWO-SIDED MATCHING (Phase 3)
      // ========================================

      /**
       * Create an interest record when a renter likes a property
       * This replaces the random match creation - now creates a pending interest
       */
      createInterest: async (propertyId, renterId, renterProfile) => {
        const { allProperties, interests } = get();

        const property = allProperties.find((p) => p.id === propertyId);
        if (!property) {
          console.error('[TwoSidedMatch] Property not found:', propertyId);
          return null;
        }

        if (!property.landlordId || property.landlordId.trim() === '') {
          console.warn('[TwoSidedMatch] Property has no landlord:', propertyId);
          return null;
        }

        // Check if interest already exists
        const existingInterest = interests.find(
          (i) => i.renterId === renterId && i.propertyId === propertyId
        );

        if (existingInterest) {
          console.log('[TwoSidedMatch] Interest already exists:', existingInterest.id);
          return existingInterest;
        }

        // Calculate compatibility score
        const compatibilityScore = calculateCompatibility(renterProfile, property);

        // Create new interest with unique ID
        const newInterest: Interest = {
          id: `interest-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          renterId,
          landlordId: property.landlordId,
          propertyId,
          interestedAt: new Date(),
          status: 'pending',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          compatibilityScore: compatibilityScore.overall,
          compatibilityBreakdown: compatibilityScore.breakdown,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        console.log('[TwoSidedMatch] Created interest:', newInterest.id, 'Score:', compatibilityScore.overall);

        set({ interests: [...interests, newInterest] });

        return newInterest;
      },

      /**
       * Get all interested renters for a landlord's properties
       * Returns RenterCard format for display in LandlordSwipePage
       */
      getInterestedRenters: async (landlordId, propertyId) => {
        const { interests, allProperties } = get();

        // Filter interests for this landlord's properties
        let relevantInterests = interests.filter(
          (i) => i.landlordId === landlordId && i.status === 'pending'
        );

        // Filter by specific property if provided
        if (propertyId) {
          relevantInterests = relevantInterests.filter((i) => i.propertyId === propertyId);
        }

        // Convert interests to RenterCards
        const renterCards: RenterCard[] = [];

        for (const interest of relevantInterests) {
          // Get renter profile from localStorage (in production, would be from API)
          let renterProfile: RenterProfile | null = null;

          try {
            const rentersData = localStorage.getItem('get-on-renters');
            if (rentersData) {
              const renters = JSON.parse(rentersData);
              renterProfile = renters.find((r: RenterProfile) => r.id === interest.renterId);
            }
          } catch {
            console.warn('[TwoSidedMatch] Could not load renter profile');
          }

          if (!renterProfile) continue;

          const property = allProperties.find((p) => p.id === interest.propertyId);
          if (!property) continue;

          // Calculate fresh compatibility score
          const compatibilityScore = calculateCompatibility(renterProfile, property);

          const renterCard: RenterCard = {
            renterId: interest.renterId,
            interestId: interest.id,
            situation: renterProfile.situation,
            employmentStatus: renterProfile.employmentStatus,
            monthlyIncome: renterProfile.monthlyIncome,
            hasPets: renterProfile.hasPets,
            petDetails: renterProfile.petDetails?.map((p) => ({
              type: p.type,
              count: p.count,
              hasInsurance: p.hasInsurance,
            })),
            hasGuarantor: renterProfile.hasGuarantor,
            hasRentalHistory: renterProfile.hasRentalHistory,
            preferredMoveInDate: renterProfile.preferredMoveInDate,
            smokingStatus: renterProfile.smokingStatus,
            rating: renterProfile.ratingsSummary,
            compatibilityScore,
            interestedAt: interest.interestedAt,
            propertyId: interest.propertyId,
            propertyAddress: `${property.address.street}, ${property.address.city}`,
          };

          renterCards.push(renterCard);
        }

        // Sort by compatibility score (highest first)
        renterCards.sort((a, b) => b.compatibilityScore.overall - a.compatibilityScore.overall);

        console.log('[TwoSidedMatch] Returning', renterCards.length, 'interested renters for landlord:', landlordId);

        return renterCards;
      },

      /**
       * Landlord confirms interest - creates a mutual match
       */
      confirmMatch: async (interestId) => {
        const { interests, allProperties, matches } = get();

        const interestIndex = interests.findIndex((i) => i.id === interestId);
        if (interestIndex === -1) {
          console.error('[TwoSidedMatch] Interest not found:', interestId);
          return null;
        }

        const interest = interests[interestIndex];
        const property = allProperties.find((p) => p.id === interest.propertyId);

        if (!property) {
          console.error('[TwoSidedMatch] Property not found for interest:', interest.propertyId);
          return null;
        }

        // Get renter name from localStorage
        let renterName = 'Renter';
        try {
          const rentersData = localStorage.getItem('get-on-renters');
          if (rentersData) {
            const renters = JSON.parse(rentersData);
            const renter = renters.find((r: RenterProfile) => r.id === interest.renterId);
            if (renter) {
              renterName = renter.names;
            }
          }
        } catch {
          console.warn('[TwoSidedMatch] Could not load renter name');
        }

        // Get landlord name
        let landlordName = `Landlord for ${property.address.street}`;
        try {
          const authData = localStorage.getItem('get-on-auth');
          if (authData) {
            const parsed = JSON.parse(authData);
            if (parsed.state?.currentUser?.names) {
              landlordName = parsed.state.currentUser.names;
            }
          }
        } catch {
          console.warn('[TwoSidedMatch] Could not retrieve landlord name');
        }

        // Create the match
        const newMatchId = `match-${Date.now()}`;
        const newMatch: Match = {
          id: newMatchId,
          propertyId: property.id,
          property,
          landlordId: interest.landlordId,
          landlordName,
          renterId: interest.renterId,
          renterName,
          timestamp: new Date().toISOString(),
          tenancyStatus: 'prospective',
          activeIssueIds: [],
          totalIssuesRaised: 0,
          totalIssuesResolved: 0,
          messages: [
            {
              id: `msg-${Date.now()}`,
              matchId: newMatchId,
              senderId: interest.landlordId,
              receiverId: interest.renterId,
              senderType: 'landlord',
              content: `Great news! I've reviewed your interest in ${property.address.street} and would love to discuss next steps. When would be a good time for a viewing?`,
              timestamp: new Date().toISOString(),
              isRead: false,
            },
          ],
          lastMessageAt: new Date().toISOString(),
          unreadCount: 1,
          hasViewingScheduled: false,
          applicationStatus: 'pending',
          isUnderEvictionProceedings: false,
          rentArrears: {
            totalOwed: 0,
            monthsMissed: 0,
            consecutiveMonthsMissed: 0,
          },
          canRate: false,
          hasLandlordRated: false,
          hasRenterRated: false,
        };

        // Update interest status
        const updatedInterests = [...interests];
        updatedInterests[interestIndex] = {
          ...interest,
          status: 'landlord_liked',
          landlordReviewedAt: new Date(),
          createdMatchId: newMatchId,
          updatedAt: new Date(),
        };

        console.log('[TwoSidedMatch] Created mutual match:', newMatchId, 'from interest:', interestId);

        set({
          interests: updatedInterests,
          matches: [newMatch, ...matches],
        });

        return newMatch;
      },

      /**
       * Landlord declines an interest
       */
      declineInterest: async (interestId) => {
        const { interests } = get();

        const interestIndex = interests.findIndex((i) => i.id === interestId);
        if (interestIndex === -1) {
          console.error('[TwoSidedMatch] Interest not found:', interestId);
          return;
        }

        const updatedInterests = [...interests];
        updatedInterests[interestIndex] = {
          ...interests[interestIndex],
          status: 'landlord_passed',
          landlordReviewedAt: new Date(),
          updatedAt: new Date(),
        };

        console.log('[TwoSidedMatch] Declined interest:', interestId);

        set({ interests: updatedInterests });
      },

      /**
       * Get count of pending interests for a landlord (for badge display)
       */
      getPendingInterestsCount: (landlordId) => {
        const { interests } = get();
        return interests.filter(
          (i) => i.landlordId === landlordId && i.status === 'pending'
        ).length;
      },
    }),
    {
      name: STORAGE_KEYS.USER,
      partialize: (state) => ({
        user: state.user,
        likedProperties: state.likedProperties,
        passedProperties: state.passedProperties,
        matches: state.matches,
        viewingPreferences: state.viewingPreferences,
        interests: state.interests,
        isOnboarded: state.isOnboarded,
      }),
    }
  )
);
