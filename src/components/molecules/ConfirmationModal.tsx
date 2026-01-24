import { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle, Info, CheckCircle } from 'lucide-react';

export type ConfirmationVariant = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (inputValue?: string) => void;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationVariant;
  /** If provided, shows a text input field */
  inputLabel?: string;
  inputPlaceholder?: string;
  inputRequired?: boolean;
  /** Pre-fill the input with a value */
  inputDefaultValue?: string;
  /** Use textarea instead of input */
  inputMultiline?: boolean;
}

const variantStyles: Record<ConfirmationVariant, {
  icon: typeof AlertTriangle;
  iconBg: string;
  iconColor: string;
  confirmBg: string;
  confirmHover: string;
}> = {
  danger: {
    icon: AlertTriangle,
    iconBg: 'bg-danger-100',
    iconColor: 'text-danger-600',
    confirmBg: 'bg-danger-500',
    confirmHover: 'hover:bg-danger-600',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-warning-100',
    iconColor: 'text-warning-600',
    confirmBg: 'bg-warning-500',
    confirmHover: 'hover:bg-warning-600',
  },
  info: {
    icon: Info,
    iconBg: 'bg-primary-100',
    iconColor: 'text-primary-600',
    confirmBg: 'bg-primary-500',
    confirmHover: 'hover:bg-primary-600',
  },
  success: {
    icon: CheckCircle,
    iconBg: 'bg-success-100',
    iconColor: 'text-success-600',
    confirmBg: 'bg-success-500',
    confirmHover: 'hover:bg-success-600',
  },
};

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  inputLabel,
  inputPlaceholder,
  inputRequired = false,
  inputDefaultValue = '',
  inputMultiline = false,
}: ConfirmationModalProps) {
  const [inputValue, setInputValue] = useState(inputDefaultValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Reset input when modal opens
  useEffect(() => {
    if (isOpen) {
      setInputValue(inputDefaultValue);
      setIsSubmitting(false);
    }
  }, [isOpen, inputDefaultValue]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputLabel && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, inputLabel]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const styles = variantStyles[variant];
  const Icon = styles.icon;

  const handleConfirm = async () => {
    if (inputRequired && inputLabel && !inputValue.trim()) {
      inputRef.current?.focus();
      return;
    }
    setIsSubmitting(true);
    try {
      await onConfirm(inputLabel ? inputValue : undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !inputMultiline) {
      e.preventDefault();
      handleConfirm();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-4 p-6 pb-4">
          <div className={`w-12 h-12 ${styles.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-6 h-6 ${styles.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-neutral-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-4">
          <div className="text-neutral-700 text-sm leading-relaxed">
            {message}
          </div>

          {/* Optional Input */}
          {inputLabel && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {inputLabel}
                {inputRequired && <span className="text-danger-500 ml-1">*</span>}
              </label>
              {inputMultiline ? (
                <textarea
                  ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={inputPlaceholder}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                  rows={3}
                />
              ) : (
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={inputPlaceholder}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-2 border-t border-neutral-100">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting || (inputRequired && !!inputLabel && !inputValue.trim())}
            className={`flex-1 px-4 py-2.5 ${styles.confirmBg} ${styles.confirmHover} text-white rounded-lg font-medium transition-colors disabled:opacity-50`}
          >
            {isSubmitting ? 'Please wait...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
