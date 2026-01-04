/**
 * Verification Badge Component
 *
 * Displays verification status as a compact badge.
 * Used on profile cards, match cards, and profile pages.
 */

import React from 'react';
import { ShieldCheck, ShieldAlert, ShieldQuestion, Clock } from 'lucide-react';

type VerificationStatus = 'not_started' | 'pending' | 'processing' | 'verified' | 'failed' | 'expired';
type BadgeSize = 'sm' | 'md' | 'lg';
type BadgeVariant = 'default' | 'minimal' | 'full';

interface VerificationBadgeProps {
  status: VerificationStatus;
  expiresAt?: Date;
  size?: BadgeSize;
  variant?: BadgeVariant;
  showLabel?: boolean;
  className?: string;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  status,
  expiresAt,
  size = 'md',
  variant = 'default',
  showLabel = true,
  className = '',
}) => {
  const isExpiringSoon = expiresAt && isWithinDays(expiresAt, 30);

  const sizeClasses = {
    sm: 'text-xs gap-1',
    md: 'text-sm gap-1.5',
    lg: 'text-base gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        if (isExpiringSoon) {
          return {
            icon: <Clock className={iconSizes[size]} />,
            label: 'Expiring Soon',
            bgColor: 'bg-yellow-100',
            textColor: 'text-yellow-700',
            borderColor: 'border-yellow-200',
            dotColor: 'bg-yellow-500',
          };
        }
        return {
          icon: <ShieldCheck className={iconSizes[size]} />,
          label: 'ID Verified',
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
          dotColor: 'bg-green-500',
        };

      case 'pending':
      case 'processing':
        return {
          icon: <Clock className={`${iconSizes[size]} animate-pulse`} />,
          label: 'Verifying',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200',
          dotColor: 'bg-blue-500',
        };

      case 'failed':
        return {
          icon: <ShieldAlert className={iconSizes[size]} />,
          label: 'Failed',
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          borderColor: 'border-red-200',
          dotColor: 'bg-red-500',
        };

      case 'expired':
        return {
          icon: <ShieldAlert className={iconSizes[size]} />,
          label: 'Expired',
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-700',
          borderColor: 'border-orange-200',
          dotColor: 'bg-orange-500',
        };

      default:
        return {
          icon: <ShieldQuestion className={iconSizes[size]} />,
          label: 'Not Verified',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-600',
          borderColor: 'border-gray-200',
          dotColor: 'bg-gray-400',
        };
    }
  };

  const config = getStatusConfig();

  // Minimal variant - just a colored dot
  if (variant === 'minimal') {
    return (
      <span
        className={`inline-block rounded-full ${config.dotColor} ${className}`}
        style={{
          width: size === 'sm' ? '6px' : size === 'md' ? '8px' : '10px',
          height: size === 'sm' ? '6px' : size === 'md' ? '8px' : '10px',
        }}
        title={config.label}
      />
    );
  }

  // Full variant - includes detailed status
  if (variant === 'full' && status === 'verified' && expiresAt) {
    return (
      <div
        className={`inline-flex items-center ${sizeClasses[size]} px-2 py-1 rounded-full border ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}
      >
        {config.icon}
        <span className="font-medium">{config.label}</span>
        <span className="opacity-75">
          · Valid until {expiresAt.toLocaleDateString()}
        </span>
      </div>
    );
  }

  // Default variant - icon with optional label
  return (
    <div
      className={`inline-flex items-center ${sizeClasses[size]} px-2 py-1 rounded-full border ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}
    >
      {config.icon}
      {showLabel && <span className="font-medium">{config.label}</span>}
    </div>
  );
};

// Helper function
function isWithinDays(date: Date, days: number): boolean {
  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return date <= future && date > now;
}

export default VerificationBadge;
