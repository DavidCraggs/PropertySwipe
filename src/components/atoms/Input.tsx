import { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
  hint?: string;
}

/**
 * Concept C Input — 1.5px border, teal focus, Libre Franklin labels
 * Keeps shake animation on error
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, error, hint, className = '', id, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <motion.div
        initial={false}
        animate={error ? { x: [-8, 8, -8, 8, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
        style={{ width: '100%' }}
      >
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            style={{
              display: 'block',
              fontFamily: "'Libre Franklin', sans-serif",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 2,
              color: 'var(--color-sub)',
              marginBottom: 8,
              textTransform: 'uppercase',
            }}
          >
            {label}
          </label>
        )}

        {/* Input container */}
        <div style={{ position: 'relative' }}>
          {/* Icon */}
          {icon && (
            <span
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: isFocused ? 'var(--color-teal)' : 'var(--color-sub)',
                transition: 'color 0.2s',
                pointerEvents: 'none',
                display: 'inline-flex',
              }}
            >
              {icon}
            </span>
          )}

          {/* Input field */}
          <input
            ref={ref}
            id={inputId}
            className={className}
            style={{
              width: '100%',
              padding: icon ? '14px 14px 14px 44px' : '14px',
              fontFamily: "'Libre Franklin', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              background: error ? 'rgba(239,68,68,0.04)' : 'var(--color-card)',
              color: 'var(--color-text)',
              border: `1.5px solid ${
                error
                  ? '#ef4444'
                  : isFocused
                    ? 'var(--color-teal)'
                    : 'var(--color-line)'
              }`,
              borderRadius: 12,
              outline: 'none',
              transition: 'border-color 0.2s, background 0.2s',
            }}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
        </div>

        {/* Error message */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              id={`${inputId}-error`}
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                fontFamily: "'Libre Franklin', sans-serif",
                fontSize: 12,
                color: '#ef4444',
                fontWeight: 600,
                marginTop: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Hint text */}
        {hint && !error && (
          <p
            id={`${inputId}-hint`}
            style={{
              fontFamily: "'Libre Franklin', sans-serif",
              fontSize: 11,
              color: 'var(--color-sub)',
              fontWeight: 500,
              marginTop: 6,
            }}
          >
            {hint}
          </p>
        )}
      </motion.div>
    );
  }
);

Input.displayName = 'Input';
