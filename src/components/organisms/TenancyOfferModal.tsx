import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, User, Home, Send } from 'lucide-react';
import { Button } from '../atoms/Button';
import type { Match } from '../../types';

interface TenancyOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  match: Match | null;
}

export function TenancyOfferModal({
  isOpen,
  onClose,
  onConfirm,
  match,
}: TenancyOfferModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Failed to send offer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!match) return null;

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
              className="absolute top-4 right-4 p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors disabled:opacity-50 z-10"
            >
              <X size={20} />
            </button>

            {/* Header with gradient */}
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-6 text-white">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                <FileText size={28} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-1">Offer Tenancy</h3>
              <p className="text-primary-100 text-sm">Send a formal offer to this tenant</p>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Tenant info */}
              <div className="bg-neutral-50 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <User size={20} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">{match.renterName || 'Tenant'}</p>
                    <p className="text-sm text-neutral-500">Prospective Tenant</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Home size={16} className="text-neutral-400" />
                  <span>{match.property.address.street}, {match.property.address.city}</span>
                </div>
              </div>

              {/* What happens next */}
              <div className="space-y-3 mb-6">
                <p className="text-sm font-medium text-neutral-700">What happens next:</p>
                <ul className="space-y-2 text-sm text-neutral-600">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">1</span>
                    <span>The tenant will be notified of your offer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">2</span>
                    <span>They can review and accept the terms</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">3</span>
                    <span>Once accepted, you can activate the tenancy</span>
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Send size={16} />
                      Send Offer
                    </span>
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
