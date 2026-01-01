import { forwardRef } from 'react';
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
 * Reusable form input field with label, validation, and error display
 * Supports icons, helper text, and accessible error messages
 */
export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, helperText, isRequired, icon, className = '', ...props }, ref) => {
    const hasError = !!error;

    return (
      <div className="space-y-2">
        {/* Label */}
        <label htmlFor={props.id} className="block text-sm font-medium text-neutral-700">
          {label}
          {isRequired && <span className="text-danger-500 ml-1">*</span>}
        </label>

        {/* Input Container */}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            className={`
              w-full px-4 py-3 ${icon ? 'pl-10' : ''}
              bg-white border-2 rounded-xl
              text-neutral-900 placeholder-neutral-400
              transition-all duration-200
              focus:outline-none focus:ring-4
              disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed
              ${
                hasError
                  ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-100'
                  : 'border-neutral-200 focus:border-primary-500 focus:ring-primary-100'
              }
              ${className}
            `}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined
            }
            {...props}
          />

          {/* Error Icon */}
          {hasError && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-danger-500">
              <AlertCircle className="w-5 h-5" />
            </div>
          )}
        </div>

        {/* Helper Text or Error Message */}
        {error ? (
          <p id={`${props.id}-error`} className="text-sm text-danger-600 flex items-start gap-1" role="alert">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p id={`${props.id}-helper`} className="text-sm text-neutral-500">
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
 * Textarea variant of FormField
 */
export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  ({ label, error, helperText, isRequired, rows = 4, maxLength, className = '', ...props }, ref) => {
    const hasError = !!error;

    return (
      <div className="space-y-2">
        {/* Label */}
        <div className="flex items-center justify-between">
          <label htmlFor={props.id} className="block text-sm font-medium text-neutral-700">
            {label}
            {isRequired && <span className="text-danger-500 ml-1">*</span>}
          </label>
          {maxLength && (
            <span className="text-xs text-neutral-500">
              {(props.value as string)?.length || 0}/{maxLength}
            </span>
          )}
        </div>

        {/* Textarea */}
        <textarea
          ref={ref}
          rows={rows}
          maxLength={maxLength}
          className={`
            w-full px-4 py-3
            bg-white border-2 rounded-xl
            text-neutral-900 placeholder-neutral-400
            transition-all duration-200
            focus:outline-none focus:ring-4
            disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed
            resize-none
            ${
              hasError
                ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-100'
                : 'border-neutral-200 focus:border-primary-500 focus:ring-primary-100'
            }
            ${className}
          `}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined
          }
          {...(props as Record<string, unknown>)}
        />

        {/* Helper Text or Error Message */}
        {error ? (
          <p id={`${props.id}-error`} className="text-sm text-danger-600 flex items-start gap-1" role="alert">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p id={`${props.id}-helper`} className="text-sm text-neutral-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

TextAreaField.displayName = 'TextAreaField';
