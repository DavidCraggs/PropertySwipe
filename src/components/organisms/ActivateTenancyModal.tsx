import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Home, Calendar, User, CheckCircle, Key } from 'lucide-react';
import { Button } from '../atoms/Button';
import type { Match } from '../../types';

interface ActivateTenancyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (startDate: Date) => Promise<void>;
  match: Match | null;
}

export function ActivateTenancyModal({
  isOpen,
  onClose,
  onConfirm,
  match,
}: ActivateTenancyModalProps) {
  const [startDate, setStartDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Set default date to first of next month when modal opens
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      setStartDate(nextMonth.toISOString().split('T')[0]);
      setError('');
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!startDate) {
      setError('Please select a start date');
      return;
    }

    const date = new Date(startDate);
    if (isNaN(date.getTime())) {
      setError('Invalid date selected');
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm(date);
      onClose();
    } catch (error) {
      console.error('Failed to activate tenancy:', error);
      setError('Failed to activate tenancy. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!match) return null;

  const formattedDate = startDate ? new Date(startDate).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }) : '';

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
            <div className="bg-gradient-to-br from-success-500 to-success-600 p-6 text-white">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                <Key size={28} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-1">Activate Tenancy</h3>
              <p className="text-success-100 text-sm">Make this tenant an active resident</p>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Tenant & Property info */}
              <div className="bg-neutral-50 rounded-xl p-4 mb-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-success-100 rounded-full flex items-center justify-center">
                    <User size={20} className="text-success-600" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">{match.renterName || 'Tenant'}</p>
                    <p className="text-sm text-neutral-500">Offer Accepted</p>
                  </div>
                  <CheckCircle size={20} className="text-success-500 ml-auto" />
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Home size={16} className="text-neutral-400" />
                  <span>{match.property.address.street}, {match.property.address.city}</span>
                </div>
              </div>

              {/* Date picker */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  <Calendar size={16} className="inline mr-2 text-neutral-400" />
                  Tenancy Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setError('');
                  }}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-success-500 focus:border-transparent text-neutral-900"
                />
                {startDate && (
                  <p className="mt-2 text-sm text-neutral-500">
                    {formattedDate}
                  </p>
                )}
                {error && (
                  <p className="mt-2 text-sm text-danger-600">{error}</p>
                )}
              </div>

              {/* What happens next */}
              <div className="bg-success-50 rounded-xl p-4 mb-6">
                <p className="text-sm font-medium text-success-800 mb-2">What happens when activated:</p>
                <ul className="space-y-1.5 text-sm text-success-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} />
                    Tenant status changes to "Active"
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} />
                    Welcome message sent automatically
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={14} />
                    Tenancy management features unlocked
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
                  disabled={isLoading || !startDate}
                  className="flex-1 !bg-success-500 hover:!bg-success-600"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Activating...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Home size={16} />
                      Activate Tenancy
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
