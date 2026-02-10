import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail } from 'lucide-react';

interface MagicLinkFormProps {
  onSend: (email: string) => Promise<{ success: boolean; error?: string }>;
  onSuccess: (email: string) => void;
  isLoading?: boolean;
}

/**
 * MagicLinkForm — Concept C design
 * Email input + submit button for requesting a magic link.
 * Uses inline styling consistent with LoginPage and the Concept C design system.
 */
export function MagicLinkForm({ onSend, onSuccess, isLoading: externalLoading }: MagicLinkFormProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLoading = externalLoading || isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = email.trim();

    if (!trimmed) {
      setError('Please enter your email address');
      return;
    }

    if (!trimmed.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await onSend(trimmed.toLowerCase());
      if (result.success) {
        onSuccess(trimmed.toLowerCase());
      } else {
        setError(result.error || 'Failed to send magic link. Please try again.');
      }
    } catch (err) {
      console.error('[MagicLinkForm] Send error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 14px 14px 44px',
    fontFamily: "'Libre Franklin', sans-serif",
    fontSize: 14,
    fontWeight: 500,
    background: 'var(--color-card)',
    color: 'var(--color-text)',
    border: `1.5px solid ${isFocused ? 'var(--color-teal)' : 'var(--color-line)'}`,
    borderRadius: 12,
    outline: 'none',
    transition: 'border-color 0.2s, background 0.2s',
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      animate={error ? { x: [-8, 8, -8, 8, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Email field */}
      <motion.div
        style={{ marginBottom: 16 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <label
          style={{
            display: 'block',
            fontFamily: "'Libre Franklin', sans-serif",
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 2,
            color: 'var(--color-sub)',
            marginBottom: 8,
            textTransform: 'uppercase',
          }}
        >
          EMAIL ADDRESS
        </label>
        <div style={{ position: 'relative' }}>
          <Mail
            size={18}
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: isFocused ? 'var(--color-teal)' : 'var(--color-sub)',
              transition: 'color 0.2s',
              pointerEvents: 'none',
            }}
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="your@email.com"
            style={inputStyle}
            disabled={isLoading}
            autoComplete="email"
          />
        </div>
      </motion.div>

      {/* Error */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              padding: '10px 14px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 10,
              marginBottom: 16,
            }}
          >
            <p
              style={{
                fontFamily: "'Libre Franklin', sans-serif",
                fontSize: 12,
                color: '#ef4444',
                fontWeight: 600,
                margin: 0,
              }}
            >
              {error}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            minHeight: 48,
            padding: '14px 0',
            fontFamily: "'Libre Franklin', sans-serif",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 2,
            textTransform: 'uppercase',
            background: 'var(--color-teal)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            cursor: isLoading ? 'wait' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
            transition: 'opacity 0.2s, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
          onMouseEnter={(e) => {
            if (!isLoading) e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {isLoading ? 'SENDING...' : 'SEND MAGIC LINK'}
        </button>
      </motion.div>
    </motion.form>
  );
}
