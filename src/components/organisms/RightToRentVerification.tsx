/**
 * Right to Rent Verification Component
 *
 * Provides UI for renters to verify their identity using Stripe Identity.
 * Stores ONLY verification status - NO document data retained.
 *
 * Features:
 * - Start verification flow
 * - Show current verification status
 * - Display expiry warnings
 * - Handle re-verification
 */

import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertTriangle, Clock, RefreshCw, ExternalLink } from 'lucide-react';
import { identityVerificationService } from '../../services/IdentityVerificationService';
import type { VerificationStatus } from '../../services/IdentityVerificationService';
import { useAuthStore } from '../../hooks/useAuthStore';
import type { RenterProfile } from '../../types';

interface RightToRentVerificationProps {
  onVerified?: () => void;
  onSkipped?: () => void;
  showSkipOption?: boolean;
  compact?: boolean;
}

export const RightToRentVerification: React.FC<RightToRentVerificationProps> = ({
  onVerified,
  onSkipped,
  showSkipOption = false,
  compact = false,
}) => {
  const { currentUser } = useAuthStore();
  const renter = currentUser as RenterProfile | null;

  const [status, setStatus] = useState<VerificationStatus>('not_started');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [showDemoMode, setShowDemoMode] = useState(false);

  useEffect(() => {
    if (renter) {
      loadVerificationStatus();
    }
  }, [renter?.id]);

  const loadVerificationStatus = async () => {
    if (!renter?.id) return;

    try {
      // Check profile first
      if (renter.rightToRentVerified && renter.rightToRentExpiresAt) {
        const expiry = new Date(renter.rightToRentExpiresAt);
        if (expiry > new Date()) {
          setStatus('verified');
          setExpiresAt(expiry);
          return;
        } else {
          setStatus('expired');
          setExpiresAt(expiry);
          return;
        }
      }

      // Otherwise check service
      const verificationStatus = await identityVerificationService.getVerificationStatus(renter.id);
      if (verificationStatus.rightToRent) {
        setStatus(verificationStatus.rightToRent.status);
        setExpiresAt(verificationStatus.rightToRent.expiresAt || null);
      }
    } catch (err) {
      console.error('Failed to load verification status:', err);
    }
  };

  const handleStartVerification = async () => {
    if (!renter?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      // Check if Stripe is configured
      if (!identityVerificationService.isConfigured()) {
        setShowDemoMode(true);
        return;
      }

      const session = await identityVerificationService.createRightToRentSession(renter.id);

      // In production, this would redirect to Stripe Identity or open their modal
      // For now, we'll simulate the flow
      setStatus('pending');

      // Simulate redirect to Stripe Identity
      console.log('Verification session created:', session.sessionId);

      // In a real implementation:
      // window.location.href = session.redirectUrl;
      // OR use Stripe Identity SDK

      setShowDemoMode(true);
    } catch (err) {
      setError('Failed to start verification. Please try again.');
      console.error('Verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoVerification = async (success: boolean) => {
    if (!renter?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      if (success) {
        const result = await identityVerificationService.simulateSuccessfulVerification(
          renter.id,
          'passport'
        );
        setStatus(result.status);
        setExpiresAt(result.expiryDate || null);
        onVerified?.();
      } else {
        const result = await identityVerificationService.simulateFailedVerification(
          renter.id,
          'Document could not be verified'
        );
        setStatus(result.status);
        setError(result.failureReason || 'Verification failed');
      }
    } catch (err) {
      setError('Demo verification failed. Please try again.');
    } finally {
      setIsLoading(false);
      setShowDemoMode(false);
    }
  };

  const getStatusDisplay = () => {
    switch (status) {
      case 'verified':
        const isExpiringSoon = expiresAt && identityVerificationService.isExpiringSoon(expiresAt);
        return {
          icon: <CheckCircle className="w-6 h-6 text-green-500" />,
          title: 'Verified',
          description: isExpiringSoon
            ? `Expires ${expiresAt?.toLocaleDateString()}. Please renew soon.`
            : `Valid until ${expiresAt?.toLocaleDateString()}`,
          color: isExpiringSoon ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200',
          textColor: isExpiringSoon ? 'text-yellow-800' : 'text-green-800',
        };

      case 'pending':
      case 'processing':
        return {
          icon: <Clock className="w-6 h-6 text-blue-500 animate-pulse" />,
          title: 'Verification in Progress',
          description: 'We\'re verifying your identity. This usually takes a few minutes.',
          color: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-800',
        };

      case 'failed':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-red-500" />,
          title: 'Verification Failed',
          description: error || 'Your identity could not be verified. Please try again.',
          color: 'bg-red-50 border-red-200',
          textColor: 'text-red-800',
        };

      case 'expired':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-orange-500" />,
          title: 'Verification Expired',
          description: 'Your verification has expired. Please verify again to continue.',
          color: 'bg-orange-50 border-orange-200',
          textColor: 'text-orange-800',
        };

      default:
        return {
          icon: <Shield className="w-6 h-6 text-gray-500" />,
          title: 'Identity Verification Required',
          description: 'Verify your Right to Rent to apply for properties.',
          color: 'bg-gray-50 border-gray-200',
          textColor: 'text-gray-800',
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  if (compact && status === 'verified') {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm font-medium">ID Verified</span>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-4 ${statusDisplay.color}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">{statusDisplay.icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold ${statusDisplay.textColor}`}>
            {statusDisplay.title}
          </h3>
          <p className={`mt-1 text-sm ${statusDisplay.textColor} opacity-80`}>
            {statusDisplay.description}
          </p>

          {/* Action buttons based on status */}
          {(status === 'not_started' || status === 'failed' || status === 'expired') && (
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={handleStartVerification}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                {status === 'not_started' ? 'Verify Identity' : 'Try Again'}
              </button>

              {showSkipOption && status === 'not_started' && (
                <button
                  onClick={onSkipped}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Skip for now
                </button>
              )}
            </div>
          )}

          {/* Verified with expiring soon - show renewal button */}
          {status === 'verified' && expiresAt && identityVerificationService.isExpiringSoon(expiresAt) && (
            <button
              onClick={handleStartVerification}
              disabled={isLoading}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Renew Verification
            </button>
          )}
        </div>
      </div>

      {/* Demo mode modal */}
      {showDemoMode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <Shield className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Demo: Stripe Identity Verification
              </h3>
              <p className="text-gray-600 mb-6">
                In production, this would redirect to Stripe Identity to verify your passport or ID.
                For demo purposes, choose a verification outcome:
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => handleDemoVerification(true)}
                  disabled={isLoading}
                  className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Simulate Successful Verification
                </button>

                <button
                  onClick={() => handleDemoVerification(false)}
                  disabled={isLoading}
                  className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Simulate Failed Verification
                </button>

                <button
                  onClick={() => setShowDemoMode(false)}
                  className="w-full py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>

              <div className="mt-6 pt-4 border-t text-sm text-gray-500">
                <a
                  href="https://stripe.com/identity"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                >
                  Learn about Stripe Identity
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && status !== 'failed' && (
        <div className="mt-3 p-3 bg-red-100 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Info about what we store */}
      {status === 'not_started' && (
        <div className="mt-4 text-xs text-gray-500">
          <p className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            We only store verification status, not your documents.
          </p>
        </div>
      )}
    </div>
  );
};

export default RightToRentVerification;
