import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { getAuthErrorMessage } from '../utils/authErrors';

/**
 * AuthCallbackPage — handles OAuth and magic link redirects
 * Shows a loading spinner while Supabase processes URL tokens.
 * If error params are found in the URL hash, displays a Concept C styled error card.
 * Otherwise, the onAuthStateChange listener in App.tsx handles routing.
 */
export function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hash = window.location.hash;

    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const errorCode = params.get('error');
      const errorDescription = params.get('error_description');

      if (errorCode || errorDescription) {
        const message = getAuthErrorMessage({
          message: errorDescription?.replace(/\+/g, ' ') || errorCode || 'Unknown error',
        });
        setError(message);
        setLoading(false);
        return;
      }
    }

    // No error found — Supabase auth state listener in App.tsx will handle routing.
    // Keep showing spinner while that processes.
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        transition: 'background 0.5s, color 0.5s',
      }}
    >
      {loading && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
          }}
        >
          {/* CSS-only teal spinner */}
          <div
            style={{
              width: 40,
              height: 40,
              border: '3px solid var(--color-line)',
              borderTopColor: 'var(--color-teal)',
              borderRadius: '50%',
              animation: 'auth-spinner 0.8s linear infinite',
            }}
          />
          <p
            style={{
              fontFamily: "'Libre Franklin', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 1.5,
              color: 'var(--color-sub)',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            Signing you in...
          </p>

          {/* Spinner keyframes */}
          <style>{`
            @keyframes auth-spinner {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            width: '100%',
            maxWidth: 400,
            padding: '0 24px',
          }}
        >
          <div
            style={{
              background: 'var(--color-card)',
              border: '1.5px solid var(--color-line)',
              borderRadius: 16,
              padding: '32px 24px',
              textAlign: 'center',
            }}
          >
            {/* Error icon */}
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: 'rgba(239,68,68,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <AlertCircle size={28} color="#ef4444" />
            </div>

            {/* Heading */}
            <h1
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 32,
                letterSpacing: 3,
                margin: '0 0 12px',
                lineHeight: 1,
                color: 'var(--color-text)',
              }}
            >
              SIGN IN FAILED
            </h1>

            {/* Error message */}
            <p
              style={{
                fontFamily: "'Libre Franklin', sans-serif",
                fontSize: 13,
                color: 'var(--color-sub)',
                fontWeight: 500,
                lineHeight: 1.6,
                margin: '0 0 28px',
              }}
            >
              {error}
            </p>

            {/* Retry button */}
            <button
              onClick={() => {
                window.location.href = '/';
              }}
              style={{
                width: '100%',
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
                cursor: 'pointer',
                transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              TRY AGAIN
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
