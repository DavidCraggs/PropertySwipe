import { useState } from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface StarRatingProps {
  value: number; // 0-5
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showValue?: boolean;
}

/**
 * StarRating - Reusable star rating input/display component
 * 
 * Features:
 * - Interactive star selection (when not readonly)
 * - Keyboard accessible (Tab, Enter, Space, Arrow keys)
 * - Hover preview
 * - Smooth animations
 * - Multiple sizes
 */
export function StarRating({
  value,
  onChange,
  readonly = false,
  size = 'md',
  label,
  showValue = false,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  // Clamp value to 0-5 range
  const clampedValue = Math.max(0, Math.min(5, value));
  const displayValue = hoverValue !== null ? hoverValue : clampedValue;

  // Size mapping
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32,
  };
  const starSize = sizeMap[size];

  const handleClick = (starIndex: number) => {
    if (readonly || !onChange) return;
    onChange(starIndex);
  };

  const handleKeyDown = (e: React.KeyboardEvent, starIndex: number) => {
    if (readonly || !onChange) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(starIndex);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(Math.min(5, clampedValue + 1));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(Math.max(0, clampedValue - 1));
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}

      <div className="flex items-center gap-1" data-testid="star-rating">
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const isFilled = starIndex <= displayValue;

          return (
            <motion.button
              key={starIndex}
              type="button"
              onClick={() => handleClick(starIndex)}
              onMouseEnter={() => !readonly && setHoverValue(starIndex)}
              onMouseLeave={() => !readonly && setHoverValue(null)}
              onKeyDown={(e) => handleKeyDown(e, starIndex)}
              disabled={readonly}
              className={`
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded
                transition-transform duration-150
                ${!readonly ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
              `}
              aria-label={`Rate ${starIndex} out of 5 stars`}
              tabIndex={readonly ? -1 : 0}
              whileTap={!readonly ? { scale: 0.9 } : {}}
            >
              <Star
                size={starSize}
                className={`
                  transition-colors duration-150
                  ${isFilled ? 'text-warning-500 fill-warning-500' : 'text-neutral-300'}
                `}
              />
            </motion.button>
          );
        })}

        {showValue && (
          <span className="ml-2 text-sm font-medium text-neutral-700">
            {clampedValue.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  );
}
