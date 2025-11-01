/**
 * Application-wide constants
 */

import type { PropertyType } from '../types';

/**
 * UK cities available in the app
 */
export const UK_CITIES = [
  'London',
  'Manchester',
  'Birmingham',
  'Edinburgh',
  'Glasgow',
  'Liverpool',
  'Bristol',
  'Leeds',
  'Sheffield',
  'Newcastle',
  'Cardiff',
  'Belfast',
] as const;

/**
 * Property types available
 */
export const PROPERTY_TYPES: PropertyType[] = [
  'Flat',
  'Terraced',
  'Semi-detached',
  'Detached',
  'Bungalow',
  'Flat',
];

/**
 * Default price range options (in GBP)
 */
export const PRICE_RANGES = [
  { label: '£50k', value: 50000 },
  { label: '£100k', value: 100000 },
  { label: '£150k', value: 150000 },
  { label: '£200k', value: 200000 },
  { label: '£250k', value: 250000 },
  { label: '£300k', value: 300000 },
  { label: '£400k', value: 400000 },
  { label: '£500k', value: 500000 },
  { label: '£750k', value: 750000 },
  { label: '£1M', value: 1000000 },
  { label: '£1.5M', value: 1500000 },
  { label: '£2M+', value: 2000000 },
] as const;

/**
 * Bedroom options
 */
export const BEDROOM_OPTIONS = [
  { label: 'Flat', value: 0 },
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
  { label: '5+', value: 5 },
] as const;

/**
 * EPC rating colors for badges
 */
export const EPC_COLORS = {
  A: 'bg-green-600 text-white',
  B: 'bg-green-500 text-white',
  C: 'bg-lime-500 text-white',
  D: 'bg-yellow-500 text-white',
  E: 'bg-orange-500 text-white',
  F: 'bg-red-500 text-white',
  G: 'bg-red-700 text-white',
} as const;

/**
 * Animation durations (in milliseconds)
 */
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  SWIPE: 400,
} as const;

/**
 * Swipe thresholds (in pixels)
 */
export const SWIPE_THRESHOLD = {
  HORIZONTAL: 150,
  VERTICAL: 100,
  VELOCITY: 0.5,
} as const;

/**
 * Card stack configuration
 */
export const CARD_STACK_CONFIG = {
  VISIBLE_CARDS: 3,
  SCALE_FACTOR: 0.05,
  Y_OFFSET: 10,
  PRELOAD_COUNT: 5,
} as const;

/**
 * LocalStorage keys
 */
export const STORAGE_KEYS = {
  USER: 'geton_user',
  PREFERENCES: 'geton_preferences',
  LIKED_PROPERTIES: 'geton_liked',
  MATCHES: 'geton_matches',
  MESSAGES: 'geton_messages',
  SWIPE_HISTORY: 'geton_swipe_history',
} as const;

/**
 * Routes
 */
export const ROUTES = {
  HOME: '/',
  MATCHES: '/matches',
  MATCH_DETAIL: '/matches/:id',
  PROFILE: '/profile',
  ONBOARDING: '/onboarding',
  PREFERENCES: '/preferences',
} as const;

/**
 * Match probability (for demo purposes)
 * In real app, this would be based on seller acceptance
 */
export const MATCH_PROBABILITY = 0.3; // 30% chance of match

/**
 * Message templates for simulated seller responses
 */
export const SELLER_MESSAGE_TEMPLATES = [
  "Hi! Thanks for your interest in this property. I'd be happy to answer any questions you have.",
  "Hello! This property is still available. Would you like to arrange a viewing?",
  "Thanks for reaching out! The property has some great features. What would you like to know?",
  "Hi there! I'm pleased you're interested. When would be a good time for a viewing?",
  "Hello! Yes, this property is available. Feel free to ask any questions.",
] as const;

/**
 * Breakpoints (matching Tailwind defaults)
 */
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

/**
 * Maximum items to load at once (for performance)
 */
export const MAX_LOAD_ITEMS = {
  PROPERTIES: 20,
  MESSAGES: 50,
  MATCHES: 100,
} as const;

/**
 * Debounce delays (in milliseconds)
 */
export const DEBOUNCE_DELAY = {
  SEARCH: 300,
  RESIZE: 150,
  SCROLL: 100,
} as const;

/**
 * Image placeholder for missing property images
 */
export const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800';

/**
 * Default user preferences
 */
export const DEFAULT_PREFERENCES = {
  locations: [] as string[],
  priceRange: {
    min: 100000,
    max: 500000,
  },
  bedrooms: {
    min: 1,
    max: 5,
  },
  propertyTypes: [] as PropertyType[],
  mustHaveGarden: false,
  mustHaveParking: false,
  newBuildOnly: false,
};

/**
 * Toast notification duration (in milliseconds)
 */
export const TOAST_DURATION = {
  SUCCESS: 3000,
  ERROR: 5000,
  INFO: 4000,
} as const;

/**
 * Accessibility labels
 */
export const ARIA_LABELS = {
  LIKE_BUTTON: 'Like this property',
  DISLIKE_BUTTON: 'Pass on this property',
  CLOSE_MODAL: 'Close details',
  NEXT_IMAGE: 'Next image',
  PREVIOUS_IMAGE: 'Previous image',
  OPEN_MENU: 'Open navigation menu',
  CLOSE_MENU: 'Close navigation menu',
} as const;
