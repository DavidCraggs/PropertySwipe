import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Send, Check } from 'lucide-react';
import { Button } from '../atoms/Button';
import type { Match } from '../../types';

interface ViewingSchedulerProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  onConfirm: (dateTime: Date) => void;
}

/**
 * Modal for landlords to respond to viewing requests
 * Shows renter's preferences and allows landlord to suggest specific date/time
 */
export function ViewingScheduler({ isOpen, onClose, match, onConfirm }: ViewingSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate date options for next 14 days
  const dateOptions = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1); // Start from tomorrow
    return {
      value: date.toISOString().split('T')[0],
      label: date.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      }),
      date
    };
  });

  // Time slot options
  const timeOptions = [
    { value: '09:00', label: '9:00 AM' },
    { value: '09:30', label: '9:30 AM' },
    { value: '10:00', label: '10:00 AM' },
    { value: '10:30', label: '10:30 AM' },
    { value: '11:00', label: '11:00 AM' },
    { value: '11:30', label: '11:30 AM' },
    { value: '12:00', label: '12:00 PM' },
    { value: '12:30', label: '12:30 PM' },
    { value: '13:00', label: '1:00 PM' },
    { value: '13:30', label: '1:30 PM' },
    { value: '14:00', label: '2:00 PM' },
    { value: '14:30', label: '2:30 PM' },
    { value: '15:00', label: '3:00 PM' },
    { value: '15:30', label: '3:30 PM' },
    { value: '16:00', label: '4:00 PM' },
    { value: '16:30', label: '4:30 PM' },
    { value: '17:00', label: '5:00 PM' },
    { value: '17:30', label: '5:30 PM' },
    { value: '18:00', label: '6:00 PM' },
    { value: '18:30', label: '6:30 PM' },
    { value: '19:00', label: '7:00 PM' },
    { value: '19:30', label: '7:30 PM' },
    { value: '20:00', label: '8:00 PM' }
  ];

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) return;

    setIsSubmitting(true);

    // Combine date and time
    const [hours, minutes] = selectedTime.split(':');
    const dateTime = new Date(selectedDate);
    dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    onConfirm(dateTime);
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-neutral-200">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-neutral-900 mb-1">
                Schedule Viewing
              </h2>
              <p className="text-neutral-600">
                For {match.renterName} at {match.property.address.street}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Renter's Preferences */}
            {match.viewingPreference && (
              <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
                <h3 className="font-semibold text-neutral-900 mb-3">Renter's Preferences</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-neutral-700">Flexibility:</span>
                    <span className="px-2 py-1 bg-primary-100 rounded text-primary-900">
                      {match.viewingPreference.flexibility}
                    </span>
                  </div>
                  {match.viewingPreference.preferredTimes.length > 0 && (
                    <div>
                      <span className="font-medium text-neutral-700">Preferred times:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {match.viewingPreference.preferredTimes.map((slot, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 bg-white border border-primary-200 rounded-lg text-xs"
                          >
                            {slot.dayType} {slot.timeOfDay}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {match.viewingPreference.additionalNotes && (
                    <div className="mt-3 pt-3 border-t border-primary-200">
                      <span className="font-medium text-neutral-700">Additional notes:</span>
                      <p className="text-neutral-600 mt-1 italic">
                        "{match.viewingPreference.additionalNotes}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Date Selection */}
            <div>
              <label className="block font-semibold text-neutral-900 mb-3">
                <Calendar className="w-4 h-4 inline mr-2" />
                Select Date
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {dateOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedDate(option.value)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      selectedDate === option.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="text-sm font-medium text-neutral-900">
                      {option.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Selection */}
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="block font-semibold text-neutral-900 mb-3">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Select Time
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {timeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedTime(option.value)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        selectedTime === option.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div className="text-sm font-medium text-neutral-900">
                        {option.label}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Confirmation Summary */}
            {selectedDate && selectedTime && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-success-50 border border-success-200 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 text-success-700 mb-2">
                  <Check className="w-5 h-5" />
                  <span className="font-semibold">Ready to confirm</span>
                </div>
                <p className="text-neutral-900 font-medium">
                  {(() => {
                    const [hours, minutes] = selectedTime.split(':');
                    const dateTime = new Date(selectedDate);
                    dateTime.setHours(parseInt(hours), parseInt(minutes));
                    return dateTime.toLocaleDateString('en-GB', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                  })()}
                </p>
              </motion.div>
            )}

            {/* Info Box */}
            <div className="bg-secondary-50 border border-secondary-200 rounded-xl p-4">
              <p className="text-sm text-secondary-900">
                💡 <strong>Tip:</strong> The renter will receive a notification with the confirmed viewing time. Make sure you're available!
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-neutral-200 bg-neutral-50">
            <Button
              variant="ghost"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirm}
              className="flex-1"
              isLoading={isSubmitting}
              disabled={!selectedDate || !selectedTime}
            >
              <Send className="w-4 h-4 mr-2" />
              Confirm Viewing
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
