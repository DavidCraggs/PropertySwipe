import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../atoms/Button';

interface FormStepProps {
  title: string;
  subtitle?: string;
  currentStep: number;
  totalSteps: number;
  children: ReactNode;
  onNext?: () => void;
  onBack?: () => void;
  nextLabel?: string;
  isNextDisabled?: boolean;
  isLastStep?: boolean;
  isLoading?: boolean;
}

/**
 * Reusable form step container with progress indicator
 * Provides consistent layout and animations for multi-step forms
 */
export function FormStep({
  title,
  subtitle,
  currentStep,
  totalSteps,
  children,
  onNext,
  onBack,
  nextLabel = 'Continue',
  isNextDisabled = false,
  isLastStep = false,
  isLoading = false,
}: FormStepProps) {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full p-8"
    >
      {/* Progress Bar */}
      <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden mb-8">
        <motion.div
          className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-3 mb-6">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </button>
        )}
        <div className="flex gap-2">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index < currentStep
                  ? 'w-8 bg-primary-500'
                  : index === currentStep
                    ? 'w-12 bg-primary-500'
                    : 'w-2 bg-neutral-300'
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-neutral-500 ml-auto">
          Step {currentStep + 1} of {totalSteps}
        </span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">{title}</h2>
        {subtitle && <p className="text-neutral-600 text-base md:text-lg">{subtitle}</p>}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto mb-6">{children}</div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-neutral-200">
        {onBack && (
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
        )}
        {onNext && (
          <Button
            variant="primary"
            onClick={onNext}
            disabled={isNextDisabled}
            isLoading={isLoading}
            className="flex-1"
          >
            {isLastStep ? 'Complete' : nextLabel}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
