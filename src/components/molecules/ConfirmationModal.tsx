import { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { heading } from '../../utils/conceptCStyles';

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
  inputLabel?: string;
  inputPlaceholder?: string;
  inputRequired?: boolean;
  inputDefaultValue?: string;
  inputMultiline?: boolean;
}

const variantConfig: Record<ConfirmationVariant, {
  icon: typeof AlertTriangle;
  iconBg: string;
  iconColor: string;
  confirmBg: string;
}> = {
  danger: { icon: AlertTriangle, iconBg: 'rgba(239,68,68,0.12)', iconColor: '#ef4444', confirmBg: '#ef4444' },
  warning: { icon: AlertTriangle, iconBg: 'rgba(234,179,8,0.12)', iconColor: '#eab308', confirmBg: '#eab308' },
  info: { icon: Info, iconBg: 'rgba(13,148,136,0.08)', iconColor: 'var(--color-teal)', confirmBg: 'var(--color-teal)' },
  success: { icon: CheckCircle, iconBg: 'rgba(34,197,94,0.12)', iconColor: '#22c55e', confirmBg: '#22c55e' },
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
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setInputValue(inputDefaultValue);
      setIsSubmitting(false);
    }
  }, [isOpen, inputDefaultValue]);

  useEffect(() => {
    if (isOpen && inputLabel && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, inputLabel]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cfg = variantConfig[variant];
  const Icon = cfg.icon;

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

  const inputStyles = {
    fontFamily: "'Libre Franklin', sans-serif",
    fontSize: 14,
    fontWeight: 500 as const,
    width: '100%',
    padding: '10px 14px',
    background: 'var(--color-card)',
    color: 'var(--color-text)',
    border: `1.5px solid ${inputFocused ? 'var(--color-teal)' : 'var(--color-line)'}`,
    borderRadius: 10,
    outline: 'none',
    transition: 'border-color 0.2s',
    resize: 'none' as const,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="max-w-md w-full"
        style={{
          background: 'var(--color-card)',
          border: '1.5px solid var(--color-line)',
          borderRadius: 20,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-4 p-6 pb-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: cfg.iconBg }}
          >
            <Icon className="w-6 h-6" style={{ color: cfg.iconColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 style={heading(20, 1)}>{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 transition-colors"
            style={{ color: 'var(--color-sub)' }}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-4">
          <div
            style={{
              fontFamily: "'Libre Franklin', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              lineHeight: 1.6,
              color: 'var(--color-sub)',
            }}
          >
            {message}
          </div>

          {inputLabel && (
            <div className="mt-4">
              <label
                style={{
                  fontFamily: "'Libre Franklin', sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  color: 'var(--color-sub)',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                {inputLabel}
                {inputRequired && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
              </label>
              {inputMultiline ? (
                <textarea
                  ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  placeholder={inputPlaceholder}
                  style={inputStyles}
                  rows={3}
                />
              ) : (
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  placeholder={inputPlaceholder}
                  style={inputStyles}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-2" style={{ borderTop: '1px solid var(--color-line)' }}>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              flex: 1,
              fontFamily: "'Libre Franklin', sans-serif",
              fontSize: 13,
              fontWeight: 700,
              padding: '10px 16px',
              background: 'transparent',
              color: 'var(--color-sub)',
              border: '1.5px solid var(--color-line)',
              borderRadius: 10,
              cursor: 'pointer',
              transition: 'background 0.2s',
              opacity: isSubmitting ? 0.5 : 1,
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting || (inputRequired && !!inputLabel && !inputValue.trim())}
            style={{
              flex: 1,
              fontFamily: "'Libre Franklin', sans-serif",
              fontSize: 13,
              fontWeight: 700,
              padding: '10px 16px',
              background: cfg.confirmBg,
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              transition: 'opacity 0.2s',
              opacity: (isSubmitting || (inputRequired && !!inputLabel && !inputValue.trim())) ? 0.5 : 1,
            }}
          >
            {isSubmitting ? 'Please wait...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
