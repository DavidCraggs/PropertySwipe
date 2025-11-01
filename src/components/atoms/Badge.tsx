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

/**
 * Badge component for displaying labels, EPC ratings, and status indicators
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  epcRating,
  size = 'md',
  className = '',
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg';

  const variantStyles: Record<BadgeVariant, string> = {
    primary: 'bg-primary-100 text-primary-700',
    secondary: 'bg-secondary-100 text-secondary-700',
    success: 'bg-success-100 text-success-700',
    danger: 'bg-danger-100 text-danger-700',
    warning: 'bg-yellow-100 text-yellow-700',
    neutral: 'bg-neutral-100 text-neutral-700',
    epc: epcRating ? EPC_COLORS[epcRating] : 'bg-neutral-100 text-neutral-700',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  return <span className={combinedClassName}>{children}</span>;
};
