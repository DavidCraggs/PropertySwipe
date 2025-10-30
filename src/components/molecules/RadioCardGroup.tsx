import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface RadioOption {
  value: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
  badge?: string;
}

interface RadioCardGroupProps {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  name: string;
  columns?: 1 | 2 | 3;
  size?: 'default' | 'compact';
}

/**
 * Large, tappable radio button cards for touch-friendly selection
 * Supports icons, descriptions, and flexible layouts
 */
export function RadioCardGroup({
  options,
  value,
  onChange,
  name,
  columns = 1,
  size = 'default',
}: RadioCardGroupProps) {
  const gridClass =
    columns === 1 ? 'grid-cols-1' : columns === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3';

  const padding = size === 'compact' ? 'p-4' : 'p-5 md:p-6';
  const iconSize = size === 'compact' ? 'w-6 h-6' : 'w-8 h-8';

  return (
    <div className={`grid ${gridClass} gap-3`} role="radiogroup" aria-label={name}>
      {options.map((option) => {
        const isSelected = value === option.value;
        const Icon = option.icon;

        return (
          <motion.label
            key={option.value}
            whileTap={{ scale: 0.98 }}
            className="relative cursor-pointer"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={isSelected}
              onChange={() => onChange(option.value)}
              className="sr-only"
              aria-describedby={option.description ? `${option.value}-desc` : undefined}
            />

            <div
              className={`
                relative ${padding} rounded-2xl border-2 transition-all duration-200
                ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 shadow-md'
                    : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm'
                }
              `}
            >
              {/* Selection Checkmark */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </motion.div>
              )}

              <div className="flex items-start gap-4">
                {/* Icon */}
                {Icon && (
                  <div
                    className={`
                      ${iconSize} flex-shrink-0 flex items-center justify-center rounded-xl
                      ${isSelected ? 'text-primary-600' : 'text-neutral-400'}
                    `}
                  >
                    <Icon className="w-full h-full" />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`
                        font-semibold text-base md:text-lg
                        ${isSelected ? 'text-primary-900' : 'text-neutral-900'}
                      `}
                    >
                      {option.label}
                    </span>
                    {option.badge && (
                      <span
                        className={`
                          px-2 py-0.5 text-xs font-medium rounded-full
                          ${
                            isSelected
                              ? 'bg-primary-200 text-primary-800'
                              : 'bg-neutral-200 text-neutral-700'
                          }
                        `}
                      >
                        {option.badge}
                      </span>
                    )}
                  </div>

                  {option.description && (
                    <p
                      id={`${option.value}-desc`}
                      className={`
                        text-sm
                        ${isSelected ? 'text-primary-700' : 'text-neutral-600'}
                      `}
                    >
                      {option.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.label>
        );
      })}
    </div>
  );
}

interface RadioOption2 {
  value: string;
  label: string;
  description?: string;
  content?: ReactNode;
}

interface RadioListProps {
  options: RadioOption2[];
  value: string;
  onChange: (value: string) => void;
  name: string;
}

/**
 * Compact radio list for simpler selections
 */
export function RadioList({ options, value, onChange, name }: RadioListProps) {
  return (
    <div className="space-y-2" role="radiogroup" aria-label={name}>
      {options.map((option) => {
        const isSelected = value === option.value;

        return (
          <label
            key={option.value}
            className={`
              flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
              ${
                isSelected
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 hover:border-neutral-300 bg-white'
              }
            `}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={isSelected}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />

            <div
              className={`
                flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5
                ${isSelected ? 'border-primary-500' : 'border-neutral-300'}
              `}
            >
              {isSelected && <div className="w-3 h-3 rounded-full bg-primary-500" />}
            </div>

            <div className="flex-1">
              <div className={`font-medium ${isSelected ? 'text-primary-900' : 'text-neutral-900'}`}>
                {option.label}
              </div>
              {option.description && (
                <div className={`text-sm mt-1 ${isSelected ? 'text-primary-700' : 'text-neutral-600'}`}>
                  {option.description}
                </div>
              )}
              {option.content && <div className="mt-2">{option.content}</div>}
            </div>
          </label>
        );
      })}
    </div>
  );
}
