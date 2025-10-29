import { Heart, X } from 'lucide-react';
import { IconButton } from '../atoms/IconButton';
import { ARIA_LABELS } from '../../utils/constants';

interface SwipeControlsProps {
  onLike: () => void;
  onDislike: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * SwipeControls component
 * Large circular buttons for like/dislike actions
 * Features:
 * - Programmatic swipe triggers
 * - Haptic-style visual feedback
 * - Accessible keyboard controls
 * - Disabled state support
 */
export const SwipeControls: React.FC<SwipeControlsProps> = ({
  onLike,
  onDislike,
  disabled = false,
  className = '',
}) => {
  const handleDislike = () => {
    if (!disabled) {
      onDislike();
    }
  };

  const handleLike = () => {
    if (!disabled) {
      onLike();
    }
  };

  // Keyboard support
  const handleKeyDown = (e: React.KeyboardEvent, action: 'like' | 'dislike') => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (action === 'like') {
        handleLike();
      } else {
        handleDislike();
      }
    }
  };

  return (
    <div className={`flex items-center justify-center gap-6 ${className}`}>
      {/* Dislike Button */}
      <div
        className="relative"
        onKeyDown={(e) => handleKeyDown(e, 'dislike')}
        role="button"
        tabIndex={disabled ? -1 : 0}
      >
        <IconButton
          icon={<X size={32} strokeWidth={3} />}
          variant="danger"
          size="xl"
          ariaLabel={ARIA_LABELS.DISLIKE_BUTTON}
          onClick={handleDislike}
          disabled={disabled}
          className="shadow-2xl"
        />
        {/* Pulse effect on hover (desktop only) */}
        <div className="absolute inset-0 rounded-full bg-danger-500 opacity-0 hover:opacity-20 transition-opacity pointer-events-none" />
      </div>

      {/* Like Button */}
      <div
        className="relative"
        onKeyDown={(e) => handleKeyDown(e, 'like')}
        role="button"
        tabIndex={disabled ? -1 : 0}
      >
        <IconButton
          icon={<Heart size={32} strokeWidth={3} />}
          variant="success"
          size="xl"
          ariaLabel={ARIA_LABELS.LIKE_BUTTON}
          onClick={handleLike}
          disabled={disabled}
          className="shadow-2xl"
        />
        {/* Pulse effect on hover (desktop only) */}
        <div className="absolute inset-0 rounded-full bg-success-500 opacity-0 hover:opacity-20 transition-opacity pointer-events-none" />
      </div>
    </div>
  );
};
