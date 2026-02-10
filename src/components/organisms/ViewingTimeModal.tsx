import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sun, Sunset, Moon, Calendar, Clock, Zap, Check } from 'lucide-react';
import { Button } from '../atoms/Button';
import { heading, modalContent } from '../../utils/conceptCStyles';
import type { ViewingTimeSlot, Match } from '../../types';

interface ViewingTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  onSubmit: (preference: {
    flexibility: 'Flexible' | 'Specific' | 'ASAP';
    preferredTimes: ViewingTimeSlot[];
    additionalNotes: string;
  }) => void;
}

/**
 * Modal for renters to specify preferred viewing times after matching
 * Appears after "It's a match!" celebration
 */
export function ViewingTimeModal({ isOpen, onClose, match, onSubmit }: ViewingTimeModalProps) {
  const [flexibility, setFlexibility] = useState<'Flexible' | 'Specific' | 'ASAP'>('Flexible');
  const [selectedSlots, setSelectedSlots] = useState<ViewingTimeSlot[]>([
    { dayType: 'Weekday', timeOfDay: 'Evening' },
  ]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timeSlotOptions = [
    { dayType: 'Weekday' as const, timeOfDay: 'Morning' as const, label: 'Weekday Mornings', subtext: '9am-12pm', icon: Sun },
    { dayType: 'Weekday' as const, timeOfDay: 'Afternoon' as const, label: 'Weekday Afternoons', subtext: '12pm-5pm', icon: Sunset },
    { dayType: 'Weekday' as const, timeOfDay: 'Evening' as const, label: 'Weekday Evenings', subtext: '5pm-8pm', icon: Moon },
    { dayType: 'Weekend' as const, timeOfDay: 'Morning' as const, label: 'Weekend Mornings', subtext: '9am-12pm', icon: Sun },
    { dayType: 'Weekend' as const, timeOfDay: 'Afternoon' as const, label: 'Weekend Afternoons', subtext: '12pm-5pm', icon: Sunset },
    { dayType: 'Weekend' as const, timeOfDay: 'Evening' as const, label: 'Weekend Evenings', subtext: '12pm-6pm', icon: Moon },
  ];

  const isSlotSelected = (dayType: string, timeOfDay: string) => {
    return selectedSlots.some((slot) => slot.dayType === dayType && slot.timeOfDay === timeOfDay);
  };

  const toggleSlot = (dayType: 'Weekday' | 'Weekend', timeOfDay: 'Morning' | 'Afternoon' | 'Evening') => {
    const exists = isSlotSelected(dayType, timeOfDay);
    if (exists) {
      setSelectedSlots(selectedSlots.filter((slot) => !(slot.dayType === dayType && slot.timeOfDay === timeOfDay)));
    } else {
      setSelectedSlots([...selectedSlots, { dayType, timeOfDay }]);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    onSubmit({
      flexibility,
      preferredTimes: flexibility === 'ASAP' ? [] : selectedSlots,
      additionalNotes: additionalNotes.trim(),
    });

    setIsSubmitting(false);
    onClose();
  };

  const handleSkip = () => {
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
          className="absolute inset-0 backdrop-blur-sm"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          style={{ ...modalContent, borderRadius: 20 }}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b" style={{ borderColor: 'var(--color-line)' }}>
            <div className="flex-1">
              <h2 className="mb-1" style={heading(22, 1)}>
                When would you like to view?
              </h2>
              <p style={{ color: 'var(--color-sub)' }}>
                {match.property.address.street}, {match.property.address.city}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--color-sub)' }}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Quick Options */}
            <div>
              <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Your availability</h3>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setFlexibility('ASAP')}
                  className="p-4 rounded-xl border-2 text-left transition-all"
                  style={{
                    borderColor: flexibility === 'ASAP' ? 'var(--color-teal)' : 'var(--color-line)',
                    background: flexibility === 'ASAP' ? 'var(--color-card)' : 'transparent',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ background: flexibility === 'ASAP' ? 'var(--color-teal)' : 'var(--color-line)' }}
                    >
                      <Zap className="w-5 h-5" style={{ color: flexibility === 'ASAP' ? '#fff' : 'var(--color-sub)' }} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium" style={{ color: 'var(--color-text)' }}>As soon as possible</div>
                      <div className="text-sm" style={{ color: 'var(--color-sub)' }}>Available any time this week</div>
                    </div>
                    {flexibility === 'ASAP' && <Check className="w-5 h-5" style={{ color: 'var(--color-teal)' }} />}
                  </div>
                </button>

                <button
                  onClick={() => setFlexibility('Flexible')}
                  className="p-4 rounded-xl border-2 text-left transition-all"
                  style={{
                    borderColor: flexibility === 'Flexible' ? 'var(--color-teal)' : 'var(--color-line)',
                    background: flexibility === 'Flexible' ? 'var(--color-card)' : 'transparent',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ background: flexibility === 'Flexible' ? 'var(--color-teal)' : 'var(--color-line)' }}
                    >
                      <Clock className="w-5 h-5" style={{ color: flexibility === 'Flexible' ? '#fff' : 'var(--color-sub)' }} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium" style={{ color: 'var(--color-text)' }}>I'm flexible with times</div>
                      <div className="text-sm" style={{ color: 'var(--color-sub)' }}>Select your preferred time slots below</div>
                    </div>
                    {flexibility === 'Flexible' && <Check className="w-5 h-5" style={{ color: 'var(--color-teal)' }} />}
                  </div>
                </button>

                <button
                  onClick={() => setFlexibility('Specific')}
                  className="p-4 rounded-xl border-2 text-left transition-all"
                  style={{
                    borderColor: flexibility === 'Specific' ? 'var(--color-teal)' : 'var(--color-line)',
                    background: flexibility === 'Specific' ? 'var(--color-card)' : 'transparent',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ background: flexibility === 'Specific' ? 'var(--color-teal)' : 'var(--color-line)' }}
                    >
                      <Calendar className="w-5 h-5" style={{ color: flexibility === 'Specific' ? '#fff' : 'var(--color-sub)' }} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium" style={{ color: 'var(--color-text)' }}>I have specific times</div>
                      <div className="text-sm" style={{ color: 'var(--color-sub)' }}>Choose exact time slots</div>
                    </div>
                    {flexibility === 'Specific' && <Check className="w-5 h-5" style={{ color: 'var(--color-teal)' }} />}
                  </div>
                </button>
              </div>
            </div>

            {/* Time Slots Selection */}
            {flexibility !== 'ASAP' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>Preferred times</h3>
                  <span className="text-sm" style={{ color: 'var(--color-sub)' }}>
                    {selectedSlots.length} slot{selectedSlots.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {timeSlotOptions.map((option) => {
                    const selected = isSlotSelected(option.dayType, option.timeOfDay);
                    const Icon = option.icon;

                    return (
                      <button
                        key={`${option.dayType}-${option.timeOfDay}`}
                        onClick={() => toggleSlot(option.dayType, option.timeOfDay)}
                        className="p-4 rounded-xl border-2 text-left transition-all"
                        style={{
                          borderColor: selected ? 'var(--color-teal)' : 'var(--color-line)',
                          background: selected ? 'var(--color-card)' : 'transparent',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: selected ? 'var(--color-teal)' : 'var(--color-line)' }}
                          >
                            <Icon className="w-4 h-4" style={{ color: selected ? '#fff' : 'var(--color-sub)' }} />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>{option.label}</div>
                            <div className="text-xs" style={{ color: 'var(--color-sub)' }}>{option.subtext}</div>
                          </div>
                          {selected && <Check className="w-5 h-5" style={{ color: 'var(--color-teal)' }} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Additional Notes */}
            <div>
              <label htmlFor="notes" className="block font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                Additional notes (optional)
              </label>
              <textarea
                id="notes"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                maxLength={200}
                rows={3}
                placeholder="e.g., I work from home Tuesdays, prefer after 6pm weekdays..."
                className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all resize-none"
                style={{
                  background: 'var(--color-card)',
                  border: '1.5px solid var(--color-line)',
                  color: 'var(--color-text)',
                }}
              />
              <div className="text-xs mt-1 text-right" style={{ color: 'var(--color-sub)' }}>
                {additionalNotes.length}/200
              </div>
            </div>

            {/* Info Box */}
            <div className="rounded-xl p-4" style={{ background: 'var(--color-card)', border: '1.5px solid var(--color-line)' }}>
              <p className="text-sm" style={{ color: 'var(--color-sub)' }}>
                💡 <strong>Tip:</strong> The vendor will see your preferences and suggest specific viewing times that work for both of you.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t" style={{ borderColor: 'var(--color-line)', background: 'var(--color-card)' }}>
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="flex-1"
              disabled={isSubmitting}
            >
              Skip for now
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              className="flex-1"
              isLoading={isSubmitting}
              disabled={flexibility !== 'ASAP' && selectedSlots.length === 0}
            >
              Send Preferences
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
