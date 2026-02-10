import { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { SWIPE_THRESHOLD, SWIPE_EXIT, ANIMATION_DURATION } from '../../utils/constants';

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeComplete?: (direction: 'left' | 'right') => void;
  className?: string;
  enabled?: boolean;
}

/**
 * SwipeableCard — Concept C swipe physics
 * - 1:1 horizontal drag (no elastic dampening)
 * - Y axis dampened to 25%
 * - Rotation: deltaX * 0.055 degrees
 * - 100px threshold
 * - YES/NO stamps with opacity ramp
 * - Exit: ±550px, ±20° rotation, 0.38s ease-out
 * - Spring-back: 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)
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
  const cardRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);

  // Rotation: 0.055 degrees per pixel of X drag
  const rotate = useTransform(x, [-200, 0, 200], [-11, 0, 11]);

  // YES stamp opacity: ramps from 20px to 80px drag right
  const yesOpacity = useTransform(x, [20, 80], [0, 1], { clamp: true });

  // NO stamp opacity: ramps from -20px to -80px drag left
  const noOpacity = useTransform(x, [-80, -20], [1, 0], { clamp: true });

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offsetX = info.offset.x;
    const velocity = info.velocity.x;

    // Swipe right (like)
    if (
      offsetX > SWIPE_THRESHOLD.HORIZONTAL ||
      velocity > SWIPE_THRESHOLD.VELOCITY * 1000
    ) {
      setExitX(SWIPE_EXIT.DISTANCE);
      onSwipeRight?.();
      setTimeout(() => onSwipeComplete?.('right'), ANIMATION_DURATION.SWIPE);
      return;
    }

    // Swipe left (dislike)
    if (
      offsetX < -SWIPE_THRESHOLD.HORIZONTAL ||
      velocity < -SWIPE_THRESHOLD.VELOCITY * 1000
    ) {
      setExitX(-SWIPE_EXIT.DISTANCE);
      onSwipeLeft?.();
      setTimeout(() => onSwipeComplete?.('left'), ANIMATION_DURATION.SWIPE);
      return;
    }

    // Spring back to center
    x.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      className={`absolute inset-0 cursor-grab active:cursor-grabbing ${className}`}
      style={{
        x,
        rotate,
        touchAction: 'none',
        userSelect: 'none',
      }}
      drag={enabled ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={1}
      onDragStart={() => {}}
      onDragEnd={handleDragEnd}
      animate={{
        x: exitX,
        rotate: exitX !== 0 ? (exitX > 0 ? SWIPE_EXIT.ROTATION : -SWIPE_EXIT.ROTATION) : undefined,
        opacity: exitX !== 0 ? 0 : 1,
      }}
      transition={
        exitX !== 0
          ? { duration: SWIPE_EXIT.DURATION, ease: [0.4, 0, 0.2, 1] }
          : { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }
      }
    >
      {/* Card Content */}
      <div className="relative w-full h-full no-select">{children}</div>

      {/* YES stamp — appears when dragging right */}
      <motion.div
        style={{
          opacity: yesOpacity,
          position: 'absolute',
          top: 20,
          left: 18,
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 44,
          color: '#34d399',
          transform: 'rotate(-8deg)',
          letterSpacing: 6,
          lineHeight: 1,
          textShadow: '0 4px 16px rgba(52,211,153,0.4)',
          pointerEvents: 'none',
          zIndex: 30,
        }}
      >
        YES
      </motion.div>

      {/* NO stamp — appears when dragging left */}
      <motion.div
        style={{
          opacity: noOpacity,
          position: 'absolute',
          top: 20,
          right: 18,
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 44,
          color: '#f87171',
          transform: 'rotate(8deg)',
          letterSpacing: 6,
          lineHeight: 1,
          textShadow: '0 4px 16px rgba(248,113,113,0.4)',
          pointerEvents: 'none',
          zIndex: 30,
        }}
      >
        NO
      </motion.div>
    </motion.div>
  );
};
