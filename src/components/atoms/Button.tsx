import { forwardRef } from 'react';
import { motion } from 'framer-motion';

/**
 * Button variants for different use cases
 */
export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'outline';

/**
 * Button sizes
 */
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  children?: React.ReactNode;
  'aria-label'?: string;
  'aria-describedby'?: string;
  tabIndex?: number;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'var(--color-teal)',
    color: '#fff',
    border: 'none',
  },
  secondary: {
    background: 'transparent',
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
    color: 'var(--color-text)',
    border: 'none',
  },
  outline: {
    background: 'transparent',
    color: 'var(--color-teal)',
    border: '1.5px solid var(--color-teal)',
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { fontSize: 11, padding: '8px 14px', gap: 6, letterSpacing: 1.5 },
  md: { fontSize: 12, padding: '12px 20px', gap: 8, letterSpacing: 2 },
  lg: { fontSize: 13, padding: '14px 28px', gap: 10, letterSpacing: 2 },
  xl: { fontSize: 14, padding: '16px 36px', gap: 12, letterSpacing: 2.5 },
};

/**
 * Concept C Button — flat fills, no gradients, Libre Franklin uppercase
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      icon,
      iconPosition = 'left',
      isLoading = false,
      disabled,
      children,
      className = '',
      onClick,
      type = 'button',
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      tabIndex,
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    const baseStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Libre Franklin', sans-serif",
      fontWeight: 800,
      textTransform: 'uppercase',
      borderRadius: 12,
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      opacity: isDisabled ? 0.5 : 1,
      transition: 'opacity 0.2s, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
      width: fullWidth ? '100%' : undefined,
      outline: 'none',
      position: 'relative',
      ...sizeStyles[size],
      ...variantStyles[variant],
    };

    return (
      <motion.button
        ref={ref}
        type={type}
        style={baseStyle}
        className={className}
        disabled={isDisabled}
        onClick={onClick}
        whileHover={isDisabled ? {} : { scale: 1.02 }}
        whileTap={isDisabled ? {} : { scale: 0.97 }}
        transition={{ type: 'tween', duration: 0.15, ease: 'easeOut' }}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        tabIndex={tabIndex}
      >
        {/* Loading spinner */}
        {isLoading && (
          <svg
            style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              style={{ opacity: 0.25 }}
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              style={{ opacity: 0.75 }}
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {/* Left icon */}
        {!isLoading && icon && iconPosition === 'left' && (
          <span style={{ display: 'inline-flex' }}>{icon}</span>
        )}

        {/* Button text */}
        <span>{children}</span>

        {/* Right icon */}
        {!isLoading && icon && iconPosition === 'right' && (
          <span style={{ display: 'inline-flex' }}>{icon}</span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
