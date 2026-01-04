/**
 * PRS Registration Verification Component
 *
 * Allows landlords to verify their Private Rented Sector registration.
 * Per RRA 2025, landlords must be registered in the PRS Database.
 *
 * Features:
 * - Enter PRS registration number
 * - Verify against government database (simulated for demo)
 * - Show verification status
 * - Handle expiry warnings
 */

import React, { useState, useEffect } from 'react';
import { Building2, CheckCircle, AlertTriangle, Clock, RefreshCw, Search, ExternalLink } from 'lucide-react';
import { identityVerificationService } from '../../services/IdentityVerificationService';
import { useAuthStore } from '../../hooks/useAuthStore';
import type { LandlordProfile, PRSRegistrationStatus } from '../../types';

interface PRSVerificationProps {
  onVerified?: () => void;
  compact?: boolean;
}

export const PRSVerification: React.FC<PRSVerificationProps> = ({
  onVerified,
  compact = false,
}) => {
  const { currentUser, updateProfile } = useAuthStore();
  const landlord = currentUser as LandlordProfile | null;

  const [registrationNumber, setRegistrationNumber] = useState('');
  const [status, setStatus] = useState<PRSRegistrationStatus>('not_registered');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  useEffect(() => {
    if (landlord) {
      setStatus(landlord.prsRegistrationStatus || 'not_registered');
      setRegistrationNumber(landlord.prsRegistrationNumber || '');
      if (landlord.prsRegistrationExpiryDate) {
        setExpiresAt(new Date(landlord.prsRegistrationExpiryDate));
      }
    }
  }, [landlord]);

  const handleVerify = async () => {
    if (!landlord?.id || !registrationNumber.trim()) {
      setError('Please enter your PRS registration number');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await identityVerificationService.verifyPRSRegistration(
        landlord.id,
        registrationNumber.trim()
      );

      if (result.verified) {
        setStatus('active');
        setExpiresAt(result.expiresAt || null);

        // Update local state
        await updateProfile({
          prsRegistrationNumber: registrationNumber.trim(),
          prsRegistrationStatus: 'active',
          prsRegistrationDate: new Date(),
          prsRegistrationExpiryDate: result.expiresAt,
          isFullyCompliant: true,
        });

        onVerified?.();
      } else {
        setStatus('not_registered');
        setError(result.error || 'Could not verify registration number');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
      console.error('PRS verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusDisplay = () => {
    const isExpiringSoon = expiresAt && isWithinDays(expiresAt, 30);
    const isExpired = expiresAt && expiresAt < new Date();

    if (isExpired) {
      return {
        icon: <AlertTriangle className="w-6 h-6 text-red-500" />,
        title: 'Registration Expired',
        description: `Your PRS registration expired on ${expiresAt?.toLocaleDateString()}. Please renew.`,
        color: 'bg-red-50 border-red-200',
        textColor: 'text-red-800',
      };
    }

    switch (status) {
      case 'active':
        return {
          icon: <CheckCircle className="w-6 h-6 text-green-500" />,
          title: 'PRS Registered',
          description: isExpiringSoon
            ? `Expires ${expiresAt?.toLocaleDateString()}. Please renew soon.`
            : `Registration: ${registrationNumber}. Valid until ${expiresAt?.toLocaleDateString()}`,
          color: isExpiringSoon ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200',
          textColor: isExpiringSoon ? 'text-yellow-800' : 'text-green-800',
        };

      case 'pending':
        return {
          icon: <Clock className="w-6 h-6 text-blue-500 animate-pulse" />,
          title: 'Registration Pending',
          description: 'Your PRS registration is being processed.',
          color: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-800',
        };

      case 'suspended':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-orange-500" />,
          title: 'Registration Suspended',
          description: 'Your PRS registration has been suspended. Please contact the PRS authority.',
          color: 'bg-orange-50 border-orange-200',
          textColor: 'text-orange-800',
        };

      default:
        return {
          icon: <Building2 className="w-6 h-6 text-gray-500" />,
          title: 'PRS Registration Required',
          description: 'Register your property in the Private Rented Sector Database to list properties.',
          color: 'bg-gray-50 border-gray-200',
          textColor: 'text-gray-800',
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  if (compact && status === 'active') {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm font-medium">PRS Registered</span>
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

          {/* Registration form for unregistered landlords */}
          {(status === 'not_registered' || status === 'expired') && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PRS Registration Number
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                    placeholder="PRS-123456"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={handleVerify}
                    disabled={isLoading || !registrationNumber.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    Verify
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Format: PRS-XXXXXX (e.g., PRS-123456)
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-100 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="text-sm text-gray-600">
                <p>Don't have a PRS registration number?</p>
                <a
                  href="https://www.gov.uk/guidance/prs-database"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline mt-1"
                >
                  Register on the PRS Database
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Renewal button for expiring registrations */}
          {status === 'active' && expiresAt && isWithinDays(expiresAt, 30) && (
            <div className="mt-4">
              <a
                href="https://www.gov.uk/guidance/prs-database"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Renew Registration
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* RRA 2025 info */}
      {status === 'not_registered' && (
        <div className="mt-4 text-xs text-gray-500 border-t pt-3">
          <p className="font-medium">Renters' Rights Act 2025 Requirement</p>
          <p className="mt-1">
            All landlords must register their rental properties in the Private Rented Sector Database.
            Failure to register can result in fines up to £30,000.
          </p>
        </div>
      )}
    </div>
  );
};

// Helper function
function isWithinDays(date: Date, days: number): boolean {
  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return date <= future && date > now;
}

export default PRSVerification;
