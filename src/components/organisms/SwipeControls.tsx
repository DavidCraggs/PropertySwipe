import { ARIA_LABELS } from '../../utils/constants';

interface SwipeControlsProps {
  onLike: () => void;
  onDislike: () => void;
  onUndo?: () => void;
  onSuperLike?: () => void;
  canUndo?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * SwipeControls — Concept C action buttons
 * 4 circular buttons: Pass (✕), Undo (↩), Like (♥), Super-Like (★)
 */
export const SwipeControls: React.FC<SwipeControlsProps> = ({
  onLike,
  onDislike,
  onUndo,
  onSuperLike,
  canUndo = false,
  disabled = false,
  className = '',
}) => {
  const buttons = [
    {
      label: '✕',
      ariaLabel: ARIA_LABELS.DISLIKE_BUTTON,
      color: '#ef4444',
      size: 48,
      filled: false,
      onClick: onDislike,
      disabled,
    },
    {
      label: '↩',
      ariaLabel: 'Undo last swipe',
      color: '#60a5fa',
      size: 40,
      filled: false,
      onClick: onUndo || (() => {}),
      disabled: disabled || !canUndo,
    },
    {
      label: '♥',
      ariaLabel: ARIA_LABELS.LIKE_BUTTON,
      color: '#ffffff',
      size: 58,
      filled: true,
      onClick: onLike,
      disabled,
    },
    {
      label: '★',
      ariaLabel: 'Super-like this property',
      color: '#fbbf24',
      size: 48,
      filled: false,
      onClick: onSuperLike || (() => {}),
      disabled,
    },
  ];

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 14,
        padding: '10px 0 6px',
        zIndex: 20,
      }}
    >
      {buttons.map((btn, i) => (
        <button
          key={i}
          onClick={btn.onClick}
          disabled={btn.disabled}
          aria-label={btn.ariaLabel}
          style={{
            width: btn.size,
            height: btn.size,
            borderRadius: '50%',
            background: btn.filled ? 'var(--color-teal)' : 'none',
            border: btn.filled ? 'none' : '2px solid var(--color-line)',
            color: btn.color,
            fontSize: btn.filled ? 24 : btn.size > 44 ? 20 : 16,
            cursor: btn.disabled ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: btn.filled ? '0 6px 24px var(--color-glow)' : 'none',
            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            opacity: btn.disabled ? 0.4 : 1,
          }}
          onMouseEnter={(e) => {
            if (!btn.disabled) e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
};
