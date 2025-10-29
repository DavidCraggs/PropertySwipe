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

/**
 * Circular icon-only button component
 * Used for like/dislike buttons, navigation controls, etc.
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
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles: Record<IconButtonVariant, string> = {
      primary:
        'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 focus-visible:ring-primary-500 shadow-lg hover:shadow-xl',
      secondary:
        'bg-white text-neutral-900 hover:bg-neutral-50 active:bg-neutral-100 focus-visible:ring-neutral-500 shadow-lg hover:shadow-xl border border-neutral-200',
      success:
        'bg-success-500 text-white hover:bg-success-600 active:bg-success-700 focus-visible:ring-success-500 shadow-lg hover:shadow-xl',
      danger:
        'bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700 focus-visible:ring-danger-500 shadow-lg hover:shadow-xl',
      ghost:
        'bg-white/80 backdrop-blur-sm text-neutral-700 hover:bg-white active:bg-neutral-50 focus-visible:ring-neutral-500',
    };

    const sizeStyles: Record<IconButtonSize, string> = {
      sm: 'w-10 h-10 text-base',
      md: 'w-12 h-12 text-lg',
      lg: 'w-16 h-16 text-2xl',
      xl: 'w-20 h-20 text-3xl',
    };

    const shapeStyles = circular ? 'rounded-full' : 'rounded-xl';

    const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${shapeStyles} ${className}`;

    return (
      <motion.button
        ref={ref}
        type={type}
        className={combinedClassName}
        disabled={disabled}
        onClick={onClick}
        aria-label={ariaLabel}
        whileTap={{ scale: disabled ? 1 : 0.9 }}
        whileHover={{ scale: disabled ? 1 : 1.05 }}
      >
        {icon}
      </motion.button>
    );
  }
);

IconButton.displayName = 'IconButton';
