import { forwardRef, useState } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  isRequired?: boolean;
  icon?: ReactNode;
}

/**
 * Concept C form input — Libre Franklin, CSS var borders, teal focus
 */
export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, helperText, isRequired, icon, className = '', ...props }, ref) => {
    const hasError = !!error;
    const [focused, setFocused] = useState(false);

    return (
      <div className="space-y-2">
        {/* Label */}
        <label
          htmlFor={props.id}
          style={{
            fontFamily: "'Libre Franklin', sans-serif",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            color: 'var(--color-sub)',
            display: 'block',
          }}
        >
          {label}
          {isRequired && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
        </label>

        {/* Input Container */}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-sub)' }}>
              {icon}
            </div>
          )}

          <input
            ref={ref}
            className={`w-full disabled:cursor-not-allowed ${className}`}
            style={{
              fontFamily: "'Libre Franklin', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              padding: icon ? '12px 16px 12px 40px' : '12px 16px',
              background: 'var(--color-card)',
              color: 'var(--color-text)',
              border: `1.5px solid ${hasError ? '#ef4444' : focused ? 'var(--color-teal)' : 'var(--color-line)'}`,
              borderRadius: 12,
              outline: 'none',
              transition: 'border-color 0.2s',
              opacity: props.disabled ? 0.5 : 1,
            }}
            onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
            onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined
            }
            {...props}
          />

          {/* Error Icon */}
          {hasError && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#ef4444' }}>
              <AlertCircle className="w-5 h-5" />
            </div>
          )}
        </div>

        {/* Helper Text or Error Message */}
        {error ? (
          <p
            id={`${props.id}-error`}
            className="flex items-start gap-1"
            style={{ fontFamily: "'Libre Franklin', sans-serif", fontSize: 12, fontWeight: 600, color: '#ef4444' }}
            role="alert"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p
            id={`${props.id}-helper`}
            style={{ fontFamily: "'Libre Franklin', sans-serif", fontSize: 12, fontWeight: 500, color: 'var(--color-sub)' }}
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

interface TextAreaFieldProps extends InputHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helperText?: string;
  isRequired?: boolean;
  rows?: number;
  maxLength?: number;
}

/**
 * Concept C textarea — same design as FormField
 */
export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  ({ label, error, helperText, isRequired, rows = 4, maxLength, className = '', ...props }, ref) => {
    const hasError = !!error;
    const [focused, setFocused] = useState(false);

    return (
      <div className="space-y-2">
        {/* Label */}
        <div className="flex items-center justify-between">
          <label
            htmlFor={props.id}
            style={{
              fontFamily: "'Libre Franklin', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              color: 'var(--color-sub)',
              display: 'block',
            }}
          >
            {label}
            {isRequired && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
          </label>
          {maxLength && (
            <span style={{ fontFamily: "'Libre Franklin', sans-serif", fontSize: 11, color: 'var(--color-sub)' }}>
              {(props.value as string)?.length || 0}/{maxLength}
            </span>
          )}
        </div>

        {/* Textarea */}
        <textarea
          ref={ref}
          rows={rows}
          maxLength={maxLength}
          className={`w-full resize-none disabled:cursor-not-allowed ${className}`}
          style={{
            fontFamily: "'Libre Franklin', sans-serif",
            fontSize: 14,
            fontWeight: 500,
            padding: '12px 16px',
            background: 'var(--color-card)',
            color: 'var(--color-text)',
            border: `1.5px solid ${hasError ? '#ef4444' : focused ? 'var(--color-teal)' : 'var(--color-line)'}`,
            borderRadius: 12,
            outline: 'none',
            transition: 'border-color 0.2s',
            opacity: props.disabled ? 0.5 : 1,
          }}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e as never); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e as never); }}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined
          }
          {...(props as Record<string, unknown>)}
        />

        {/* Helper Text or Error Message */}
        {error ? (
          <p
            id={`${props.id}-error`}
            className="flex items-start gap-1"
            style={{ fontFamily: "'Libre Franklin', sans-serif", fontSize: 12, fontWeight: 600, color: '#ef4444' }}
            role="alert"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p
            id={`${props.id}-helper`}
            style={{ fontFamily: "'Libre Franklin', sans-serif", fontSize: 12, fontWeight: 500, color: 'var(--color-sub)' }}
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

TextAreaField.displayName = 'TextAreaField';
