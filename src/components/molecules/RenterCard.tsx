import { motion } from 'framer-motion';
import {
  User,
  Briefcase,
  PoundSterling,
  PawPrint,
  Shield,
  Star,
  Calendar,
  Info,
  Cigarette,
  Home,
} from 'lucide-react';
import type { RenterCard as RenterCardType, CompatibilityFlag } from '../../types';
import { Badge } from '../atoms/Badge';
import { IconButton } from '../atoms/IconButton';
import {
  getScoreTier,
  getFlagDescription,
  getFlagType,
  formatScore,
} from '../../utils/matchScoring';

interface RenterCardProps {
  renter: RenterCardType;
  onInfoClick?: () => void;
  className?: string;
}

/**
 * RenterCard component displays renter information for landlord review
 * Shows non-discriminatory information only (per RRA 2025)
 * Features compatibility score prominently
 */
export const RenterCard: React.FC<RenterCardProps> = ({
  renter,
  onInfoClick,
  className = '',
}) => {
  const scoreTier = getScoreTier(renter.compatibilityScore.overall);

  // Filter to show top 3 most relevant flags
  const displayFlags = renter.compatibilityScore.flags.slice(0, 3);

  // Calculate income ratio for display
  const affordabilityText = getAffordabilityText(renter.compatibilityScore.breakdown.affordability);

  return (
    <div
      className={`relative w-full h-full bg-white rounded-3xl shadow-card overflow-hidden select-none ${className}`}
    >
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-100 via-white to-success-50" />

      {/* Content */}
      <div className="relative h-full flex flex-col p-6">
        {/* Top Bar - Compatibility Score */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            {/* Avatar Placeholder */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <User size={32} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">{renter.situation}</h3>
              <p className="text-sm text-neutral-600">{renter.employmentStatus}</p>
            </div>
          </div>

          {/* Compatibility Score Badge */}
          <div className="text-center">
            <div
              className={`text-3xl font-bold ${scoreTier.color}`}
            >
              {formatScore(renter.compatibilityScore.overall)}
            </div>
            <div className="text-xs text-neutral-500 mt-0.5">{scoreTier.label}</div>
          </div>
        </div>

        {/* Property Context */}
        <div className="bg-white/80 rounded-xl p-3 mb-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Home size={16} className="text-primary-500" />
            <span className="truncate">Interested in: {renter.propertyAddress}</span>
          </div>
        </div>

        {/* Key Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Income */}
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
              <PoundSterling size={14} />
              <span>Monthly Income</span>
            </div>
            <div className="text-lg font-semibold text-neutral-900">
              £{renter.monthlyIncome.toLocaleString()}
            </div>
            <div className="text-xs text-neutral-500">{affordabilityText}</div>
          </div>

          {/* Employment */}
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
              <Briefcase size={14} />
              <span>Employment</span>
            </div>
            <div className="text-sm font-semibold text-neutral-900">{renter.employmentStatus}</div>
          </div>

          {/* Pets */}
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
              <PawPrint size={14} />
              <span>Pets</span>
            </div>
            <div className="text-sm font-semibold text-neutral-900">
              {renter.hasPets ? (
                <span className="text-warning-600">
                  Yes ({renter.petDetails?.map((p) => p.type).join(', ') || 'Pet owner'})
                </span>
              ) : (
                <span className="text-success-600">No pets</span>
              )}
            </div>
          </div>

          {/* Smoking */}
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
              <Cigarette size={14} />
              <span>Smoking</span>
            </div>
            <div className="text-sm font-semibold text-neutral-900">
              <span
                className={
                  renter.smokingStatus === 'Non-Smoker' ? 'text-success-600' : 'text-warning-600'
                }
              >
                {renter.smokingStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Guarantor & Rental History */}
        <div className="flex gap-2 mb-4">
          {renter.hasGuarantor && (
            <Badge variant="success" size="sm">
              <Shield size={12} className="mr-1" />
              Has Guarantor
            </Badge>
          )}
          {renter.hasRentalHistory && (
            <Badge variant="primary" size="sm">
              <Home size={12} className="mr-1" />
              Rental History
            </Badge>
          )}
          {renter.rating && renter.rating.totalRatings > 0 && (
            <Badge variant="warning" size="sm">
              <Star size={12} className="mr-1" />
              {renter.rating.averageOverallScore.toFixed(1)} ({renter.rating.totalRatings})
            </Badge>
          )}
        </div>

        {/* Move-in Date */}
        {renter.preferredMoveInDate && (
          <div className="flex items-center gap-2 text-sm text-neutral-600 mb-4">
            <Calendar size={16} />
            <span>
              Preferred move-in:{' '}
              {new Date(renter.preferredMoveInDate).toLocaleDateString('en-GB', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        )}

        {/* Compatibility Flags */}
        {displayFlags.length > 0 && (
          <div className="mt-auto">
            <div className="text-xs text-neutral-500 mb-2">Key Factors</div>
            <div className="flex flex-wrap gap-2">
              {displayFlags.map((flag) => (
                <FlagBadge key={flag} flag={flag} />
              ))}
            </div>
          </div>
        )}

        {/* Interested Date */}
        <div className="mt-4 text-xs text-neutral-400 text-center">
          Interested {formatTimeAgo(renter.interestedAt)}
        </div>

        {/* Info Button */}
        <div className="absolute bottom-6 right-6 z-20">
          <IconButton
            icon={<Info size={24} />}
            variant="ghost"
            size="md"
            ariaLabel="View renter details"
            onClick={onInfoClick}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Flag badge component with appropriate styling
 */
const FlagBadge: React.FC<{ flag: CompatibilityFlag }> = ({ flag }) => {
  const type = getFlagType(flag);
  const description = getFlagDescription(flag);

  const colorClasses = {
    positive: 'bg-success-100 text-success-700 border-success-200',
    neutral: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    attention: 'bg-warning-100 text-warning-700 border-warning-200',
  };

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${colorClasses[type]}`}
    >
      {description}
    </motion.span>
  );
};

/**
 * Get affordability text based on score
 */
function getAffordabilityText(affordabilityScore: number): string {
  if (affordabilityScore >= 27) return '3x+ rent';
  if (affordabilityScore >= 24) return '~3x rent';
  if (affordabilityScore >= 18) return '2.5x rent';
  if (affordabilityScore >= 15) return '~2.5x rent';
  return 'Check affordability';
}

/**
 * Format time ago for display
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'just now';
}
