/**
 * Agreement Service
 * Handles tenancy agreement document uploads, signatures, and management
 */

import { supabase } from './supabase';
import type {
  TenancyAgreement,
  AgreementSignatory,
  AgreementAuditEntry,
  AgreementStatus,
  SignatureType,
  AgreementAuditAction,
} from '../types';

const AGREEMENTS_BUCKET = 'tenancy-agreements';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['application/pdf'];

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Transform snake_case DB row to camelCase
 */
function transformAgreement(row: Record<string, unknown>): TenancyAgreement {
  return {
    id: row.id as string,
    matchId: row.match_id as string,
    propertyId: row.property_id as string,
    landlordId: row.landlord_id as string,
    agencyId: row.agency_id as string | undefined,
    renterId: row.renter_id as string,
    originalDocumentPath: row.original_document_path as string,
    originalFilename: row.original_filename as string,
    mimeType: row.mime_type as string,
    fileSizeBytes: row.file_size_bytes as number,
    signedDocumentPath: row.signed_document_path as string | undefined,
    signedAt: row.signed_at ? new Date(row.signed_at as string) : undefined,
    title: row.title as string,
    description: row.description as string | undefined,
    tenancyStartDate: row.tenancy_start_date ? new Date(row.tenancy_start_date as string) : undefined,
    tenancyEndDate: row.tenancy_end_date ? new Date(row.tenancy_end_date as string) : undefined,
    rentAmount: row.rent_amount as number | undefined,
    depositAmount: row.deposit_amount as number | undefined,
    status: row.status as AgreementStatus,
    expiresAt: new Date(row.expires_at as string),
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    createdBy: row.created_by as string,
    signatories: row.signatories
      ? (row.signatories as Record<string, unknown>[]).map(transformSignatory)
      : undefined,
  };
}

function transformSignatory(row: Record<string, unknown>): AgreementSignatory {
  return {
    id: row.id as string,
    agreementId: row.agreement_id as string,
    userId: row.user_id as string,
    userType: row.user_type as 'landlord' | 'agency' | 'renter',
    userEmail: row.user_email as string,
    userName: row.user_name as string,
    signingOrder: row.signing_order as number,
    isRequired: row.is_required as boolean,
    hasSigned: row.has_signed as boolean,
    signedAt: row.signed_at ? new Date(row.signed_at as string) : undefined,
    signatureData: row.signature_data as string | undefined,
    signatureType: row.signature_type as SignatureType | undefined,
    ipAddress: row.ip_address as string | undefined,
    userAgent: row.user_agent as string | undefined,
    invitationSentAt: row.invitation_sent_at ? new Date(row.invitation_sent_at as string) : undefined,
    lastReminderAt: row.last_reminder_at ? new Date(row.last_reminder_at as string) : undefined,
    reminderCount: row.reminder_count as number,
    createdAt: new Date(row.created_at as string),
  };
}

// =====================================================
// AGREEMENT CRUD OPERATIONS
// =====================================================

/**
 * Upload a new tenancy agreement
 */
export async function uploadAgreement(
  file: File,
  matchId: string,
  metadata: {
    title: string;
    description?: string;
    tenancyStartDate?: Date;
    tenancyEndDate?: Date;
    rentAmount?: number;
    depositAmount?: number;
  },
  signatories: Array<{
    userId: string;
    userType: 'landlord' | 'agency' | 'renter';
    userEmail: string;
    userName: string;
    signingOrder: number;
    isRequired?: boolean;
  }>,
  createdBy: string
): Promise<TenancyAgreement> {
  // Validate file
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Only PDF files are allowed');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 10MB limit');
  }

  // Get match details to populate agreement
  const { data: matchData, error: matchError } = await supabase
    .from('matches')
    .select('*, property:properties(*)')
    .eq('id', matchId)
    .single();

  if (matchError || !matchData) {
    throw new Error('Match not found');
  }

  // Security check: verify the uploader is authorized for this match
  const isLandlord = matchData.landlord_id === createdBy;
  const isAgency = matchData.property?.managing_agency_id === createdBy;
  if (!isLandlord && !isAgency) {
    throw new Error('Unauthorized: You are not authorized to upload agreements for this match');
  }

  // Generate unique storage path with user ID for RLS validation
  // Path format: original/{userId}/{agreementId}/{filename}
  const agreementId = crypto.randomUUID();
  const storagePath = `original/${createdBy}/${agreementId}/${file.name}`;

  // Upload file to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(AGREEMENTS_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error('[AgreementService] Upload error:', uploadError);
    throw new Error('Failed to upload document');
  }

  // Create agreement record
  const { data: agreement, error: createError } = await supabase
    .from('tenancy_agreements')
    .insert({
      id: agreementId,
      match_id: matchId,
      property_id: matchData.property_id,
      landlord_id: matchData.landlord_id,
      agency_id: matchData.property?.managing_agency_id || null,
      renter_id: matchData.renter_id,
      original_document_path: storagePath,
      original_filename: file.name,
      mime_type: file.type,
      file_size_bytes: file.size,
      title: metadata.title,
      description: metadata.description || null,
      tenancy_start_date: metadata.tenancyStartDate?.toISOString().split('T')[0] || null,
      tenancy_end_date: metadata.tenancyEndDate?.toISOString().split('T')[0] || null,
      rent_amount: metadata.rentAmount || null,
      deposit_amount: metadata.depositAmount || null,
      status: 'pending_signatures',
      created_by: createdBy,
    })
    .select()
    .single();

  if (createError || !agreement) {
    // Rollback: delete uploaded file
    await supabase.storage.from(AGREEMENTS_BUCKET).remove([storagePath]);
    console.error('[AgreementService] Create error:', createError);
    throw new Error('Failed to create agreement record');
  }

  // Create signatory records
  const signatoryRecords = signatories.map((s) => ({
    agreement_id: agreementId,
    user_id: s.userId,
    user_type: s.userType,
    user_email: s.userEmail,
    user_name: s.userName,
    signing_order: s.signingOrder,
    is_required: s.isRequired ?? true,
    invitation_sent_at: new Date().toISOString(),
  }));

  const { error: signatoryError } = await supabase
    .from('agreement_signatories')
    .insert(signatoryRecords);

  if (signatoryError) {
    console.error('[AgreementService] Signatory error:', signatoryError);
    // Don't rollback agreement, just log the error
  }

  // Log audit entry
  await logAuditEntry(agreementId, 'created', createdBy, {
    filename: file.name,
    fileSize: file.size,
    signatoryCount: signatories.length,
  });

  return transformAgreement(agreement);
}

/**
 * Get all agreements for a user (as landlord, agency, or renter)
 */
export async function getUserAgreements(
  userId: string,
  userType: 'landlord' | 'agency' | 'renter'
): Promise<TenancyAgreement[]> {
  let query = supabase
    .from('tenancy_agreements')
    .select(`
      *,
      signatories:agreement_signatories(*)
    `)
    .order('created_at', { ascending: false });

  // Filter by user type
  if (userType === 'landlord') {
    query = query.eq('landlord_id', userId);
  } else if (userType === 'agency') {
    query = query.eq('agency_id', userId);
  } else {
    query = query.eq('renter_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[AgreementService] Get agreements error:', error);
    throw new Error('Failed to fetch agreements');
  }

  return (data || []).map(transformAgreement);
}

/**
 * Get agreements for a specific match
 */
export async function getAgreementsForMatch(matchId: string): Promise<TenancyAgreement[]> {
  const { data, error } = await supabase
    .from('tenancy_agreements')
    .select(`
      *,
      signatories:agreement_signatories(*)
    `)
    .eq('match_id', matchId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[AgreementService] Get match agreements error:', error);
    throw new Error('Failed to fetch agreements for match');
  }

  return (data || []).map(transformAgreement);
}

/**
 * Get a single agreement by ID
 */
export async function getAgreement(agreementId: string): Promise<TenancyAgreement | null> {
  const { data, error } = await supabase
    .from('tenancy_agreements')
    .select(`
      *,
      signatories:agreement_signatories(*)
    `)
    .eq('id', agreementId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('[AgreementService] Get agreement error:', error);
    throw new Error('Failed to fetch agreement');
  }

  return transformAgreement(data);
}

// =====================================================
// DOCUMENT ACCESS
// =====================================================

/**
 * Get a signed URL for viewing/downloading a document
 */
export async function getDocumentUrl(
  agreementId: string,
  documentType: 'original' | 'signed',
  userId: string
): Promise<string> {
  const agreement = await getAgreement(agreementId);
  if (!agreement) {
    throw new Error('Agreement not found');
  }

  const path = documentType === 'signed' && agreement.signedDocumentPath
    ? agreement.signedDocumentPath
    : agreement.originalDocumentPath;

  const { data, error } = await supabase.storage
    .from(AGREEMENTS_BUCKET)
    .createSignedUrl(path, 300); // 5 minute expiry

  if (error || !data?.signedUrl) {
    console.error('[AgreementService] Get URL error:', error);
    throw new Error('Failed to generate document URL');
  }

  // Log view action
  await logAuditEntry(agreementId, 'viewed', userId, { documentType });

  return data.signedUrl;
}

/**
 * Download document and log the action
 */
export async function downloadDocument(
  agreementId: string,
  documentType: 'original' | 'signed',
  userId: string
): Promise<string> {
  const url = await getDocumentUrl(agreementId, documentType, userId);

  // Log download action
  await logAuditEntry(agreementId, 'downloaded', userId, { documentType });

  return url;
}

// =====================================================
// SIGNING OPERATIONS
// =====================================================

/**
 * Sign an agreement
 */
export async function signAgreement(
  agreementId: string,
  userId: string,
  signatureData: string,
  signatureType: SignatureType
): Promise<void> {
  // Get the signatory record
  const { data: signatory, error: fetchError } = await supabase
    .from('agreement_signatories')
    .select('*')
    .eq('agreement_id', agreementId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !signatory) {
    throw new Error('You are not a signatory of this agreement');
  }

  if (signatory.has_signed) {
    throw new Error('You have already signed this agreement');
  }

  // Check if agreement is still valid
  const agreement = await getAgreement(agreementId);
  if (!agreement) {
    throw new Error('Agreement not found');
  }

  if (agreement.status === 'expired' || agreement.status === 'cancelled') {
    throw new Error('This agreement is no longer valid');
  }

  if (new Date() > agreement.expiresAt) {
    // Update status to expired
    await supabase
      .from('tenancy_agreements')
      .update({ status: 'expired' })
      .eq('id', agreementId);
    throw new Error('This agreement has expired');
  }

  // Update signatory with signature
  const { error: updateError } = await supabase
    .from('agreement_signatories')
    .update({
      has_signed: true,
      signed_at: new Date().toISOString(),
      signature_data: signatureData,
      signature_type: signatureType,
      ip_address: null, // Would be populated server-side
      user_agent: navigator.userAgent,
    })
    .eq('id', signatory.id);

  if (updateError) {
    console.error('[AgreementService] Sign error:', updateError);
    throw new Error('Failed to save signature');
  }

  // Log signing action
  await logAuditEntry(agreementId, 'signed', userId, {
    signatureType,
    signatoryId: signatory.id,
  });

  // Note: The database trigger will automatically update agreement status
  // to 'partially_signed' or 'fully_signed' based on remaining signatures
}

/**
 * Get signing status for an agreement
 */
export async function getSigningStatus(agreementId: string): Promise<{
  totalSignatories: number;
  signedCount: number;
  pendingSignatories: AgreementSignatory[];
  completedSignatories: AgreementSignatory[];
  isFullySigned: boolean;
}> {
  const { data, error } = await supabase
    .from('agreement_signatories')
    .select('*')
    .eq('agreement_id', agreementId)
    .order('signing_order');

  if (error) {
    console.error('[AgreementService] Get signing status error:', error);
    throw new Error('Failed to fetch signing status');
  }

  const signatories = (data || []).map(transformSignatory);
  const requiredSignatories = signatories.filter((s) => s.isRequired);

  return {
    totalSignatories: requiredSignatories.length,
    signedCount: requiredSignatories.filter((s) => s.hasSigned).length,
    pendingSignatories: signatories.filter((s) => !s.hasSigned),
    completedSignatories: signatories.filter((s) => s.hasSigned),
    isFullySigned: requiredSignatories.every((s) => s.hasSigned),
  };
}

// =====================================================
// AGREEMENT MANAGEMENT
// =====================================================

/**
 * Cancel an agreement (landlord/agency only)
 */
export async function cancelAgreement(
  agreementId: string,
  userId: string,
  reason: string
): Promise<void> {
  const agreement = await getAgreement(agreementId);
  if (!agreement) {
    throw new Error('Agreement not found');
  }

  if (agreement.status === 'fully_signed') {
    throw new Error('Cannot cancel a fully signed agreement');
  }

  const { error } = await supabase
    .from('tenancy_agreements')
    .update({ status: 'cancelled' })
    .eq('id', agreementId);

  if (error) {
    console.error('[AgreementService] Cancel error:', error);
    throw new Error('Failed to cancel agreement');
  }

  await logAuditEntry(agreementId, 'cancelled', userId, { reason });
}

/**
 * Send a reminder to pending signatories
 */
export async function sendSigningReminder(
  agreementId: string,
  signatoryId: string,
  sentBy: string
): Promise<void> {
  const { error } = await supabase
    .from('agreement_signatories')
    .update({
      last_reminder_at: new Date().toISOString(),
      reminder_count: supabase.rpc('increment', { x: 1 }), // Increment reminder count
    })
    .eq('id', signatoryId);

  if (error) {
    console.error('[AgreementService] Reminder error:', error);
    throw new Error('Failed to send reminder');
  }

  await logAuditEntry(agreementId, 'reminder_sent', sentBy, { signatoryId });

  // TODO: Integrate with email/notification service
}

// =====================================================
// AUDIT LOGGING
// =====================================================

/**
 * Log an audit entry for an agreement action
 */
export async function logAuditEntry(
  agreementId: string,
  action: AgreementAuditAction,
  performedBy?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.from('agreement_audit_log').insert({
    agreement_id: agreementId,
    action,
    performed_by: performedBy || null,
    performed_by_type: null, // Would be populated if we have user type
    metadata: metadata || null,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
  });

  if (error) {
    console.error('[AgreementService] Audit log error:', error);
    // Don't throw - audit logging failure shouldn't break the main operation
  }
}

/**
 * Get audit log for an agreement
 */
export async function getAuditLog(agreementId: string): Promise<AgreementAuditEntry[]> {
  const { data, error } = await supabase
    .from('agreement_audit_log')
    .select('*')
    .eq('agreement_id', agreementId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[AgreementService] Get audit log error:', error);
    throw new Error('Failed to fetch audit log');
  }

  return (data || []).map((row) => ({
    id: row.id,
    agreementId: row.agreement_id,
    action: row.action as AgreementAuditAction,
    performedBy: row.performed_by,
    performedByType: row.performed_by_type,
    metadata: row.metadata,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    createdAt: new Date(row.created_at),
  }));
}

// =====================================================
// STORAGE BUCKET INITIALIZATION
// =====================================================

/**
 * Initialize the storage bucket (run once during setup)
 */
export async function initializeStorage(): Promise<void> {
  const { data: buckets } = await supabase.storage.listBuckets();

  const bucketExists = buckets?.some((b) => b.name === AGREEMENTS_BUCKET);

  if (!bucketExists) {
    const { error } = await supabase.storage.createBucket(AGREEMENTS_BUCKET, {
      public: false,
      fileSizeLimit: MAX_FILE_SIZE,
      allowedMimeTypes: ALLOWED_MIME_TYPES,
    });

    if (error) {
      console.error('[AgreementService] Bucket creation error:', error);
    }
  }
}
