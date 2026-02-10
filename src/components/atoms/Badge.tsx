import type { EPCRating } from '../../types';
import { EPC_COLORS } from '../../utils/constants';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'neutral' | 'epc';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  epcRating?: EPCRating;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantStyles: Record<Exclude<BadgeVariant, 'epc'>, React.CSSProperties> = {
  primary: {
    background: 'var(--color-glow)',
    color: 'var(--color-teal)',
    border: '1px solid var(--color-teal)',
  },
  secondary: {
    background: 'transparent',
    color: 'var(--color-sub)',
    border: '1px solid var(--color-line)',
  },
  success: {
    background: 'rgba(34,197,94,0.08)',
    color: '#22c55e',
    border: '1px solid rgba(34,197,94,0.2)',
  },
  danger: {
    background: 'rgba(239,68,68,0.08)',
    color: '#ef4444',
    border: '1px solid rgba(239,68,68,0.2)',
  },
  warning: {
    background: 'rgba(234,179,8,0.08)',
    color: '#ca8a04',
    border: '1px solid rgba(234,179,8,0.2)',
  },
  neutral: {
    background: 'transparent',
    color: 'var(--color-sub)',
    border: '1px solid var(--color-line)',
  },
};

const sizeStyles: Record<'sm' | 'md' | 'lg', React.CSSProperties> = {
  sm: { fontSize: 9, padding: '2px 8px', letterSpacing: 1.5 },
  md: { fontSize: 10, padding: '4px 10px', letterSpacing: 1.5 },
  lg: { fontSize: 12, padding: '6px 14px', letterSpacing: 2 },
};

/**
 * Concept C Badge — monochrome base + teal primary, border-based
 * EPC variant retains its color mapping
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  epcRating,
  size = 'md',
  className = '',
}) => {
  // EPC badges still use the existing color class system
  if (variant === 'epc' && epcRating) {
    const epcClass = EPC_COLORS[epcRating] || 'bg-neutral-100 text-neutral-700';
    return (
      <span
        className={`inline-flex items-center justify-center font-semibold rounded-lg ${epcClass} ${className}`}
        style={{
          fontFamily: "'Libre Franklin', sans-serif",
          fontWeight: 700,
          textTransform: 'uppercase',
          ...sizeStyles[size],
        }}
      >
        {children}
      </span>
    );
  }

  const vStyle = variant === 'epc' ? variantStyles.neutral : variantStyles[variant];

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Libre Franklin', sans-serif",
        fontWeight: 700,
        textTransform: 'uppercase',
        borderRadius: 6,
        ...sizeStyles[size],
        ...vStyle,
      }}
    >
      {children}
    </span>
  );
};
