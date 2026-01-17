import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PartyPopper, Home, MapPin, Banknote, Calendar, CheckCircle } from 'lucide-react';
import { Button } from '../atoms/Button';
import type { Match } from '../../types';
import { formatPrice } from '../../utils/formatters';

interface AcceptOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => Promise<void>;
  match: Match | null;
}

export function AcceptOfferModal({
  isOpen,
  onClose,
  onAccept,
  match,
}: AcceptOfferModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      await onAccept();
      onClose();
    } catch (error) {
      console.error('Failed to accept offer:', error);
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
              className="absolute top-4 right-4 p-1 text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-colors disabled:opacity-50 z-10"
            >
              <X size={20} />
            </button>

            {/* Header with celebration gradient */}
            <div className="bg-gradient-to-br from-success-500 via-primary-500 to-secondary-500 p-6 text-white text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <PartyPopper size={32} className="text-white" />
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold mb-1"
              >
                You've Got an Offer!
              </motion.h3>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white/80 text-sm"
              >
                The landlord wants you as their tenant
              </motion.p>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Property info */}
              <div className="bg-neutral-50 rounded-xl p-4 mb-5">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                    <Home size={24} className="text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-900 truncate">
                      {match.property.address.street}
                    </p>
                    <p className="text-sm text-neutral-500 flex items-center gap-1">
                      <MapPin size={14} />
                      {match.property.address.city}, {match.property.address.postcode}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-neutral-200">
                  <div className="flex items-center gap-2">
                    <Banknote size={16} className="text-neutral-400" />
                    <div>
                      <p className="text-xs text-neutral-500">Rent</p>
                      <p className="font-semibold text-neutral-900">{formatPrice(match.property.rentPcm)}/mo</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-neutral-400" />
                    <div>
                      <p className="text-xs text-neutral-500">Available</p>
                      <p className="font-semibold text-neutral-900">
                        {new Date(match.property.availableFrom).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* What accepting means */}
              <div className="space-y-2 mb-6">
                <p className="text-sm font-medium text-neutral-700">By accepting this offer:</p>
                <ul className="space-y-2 text-sm text-neutral-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-success-500 shrink-0" />
                    <span>You agree to proceed with this tenancy</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-success-500 shrink-0" />
                    <span>The landlord will prepare the tenancy agreement</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-success-500 shrink-0" />
                    <span>You'll receive move-in instructions shortly</span>
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
                  Review Later
                </Button>
                <Button
                  variant="primary"
                  onClick={handleAccept}
                  disabled={isLoading}
                  className="flex-1 !bg-success-500 hover:!bg-success-600"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Accepting...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <CheckCircle size={16} />
                      Accept Offer
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
