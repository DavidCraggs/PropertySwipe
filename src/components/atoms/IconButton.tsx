import { forwardRef } from 'react';
import { motion } from 'framer-motion';

type IconButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
type IconButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface IconButtonProps {
  icon: React.ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  circular?: boolean;
  ariaLabel: string;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const variantStyles: Record<IconButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'var(--color-teal)',
    color: '#fff',
    border: 'none',
  },
  secondary: {
    background: 'var(--color-card)',
    color: 'var(--color-text)',
    border: '1.5px solid var(--color-line)',
  },
  success: {
    background: '#22c55e',
    color: '#fff',
    border: 'none',
  },
  danger: {
    background: '#ef4444',
    color: '#fff',
    border: 'none',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-sub)',
    border: '1.5px solid var(--color-line)',
  },
};

const sizeMap: Record<IconButtonSize, number> = {
  sm: 36,
  md: 44,
  lg: 56,
  xl: 72,
};

/**
 * Concept C IconButton — flat fills or border-only, no gradients
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      variant = 'primary',
      size = 'md',
      circular = true,
      ariaLabel,
      disabled,
      className = '',
      onClick,
      type = 'button',
    },
    ref
  ) => {
    const dim = sizeMap[size];

    const style: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: dim,
      height: dim,
      borderRadius: circular ? '50%' : 12,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transition: 'opacity 0.2s, border-color 0.2s',
      outline: 'none',
      ...variantStyles[variant],
    };

    return (
      <motion.button
        ref={ref}
        type={type}
        style={style}
        className={className}
        disabled={disabled}
        onClick={onClick}
        aria-label={ariaLabel}
        whileHover={disabled ? {} : { scale: 1.1 }}
        whileTap={disabled ? {} : { scale: 0.9 }}
        transition={{ type: 'tween', duration: 0.15, ease: 'easeOut' }}
      >
        {icon}
      </motion.button>
    );
  }
);

IconButton.displayName = 'IconButton';
