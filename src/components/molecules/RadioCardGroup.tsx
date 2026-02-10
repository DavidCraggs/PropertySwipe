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
 * Concept C radio cards — teal selection, CSS var colors, Libre Franklin text
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
              className={`relative ${padding} rounded-2xl transition-all duration-200`}
              style={{
                background: isSelected ? 'rgba(13,148,136,0.06)' : 'var(--color-card)',
                border: `1.5px solid ${isSelected ? 'var(--color-teal)' : 'var(--color-line)'}`,
              }}
            >
              {/* Selection Checkmark */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--color-teal)' }}
                >
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </motion.div>
              )}

              <div className="flex items-start gap-4">
                {/* Icon */}
                {Icon && (
                  <div
                    className={`${iconSize} flex-shrink-0 flex items-center justify-center rounded-xl`}
                    style={{ color: isSelected ? 'var(--color-teal)' : 'var(--color-sub)' }}
                  >
                    <Icon className="w-full h-full" />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      style={{
                        fontFamily: "'Libre Franklin', sans-serif",
                        fontSize: 15,
                        fontWeight: 700,
                        color: isSelected ? 'var(--color-teal)' : 'var(--color-text)',
                      }}
                    >
                      {option.label}
                    </span>
                    {option.badge && (
                      <span
                        style={{
                          fontFamily: "'Libre Franklin', sans-serif",
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: 1,
                          padding: '2px 8px',
                          borderRadius: 99,
                          background: isSelected ? 'rgba(13,148,136,0.15)' : 'var(--color-line)',
                          color: isSelected ? 'var(--color-teal)' : 'var(--color-sub)',
                        }}
                      >
                        {option.badge}
                      </span>
                    )}
                  </div>

                  {option.description && (
                    <p
                      id={`${option.value}-desc`}
                      style={{
                        fontFamily: "'Libre Franklin', sans-serif",
                        fontSize: 13,
                        fontWeight: 500,
                        color: 'var(--color-sub)',
                        margin: 0,
                      }}
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
 * Concept C compact radio list — teal dot, CSS var colors
 */
export function RadioList({ options, value, onChange, name }: RadioListProps) {
  return (
    <div className="space-y-2" role="radiogroup" aria-label={name}>
      {options.map((option) => {
        const isSelected = value === option.value;

        return (
          <label
            key={option.value}
            className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all"
            style={{
              background: isSelected ? 'rgba(13,148,136,0.06)' : 'var(--color-card)',
              border: `1.5px solid ${isSelected ? 'var(--color-teal)' : 'var(--color-line)'}`,
            }}
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
              className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
              style={{ border: `2px solid ${isSelected ? 'var(--color-teal)' : 'var(--color-line)'}` }}
            >
              {isSelected && (
                <div className="w-3 h-3 rounded-full" style={{ background: 'var(--color-teal)' }} />
              )}
            </div>

            <div className="flex-1">
              <div
                style={{
                  fontFamily: "'Libre Franklin', sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  color: isSelected ? 'var(--color-teal)' : 'var(--color-text)',
                }}
              >
                {option.label}
              </div>
              {option.description && (
                <div
                  style={{
                    fontFamily: "'Libre Franklin', sans-serif",
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--color-sub)',
                    marginTop: 2,
                  }}
                >
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
