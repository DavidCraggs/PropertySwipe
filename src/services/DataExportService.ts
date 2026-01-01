/**
 * Data Export Service
 *
 * GDPR-compliant data export service that provides users with their personal data
 * in a structured, commonly used, and machine-readable format per Articles 15 & 20.
 *
 * GDPR Compliance:
 * - Article 15: Right of access by the data subject
 * - Article 20: Right to data portability
 *
 * Features:
 * - Export all user data in JSON and CSV formats
 * - Include metadata about data collection and processing
 * - Generate downloadable ZIP archive
 * - Track export requests for audit purposes
 *
 * @see https://gdpr-info.eu/art-15-gdpr/ - Right of access
 * @see https://gdpr-info.eu/art-20-gdpr/ - Right to data portability
 */

import { supabase } from '../lib/supabase';
import type {
  UserType,
  RenterProfile,
  LandlordProfile,
  AgencyProfile,
  Property,
  Match,
  Message,
  Rating,
  Issue
} from '../types';

// Alias for backward compatibility
type ViewingRequest = Record<string, unknown>;
type MaintenanceIssue = Issue;

// =====================================================
// TYPE DEFINITIONS
// =====================================================

/**
 * Options for data export
 */
export interface DataExportOptions {
  /**
   * Whether to use Supabase (true) or localStorage (false)
   * @default true
   */
  useSupabase?: boolean;

  /**
   * Format for the export (json, csv, or both)
   * @default 'both'
   */
  format?: 'json' | 'csv' | 'both';

  /**
   * Whether to include metadata about data collection
   * @default true
   */
  includeMetadata?: boolean;

  /**
   * Whether to compress the export as a ZIP file
   * @default false (not implemented in browser without library)
   */
  compress?: boolean;
}

/**
 * User data export package
 */
export interface UserDataExport {
  metadata: ExportMetadata;
  profile: RenterProfile | LandlordProfile | AgencyProfile;
  properties?: Property[];
  matches?: Match[];
  messages?: Message[];
  ratings?: RatingExport[];
  viewingRequests?: ViewingRequest[];
  maintenanceIssues?: MaintenanceIssue[];
  agencyLinks?: AgencyLinkExport[];
  exportedAt: Date;
}

/**
 * Metadata about the data export
 */
export interface ExportMetadata {
  exportId: string;
  userId: string;
  userType: UserType;
  exportedAt: Date;
  dataProcessingPurpose: string;
  legalBasis: string;
  dataRetentionPeriod: string;
  dataController: DataController;
  thirdPartyProcessors: string[];
  userRights: string[];
}

/**
 * Data controller information
 */
export interface DataController {
  name: string;
  address: string;
  email: string;
  phone: string;
  dpoEmail: string; // Data Protection Officer
}

/**
 * Rating export with anonymized details
 */
export interface RatingExport extends Omit<Rating, 'fromUserId' | 'toUserId'> {
  fromUserId: string; // May be anonymized
  toUserId: string; // May be anonymized
  direction: 'given' | 'received';
}

/**
 * Agency link export
 */
export interface AgencyLinkExport {
  agencyId: string;
  agencyName: string;
  landlordId: string;
  linkedAt: Date;
  status: string;
}

/**
 * Result of export operation
 */
export interface ExportResult {
  success: boolean;
  exportId: string;
  downloadUrl?: string;
  jsonData?: string;
  csvData?: string;
  error?: string;
}

// =====================================================
// CONSTANTS
// =====================================================

/**
 * Data controller information for PropertySwipe
 */
const DATA_CONTROLLER: DataController = {
  name: 'PropertySwipe Ltd',
  address: 'Liverpool, Merseyside, United Kingdom',
  email: 'privacy@propertyswipe.co.uk',
  phone: '+44 (0) 151 XXX XXXX',
  dpoEmail: 'dpo@propertyswipe.co.uk'
};

/**
 * Third-party data processors
 */
const THIRD_PARTY_PROCESSORS = [
  'Supabase (Database hosting - USA)',
  'Vercel (Application hosting - USA)',
  'Stripe (Payment processing - USA)' // Future implementation
];

/**
 * User rights under GDPR
 */
const USER_RIGHTS = [
  'Right to access your personal data (Article 15)',
  'Right to rectification of inaccurate data (Article 16)',
  'Right to erasure / "Right to be forgotten" (Article 17)',
  'Right to restriction of processing (Article 18)',
  'Right to data portability (Article 20)',
  'Right to object to processing (Article 21)',
  'Right to withdraw consent at any time (Article 7)',
  'Right to lodge a complaint with the ICO (UK supervisory authority)'
];

// =====================================================
// CORE EXPORT FUNCTIONS
// =====================================================

/**
 * Generates a unique export ID
 */
function generateExportId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `export-${timestamp}-${random}`;
}

/**
 * Creates export metadata
 */
function createExportMetadata(userId: string, userType: UserType): ExportMetadata {
  return {
    exportId: generateExportId(),
    userId,
    userType,
    exportedAt: new Date(),
    dataProcessingPurpose: 'Matching renters with landlords and properties, facilitating rental agreements',
    legalBasis: 'Consent (GDPR Article 6(1)(a)) and Contract performance (GDPR Article 6(1)(b))',
    dataRetentionPeriod: '2 years after account closure or last activity',
    dataController: DATA_CONTROLLER,
    thirdPartyProcessors: THIRD_PARTY_PROCESSORS,
    userRights: USER_RIGHTS
  };
}

/**
 * Exports all data for a renter
 */
async function exportRenterData(
  userId: string,
  options: DataExportOptions
): Promise<UserDataExport> {
  const { useSupabase = true } = options;

  if (useSupabase) {
    // Fetch renter profile
    const { data: profile, error: profileError } = await supabase
      .from('renter_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error(`Failed to fetch renter profile: ${profileError?.message}`);
    }

    // Fetch matches
    const { data: matches } = await supabase
      .from('matches')
      .select('*')
      .eq('renter_id', userId);

    // Fetch conversations (which contain messages)
    const matchIds = matches?.map(m => m.id) || [];
    const { data: conversations } = matchIds.length > 0
      ? await supabase
          .from('conversations')
          .select('*')
          .in('match_id', matchIds)
      : { data: [] };

    // Extract all messages from conversations
    const messages = (conversations || []).flatMap(conv => conv.messages || []);

    // Fetch ratings (given and received)
    const { data: ratingsGiven } = await supabase
      .from('ratings')
      .select('*')
      .eq('from_user_id', userId);

    const { data: ratingsReceived } = await supabase
      .from('ratings')
      .select('*')
      .eq('to_user_id', userId);

    const ratings: RatingExport[] = [
      ...(ratingsGiven || []).map(r => ({ ...r, direction: 'given' as const })),
      ...(ratingsReceived || []).map(r => ({ ...r, direction: 'received' as const }))
    ];

    // Fetch viewing requests
    const { data: viewingRequests } = await supabase
      .from('viewing_requests')
      .select('*')
      .eq('renter_id', userId);

    // Fetch maintenance issues reported by renter
    const { data: maintenanceIssues } = await supabase
      .from('maintenance_issues')
      .select('*')
      .eq('reported_by', userId);

    return {
      metadata: createExportMetadata(userId, 'renter'),
      profile: profile as RenterProfile,
      matches: matches || [],
      messages: messages || [],
      ratings,
      viewingRequests: viewingRequests || [],
      maintenanceIssues: maintenanceIssues || [],
      exportedAt: new Date()
    };
  } else {
    // localStorage fallback
    const profile = JSON.parse(localStorage.getItem(`renterProfile_${userId}`) || '{}');
    const matches = JSON.parse(localStorage.getItem('matches') || '[]')
      .filter((m: Match) => m.renterId === userId);
    const messages = JSON.parse(localStorage.getItem('messages') || '[]')
      .filter((msg: Message) => matches.some((m: Match) => m.id === msg.matchId));
    const ratings = JSON.parse(localStorage.getItem('ratings') || '[]')
      .filter((r: Rating) => r.fromUserId === userId || r.toUserId === userId)
      .map((r: Rating) => ({
        ...r,
        direction: r.fromUserId === userId ? 'given' : 'received'
      }));

    return {
      metadata: createExportMetadata(userId, 'renter'),
      profile,
      matches,
      messages,
      ratings,
      exportedAt: new Date()
    };
  }
}

/**
 * Exports all data for a landlord
 */
async function exportLandlordData(
  userId: string,
  options: DataExportOptions
): Promise<UserDataExport> {
  const { useSupabase = true } = options;

  if (useSupabase) {
    // Fetch landlord profile
    const { data: profile, error: profileError } = await supabase
      .from('landlord_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error(`Failed to fetch landlord profile: ${profileError?.message}`);
    }

    // Fetch properties
    const { data: properties } = await supabase
      .from('properties')
      .select('*')
      .eq('landlord_id', userId);

    // Fetch matches
    const { data: matches } = await supabase
      .from('matches')
      .select('*')
      .eq('landlord_id', userId);

    // Fetch conversations (which contain messages)
    const matchIds = matches?.map(m => m.id) || [];
    const { data: conversations } = matchIds.length > 0
      ? await supabase
          .from('conversations')
          .select('*')
          .in('match_id', matchIds)
      : { data: [] };

    // Extract all messages from conversations
    const messages = (conversations || []).flatMap(conv => conv.messages || []);

    // Fetch ratings (given and received)
    const { data: ratingsGiven } = await supabase
      .from('ratings')
      .select('*')
      .eq('from_user_id', userId);

    const { data: ratingsReceived } = await supabase
      .from('ratings')
      .select('*')
      .eq('to_user_id', userId);

    const ratings: RatingExport[] = [
      ...(ratingsGiven || []).map(r => ({ ...r, direction: 'given' as const })),
      ...(ratingsReceived || []).map(r => ({ ...r, direction: 'received' as const }))
    ];

    // Fetch viewing requests
    const { data: viewingRequests } = await supabase
      .from('viewing_requests')
      .select('*')
      .eq('landlord_id', userId);

    // Fetch maintenance issues for landlord's properties
    const propertyIds = properties?.map(p => p.id) || [];
    const { data: maintenanceIssues } = propertyIds.length > 0
      ? await supabase
          .from('maintenance_issues')
          .select('*')
          .in('property_id', propertyIds)
      : { data: [] };

    // Fetch agency links
    const { data: agencyLinksRaw } = await supabase
      .from('agency_property_links')
      .select('*, agency:agency_profiles(company_name)')
      .eq('landlord_id', userId);

    const agencyLinks: AgencyLinkExport[] = (agencyLinksRaw || []).map(link => ({
      agencyId: link.agency_id,
      agencyName: (link.agency as { company_name?: string } | null)?.company_name || 'Unknown',
      landlordId: link.landlord_id,
      linkedAt: new Date(link.created_at),
      status: link.status
    }));

    return {
      metadata: createExportMetadata(userId, 'landlord'),
      profile: profile as LandlordProfile,
      properties: properties || [],
      matches: matches || [],
      messages: messages || [],
      ratings,
      viewingRequests: viewingRequests || [],
      maintenanceIssues: maintenanceIssues || [],
      agencyLinks,
      exportedAt: new Date()
    };
  } else {
    // localStorage fallback
    const profile = JSON.parse(localStorage.getItem(`landlordProfile_${userId}`) || '{}');
    const properties = JSON.parse(localStorage.getItem('properties') || '[]')
      .filter((p: Property) => p.landlordId === userId);
    const matches = JSON.parse(localStorage.getItem('matches') || '[]')
      .filter((m: Match) => m.landlordId === userId);
    const messages = JSON.parse(localStorage.getItem('messages') || '[]')
      .filter((msg: Message) => matches.some((m: Match) => m.id === msg.matchId));
    const ratings = JSON.parse(localStorage.getItem('ratings') || '[]')
      .filter((r: Rating) => r.fromUserId === userId || r.toUserId === userId)
      .map((r: Rating) => ({
        ...r,
        direction: r.fromUserId === userId ? 'given' : 'received'
      }));

    return {
      metadata: createExportMetadata(userId, 'landlord'),
      profile,
      properties,
      matches,
      messages,
      ratings,
      exportedAt: new Date()
    };
  }
}

/**
 * Exports all data for an agency
 */
async function exportAgencyData(
  userId: string,
  options: DataExportOptions
): Promise<UserDataExport> {
  const { useSupabase = true } = options;

  if (useSupabase) {
    // Fetch agency profile
    const { data: profile, error: profileError } = await supabase
      .from('agency_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error(`Failed to fetch agency profile: ${profileError?.message}`);
    }

    // Fetch properties managed by agency
    const { data: properties } = await supabase
      .from('properties')
      .select('*')
      .or(`managing_agency_id.eq.${userId},marketing_agent_id.eq.${userId}`);

    // Fetch matches facilitated by agency
    const { data: matches } = await supabase
      .from('matches')
      .select('*')
      .or(`managing_agency_id.eq.${userId},marketing_agent_id.eq.${userId}`);

    // Fetch conversations in agency-related matches
    const matchIds = matches?.map(m => m.id) || [];
    const { data: conversations } = matchIds.length > 0
      ? await supabase
          .from('conversations')
          .select('*')
          .in('match_id', matchIds)
      : { data: [] };

    // Extract all messages from conversations
    const messages = (conversations || []).flatMap(conv => conv.messages || []);

    // Fetch landlord links
    const { data: agencyLinksRaw } = await supabase
      .from('agency_property_links')
      .select('*, landlord:landlord_profiles(names)')
      .eq('agency_id', userId);

    const agencyLinks: AgencyLinkExport[] = (agencyLinksRaw || []).map(link => ({
      agencyId: link.agency_id,
      agencyName: profile.company_name,
      landlordId: link.landlord_id,
      linkedAt: new Date(link.created_at),
      status: link.status
    }));

    return {
      metadata: createExportMetadata(userId, 'estate_agent'),
      profile: profile as AgencyProfile,
      properties: properties || [],
      matches: matches || [],
      messages: messages || [],
      agencyLinks,
      exportedAt: new Date()
    };
  } else {
    // localStorage fallback
    const profile = JSON.parse(localStorage.getItem(`agencyProfile_${userId}`) || '{}');
    const properties = JSON.parse(localStorage.getItem('properties') || '[]')
      .filter((p: Property) => p.managingAgencyId === userId || p.marketingAgentId === userId);
    const matches = JSON.parse(localStorage.getItem('matches') || '[]')
      .filter((m: Match) => m.managingAgencyId === userId || m.marketingAgentId === userId);

    return {
      metadata: createExportMetadata(userId, 'estate_agent'),
      profile,
      properties,
      matches,
      exportedAt: new Date()
    };
  }
}

// =====================================================
// FORMAT CONVERSION FUNCTIONS
// =====================================================

/**
 * Converts export data to JSON string
 */
function toJSON(data: UserDataExport): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Converts export data to CSV format
 * Creates separate CSV files for each data type
 */
function toCSV(data: UserDataExport): Record<string, string> {
  const csvFiles: Record<string, string> = {};

  // Helper function to convert array of objects to CSV
  const arrayToCSV = (arr: Record<string, unknown>[]): string => {
    if (arr.length === 0) return '';

    const headers = Object.keys(arr[0]);
    const rows = arr.map(obj =>
      headers.map(header => {
        const value = obj[header];
        // Escape quotes and wrap in quotes if contains comma
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  };

  // Export profile
  csvFiles['profile.csv'] = arrayToCSV([data.profile as unknown as Record<string, unknown>]);

  // Export properties if present
  if (data.properties && data.properties.length > 0) {
    csvFiles['properties.csv'] = arrayToCSV(data.properties as unknown as Record<string, unknown>[]);
  }

  // Export matches if present
  if (data.matches && data.matches.length > 0) {
    csvFiles['matches.csv'] = arrayToCSV(data.matches as unknown as Record<string, unknown>[]);
  }

  // Export messages if present
  if (data.messages && data.messages.length > 0) {
    csvFiles['messages.csv'] = arrayToCSV(data.messages as unknown as Record<string, unknown>[]);
  }

  // Export ratings if present
  if (data.ratings && data.ratings.length > 0) {
    csvFiles['ratings.csv'] = arrayToCSV(data.ratings as unknown as Record<string, unknown>[]);
  }

  // Export viewing requests if present
  if (data.viewingRequests && data.viewingRequests.length > 0) {
    csvFiles['viewing_requests.csv'] = arrayToCSV(data.viewingRequests as unknown as Record<string, unknown>[]);
  }

  // Export maintenance issues if present
  if (data.maintenanceIssues && data.maintenanceIssues.length > 0) {
    csvFiles['maintenance_issues.csv'] = arrayToCSV(data.maintenanceIssues as unknown as Record<string, unknown>[]);
  }

  // Export agency links if present
  if (data.agencyLinks && data.agencyLinks.length > 0) {
    csvFiles['agency_links.csv'] = arrayToCSV(data.agencyLinks as unknown as Record<string, unknown>[]);
  }

  return csvFiles;
}

// =====================================================
// MAIN EXPORT FUNCTION
// =====================================================

/**
 * Exports all user data in the requested format
 *
 * This function implements GDPR Articles 15 & 20 by providing users with
 * a complete export of their personal data in a structured, machine-readable format.
 *
 * @param userId - ID of the user requesting export
 * @param userType - Type of user (renter, landlord, agency)
 * @param options - Export options
 * @returns Export result with download data
 *
 * @example
 * ```typescript
 * // Export all data as JSON
 * const result = await exportUserData('user-123', 'renter', {
 *   format: 'json',
 *   includeMetadata: true
 * });
 *
 * // Download the data
 * const blob = new Blob([result.jsonData!], { type: 'application/json' });
 * const url = URL.createObjectURL(blob);
 * // Trigger download...
 * ```
 */
export async function exportUserData(
  userId: string,
  userType: UserType,
  options: DataExportOptions = {}
): Promise<ExportResult> {
  const { format = 'both' } = options;

  try {
    // Fetch data based on user type
    let exportData: UserDataExport;

    switch (userType) {
      case 'renter':
        exportData = await exportRenterData(userId, options);
        break;
      case 'landlord':
        exportData = await exportLandlordData(userId, options);
        break;
      case 'estate_agent':
      case 'management_agency':
        exportData = await exportAgencyData(userId, options);
        break;
      default:
        throw new Error(`Unsupported user type: ${userType}`);
    }

    // Convert to requested format
    const result: ExportResult = {
      success: true,
      exportId: exportData.metadata.exportId
    };

    if (format === 'json' || format === 'both') {
      result.jsonData = toJSON(exportData);
    }

    if (format === 'csv' || format === 'both') {
      const csvFiles = toCSV(exportData);
      // For browser download, we'll combine all CSV files with separators
      result.csvData = Object.entries(csvFiles)
        .map(([filename, content]) => `=== ${filename} ===\n${content}`)
        .join('\n\n');
    }

    // Log export for audit purposes
    await logExport(userId, userType, exportData.metadata.exportId);

    return result;
  } catch (error) {
    console.error('Failed to export user data:', error);
    return {
      success: false,
      exportId: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Triggers a browser download of the exported data
 *
 * @param result - Export result from exportUserData
 * @param filename - Base filename (without extension)
 */
export function downloadExportData(result: ExportResult, filename: string = 'my-data'): void {
  if (!result.success) {
    throw new Error(`Cannot download failed export: ${result.error}`);
  }

  if (result.jsonData) {
    const blob = new Blob([result.jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (result.csvData) {
    const blob = new Blob([result.csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// =====================================================
// AUDIT LOGGING
// =====================================================

/**
 * Logs export operation for GDPR Article 30 compliance
 */
async function logExport(userId: string, userType: UserType, exportId: string): Promise<void> {
  try {
    const { error } = await supabase.from('gdpr_audit_log').insert({
      user_id: userId,
      user_type: userType,
      operation: 'data_export',
      details: {
        export_id: exportId,
        timestamp: new Date().toISOString()
      }
    });

    if (error) {
      console.error('Failed to log export operation:', error);
    }
  } catch (error) {
    console.error('Failed to log export operation:', error);
  }
}
