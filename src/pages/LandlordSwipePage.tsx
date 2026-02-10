import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Check, X, Eye, AlertCircle, ChevronDown } from 'lucide-react';
import { RenterCard } from '../components/molecules/RenterCard';
import { SwipeableCard } from '../components/organisms/SwipeableCard';
import { Button } from '../components/atoms/Button';
import { useAppStore } from '../hooks/useAppStore';
import { useAuthStore } from '../hooks/useAuthStore';
import { useToastStore } from '../components/organisms/toastUtils';
import { CARD_STACK_CONFIG } from '../utils/constants';
import type { RenterCard as RenterCardType, Property } from '../types';

/**
 * LandlordSwipePage - Two-sided matching interface for landlords
 * Allows landlords to review interested renters and create matches
 * Phase 3: Two-Sided Matching System
 */
export const LandlordSwipePage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { getInterestedRenters, confirmMatch, declineInterest, allProperties } = useAppStore();
  const { addToast } = useToastStore();

  const [interestedRenters, setInterestedRenters] = useState<RenterCardType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [showPropertyFilter, setShowPropertyFilter] = useState(false);

  // Get landlord's properties
  const landlordProperties = allProperties.filter(
    (p: Property) => p.landlordId === currentUser?.id && p.isAvailable
  );

  // Load interested renters
  useEffect(() => {
    const loadInterests = async () => {
      if (!currentUser?.id) return;

      setIsLoading(true);
      try {
        const renters = await getInterestedRenters(currentUser.id, selectedProperty || undefined);
        setInterestedRenters(renters);
        setCurrentIndex(0);
      } catch (error) {
        console.error('Failed to load interested renters:', error);
        addToast({
          type: 'error',
          title: 'Failed to load renters',
          message: 'Please try again later',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadInterests();
  }, [currentUser?.id, selectedProperty, getInterestedRenters, addToast]);

  // Get visible cards for stack effect
  const visibleCards = interestedRenters.slice(
    currentIndex,
    currentIndex + CARD_STACK_CONFIG.VISIBLE_CARDS
  );

  const handleSwipeComplete = async (direction: 'left' | 'right') => {
    const currentRenter = interestedRenters[currentIndex];
    if (!currentRenter) return;

    try {
      if (direction === 'right') {
        // Landlord likes - create match
        await confirmMatch(currentRenter.interestId);
        addToast({
          type: 'match',
          title: "It's a match!",
          message: `You've matched with this ${currentRenter.situation}. They'll be notified!`,
          duration: 5000,
        });
      } else {
        // Landlord passes
        await declineInterest(currentRenter.interestId);
        addToast({
          type: 'info',
          title: 'Passed',
          message: 'Moved to next renter',
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Failed to process swipe:', error);
      addToast({
        type: 'error',
        title: 'Action failed',
        message: 'Please try again',
      });
    }

    // Move to next card
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 100);
  };

  const handleLikeClick = () => {
    // Trigger programmatic swipe right
    handleSwipeComplete('right');
  };

  const handlePassClick = () => {
    // Trigger programmatic swipe left
    handleSwipeComplete('left');
  };

  const getCardStyle = (index: number) => {
    const scale = 1 - index * CARD_STACK_CONFIG.SCALE_FACTOR;
    const yOffset = index * CARD_STACK_CONFIG.Y_OFFSET;
    const zIndex = CARD_STACK_CONFIG.VISIBLE_CARDS - index;
    return { scale, y: yOffset, zIndex, opacity: 1 };
  };

  // Stats
  const totalInterests = interestedRenters.length;
  const reviewed = currentIndex;
  const remaining = Math.max(0, totalInterests - currentIndex);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-primary-600 to-success-600 bg-clip-text text-transparent mb-2">
          Discover Renters
        </h1>
        <p className="text-center text-neutral-600 mb-4">
          Review interested renters and create matches
        </p>

        {/* Property Filter */}
        {landlordProperties.length > 1 && (
          <div className="relative">
            <button
              onClick={() => setShowPropertyFilter(!showPropertyFilter)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl shadow-sm text-left"
            >
              <span className="text-sm text-neutral-600">
                {selectedProperty
                  ? landlordProperties.find((p) => p.id === selectedProperty)?.address.street ||
                    'Selected Property'
                  : 'All Properties'}
              </span>
              <ChevronDown
                size={20}
                className={`text-neutral-400 transition-transform ${showPropertyFilter ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {showPropertyFilter && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg z-50 overflow-hidden"
                >
                  <button
                    onClick={() => {
                      setSelectedProperty(null);
                      setShowPropertyFilter(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-sm hover:bg-neutral-50 ${
                      !selectedProperty ? 'bg-primary-50 text-primary-600 font-medium' : ''
                    }`}
                  >
                    All Properties
                  </button>
                  {landlordProperties.map((property) => (
                    <button
                      key={property.id}
                      onClick={() => {
                        setSelectedProperty(property.id);
                        setShowPropertyFilter(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm hover:bg-neutral-50 border-t border-neutral-100 ${
                        selectedProperty === property.id
                          ? 'bg-primary-50 text-primary-600 font-medium'
                          : ''
                      }`}
                    >
                      {property.address.street}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4">
        {/* Stats Bar */}
        <div className="flex items-center justify-center gap-6 mb-6">
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Users size={18} className="text-primary-500" />
            <span>{totalInterests} interested</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Eye size={18} className="text-neutral-400" />
            <span>{reviewed} reviewed</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <AlertCircle size={18} className="text-warning-500" />
            <span>{remaining} remaining</span>
          </div>
        </div>

        {/* Card Stack */}
        <div className="relative w-full aspect-[3/4] mb-8">
          {isLoading ? (
            <div className="flex items-center justify-center w-full h-full bg-neutral-100 rounded-3xl">
              <div className="text-center p-8">
                <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-neutral-600">Loading interested renters...</p>
              </div>
            </div>
          ) : interestedRenters.length === 0 || currentIndex >= interestedRenters.length ? (
            <EmptyState hasProperties={landlordProperties.length > 0} />
          ) : (
            <AnimatePresence initial={false}>
              {visibleCards.map((renter, index) => {
                const isTopCard = index === 0;
                const style = getCardStyle(index);

                return (
                  <motion.div
                    key={`${renter.renterId}-${currentIndex + index}`}
                    className="absolute inset-0"
                    initial={
                      index === 0
                        ? { scale: 1, y: 0, opacity: 1 }
                        : { scale: style.scale, y: style.y, opacity: 0 }
                    }
                    animate={{
                      scale: style.scale,
                      y: style.y,
                      opacity: style.opacity,
                      zIndex: style.zIndex,
                    }}
                    exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    style={{ zIndex: style.zIndex }}
                  >
                    {isTopCard ? (
                      <SwipeableCard onSwipeComplete={handleSwipeComplete} enabled={isTopCard}>
                        <RenterCard renter={renter} />
                      </SwipeableCard>
                    ) : (
                      <RenterCard renter={renter} />
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Action Buttons */}
        {!isLoading && remaining > 0 && (
          <div className="flex items-center justify-center gap-8 mb-6">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handlePassClick}
              className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center text-danger-500 hover:bg-danger-50 transition-colors"
            >
              <X size={32} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleLikeClick}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-success-400 to-success-600 shadow-lg flex items-center justify-center text-white hover:from-success-500 hover:to-success-700 transition-colors"
            >
              <Check size={40} />
            </motion.button>
          </div>
        )}

        {/* Progress Bar */}
        {totalInterests > 0 && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-neutral-600">Review Progress</span>
              <span className="text-xs font-medium text-neutral-900">
                {Math.round((reviewed / totalInterests) * 100)}%
              </span>
            </div>
            <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary-500 to-success-500"
                initial={{ width: 0 }}
                animate={{ width: `${(reviewed / totalInterests) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

/**
 * Empty state component
 */
const EmptyState: React.FC<{ hasProperties: boolean }> = ({ hasProperties }) => {
  if (!hasProperties) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-neutral-100 rounded-3xl">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🏠</div>
          <h3 className="text-xl font-bold text-neutral-900 mb-2">No Properties Listed</h3>
          <p className="text-neutral-600 mb-4">
            List a property first to start receiving interest from renters.
          </p>
          <Button variant="primary">Add Property</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-full h-full bg-neutral-100 rounded-3xl">
      <div className="text-center p-8">
        <div className="text-6xl mb-4">👋</div>
        <h3 className="text-xl font-bold text-neutral-900 mb-2">All Caught Up!</h3>
        <p className="text-neutral-600">
          No more interested renters to review. New interests will appear here.
        </p>
      </div>
    </div>
  );
};
