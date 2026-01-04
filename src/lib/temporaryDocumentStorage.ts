/**
 * Temporary Document Storage
 *
 * Handles temporary storage of documents for verification purposes.
 * Key principles:
 * 1. Maximum 72-hour retention
 * 2. Auto-deletion after verification complete
 * 3. Encrypted at rest (Supabase Storage handles this)
 * 4. Access audit logging
 *
 * Used for edge cases like manual PRS registration verification
 * where documents need temporary review.
 */

import { supabase } from './supabase';

// =====================================================
// TYPES
// =====================================================

export type DocumentPurpose =
  | 'identity_verification'
  | 'income_verification'
  | 'reference_check'
  | 'prs_registration'
  | 'gas_safety_certificate'
  | 'epc_certificate';

export interface TemporaryDocument {
  id: string;
  userId: string;
  purpose: DocumentPurpose;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  uploadedAt: Date;
  expiresAt: Date;
  accessedBy: string[];
  deletedAt?: Date;
  verificationComplete: boolean;
}

export interface UploadResult {
  success: boolean;
  document?: TemporaryDocument;
  error?: string;
}

// =====================================================
// CONSTANTS
// =====================================================

const MAX_RETENTION_HOURS = 72;
const MAX_FILE_SIZE_MB = 10;
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

const BUCKET_NAME = 'temp-documents';

// =====================================================
// UPLOAD FUNCTIONS
// =====================================================

/**
 * Upload a temporary document for verification
 * Auto-expires after 72 hours maximum
 */
export async function uploadTemporaryDocument(
  userId: string,
  file: File,
  purpose: DocumentPurpose,
  maxRetentionHours: number = MAX_RETENTION_HOURS
): Promise<UploadResult> {
  // Validate file type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      success: false,
      error: `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
    };
  }

  // Validate file size
  const maxSizeBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      success: false,
      error: `File too large. Maximum size: ${MAX_FILE_SIZE_MB}MB`,
    };
  }

  // Enforce maximum retention
  const retentionHours = Math.min(maxRetentionHours, MAX_RETENTION_HOURS);

  try {
    // Generate unique file path
    const documentId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fileExtension = file.name.split('.').pop() || 'bin';
    const storagePath = `${userId}/${documentId}.${fileExtension}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, file, {
        cacheControl: '0', // No caching for sensitive documents
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return {
        success: false,
        error: 'Failed to upload document. Please try again.',
      };
    }

    // Create database record
    const now = new Date();
    const expiresAt = new Date(now.getTime() + retentionHours * 60 * 60 * 1000);

    const documentRecord: Omit<TemporaryDocument, 'accessedBy' | 'deletedAt'> & {
      accessed_by: string[];
      storage_path: string;
    } = {
      id: documentId,
      userId,
      purpose,
      fileName: file.name,
      mimeType: file.type,
      fileSizeBytes: file.size,
      uploadedAt: now,
      expiresAt,
      accessed_by: [],
      storage_path: storagePath,
      verificationComplete: false,
    };

    const { error: dbError } = await supabase
      .from('temporary_documents')
      .insert({
        id: documentRecord.id,
        user_id: documentRecord.userId,
        purpose: documentRecord.purpose,
        file_name: documentRecord.fileName,
        mime_type: documentRecord.mimeType,
        file_size_bytes: documentRecord.fileSizeBytes,
        uploaded_at: documentRecord.uploadedAt.toISOString(),
        expires_at: documentRecord.expiresAt.toISOString(),
        accessed_by: documentRecord.accessed_by,
        storage_path: documentRecord.storage_path,
        verification_complete: documentRecord.verificationComplete,
      });

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
      console.error('Database error:', dbError);
      return {
        success: false,
        error: 'Failed to record document. Please try again.',
      };
    }

    // Log upload event
    await logDocumentAccess(documentId, userId, 'upload');

    return {
      success: true,
      document: {
        id: documentId,
        userId,
        purpose,
        fileName: file.name,
        mimeType: file.type,
        fileSizeBytes: file.size,
        uploadedAt: now,
        expiresAt,
        accessedBy: [],
        verificationComplete: false,
      },
    };
  } catch (err) {
    console.error('Upload failed:', err);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

// =====================================================
// ACCESS FUNCTIONS
// =====================================================

/**
 * Get a signed URL for temporary document access
 * Logs access for audit trail
 */
export async function getDocumentUrl(
  documentId: string,
  accessedBy: string
): Promise<{ url: string | null; error?: string }> {
  try {
    // Get document record
    const { data: doc, error: fetchError } = await supabase
      .from('temporary_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError || !doc) {
      return { url: null, error: 'Document not found' };
    }

    // Check if expired
    if (new Date(doc.expires_at) < new Date()) {
      return { url: null, error: 'Document has expired' };
    }

    // Check if deleted
    if (doc.deleted_at) {
      return { url: null, error: 'Document has been deleted' };
    }

    // Get signed URL (5 minute expiry)
    const { data: urlData, error: urlError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(doc.storage_path, 300);

    if (urlError || !urlData?.signedUrl) {
      return { url: null, error: 'Failed to generate access URL' };
    }

    // Log access
    await logDocumentAccess(documentId, accessedBy, 'view');

    // Update accessed_by array
    await supabase
      .from('temporary_documents')
      .update({
        accessed_by: [...(doc.accessed_by || []), accessedBy],
      })
      .eq('id', documentId);

    return { url: urlData.signedUrl };
  } catch (err) {
    console.error('Get document URL failed:', err);
    return { url: null, error: 'Failed to access document' };
  }
}

// =====================================================
// DELETION FUNCTIONS
// =====================================================

/**
 * Delete a specific document
 */
export async function deleteDocument(documentId: string): Promise<boolean> {
  try {
    // Get document to find storage path
    const { data: doc, error: fetchError } = await supabase
      .from('temporary_documents')
      .select('storage_path, user_id')
      .eq('id', documentId)
      .single();

    if (fetchError || !doc) {
      console.error('Document not found for deletion:', documentId);
      return false;
    }

    // Delete from storage
    await supabase.storage.from(BUCKET_NAME).remove([doc.storage_path]);

    // Mark as deleted in database (soft delete for audit)
    await supabase
      .from('temporary_documents')
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    // Log deletion
    await logDocumentAccess(documentId, 'system', 'delete');

    return true;
  } catch (err) {
    console.error('Delete document failed:', err);
    return false;
  }
}

/**
 * Mark verification as complete and delete document
 */
export async function markVerificationComplete(documentId: string): Promise<boolean> {
  try {
    await supabase
      .from('temporary_documents')
      .update({
        verification_complete: true,
      })
      .eq('id', documentId);

    // Delete the document now that verification is complete
    return await deleteDocument(documentId);
  } catch (err) {
    console.error('Mark verification complete failed:', err);
    return false;
  }
}

/**
 * Purge all expired documents
 * Should be run hourly via scheduled job
 */
export async function purgeExpiredDocuments(): Promise<number> {
  try {
    // Get all expired documents
    const { data: expiredDocs, error: fetchError } = await supabase
      .from('temporary_documents')
      .select('id, storage_path')
      .lt('expires_at', new Date().toISOString())
      .is('deleted_at', null);

    if (fetchError || !expiredDocs || expiredDocs.length === 0) {
      return 0;
    }

    // Delete from storage
    const storagePaths = expiredDocs.map(d => d.storage_path);
    await supabase.storage.from(BUCKET_NAME).remove(storagePaths);

    // Mark as deleted in database
    const ids = expiredDocs.map(d => d.id);
    await supabase
      .from('temporary_documents')
      .update({
        deleted_at: new Date().toISOString(),
      })
      .in('id', ids);

    console.log(`Purged ${expiredDocs.length} expired documents`);
    return expiredDocs.length;
  } catch (err) {
    console.error('Purge expired documents failed:', err);
    return 0;
  }
}

// =====================================================
// AUDIT LOGGING
// =====================================================

type DocumentAction = 'upload' | 'view' | 'delete' | 'verify';

async function logDocumentAccess(
  documentId: string,
  accessedBy: string,
  action: DocumentAction
): Promise<void> {
  try {
    await supabase.from('document_access_log').insert({
      document_id: documentId,
      accessed_by: accessedBy,
      action,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    // Don't fail the main operation if logging fails
    console.error('Failed to log document access:', err);
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Get all documents for a user
 */
export async function getUserDocuments(userId: string): Promise<TemporaryDocument[]> {
  const { data, error } = await supabase
    .from('temporary_documents')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .gte('expires_at', new Date().toISOString());

  if (error) {
    console.error('Failed to get user documents:', error);
    return [];
  }

  return data.map(d => ({
    id: d.id,
    userId: d.user_id,
    purpose: d.purpose,
    fileName: d.file_name,
    mimeType: d.mime_type,
    fileSizeBytes: d.file_size_bytes,
    uploadedAt: new Date(d.uploaded_at),
    expiresAt: new Date(d.expires_at),
    accessedBy: d.accessed_by || [],
    deletedAt: d.deleted_at ? new Date(d.deleted_at) : undefined,
    verificationComplete: d.verification_complete,
  }));
}

/**
 * Check if user has pending documents
 */
export async function hasPendingDocuments(userId: string): Promise<boolean> {
  const docs = await getUserDocuments(userId);
  return docs.some(d => !d.verificationComplete);
}
