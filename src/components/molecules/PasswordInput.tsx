import { useState } from 'react';
import { Eye, EyeOff, Lock, Check, X } from 'lucide-react';
import { getPasswordStrength } from '../../utils/validation';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  showStrengthIndicator?: boolean;
  showRequirements?: boolean;
  error?: string;
  disabled?: boolean;
  autoComplete?: string;
}

/**
 * PasswordInput - Secure password input with strength indicator and validation
 */
export function PasswordInput({
  value,
  onChange,
  label = 'Password',
  placeholder = 'Enter a strong password',
  showStrengthIndicator = true,
  showRequirements = true,
  error,
  disabled = false,
  autoComplete = 'new-password',
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const strength = value.length > 0 ? getPasswordStrength(value) : null;

  const strengthColors = {
    weak: 'bg-danger-500',
    medium: 'bg-warning-500',
    strong: 'bg-success-500',
  };

  const strengthLabels = {
    weak: 'Weak',
    medium: 'Medium',
    strong: 'Strong',
  };

  const requirements = [
    { met: value.length >= 8, text: 'At least 8 characters' },
    { met: /[A-Z]/.test(value), text: 'One uppercase letter' },
    { met: /[a-z]/.test(value), text: 'One lowercase letter' },
    { met: /[0-9]/.test(value), text: 'One number' },
    { met: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value), text: 'One special character' },
  ];

  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        {label}
      </label>

      {/* Password Input */}
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`w-full pl-11 pr-12 py-3 border-2 rounded-xl focus:ring-0 outline-none transition-colors ${
            error
              ? 'border-danger-300 focus:border-danger-500'
              : 'border-neutral-200 focus:border-primary-500'
          }`}
          disabled={disabled}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>

      {/* Strength Indicator */}
      {showStrengthIndicator && strength && value.length > 0 && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-neutral-600">Password strength:</span>
            <span className={`text-xs font-medium ${
              strength === 'weak' ? 'text-danger-600' :
              strength === 'medium' ? 'text-warning-600' :
              'text-success-600'
            }`}>
              {strengthLabels[strength]}
            </span>
          </div>
          <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${strengthColors[strength]}`}
              style={{
                width: strength === 'weak' ? '33%' : strength === 'medium' ? '66%' : '100%',
              }}
            />
          </div>
        </div>
      )}

      {/* Requirements List */}
      {showRequirements && (isFocused || value.length > 0) && (
        <div className="mt-3 p-3 bg-neutral-50 rounded-lg">
          <p className="text-xs font-medium text-neutral-700 mb-2">Password must contain:</p>
          <ul className="space-y-1">
            {requirements.map((req, idx) => (
              <li key={idx} className="flex items-center gap-2 text-xs">
                {req.met ? (
                  <Check className="w-3.5 h-3.5 text-success-600 flex-shrink-0" />
                ) : (
                  <X className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                )}
                <span className={req.met ? 'text-success-700' : 'text-neutral-600'}>
                  {req.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-danger-600">{error}</p>
      )}
    </div>
  );
}
