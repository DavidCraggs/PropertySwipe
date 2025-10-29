/**
 * Core type definitions for PropertySwipe application
 */

export type PropertyType = 'Flat' | 'Terraced' | 'Semi-Detached' | 'Detached' | 'Bungalow' | 'Studio';
export type Tenure = 'Freehold' | 'Leasehold' | 'Shared Ownership';
export type EPCRating = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
export type UserType = 'buyer' | 'seller';

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
  sellerId: string;
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
 * Match between a buyer and a property/seller
 */
export interface Match {
  id: string;
  propertyId: string;
  property: Property;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  timestamp: string;
  messages: Message[];
  lastMessageAt?: string;
  unreadCount: number;
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
