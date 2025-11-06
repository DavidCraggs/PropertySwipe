/**
 * Application-wide constants for GetOn Rental Platform
 * Compliant with Renters' Rights Act 2025
 */

import type {
  PropertyType,
  RenterType,
  EmploymentStatus,
  FurnishingType,
  RatingCategory
} from '../types';

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
  'End-Terraced',
];

/**
 * Monthly rent range options (in GBP per calendar month)
 */
export const RENT_RANGES = [
  { label: '£400', value: 400 },
  { label: '£500', value: 500 },
  { label: '£600', value: 600 },
  { label: '£700', value: 700 },
  { label: '£800', value: 800 },
  { label: '£900', value: 900 },
  { label: '£1,000', value: 1000 },
  { label: '£1,200', value: 1200 },
  { label: '£1,500', value: 1500 },
  { label: '£1,800', value: 1800 },
  { label: '£2,000', value: 2000 },
  { label: '£2,500', value: 2500 },
  { label: '£3,000+', value: 3000 },
] as const;

/**
 * Legacy alias for backward compatibility (DEPRECATED)
 */
export const PRICE_RANGES = RENT_RANGES;

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
 * Message templates for simulated landlord responses
 */
export const LANDLORD_MESSAGE_TEMPLATES = [
  "Hi! Thanks for your interest in this property. I'd be happy to answer any questions you have.",
  "Hello! This property is still available. Would you like to arrange a viewing?",
  "Thanks for reaching out! The property has some great features. What would you like to know?",
  "Hi there! I'm pleased you're interested. When would be a good time for a viewing?",
  "Hello! Yes, this property is available. Feel free to ask any questions.",
] as const;

/**
 * Legacy alias for backward compatibility (DEPRECATED)
 */
export const SELLER_MESSAGE_TEMPLATES = LANDLORD_MESSAGE_TEMPLATES;

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
 * Renter types (tenant profiles)
 */
export const RENTER_TYPES: RenterType[] = [
  'Student',
  'Young Professional',
  'Family',
  'Couple',
  'Professional Sharers',
  'Retired',
];

/**
 * Employment status options
 */
export const EMPLOYMENT_STATUSES: EmploymentStatus[] = [
  'Employed Full-Time',
  'Employed Part-Time',
  'Self-Employed',
  'Student',
  'Retired',
  'Unemployed',
];

/**
 * Furnishing types for rental properties
 */
export const FURNISHING_TYPES: FurnishingType[] = [
  'Furnished',
  'Part Furnished',
  'Unfurnished',
];

/**
 * Pets preference options
 */
export const PETS_PREFERENCES = [
  { label: 'No Pets', value: 'no_pets' },
  { label: 'Cat', value: 'cat' },
  { label: 'Dog', value: 'dog' },
  { label: 'Small Caged Pets', value: 'small_caged' },
  { label: 'Fish', value: 'fish' },
] as const;

/**
 * Rating categories for landlords
 */
export const LANDLORD_RATING_CATEGORIES: RatingCategory[] = [
  'communication',
  'property_condition',
  'reliability',
];

/**
 * Rating categories for renters
 */
export const RENTER_RATING_CATEGORIES: RatingCategory[] = [
  'communication',
  'cleanliness',
  'respect_for_property',
  'reliability',
];

/**
 * PRS Database registration statuses
 */
export const PRS_REGISTRATION_STATUSES = [
  { label: 'Not Registered', value: 'not_registered' },
  { label: 'Pending', value: 'pending' },
  { label: 'Active', value: 'active' },
  { label: 'Expired', value: 'expired' },
  { label: 'Suspended', value: 'suspended' },
] as const;

/**
 * Ombudsman scheme options (RRA 2025 requirement)
 */
export const OMBUDSMAN_SCHEMES = [
  { label: 'Not Registered', value: 'not_registered' },
  { label: 'Property Redress Scheme', value: 'property_redress_scheme' },
  { label: 'The Property Ombudsman', value: 'property_ombudsman' },
  { label: 'TPO', value: 'tpo' },
] as const;

/**
 * Deposit protection schemes (legally required in UK)
 */
export const DEPOSIT_SCHEMES = [
  { label: 'DPS (Deposit Protection Service)', value: 'DPS' },
  { label: 'MyDeposits', value: 'MyDeposits' },
  { label: 'TDS (Tenancy Deposit Scheme)', value: 'TDS' },
] as const;

/**
 * Section 8 eviction grounds (RRA 2025: Section 21 abolished)
 */
export const EVICTION_GROUNDS = [
  { label: 'Ground 8: 8+ weeks rent arrears (mandatory)', value: 'ground_8' },
  { label: 'Ground 7A: Persistent rent arrears (mandatory)', value: 'ground_7a' },
  { label: 'Ground 1: Landlord moving in', value: 'ground_1' },
  { label: 'Ground 1A: Selling to buyer needing vacant possession', value: 'ground_1a' },
  { label: 'Ground 6: Redevelopment', value: 'ground_6' },
  { label: 'Ground 14: Anti-social behavior', value: 'ground_14' },
  { label: 'Ground 14A: Domestic abuse', value: 'ground_14a' },
  { label: 'Ground 14ZA: Serious criminal offence', value: 'ground_14za' },
  { label: 'Ground 17: False statement by tenant', value: 'ground_17' },
] as const;

/**
 * Hazard types (Awaab\'s Law compliance)
 */
export const HAZARD_TYPES = [
  { label: 'Damp and Mould', value: 'damp_and_mould' },
  { label: 'Excess Cold', value: 'excess_cold' },
  { label: 'Fire Safety Issue', value: 'fire_safety' },
  { label: 'Electrical Hazard', value: 'electrical_hazard' },
  { label: 'Gas Safety Issue', value: 'gas_safety' },
  { label: 'Structural Issue', value: 'structural_issue' },
  { label: 'Pest Infestation', value: 'pest_infestation' },
  { label: 'Water Leak/Flooding', value: 'water_leak' },
  { label: 'Other', value: 'other' },
] as const;

/**
 * Dispute categories for ombudsman resolution
 */
export const DISPUTE_CATEGORIES = [
  { label: 'Repairs Not Done', value: 'repairs_not_done' },
  { label: 'Deposit Deductions', value: 'deposit_deductions' },
  { label: 'Harassment by Landlord', value: 'harassment' },
  { label: 'Illegal Eviction', value: 'illegal_eviction' },
  { label: 'Rent Increase Dispute', value: 'rent_increase' },
  { label: 'Property Condition', value: 'property_condition' },
  { label: 'Contract Breach', value: 'contract_breach' },
  { label: 'Other', value: 'other' },
] as const;

/**
 * Default rental preferences for renters
 */
export const DEFAULT_RENTAL_PREFERENCES = {
  locations: [] as string[],
  rentRange: {
    min: 500,
    max: 2000,
  },
  bedrooms: {
    min: 1,
    max: 3,
  },
  propertyTypes: [] as PropertyType[],
  furnishing: [] as FurnishingType[],
  mustHaveGarden: false,
  mustHaveParking: false,
  petsRequired: false,
  acceptsShortTerm: false,
};

/**
 * Legacy alias for backward compatibility (DEPRECATED)
 */
export const DEFAULT_PREFERENCES = DEFAULT_RENTAL_PREFERENCES;

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
  SUBMIT_RATING: 'Submit rating',
  VIEW_RATING: 'View rating details',
} as const;

/**
 * RRA 2025 Compliance Constants
 */

/**
 * Maximum rent in advance (RRA 2025 requirement)
 */
export const MAX_RENT_IN_ADVANCE = 1; // 1 month maximum by law

/**
 * Maximum deposit (RRA 2025 requirement)
 * Typically 5 weeks rent for annual rent under £50,000
 */
export const MAX_DEPOSIT_WEEKS = 5;

/**
 * Awaab's Law: Maximum days to fix hazards
 */
export const AWAABS_LAW_DEADLINE_DAYS = {
  immediate: 1, // Immediate hazards: 24 hours
  serious: 7, // Serious hazards: 7 days
  moderate: 14, // Moderate hazards: 14 days
} as const;

/**
 * Minimum notice periods for Section 8 evictions (RRA 2025)
 */
export const EVICTION_NOTICE_PERIODS = {
  ground_8: 14, // 2 weeks for 8+ weeks arrears
  ground_7a: 28, // 4 weeks for persistent arrears
  ground_1: 56, // 8 weeks for landlord moving in
  ground_1a: 56, // 8 weeks for selling
  ground_6: 56, // 8 weeks for redevelopment
  ground_14: 28, // 4 weeks for anti-social behavior
  ground_14a: 28, // 4 weeks for domestic abuse
  ground_14za: 28, // 4 weeks for serious crime
  ground_17: 28, // 4 weeks for false statement
} as const;

/**
 * Rating validation constants
 */
export const RATING_CONSTRAINTS = {
  MIN_SCORE: 1,
  MAX_SCORE: 5,
  MIN_REVIEW_LENGTH: 50,
  MAX_REVIEW_LENGTH: 1000,
  MIN_TENANCY_DAYS: 30, // Must have rented for at least 30 days to rate
} as const;

/**
 * Affordability calculation (standard UK rental affordability rule)
 * Rent should not exceed 30% of monthly income
 */
export const AFFORDABILITY_PERCENTAGE = 0.3; // 30%

/**
 * PRS Database registration renewal period (years)
 */
export const PRS_REGISTRATION_PERIOD_YEARS = 5;

/**
 * Minimum tenant income multiplier (standard UK practice)
 * Annual rent should not exceed 25x monthly income
 */
export const INCOME_MULTIPLIER = 25;
