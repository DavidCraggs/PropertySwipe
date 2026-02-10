import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../atoms/Button';
import { heading, subText } from '../../utils/conceptCStyles';

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
 * Concept C form step container — Bebas heading, teal progress, minimal borders
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
      <div
        className="w-full h-1.5 rounded-full overflow-hidden mb-8"
        style={{ background: 'var(--color-line)' }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'var(--color-teal)' }}
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
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--color-sub)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-line)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex gap-2">
          {Array.from({ length: totalSteps }).map((_, index) => {
            const stepNumber = index + 1;
            return (
              <div
                key={index}
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: stepNumber < currentStep ? 32 : stepNumber === currentStep ? 48 : 8,
                  background: stepNumber <= currentStep ? 'var(--color-teal)' : 'var(--color-line)',
                }}
              />
            );
          })}
        </div>
        <span
          className="ml-auto"
          style={{
            fontFamily: "'Libre Franklin', sans-serif",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1.5,
            color: 'var(--color-sub)',
          }}
        >
          STEP {currentStep} OF {totalSteps}
        </span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h2 style={heading(28, 2)}>{title}</h2>
        {subtitle && <p style={{ ...subText(14), marginTop: 6 }}>{subtitle}</p>}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto mb-6">{children}</div>

      {/* Actions */}
      <div className="flex gap-3 pt-4" style={{ borderTop: '1px solid var(--color-line)' }}>
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
