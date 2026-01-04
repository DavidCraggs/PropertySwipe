import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, AlertTriangle, Settings } from 'lucide-react';
import { IconButton } from '../atoms/IconButton';
import { Button } from '../atoms/Button';

export interface SLAConfig {
  emergencyResponseHours: number;
  urgentResponseHours: number;
  routineResponseHours: number;
  maintenanceResponseDays: number;
}

interface SLAConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: SLAConfig;
  onSave: (config: SLAConfig) => void;
}

/**
 * SLAConfigurationModal component
 * Allows editing of SLA response times for agencies
 * Features:
 * - Form with 4 numeric inputs for response times
 * - Validation (positive numbers, reasonable ranges)
 * - Save/Cancel buttons
 */
export const SLAConfigurationModal: React.FC<SLAConfigurationModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onSave,
}) => {
  const [config, setConfig] = useState<SLAConfig>(currentConfig);
  const [errors, setErrors] = useState<Partial<Record<keyof SLAConfig, string>>>({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setConfig(currentConfig);
      setErrors({});
    }
  }, [isOpen, currentConfig]);

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

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const validateField = (field: keyof SLAConfig, value: number): string | undefined => {
    if (value <= 0) {
      return 'Must be greater than 0';
    }

    switch (field) {
      case 'emergencyResponseHours':
        if (value > 24) return 'Emergency response should be within 24 hours';
        break;
      case 'urgentResponseHours':
        if (value > 72) return 'Urgent response should be within 72 hours';
        if (value <= config.emergencyResponseHours) return 'Must be greater than emergency SLA';
        break;
      case 'routineResponseHours':
        if (value > 168) return 'Routine response should be within 1 week';
        if (value <= config.urgentResponseHours) return 'Must be greater than urgent SLA';
        break;
      case 'maintenanceResponseDays':
        if (value > 30) return 'Maintenance should be within 30 days';
        break;
    }
    return undefined;
  };

  const handleChange = (field: keyof SLAConfig, value: string) => {
    const numValue = parseInt(value, 10) || 0;
    setConfig(prev => ({ ...prev, [field]: numValue }));

    const error = validateField(field, numValue);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleSave = () => {
    // Validate all fields
    const newErrors: Partial<Record<keyof SLAConfig, string>> = {};
    let hasErrors = false;

    (Object.keys(config) as Array<keyof SLAConfig>).forEach(field => {
      const error = validateField(field, config[field]);
      if (error) {
        newErrors[field] = error;
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    onSave(config);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <Settings size={20} className="text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-neutral-900">SLA Configuration</h2>
                    <p className="text-sm text-neutral-600">Set response time targets</p>
                  </div>
                </div>
                <IconButton
                  icon={<X size={24} />}
                  variant="ghost"
                  size="md"
                  ariaLabel="Close"
                  onClick={onClose}
                />
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Info Banner */}
                <div className="bg-primary-50 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle size={20} className="text-primary-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-primary-800">
                    <p className="font-medium mb-1">Response Time Targets</p>
                    <p>These SLAs define your target response times for different issue priorities. Overdue issues will be highlighted in your dashboard.</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  {/* Emergency Response */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-danger-500" />
                        Emergency Response (hours)
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="24"
                        value={config.emergencyResponseHours}
                        onChange={(e) => handleChange('emergencyResponseHours', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors.emergencyResponseHours ? 'border-danger-500' : 'border-neutral-300'
                        }`}
                        placeholder="e.g., 4"
                      />
                      <Clock size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                    </div>
                    {errors.emergencyResponseHours && (
                      <p className="text-sm text-danger-600 mt-1">{errors.emergencyResponseHours}</p>
                    )}
                    <p className="text-xs text-neutral-500 mt-1">For gas leaks, flooding, no heating in winter</p>
                  </div>

                  {/* Urgent Response */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-warning-500" />
                        Urgent Response (hours)
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="72"
                        value={config.urgentResponseHours}
                        onChange={(e) => handleChange('urgentResponseHours', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors.urgentResponseHours ? 'border-danger-500' : 'border-neutral-300'
                        }`}
                        placeholder="e.g., 24"
                      />
                      <Clock size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                    </div>
                    {errors.urgentResponseHours && (
                      <p className="text-sm text-danger-600 mt-1">{errors.urgentResponseHours}</p>
                    )}
                    <p className="text-xs text-neutral-500 mt-1">For broken appliances, plumbing issues</p>
                  </div>

                  {/* Routine Response */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-success-500" />
                        Routine Response (hours)
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="168"
                        value={config.routineResponseHours}
                        onChange={(e) => handleChange('routineResponseHours', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors.routineResponseHours ? 'border-danger-500' : 'border-neutral-300'
                        }`}
                        placeholder="e.g., 72"
                      />
                      <Clock size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                    </div>
                    {errors.routineResponseHours && (
                      <p className="text-sm text-danger-600 mt-1">{errors.routineResponseHours}</p>
                    )}
                    <p className="text-xs text-neutral-500 mt-1">For general maintenance, minor repairs</p>
                  </div>

                  {/* Maintenance Response */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-neutral-500" />
                        Maintenance Response (days)
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={config.maintenanceResponseDays}
                        onChange={(e) => handleChange('maintenanceResponseDays', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors.maintenanceResponseDays ? 'border-danger-500' : 'border-neutral-300'
                        }`}
                        placeholder="e.g., 14"
                      />
                      <Clock size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                    </div>
                    {errors.maintenanceResponseDays && (
                      <p className="text-sm text-danger-600 mt-1">{errors.maintenanceResponseDays}</p>
                    )}
                    <p className="text-xs text-neutral-500 mt-1">For scheduled repairs, contractor work</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-neutral-200 px-6 py-4 flex justify-end gap-3">
                <Button variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSave}>
                  Save Changes
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
