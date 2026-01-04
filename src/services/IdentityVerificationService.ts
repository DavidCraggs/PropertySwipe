/**
 * Identity Verification Service
 *
 * Integrates with Stripe Identity for ID verification.
 * Stores ONLY verification status - NO document data retained.
 *
 * Key Principles:
 * 1. Zero document storage - all documents handled by Stripe
 * 2. Only store: verified (boolean), verifiedAt, expiresAt
 * 3. Right to Rent verification valid for 1 year
 * 4. Re-verification triggered 30 days before expiry
 */

import { supabase } from '../lib/supabase';

// =====================================================
// TYPES
// =====================================================

export type VerificationType = 'right_to_rent' | 'prs_registration' | 'income';

export type VerificationStatus =
  | 'not_started'
  | 'pending'
  | 'processing'
  | 'verified'
  | 'failed'
  | 'expired';

export type DocumentType =
  | 'passport'
  | 'driving_license'
  | 'biometric_residence_permit'
  | 'share_code'
  | 'other';

export interface VerificationSession {
  sessionId: string;
  clientSecret: string; // For Stripe Identity SDK
  redirectUrl?: string; // Alternative redirect flow
  expiresAt: Date;
}

export interface VerificationResult {
  verified: boolean;
  status: VerificationStatus;
  verifiedAt?: Date;
  expiryDate?: Date; // When re-verification is needed (1 year for Right to Rent)
  documentType?: DocumentType;
  checksPerformed: string[];
  failureReason?: string;
}

export interface UserVerificationStatus {
  userId: string;
  userType: 'renter' | 'landlord';
  rightToRent?: {
    status: VerificationStatus;
    verifiedAt?: Date;
    expiresAt?: Date;
    documentType?: DocumentType;
    lastCheckSessionId?: string;
  };
  prsRegistration?: {
    status: VerificationStatus;
    registrationNumber?: string;
    verifiedAt?: Date;
    expiresAt?: Date;
  };
  income?: {
    status: VerificationStatus;
    verifiedAt?: Date;
    verifiedMonthlyAmount?: number;
  };
}

// =====================================================
// STRIPE IDENTITY SERVICE
// =====================================================

class IdentityVerificationService {
  private stripePublishableKey: string;

  constructor() {
    this.stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
  }

  /**
   * Check if Stripe is configured
   */
  isConfigured(): boolean {
    return Boolean(this.stripePublishableKey);
  }

  /**
   * Create a new verification session for Right to Rent check
   * This calls our backend which uses Stripe's server-side SDK
   */
  async createRightToRentSession(userId: string): Promise<VerificationSession> {
    // In production, this would call your backend API which uses Stripe's SDK
    // For now, we'll simulate the flow and store status locally

    const sessionId = `vs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store pending verification in database
    const { error } = await supabase
      .from('verification_sessions')
      .insert({
        id: sessionId,
        user_id: userId,
        verification_type: 'right_to_rent',
        status: 'pending',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min expiry
      });

    if (error) {
      console.error('Failed to create verification session:', error);
      throw new Error('Failed to create verification session');
    }

    return {
      sessionId,
      clientSecret: `seti_${sessionId}_secret`, // Would come from Stripe in production
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    };
  }

  /**
   * Get verification status for a user
   */
  async getVerificationStatus(userId: string): Promise<UserVerificationStatus> {
    const { data, error } = await supabase
      .from('user_verifications')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Failed to get verification status:', error);
    }

    // Return default unverified status if no record exists
    if (!data) {
      return {
        userId,
        userType: 'renter',
        rightToRent: {
          status: 'not_started',
        },
      };
    }

    return {
      userId,
      userType: data.user_type,
      rightToRent: data.right_to_rent_status ? {
        status: data.right_to_rent_status as VerificationStatus,
        verifiedAt: data.right_to_rent_verified_at ? new Date(data.right_to_rent_verified_at) : undefined,
        expiresAt: data.right_to_rent_expires_at ? new Date(data.right_to_rent_expires_at) : undefined,
        documentType: data.right_to_rent_document_type as DocumentType,
        lastCheckSessionId: data.last_verification_session_id,
      } : { status: 'not_started' },
      prsRegistration: data.prs_status ? {
        status: data.prs_status as VerificationStatus,
        registrationNumber: data.prs_registration_number,
        verifiedAt: data.prs_verified_at ? new Date(data.prs_verified_at) : undefined,
        expiresAt: data.prs_expires_at ? new Date(data.prs_expires_at) : undefined,
      } : undefined,
    };
  }

  /**
   * Process verification result from Stripe webhook
   * This would be called by your backend when Stripe sends the verification result
   */
  async processVerificationResult(
    sessionId: string,
    result: {
      verified: boolean;
      documentType?: DocumentType;
      failureReason?: string;
    }
  ): Promise<VerificationResult> {
    // Get session to find user
    const { data: session } = await supabase
      .from('verification_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!session) {
      throw new Error('Verification session not found');
    }

    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year validity

    const verificationResult: VerificationResult = {
      verified: result.verified,
      status: result.verified ? 'verified' : 'failed',
      verifiedAt: result.verified ? now : undefined,
      expiryDate: result.verified ? expiryDate : undefined,
      documentType: result.documentType,
      checksPerformed: ['document_authenticity', 'face_match', 'liveness'],
      failureReason: result.failureReason,
    };

    // Update user verification status
    await supabase
      .from('user_verifications')
      .upsert({
        user_id: session.user_id,
        user_type: 'renter',
        right_to_rent_status: verificationResult.status,
        right_to_rent_verified_at: verificationResult.verifiedAt?.toISOString(),
        right_to_rent_expires_at: verificationResult.expiryDate?.toISOString(),
        right_to_rent_document_type: verificationResult.documentType,
        last_verification_session_id: sessionId,
        updated_at: now.toISOString(),
      }, {
        onConflict: 'user_id',
      });

    // Update session status
    await supabase
      .from('verification_sessions')
      .update({
        status: verificationResult.status,
        completed_at: now.toISOString(),
      })
      .eq('id', sessionId);

    // Also update renter profile with verification status
    await supabase
      .from('renter_profiles')
      .update({
        right_to_rent_verified: result.verified,
        right_to_rent_verified_at: result.verified ? now.toISOString() : null,
        right_to_rent_expires_at: result.verified ? expiryDate.toISOString() : null,
        right_to_rent_document_type: result.documentType,
      })
      .eq('id', session.user_id);

    return verificationResult;
  }

  /**
   * Check if verification is expiring soon (within 30 days)
   */
  isExpiringSoon(expiresAt?: Date): boolean {
    if (!expiresAt) return false;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiresAt <= thirtyDaysFromNow;
  }

  /**
   * Check if verification has expired
   */
  isExpired(expiresAt?: Date): boolean {
    if (!expiresAt) return true;
    return expiresAt <= new Date();
  }

  /**
   * Get users with expiring verifications (for scheduled notifications)
   */
  async getExpiringVerifications(daysUntilExpiry: number = 30): Promise<string[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysUntilExpiry);

    const { data, error } = await supabase
      .from('user_verifications')
      .select('user_id')
      .eq('right_to_rent_status', 'verified')
      .lte('right_to_rent_expires_at', cutoffDate.toISOString())
      .gte('right_to_rent_expires_at', new Date().toISOString());

    if (error) {
      console.error('Failed to get expiring verifications:', error);
      return [];
    }

    return data.map(d => d.user_id);
  }

  /**
   * Revoke verification (for GDPR deletion or fraud detection)
   */
  async revokeVerification(userId: string, reason: string): Promise<void> {
    await supabase
      .from('user_verifications')
      .update({
        right_to_rent_status: 'not_started',
        right_to_rent_verified_at: null,
        right_to_rent_expires_at: null,
        right_to_rent_document_type: null,
        revoked_at: new Date().toISOString(),
        revocation_reason: reason,
      })
      .eq('user_id', userId);

    // Also update renter profile
    await supabase
      .from('renter_profiles')
      .update({
        right_to_rent_verified: false,
        right_to_rent_verified_at: null,
        right_to_rent_expires_at: null,
      })
      .eq('id', userId);
  }

  // =====================================================
  // LANDLORD PRS VERIFICATION
  // =====================================================

  /**
   * Verify landlord PRS registration number
   * In production, this would query the government PRS database API
   */
  async verifyPRSRegistration(
    landlordId: string,
    registrationNumber: string
  ): Promise<{
    verified: boolean;
    expiresAt?: Date;
    error?: string;
  }> {
    // Simulate PRS database lookup
    // In production, this would call the HM Land Registry PRS Database API

    // For demo: Accept registration numbers that start with 'PRS-'
    const isValidFormat = /^PRS-\d{6,10}$/.test(registrationNumber);

    if (!isValidFormat) {
      return {
        verified: false,
        error: 'Invalid PRS registration number format. Expected: PRS-XXXXXX',
      };
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // Update landlord profile with PRS verification
    await supabase
      .from('landlord_profiles')
      .update({
        prs_registration_number: registrationNumber,
        prs_registration_status: 'active',
        prs_registration_date: now.toISOString(),
        prs_registration_expiry_date: expiresAt.toISOString(),
        is_fully_compliant: true, // Would check ombudsman too in production
      })
      .eq('id', landlordId);

    return {
      verified: true,
      expiresAt,
    };
  }

  // =====================================================
  // DEMO/DEVELOPMENT HELPERS
  // =====================================================

  /**
   * Simulate successful verification (for development/demo only)
   */
  async simulateSuccessfulVerification(
    userId: string,
    documentType: DocumentType = 'passport'
  ): Promise<VerificationResult> {
    const session = await this.createRightToRentSession(userId);
    return this.processVerificationResult(session.sessionId, {
      verified: true,
      documentType,
    });
  }

  /**
   * Simulate failed verification (for development/demo only)
   */
  async simulateFailedVerification(
    userId: string,
    reason: string = 'Document could not be verified'
  ): Promise<VerificationResult> {
    const session = await this.createRightToRentSession(userId);
    return this.processVerificationResult(session.sessionId, {
      verified: false,
      failureReason: reason,
    });
  }
}

// Export singleton instance
export const identityVerificationService = new IdentityVerificationService();

// Export types for external use
export type { IdentityVerificationService };
