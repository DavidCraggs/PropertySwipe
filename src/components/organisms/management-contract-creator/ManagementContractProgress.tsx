/**
 * ManagementContractProgress - Step progress indicator for the wizard
 */

import { Check } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  shortTitle?: string;
}

interface ManagementContractProgressProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
}

export function ManagementContractProgress({
  steps,
  currentStep,
  onStepClick,
}: ManagementContractProgressProps) {
  return (
    <div className="w-full">
      {/* Desktop view */}
      <div className="hidden sm:flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = onStepClick && index <= currentStep;

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-initial">
              <button
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className={`flex items-center gap-2 ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                {/* Step circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    isCompleted
                      ? 'bg-success-500 text-white'
                      : isCurrent
                        ? 'bg-primary-500 text-white'
                        : 'bg-neutral-200 text-neutral-500'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Step title */}
                <span
                  className={`text-sm font-medium hidden lg:inline ${
                    isCurrent
                      ? 'text-primary-600'
                      : isCompleted
                        ? 'text-success-600'
                        : 'text-neutral-500'
                  }`}
                >
                  {step.shortTitle || step.title}
                </span>
              </button>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    index < currentStep
                      ? 'bg-success-500'
                      : 'bg-neutral-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile view */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary-600">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-sm text-neutral-500">
            {steps[currentStep]?.title}
          </span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2">
          <div
            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
