import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MailCheck } from 'lucide-react';

interface MagicLinkSentProps {
  email: string;
  onResend: () => Promise<{ success: boolean; error?: string }>;
  onChangeEmail: () => void;
}

/**
 * MagicLinkSent — Concept C design
 * Confirmation screen shown after a magic link has been sent.
 * Displays the target email, a 60-second resend countdown, and a change-email link.
 */
export function MagicLinkSent({ email, onResend, onChangeEmail }: MagicLinkSentProps) {
  const [countdown, setCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const canResend = countdown === 0 && !isResending;

  const handleResend = useCallback(async () => {
    if (!canResend) return;

    setError('');
    setIsResending(true);

    try {
      const result = await onResend();
      if (result.success) {
        setCountdown(60);
      } else {
        setError(result.error || 'Failed to resend. Please try again.');
      }
    } catch (err) {
      console.error('[MagicLinkSent] Resend error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsResending(false);
    }
  }, [canResend, onResend]);

  const resendDisabled = !canResend;

  const resendButtonStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 48,
    padding: '14px 0',
    fontFamily: "'Libre Franklin', sans-serif",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 2,
    textTransform: 'uppercase',
    background: resendDisabled ? 'transparent' : 'var(--color-teal)',
    color: resendDisabled ? 'var(--color-sub)' : '#fff',
    border: '1.5px solid var(--color-line)',
    borderRadius: 12,
    cursor: resendDisabled ? 'not-allowed' : 'pointer',
    opacity: isResending ? 0.7 : 1,
    transition: 'background 0.2s, color 0.2s, opacity 0.2s, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      {/* Icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.4, ease: 'easeOut' }}
        style={{ marginBottom: 20 }}
      >
        <MailCheck size={48} style={{ color: 'var(--color-teal)' }} />
      </motion.div>

      {/* Heading */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 32,
          letterSpacing: 3,
          margin: '0 0 12px',
          lineHeight: 1,
          color: 'var(--color-text)',
        }}
      >
        CHECK YOUR EMAIL
      </motion.h2>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        style={{
          fontFamily: "'Libre Franklin', sans-serif",
          fontSize: 13,
          color: 'var(--color-sub)',
          fontWeight: 500,
          margin: '0 0 4px',
          lineHeight: 1.5,
        }}
      >
        We sent a magic link to
      </motion.p>

      {/* Email */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        style={{
          fontFamily: "'Libre Franklin', sans-serif",
          fontSize: 14,
          color: 'var(--color-teal)',
          fontWeight: 700,
          margin: '0 0 8px',
          wordBreak: 'break-all',
        }}
      >
        {email}
      </motion.p>

      {/* Expiry notice */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        style={{
          fontFamily: "'Libre Franklin', sans-serif",
          fontSize: 11,
          color: 'var(--color-sub)',
          fontWeight: 500,
          fontStyle: 'italic',
          margin: '0 0 28px',
        }}
      >
        The link will expire in 10 minutes.
      </motion.p>

      {/* Error */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              width: '100%',
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

      {/* Resend button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        style={{ width: '100%', marginBottom: 16 }}
      >
        <button
          type="button"
          disabled={resendDisabled}
          onClick={handleResend}
          style={resendButtonStyle}
          onMouseEnter={(e) => {
            if (!resendDisabled) e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {isResending
            ? 'SENDING...'
            : countdown > 0
              ? `RESEND IN ${countdown}s`
              : 'RESEND LINK'}
        </button>
      </motion.div>

      {/* Change email link */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <button
          type="button"
          onClick={onChangeEmail}
          style={{
            fontFamily: "'Libre Franklin', sans-serif",
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--color-teal)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          Use a different email
        </button>
      </motion.div>
    </motion.div>
  );
}
