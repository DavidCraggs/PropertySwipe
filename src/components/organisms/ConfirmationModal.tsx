import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, Info, HelpCircle } from 'lucide-react';
import { Button } from '../atoms/Button';

type ModalVariant = 'confirm' | 'warning' | 'success' | 'info';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ModalVariant;
  isLoading?: boolean;
  children?: React.ReactNode;
}

const variantConfig: Record<ModalVariant, { icon: typeof AlertTriangle; iconBg: string; iconColor: string; buttonVariant: 'primary' | 'danger' | 'secondary' }> = {
  confirm: {
    icon: HelpCircle,
    iconBg: 'bg-primary-100',
    iconColor: 'text-primary-600',
    buttonVariant: 'primary',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-warning-100',
    iconColor: 'text-warning-600',
    buttonVariant: 'danger',
  },
  success: {
    icon: CheckCircle,
    iconBg: 'bg-success-100',
    iconColor: 'text-success-600',
    buttonVariant: 'primary',
  },
  info: {
    icon: Info,
    iconBg: 'bg-primary-100',
    iconColor: 'text-primary-600',
    buttonVariant: 'primary',
  },
};

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'confirm',
  isLoading = false,
  children,
}: ConfirmationModalProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, isLoading]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isLoading ? undefined : onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              disabled={isLoading}
              className="absolute top-4 right-4 p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors disabled:opacity-50"
            >
              <X size={20} />
            </button>

            {/* Content */}
            <div className="p-6">
              {/* Icon */}
              <div className={`w-12 h-12 ${config.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <Icon size={24} className={config.iconColor} />
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-neutral-900 text-center mb-2">
                {title}
              </h3>

              {/* Message */}
              <div className="text-neutral-600 text-center text-sm mb-6">
                {message}
              </div>

              {/* Optional children (for forms, etc.) */}
              {children && (
                <div className="mb-6">
                  {children}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {cancelLabel}
                </Button>
                <Button
                  variant={config.buttonVariant}
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    confirmLabel
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
