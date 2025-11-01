/**
 * Core type definitions for Get On application
 */

export type PropertyType = 'Detached' | 'Semi-detached' | 'Terraced' | 'End-Terraced' | 'Bungalow' | 'Flat';
export type Tenure = 'Freehold' | 'Leasehold' | 'Shared Ownership';
export type EPCRating = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
export type UserType = 'vendor' | 'buyer';
export type LocalArea = 'Southport' | 'Liverpool' | 'Manchester';
export type BuyerSituation = 'Family' | 'Couple' | 'Single';
export type BuyerType = 'First Time Buyer' | 'Nothing To Sell' | 'Need To Sell On The Market' | 'Under Offer' | 'Investor';
export type PurchaseType = 'Mortgage' | 'Cash' | 'Loan' | 'Cash on Completion';
export type LookingFor = 'Family' | 'Investor';

/**
 * Property interface representing a UK property listing
 */
export interface Property {
  id: string;
  address: {
    street: string;
    city: string;
    postcode: string;
    council: string;
  };
  price: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: PropertyType;
  images: string[];
  description: string;
  epcRating: EPCRating;
  tenure: Tenure;
  squareFootage: number;
  yearBuilt: number;
  features: string[];
  listingDate: string;
  vendorId: string;
}

/**
 * User preferences for property filtering
 */
export interface UserPreferences {
  locations: string[];
  priceRange: {
    min: number;
    max: number;
  };
  bedrooms: {
    min: number;
    max: number;
  };
  propertyTypes: PropertyType[];
  mustHaveGarden: boolean;
  mustHaveParking: boolean;
  newBuildOnly: boolean;
  maxAge?: number; // Maximum age of property in years
}

/**
 * User profile interface
 */
export interface User {
  id: string;
  name: string;
  email: string;
  type: UserType;
  preferences: UserPreferences;
  likedProperties: string[]; // Property IDs
  passedProperties: string[]; // Property IDs user swiped left on
  matches: string[]; // Match IDs
  avatar?: string;
  createdAt: string;
  hasCompletedOnboarding: boolean;
}

/**
 * Message in a conversation
 */
export interface Message {
  id: string;
  senderId: string;
  senderType: UserType;
  content: string;
  timestamp: string;
  read: boolean;
}

/**
 * Match between a buyer and a property/vendor
 */
export interface Match {
  id: string;
  propertyId: string;
  property: Property;
  vendorId: string;
  vendorName: string;
  buyerId: string;
  buyerName: string;
  // ENHANCEMENT: Full buyer profile for vendors to evaluate buyers
  buyerProfile?: {
    situation: BuyerSituation;
    ages: string;
    localArea: LocalArea;
    buyerType: BuyerType;
    purchaseType: PurchaseType;
  };
  timestamp: string;
  messages: Message[];
  lastMessageAt?: string;
  unreadCount: number;
  viewingPreference?: ViewingPreference;
  hasViewingScheduled: boolean;
  confirmedViewingDate?: Date;
}

/**
 * Swipe action type
 */
export type SwipeAction = 'like' | 'dislike';

/**
 * Swipe event data
 */
export interface SwipeEvent {
  propertyId: string;
  action: SwipeAction;
  timestamp: string;
}

/**
 * Statistics for user activity
 */
export interface UserStats {
  propertiesViewed: number;
  propertiesLiked: number;
  propertiesPassed: number;
  matchesCount: number;
  messagesCount: number;
}

/**
 * Notification types
 */
export type NotificationType = 'match' | 'message' | 'info' | 'success' | 'error';

/**
 * Notification interface
 */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

/**
 * Filter options for property search
 */
export interface FilterOptions extends Partial<UserPreferences> {
  sortBy?: 'price-asc' | 'price-desc' | 'newest' | 'bedrooms';
}

/**
 * Location data for UK regions
 */
export interface Location {
  name: string;
  region: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

/**
 * Vendor profile for property sellers
 */
export interface VendorProfile {
  id: string;
  names: string; // e.g., "John & Sarah Smith"
  propertyType: PropertyType;
  lookingFor: LookingFor;
  preferredPurchaseType: PurchaseType;
  estateAgentLink: string;
  propertyId?: string;
  createdAt: Date;
  isComplete: boolean;
}

/**
 * Buyer profile for property buyers
 */
export interface BuyerProfile {
  id: string;
  situation: BuyerSituation;
  names: string;
  ages: string; // e.g., "32" or "32 & 29"
  localArea: LocalArea;
  buyerType: BuyerType;
  purchaseType: PurchaseType;
  createdAt: Date;
  isComplete: boolean;
}

/**
 * Authentication state
 */
export interface AuthState {
  isAuthenticated: boolean;
  userType: UserType | null;
  currentUser: VendorProfile | BuyerProfile | null;
  onboardingStep: number;
}

/**
 * Viewing time slot preference
 */
export interface ViewingTimeSlot {
  dayType: 'Weekday' | 'Weekend' | 'Any Day';
  timeOfDay: 'Morning' | 'Afternoon' | 'Evening' | 'Flexible';
  specificDays?: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[];
}

/**
 * Viewing preference for property viewings
 */
export interface ViewingPreference {
  id: string;
  matchId: string;
  buyerId: string;
  vendorId: string;
  propertyId: string;
  preferredTimes: ViewingTimeSlot[];
  specificDateTime?: Date;
  flexibility: 'Flexible' | 'Specific' | 'ASAP';
  additionalNotes?: string;
  status: 'pending' | 'confirmed' | 'declined' | 'rescheduled';
  createdAt: Date;
  updatedAt: Date;
}
