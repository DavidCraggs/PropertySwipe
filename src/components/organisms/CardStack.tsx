import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Property } from '../../types';
import { PropertyCard } from '../molecules/PropertyCard';
import { SwipeableCard } from './SwipeableCard';
import { CARD_STACK_CONFIG } from '../../utils/constants';

interface CardStackProps {
  properties: Property[];
  onLike: (property: Property) => void;
  onDislike: (property: Property) => void;
  onInfoClick?: (property: Property) => void;
  onStackEmpty?: () => void;
  className?: string;
}

/**
 * CardStack component manages a stack of swipeable property cards
 * Features:
 * - Displays top 3 cards with depth effect (scale and z-index)
 * - Removes card from stack after swipe
 * - Loads next cards as stack depletes
 * - Handles empty state
 * - Performance optimized (only renders visible cards)
 */
export const CardStack: React.FC<CardStackProps> = ({
  properties,
  onLike,
  onDislike,
  onInfoClick,
  onStackEmpty,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Get visible cards (current + next 2)
  const visibleCards = properties.slice(
    currentIndex,
    currentIndex + CARD_STACK_CONFIG.VISIBLE_CARDS
  );

  // Check if stack is empty
  useEffect(() => {
    if (currentIndex >= properties.length && properties.length > 0) {
      onStackEmpty?.();
    }
  }, [currentIndex, properties.length, onStackEmpty]);

  /**
   * Handle swipe completion
   */
  const handleSwipeComplete = (swipeDirection: 'left' | 'right') => {
    const currentProperty = properties[currentIndex];

    if (swipeDirection === 'left') {
      onDislike(currentProperty);
    } else {
      onLike(currentProperty);
    }

    // Move to next card after animation
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 100);
  };

  /**
   * Calculate card style based on position in stack
   */
  const getCardStyle = (index: number) => {
    const position = index;
    const scale = 1 - position * CARD_STACK_CONFIG.SCALE_FACTOR;
    const yOffset = position * CARD_STACK_CONFIG.Y_OFFSET;
    const zIndex = CARD_STACK_CONFIG.VISIBLE_CARDS - position;

    return {
      scale,
      y: yOffset,
      zIndex,
      opacity: 1,
    };
  };

  // Empty state
  if (properties.length === 0 || currentIndex >= properties.length) {
    return (
      <div
        className={`flex items-center justify-center w-full h-full bg-neutral-100 rounded-3xl ${className}`}
      >
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🏠</div>
          <h3 className="text-2xl font-bold text-neutral-900 mb-2">No more properties</h3>
          <p className="text-neutral-600">
            You've seen all available properties. Check back later for new listings!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <AnimatePresence initial={false}>
        {visibleCards.map((property, index) => {
          const isTopCard = index === 0;
          const style = getCardStyle(index);

          return (
            <motion.div
              key={`${property.id}-${currentIndex + index}`}
              className="absolute inset-0"
              initial={
                index === 0
                  ? {
                      scale: 1,
                      y: 0,
                      opacity: 1,
                    }
                  : {
                      scale: style.scale,
                      y: style.y,
                      opacity: 0,
                    }
              }
              animate={{
                scale: style.scale,
                y: style.y,
                opacity: style.opacity,
                zIndex: style.zIndex,
              }}
              exit={{
                opacity: 0,
                scale: 0.8,
                transition: { duration: 0.2 },
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
              style={{
                zIndex: style.zIndex,
              }}
            >
              {isTopCard ? (
                <SwipeableCard
                  onSwipeComplete={handleSwipeComplete}
                  enabled={isTopCard}
                >
                  <PropertyCard
                    property={property}
                    onInfoClick={() => onInfoClick?.(property)}
                  />
                </SwipeableCard>
              ) : (
                <PropertyCard
                  property={property}
                  onInfoClick={() => onInfoClick?.(property)}
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Loading indicator for next batch */}
      {properties.length - currentIndex <= CARD_STACK_CONFIG.PRELOAD_COUNT &&
        properties.length - currentIndex > 0 && (
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-sm text-neutral-500">
            {properties.length - currentIndex} properties remaining
          </div>
        )}
    </div>
  );
};
