import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, RefreshCw, Search } from 'lucide-react';
import { AgreementCard } from './AgreementCard';
import { getAgreementsForMatch, getUserAgreements } from '../../lib/agreementService';
import type { TenancyAgreement, AgreementStatus } from '../../types';

interface AgreementsListProps {
  matchId?: string;
  userId: string;
  userType: 'landlord' | 'agency' | 'renter';
  onUploadClick?: () => void;
  onViewAgreement?: (agreement: TenancyAgreement) => void;
  onSignAgreement?: (agreement: TenancyAgreement) => void;
  showUploadButton?: boolean;
  compact?: boolean;
}

type FilterOption = 'all' | AgreementStatus;

export function AgreementsList({
  matchId,
  userId,
  userType,
  onUploadClick,
  onViewAgreement,
  onSignAgreement,
  showUploadButton = true,
  compact = false,
}: AgreementsListProps) {
  const [agreements, setAgreements] = useState<TenancyAgreement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterOption>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAgreements = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let data: TenancyAgreement[];

      if (matchId) {
        data = await getAgreementsForMatch(matchId);
      } else {
        data = await getUserAgreements(userId, userType);
      }

      setAgreements(data);
    } catch (err) {
      console.error('Failed to fetch agreements:', err);
      setError('Failed to load agreements');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgreements();
  }, [matchId, userId, userType]);

  // Filter agreements
  const filteredAgreements = agreements.filter((agreement) => {
    // Status filter
    if (filter !== 'all' && agreement.status !== filter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        agreement.title.toLowerCase().includes(query) ||
        agreement.originalFilename.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Count by status for filter badges
  const statusCounts = agreements.reduce(
    (acc, agreement) => {
      acc[agreement.status] = (acc[agreement.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const filterOptions: Array<{ value: FilterOption; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'pending_signatures', label: 'Awaiting' },
    { value: 'partially_signed', label: 'Partial' },
    { value: 'fully_signed', label: 'Signed' },
  ];

  if (compact) {
    // Compact view for embedding in other components
    return (
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw size={20} className="animate-spin text-neutral-400" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-danger-600">{error}</div>
        ) : agreements.length === 0 ? (
          <div className="text-center py-8">
            <FileText size={32} className="mx-auto text-neutral-300 mb-2" />
            <p className="text-neutral-500 text-sm">No agreements yet</p>
            {showUploadButton && (userType === 'landlord' || userType === 'agency') && (
              <button
                onClick={onUploadClick}
                className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                + Upload Agreement
              </button>
            )}
          </div>
        ) : (
          agreements.slice(0, 3).map((agreement) => (
            <AgreementCard
              key={agreement.id}
              agreement={agreement}
              currentUserId={userId}
              userType={userType}
              onView={onViewAgreement}
              onSign={onSignAgreement}
              onRefresh={fetchAgreements}
            />
          ))
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">Tenancy Agreements</h3>
          <p className="text-sm text-neutral-500">
            {agreements.length} agreement{agreements.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAgreements}
            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>

          {showUploadButton && (userType === 'landlord' || userType === 'agency') && (
            <button
              onClick={onUploadClick}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Plus size={16} />
              Upload Agreement
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {agreements.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search agreements..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Status filter */}
          <div className="flex gap-1 bg-neutral-100 rounded-lg p-1">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`
                  px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                  ${
                    filter === option.value
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }
                `}
              >
                {option.label}
                {option.value !== 'all' && statusCounts[option.value] ? (
                  <span className="ml-1.5 text-xs text-neutral-400">
                    ({statusCounts[option.value]})
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <RefreshCw size={24} className="animate-spin text-primary-500 mb-3" />
            <p className="text-neutral-500">Loading agreements...</p>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <div className="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText size={24} className="text-danger-500" />
            </div>
            <p className="text-danger-600 mb-3">{error}</p>
            <button
              onClick={fetchAgreements}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Try Again
            </button>
          </motion.div>
        ) : filteredAgreements.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={32} className="text-neutral-400" />
            </div>
            {searchQuery || filter !== 'all' ? (
              <>
                <p className="text-neutral-600 mb-1">No agreements match your filters</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilter('all');
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <p className="text-neutral-600 mb-1">No tenancy agreements yet</p>
                <p className="text-sm text-neutral-500 mb-4">
                  {userType === 'renter'
                    ? 'Your landlord will upload the agreement for you to sign'
                    : 'Upload a tenancy agreement for your tenant to sign'}
                </p>
                {showUploadButton && (userType === 'landlord' || userType === 'agency') && (
                  <button
                    onClick={onUploadClick}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    <Plus size={16} />
                    Upload Agreement
                  </button>
                )}
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-4"
          >
            {filteredAgreements.map((agreement) => (
              <AgreementCard
                key={agreement.id}
                agreement={agreement}
                currentUserId={userId}
                userType={userType}
                onView={onViewAgreement}
                onSign={onSignAgreement}
                onRefresh={fetchAgreements}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
