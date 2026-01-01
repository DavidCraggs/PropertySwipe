/**
 * Consent Management System
 *
 * GDPR-compliant consent tracking and management system that ensures
 * user consent is freely given, specific, informed, and unambiguous
 * per Article 7.
 *
 * GDPR Compliance:
 * - Article 7: Conditions for consent
 * - Article 13: Information to be provided when personal data are collected
 * - Article 21: Right to object to processing
 * - ePrivacy Directive: Cookie consent requirements
 *
 * Features:
 * - Track consent for different processing purposes
 * - Record consent/withdrawal with timestamp and IP
 * - Provide easy consent withdrawal
 * - Cookie consent management
 * - Consent audit trail
 *
 * @see https://gdpr-info.eu/art-7-gdpr/ - Conditions for consent
 * @see https://gdpr-info.eu/art-13-gdpr/ - Information to be provided
 */

import { supabase } from './supabase';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

/**
 * Types of consent that can be granted
 */
export type ConsentPurpose =
  | 'essential' // Essential for service operation (no consent required)
  | 'functional' // Enhanced functionality (requires consent)
  | 'analytics' // Usage analytics and improvement (requires consent)
  | 'marketing' // Marketing communications (requires consent)
  | 'personalization' // Personalized content (requires consent)
  | 'third_party_sharing'; // Sharing with third parties (requires consent)

/**
 * Cookie categories for cookie consent
 */
export type CookieCategory =
  | 'essential' // Strictly necessary cookies
  | 'functional' // Functionality cookies
  | 'analytics' // Performance/analytics cookies
  | 'marketing'; // Marketing/advertising cookies

/**
 * Consent record stored in database
 */
export interface ConsentRecord {
  id: string;
  userId: string;
  purpose: ConsentPurpose;
  granted: boolean;
  grantedAt?: Date;
  withdrawnAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  consentMethod: 'explicit' | 'implicit' | 'opt_in' | 'opt_out';
  consentVersion: string; // Version of privacy policy/terms
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Cookie consent preferences
 */
export interface CookieConsent {
  essential: boolean; // Always true, cannot be disabled
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: Date;
  consentVersion: string;
}

/**
 * Consent status for all purposes
 */
export interface ConsentStatus {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
  thirdPartySharing: boolean;
  lastUpdated: Date;
}

/**
 * Options for granting consent
 */
export interface GrantConsentOptions {
  ipAddress?: string;
  userAgent?: string;
  consentMethod?: 'explicit' | 'implicit' | 'opt_in';
  metadata?: Record<string, unknown>;
}

/**
 * Options for withdrawing consent
 */
export interface WithdrawConsentOptions {
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

// =====================================================
// CONSTANTS
// =====================================================

/**
 * Current version of privacy policy and consent
 * Update this when privacy policy changes require new consent
 */
export const CURRENT_CONSENT_VERSION = '1.0.0';

/**
 * Local storage key for consent preferences
 */
const CONSENT_STORAGE_KEY = 'propertyswipe-consent-preferences';

/**
 * Cookie consent storage key
 */
const COOKIE_CONSENT_STORAGE_KEY = 'propertyswipe-cookie-consent';

/**
 * Consent descriptions for user display
 */
export const CONSENT_DESCRIPTIONS: Record<ConsentPurpose, { title: string; description: string; required: boolean }> = {
  essential: {
    title: 'Essential Services',
    description: 'Required for the platform to function properly. Includes authentication, security, and core features.',
    required: true
  },
  functional: {
    title: 'Functional Features',
    description: 'Enhanced features like remembering your preferences and settings.',
    required: false
  },
  analytics: {
    title: 'Analytics & Improvement',
    description: 'Help us understand how you use the platform to improve your experience.',
    required: false
  },
  marketing: {
    title: 'Marketing Communications',
    description: 'Receive updates about new features, properties, and platform improvements.',
    required: false
  },
  personalization: {
    title: 'Personalized Content',
    description: 'Show you properties and content tailored to your preferences.',
    required: false
  },
  third_party_sharing: {
    title: 'Third-Party Sharing',
    description: 'Share your data with partner estate agents and landlords for matching purposes.',
    required: false
  }
};

/**
 * Cookie descriptions for cookie banner
 */
export const COOKIE_DESCRIPTIONS: Record<CookieCategory, { title: string; description: string; required: boolean }> = {
  essential: {
    title: 'Essential Cookies',
    description: 'These cookies are necessary for the website to function and cannot be disabled.',
    required: true
  },
  functional: {
    title: 'Functional Cookies',
    description: 'These cookies enable enhanced functionality and personalization.',
    required: false
  },
  analytics: {
    title: 'Analytics Cookies',
    description: 'These cookies help us understand how visitors interact with the website.',
    required: false
  },
  marketing: {
    title: 'Marketing Cookies',
    description: 'These cookies are used to track visitors across websites for marketing purposes.',
    required: false
  }
};

// =====================================================
// CONSENT MANAGEMENT FUNCTIONS
// =====================================================

/**
 * Gets the current user's IP address (for audit trail)
 * In production, this should be done server-side
 */
async function getCurrentIpAddress(): Promise<string | undefined> {
  try {
    // In production, get this from server-side API
    // For now, return undefined (will be set by backend)
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Gets the current user agent
 */
function getCurrentUserAgent(): string {
  return navigator.userAgent;
}

/**
 * Grants consent for a specific purpose
 *
 * @param userId - User ID granting consent
 * @param purpose - Purpose for which consent is granted
 * @param options - Additional options
 * @returns The created consent record
 *
 * @example
 * ```typescript
 * await grantConsent('user-123', 'analytics', {
 *   consentMethod: 'explicit',
 *   ipAddress: '192.168.1.1'
 * });
 * ```
 */
export async function grantConsent(
  userId: string,
  purpose: ConsentPurpose,
  options: GrantConsentOptions = {}
): Promise<ConsentRecord> {
  const {
    ipAddress = await getCurrentIpAddress(),
    userAgent = getCurrentUserAgent(),
    consentMethod = 'explicit',
    metadata = {}
  } = options;

  const consentRecord: Omit<ConsentRecord, 'id'> = {
    userId,
    purpose,
    granted: true,
    grantedAt: new Date(),
    ipAddress,
    userAgent,
    consentMethod,
    consentVersion: CURRENT_CONSENT_VERSION,
    metadata,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Store in Supabase
  try {
    const { data, error } = await supabase
      .from('consent_records')
      .upsert({
        user_id: userId,
        purpose,
        granted: true,
        granted_at: consentRecord.grantedAt?.toISOString(),
        withdrawn_at: null,
        ip_address: ipAddress,
        user_agent: userAgent,
        consent_method: consentMethod,
        consent_version: CURRENT_CONSENT_VERSION,
        metadata,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,purpose'
      })
      .select()
      .single();

    if (error) throw error;

    // Also store in localStorage for quick access
    updateLocalConsent(userId, purpose, true);

    // Log to audit trail
    await logConsentChange(userId, purpose, 'granted', metadata);

    return {
      id: data.id,
      ...consentRecord
    };
  } catch (error) {
    console.error('Failed to grant consent in database:', error);

    // Fallback to localStorage only
    updateLocalConsent(userId, purpose, true);

    return {
      id: crypto.randomUUID(),
      ...consentRecord
    };
  }
}

/**
 * Withdraws consent for a specific purpose
 *
 * @param userId - User ID withdrawing consent
 * @param purpose - Purpose for which consent is withdrawn
 * @param options - Additional options
 * @returns The updated consent record
 *
 * @example
 * ```typescript
 * await withdrawConsent('user-123', 'marketing', {
 *   reason: 'No longer interested in marketing emails'
 * });
 * ```
 */
export async function withdrawConsent(
  userId: string,
  purpose: ConsentPurpose,
  options: WithdrawConsentOptions = {}
): Promise<ConsentRecord> {
  const {
    reason,
    ipAddress = await getCurrentIpAddress(),
    userAgent = getCurrentUserAgent()
  } = options;

  // Essential consent cannot be withdrawn
  if (purpose === 'essential') {
    throw new Error('Essential consent cannot be withdrawn as it is required for service operation');
  }

  try {
    const { data, error } = await supabase
      .from('consent_records')
      .update({
        granted: false,
        withdrawn_at: new Date().toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: reason ? { withdrawal_reason: reason } : {},
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('purpose', purpose)
      .select()
      .single();

    if (error) throw error;

    // Update localStorage
    updateLocalConsent(userId, purpose, false);

    // Log to audit trail
    await logConsentChange(userId, purpose, 'withdrawn', { reason });

    return {
      id: data.id,
      userId,
      purpose,
      granted: false,
      grantedAt: data.granted_at ? new Date(data.granted_at) : undefined,
      withdrawnAt: new Date(),
      ipAddress,
      userAgent,
      consentMethod: data.consent_method,
      consentVersion: data.consent_version,
      metadata: data.metadata,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  } catch (error) {
    console.error('Failed to withdraw consent in database:', error);

    // Fallback to localStorage only
    updateLocalConsent(userId, purpose, false);

    return {
      id: crypto.randomUUID(),
      userId,
      purpose,
      granted: false,
      withdrawnAt: new Date(),
      ipAddress,
      userAgent,
      consentMethod: 'explicit',
      consentVersion: CURRENT_CONSENT_VERSION,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}

/**
 * Gets all consent records for a user
 *
 * @param userId - User ID
 * @returns Object with consent status for each purpose
 *
 * @example
 * ```typescript
 * const status = await getConsentStatus('user-123');
 * if (status.analytics) {
 *   // Track analytics
 * }
 * ```
 */
export async function getConsentStatus(userId: string): Promise<ConsentStatus> {
  try {
    const { data, error } = await supabase
      .from('consent_records')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    const status: ConsentStatus = {
      essential: true, // Always granted
      functional: false,
      analytics: false,
      marketing: false,
      personalization: false,
      thirdPartySharing: false,
      lastUpdated: new Date()
    };

    if (data) {
      for (const record of data) {
        if (record.granted) {
          switch (record.purpose) {
            case 'functional':
              status.functional = true;
              break;
            case 'analytics':
              status.analytics = true;
              break;
            case 'marketing':
              status.marketing = true;
              break;
            case 'personalization':
              status.personalization = true;
              break;
            case 'third_party_sharing':
              status.thirdPartySharing = true;
              break;
          }

          // Update lastUpdated to most recent
          const updatedAt = new Date(record.updated_at);
          if (updatedAt > status.lastUpdated) {
            status.lastUpdated = updatedAt;
          }
        }
      }
    }

    // Update localStorage cache
    localStorage.setItem(`${CONSENT_STORAGE_KEY}-${userId}`, JSON.stringify(status));

    return status;
  } catch (error) {
    console.error('Failed to get consent status from database:', error);

    // Fallback to localStorage
    const cached = localStorage.getItem(`${CONSENT_STORAGE_KEY}-${userId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Default: only essential consent
    return {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
      personalization: false,
      thirdPartySharing: false,
      lastUpdated: new Date()
    };
  }
}

/**
 * Checks if user has granted consent for a specific purpose
 *
 * @param userId - User ID
 * @param purpose - Purpose to check
 * @returns True if consent is granted
 */
export async function hasConsent(userId: string, purpose: ConsentPurpose): Promise<boolean> {
  // Essential consent is always granted
  if (purpose === 'essential') return true;

  const status = await getConsentStatus(userId);

  switch (purpose) {
    case 'functional':
      return status.functional;
    case 'analytics':
      return status.analytics;
    case 'marketing':
      return status.marketing;
    case 'personalization':
      return status.personalization;
    case 'third_party_sharing':
      return status.thirdPartySharing;
    default:
      return false;
  }
}

/**
 * Updates consent in localStorage for quick access
 */
function updateLocalConsent(userId: string, purpose: ConsentPurpose, granted: boolean): void {
  const key = `${CONSENT_STORAGE_KEY}-${userId}`;
  const cached = localStorage.getItem(key);
  const status: ConsentStatus = cached ? JSON.parse(cached) : {
    essential: true,
    functional: false,
    analytics: false,
    marketing: false,
    personalization: false,
    thirdPartySharing: false,
    lastUpdated: new Date()
  };

  switch (purpose) {
    case 'functional':
      status.functional = granted;
      break;
    case 'analytics':
      status.analytics = granted;
      break;
    case 'marketing':
      status.marketing = granted;
      break;
    case 'personalization':
      status.personalization = granted;
      break;
    case 'third_party_sharing':
      status.thirdPartySharing = granted;
      break;
  }

  status.lastUpdated = new Date();
  localStorage.setItem(key, JSON.stringify(status));
}

// =====================================================
// COOKIE CONSENT MANAGEMENT
// =====================================================

/**
 * Gets the current cookie consent preferences
 *
 * @returns Cookie consent preferences or null if not set
 */
export function getCookieConsent(): CookieConsent | null {
  const stored = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored);
    return {
      ...parsed,
      timestamp: new Date(parsed.timestamp)
    };
  } catch {
    return null;
  }
}

/**
 * Sets cookie consent preferences
 *
 * @param consent - Cookie consent preferences
 */
export function setCookieConsent(consent: Omit<CookieConsent, 'essential' | 'timestamp' | 'consentVersion'>): void {
  const fullConsent: CookieConsent = {
    essential: true, // Always true
    ...consent,
    timestamp: new Date(),
    consentVersion: CURRENT_CONSENT_VERSION
  };

  localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(fullConsent));

  // Apply cookie preferences
  applyCookieConsent(fullConsent);
}

/**
 * Checks if cookie consent has been given
 *
 * @returns True if user has made a cookie consent choice
 */
export function hasCookieConsent(): boolean {
  return getCookieConsent() !== null;
}

/**
 * Applies cookie consent preferences by enabling/disabling analytics and marketing
 *
 * @param consent - Cookie consent preferences
 */
function applyCookieConsent(consent: CookieConsent): void {
  // In production, this would:
  // - Enable/disable Google Analytics
  // - Enable/disable marketing pixels
  // - Enable/disable third-party scripts

  if (consent.analytics) {
    // Enable analytics
    console.log('[Consent] Analytics enabled');
  } else {
    // Disable analytics
    console.log('[Consent] Analytics disabled');
  }

  if (consent.marketing) {
    // Enable marketing
    console.log('[Consent] Marketing enabled');
  } else {
    // Disable marketing
    console.log('[Consent] Marketing disabled');
  }
}

// =====================================================
// AUDIT TRAIL
// =====================================================

/**
 * Logs a consent change to the GDPR audit log
 *
 * @param userId - User ID
 * @param purpose - Consent purpose
 * @param action - Action performed ('granted' or 'withdrawn')
 * @param metadata - Additional metadata
 */
async function logConsentChange(
  userId: string,
  purpose: ConsentPurpose,
  action: 'granted' | 'withdrawn',
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    await supabase.from('gdpr_audit_log').insert({
      user_id: userId,
      operation: 'consent_update',
      details: {
        purpose,
        action,
        consent_version: CURRENT_CONSENT_VERSION,
        ...metadata
      },
      performed_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log consent change:', error);
  }
}

/**
 * Gets consent history for a user (for transparency)
 *
 * @param userId - User ID
 * @returns Array of consent records ordered by date
 */
export async function getConsentHistory(userId: string): Promise<ConsentRecord[]> {
  try {
    const { data, error } = await supabase
      .from('consent_records')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(record => ({
      id: record.id,
      userId: record.user_id,
      purpose: record.purpose,
      granted: record.granted,
      grantedAt: record.granted_at ? new Date(record.granted_at) : undefined,
      withdrawnAt: record.withdrawn_at ? new Date(record.withdrawn_at) : undefined,
      ipAddress: record.ip_address,
      userAgent: record.user_agent,
      consentMethod: record.consent_method,
      consentVersion: record.consent_version,
      metadata: record.metadata,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at)
    }));
  } catch (error) {
    console.error('Failed to get consent history:', error);
    return [];
  }
}
