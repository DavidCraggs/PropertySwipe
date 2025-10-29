import { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { Heart, X } from 'lucide-react';
import { SWIPE_THRESHOLD, ANIMATION_DURATION } from '../../utils/constants';

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeComplete?: (direction: 'left' | 'right') => void;
  className?: string;
  enabled?: boolean;
}

/**
 * SwipeableCard wrapper component
 * Implements touch/mouse drag with Framer Motion
 * Features:
 * - Swipe left (dislike) / right (like) with visual feedback
 * - Rotation and translation animations
 * - Threshold-based action triggering
 * - Spring physics for natural feel
 * - Prevents over-swiping
 */
export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeComplete,
  className = '',
  enabled = true,
}) => {
  const [exitX, setExitX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Motion values for drag position
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Transform x position to rotation (max ±15 degrees)
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);

  // Transform x position to opacity for like/dislike indicators
  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD.HORIZONTAL / 2], [0, 1]);
  const dislikeOpacity = useTransform(
    x,
    [-SWIPE_THRESHOLD.HORIZONTAL / 2, 0],
    [1, 0]
  );

  /**
   * Handle drag end - determine if swipe threshold was met
   */
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    const offsetX = info.offset.x;
    const velocity = info.velocity.x;

    // Swipe right (like)
    if (
      offsetX > SWIPE_THRESHOLD.HORIZONTAL ||
      velocity > SWIPE_THRESHOLD.VELOCITY * 1000
    ) {
      setExitX(1000);
      onSwipeRight?.();
      setTimeout(() => onSwipeComplete?.('right'), ANIMATION_DURATION.SWIPE);
      return;
    }

    // Swipe left (dislike)
    if (
      offsetX < -SWIPE_THRESHOLD.HORIZONTAL ||
      velocity < -SWIPE_THRESHOLD.VELOCITY * 1000
    ) {
      setExitX(-1000);
      onSwipeLeft?.();
      setTimeout(() => onSwipeComplete?.('left'), ANIMATION_DURATION.SWIPE);
      return;
    }

    // Reset to center if threshold not met
    x.set(0);
    y.set(0);
  };

  // Expose swipe method to parent via ref (if needed)
  // This could be done with useImperativeHandle if parent needs control
  // Removed unused swipe function for now

  return (
    <motion.div
      ref={cardRef}
      className={`absolute inset-0 cursor-grab active:cursor-grabbing ${className}`}
      style={{
        x,
        y,
        rotate,
      }}
      drag={enabled}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      animate={{
        x: exitX,
        opacity: exitX !== 0 ? 0 : 1,
      }}
      transition={{
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Card Content */}
      <div className="relative w-full h-full no-select">{children}</div>

      {/* Like Indicator (appears when swiping right) */}
      <motion.div
        className="absolute top-16 left-8 rotate-12 pointer-events-none z-30"
        style={{ opacity: likeOpacity }}
      >
        <div className="flex items-center gap-2 bg-success-500 text-white px-6 py-3 rounded-2xl shadow-lg border-4 border-white">
          <Heart size={32} fill="white" />
          <span className="text-2xl font-bold uppercase tracking-wider">Like</span>
        </div>
      </motion.div>

      {/* Dislike Indicator (appears when swiping left) */}
      <motion.div
        className="absolute top-16 right-8 -rotate-12 pointer-events-none z-30"
        style={{ opacity: dislikeOpacity }}
      >
        <div className="flex items-center gap-2 bg-danger-500 text-white px-6 py-3 rounded-2xl shadow-lg border-4 border-white">
          <X size={32} />
          <span className="text-2xl font-bold uppercase tracking-wider">Nope</span>
        </div>
      </motion.div>

      {/* Visual feedback overlay when dragging */}
      {isDragging && (
        <div className="absolute inset-0 bg-black/5 pointer-events-none z-20 rounded-3xl" />
      )}
    </motion.div>
  );
};
