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
 * CardStack — Concept C card stack with depth effect
 * - 3 visible cards
 * - Scale: 1 - index * 0.04
 * - Y offset: index * 10px
 * - Opacity: 1 - index * 0.28
 * - Shadow only on top card
 * - Card entry: opacity 0→1, translateY 14→0, 0.5s ease
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

  const visibleCards = properties.slice(
    currentIndex,
    currentIndex + CARD_STACK_CONFIG.VISIBLE_CARDS
  );

  useEffect(() => {
    if (currentIndex >= properties.length && properties.length > 0) {
      onStackEmpty?.();
    }
  }, [currentIndex, properties.length, onStackEmpty]);

  const handleSwipeComplete = (swipeDirection: 'left' | 'right') => {
    const currentProperty = properties[currentIndex];

    if (swipeDirection === 'left') {
      onDislike(currentProperty);
    } else {
      onLike(currentProperty);
    }

    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 100);
  };

  const getCardStyle = (index: number) => {
    const scale = 1 - index * CARD_STACK_CONFIG.SCALE_FACTOR;
    const yOffset = index * CARD_STACK_CONFIG.Y_OFFSET;
    const opacity = 1 - index * CARD_STACK_CONFIG.OPACITY_FACTOR;
    const zIndex = CARD_STACK_CONFIG.VISIBLE_CARDS - index;

    return { scale, y: yOffset, opacity, zIndex };
  };

  // Empty state — Concept C
  if (properties.length === 0 || currentIndex >= properties.length) {
    return (
      <div
        className={`flex items-center justify-center w-full h-full ${className}`}
        style={{ background: 'var(--color-bg)' }}
      >
        <div style={{ textAlign: 'center', padding: 40 }}>
          <span style={{ fontSize: 48, marginBottom: 12, display: 'block' }}>&#x25C9;</span>
          <h2
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 34,
              letterSpacing: 4,
              margin: '0 0 8px',
              color: 'var(--color-text)',
            }}
          >
            DONE
          </h2>
          <p
            style={{
              fontFamily: "'Libre Franklin', sans-serif",
              fontSize: 13,
              color: 'var(--color-sub)',
              fontWeight: 500,
              lineHeight: 1.5,
            }}
          >
            Check back tomorrow for new drops.
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
                  ? { scale: 1, y: 0, opacity: 0, translateY: 14 }
                  : { scale: style.scale, y: style.y, opacity: 0 }
              }
              animate={{
                scale: style.scale,
                y: style.y,
                opacity: style.opacity,
                translateY: 0,
                zIndex: style.zIndex,
              }}
              exit={{
                opacity: 0,
                scale: 0.96,
                transition: { duration: 0.2 },
              }}
              transition={{
                duration: 0.5,
                ease: 'easeOut',
              }}
              style={{ zIndex: style.zIndex }}
            >
              {isTopCard ? (
                <SwipeableCard
                  onSwipeComplete={handleSwipeComplete}
                  enabled={isTopCard}
                >
                  <PropertyCard
                    property={property}
                    onInfoClick={() => onInfoClick?.(property)}
                    isTopCard
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
    </div>
  );
};
