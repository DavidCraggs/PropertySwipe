import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { LoginButton } from '../components/molecules/LoginButton';
import { LOGIN_TAGLINES } from '../data/taglines';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

/**
 * WelcomeScreen — Concept C landing page
 * Typography-driven, warm parchment background, no orbs, no gradients
 * Bebas Neue headings, Libre Franklin body, teal as sole accent
 */
export function WelcomeScreen({ onGetStarted, onLogin }: WelcomeScreenProps) {
  const tagline = useMemo(() => {
    const index = Math.floor(Math.random() * LOGIN_TAGLINES.length);
    return LOGIN_TAGLINES[index];
  }, []);

  const features = [
    { title: 'FAST MATCHING', description: 'Connect with quality renters or find your perfect rental in minutes' },
    { title: 'DIRECT CONNECTION', description: 'No middlemen. Chat directly with renters and landlords' },
    { title: 'LOCAL FOCUS', description: 'Properties in Southport, Liverpool, and Manchester' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        transition: 'background 0.5s, color 0.5s',
      }}
    >
      {/* Login Button */}
      <LoginButton onLogin={onLogin} />

      {/* Header */}
      <motion.header
        style={{
          padding: '24px 24px 0',
          textAlign: 'center',
          zIndex: 10,
        }}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }}
      >
        <h1
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 44,
            letterSpacing: 6,
            margin: 0,
            lineHeight: 1,
          }}
        >
          <span style={{ color: 'var(--color-teal)' }}>LET</span>RIGHT
        </h1>
        <p
          style={{
            fontFamily: "'Libre Franklin', sans-serif",
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: 3,
            color: 'var(--color-sub)',
            margin: '4px 0 0',
          }}
        >
          &ldquo;SWIPE RIGHT. LET RIGHT.&rdquo;
        </p>
      </motion.header>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
          zIndex: 10,
        }}
      >
        <div style={{ maxWidth: 520, width: '100%' }}>
          {/* Hero */}
          <motion.div
            style={{ textAlign: 'center', marginBottom: 48 }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
          >
            <h2
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 52,
                letterSpacing: 4,
                lineHeight: 1,
                margin: '0 0 12px',
              }}
            >
              LET RIGHT,{' '}
              <span style={{ color: 'var(--color-teal)' }}>LIVE BETTER</span>
            </h2>
            <p
              style={{
                fontFamily: "'Libre Franklin', sans-serif",
                fontSize: 14,
                color: 'var(--color-sub)',
                fontWeight: 500,
                lineHeight: 1.6,
                fontStyle: 'italic',
              }}
            >
              &ldquo;{tagline}&rdquo;
            </p>
          </motion.div>

          {/* Features */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 48 }}>
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: 0.25 + index * 0.08 }}
                style={{
                  background: 'var(--color-card)',
                  border: '1.5px solid var(--color-line)',
                  borderRadius: 16,
                  padding: '16px 12px',
                  textAlign: 'center',
                }}
              >
                <h3
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 18,
                    letterSpacing: 2,
                    margin: '0 0 8px',
                    color: 'var(--color-text)',
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    fontFamily: "'Libre Franklin', sans-serif",
                    fontSize: 11,
                    color: 'var(--color-sub)',
                    fontWeight: 500,
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            style={{ display: 'flex', justifyContent: 'center' }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.5 }}
          >
            <button
              onClick={onGetStarted}
              style={{
                fontFamily: "'Libre Franklin', sans-serif",
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: 'uppercase',
                background: 'var(--color-teal)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '16px 40px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: '0 6px 24px var(--color-glow)',
                transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              GET STARTED
              <ArrowRight size={18} />
            </button>
          </motion.div>

          {/* Social Proof */}
          <motion.p
            style={{
              fontFamily: "'Libre Franklin', sans-serif",
              fontSize: 11,
              color: 'var(--color-sub)',
              textAlign: 'center',
              marginTop: 40,
              fontWeight: 500,
              letterSpacing: 0.5,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            Helping renters and landlords connect across Southport, Liverpool & Manchester
          </motion.p>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          padding: 24,
          textAlign: 'center',
          fontFamily: "'Libre Franklin', sans-serif",
          fontSize: 10,
          color: 'var(--color-sub)',
          fontWeight: 500,
          letterSpacing: 1,
          zIndex: 10,
        }}
      >
        &copy; 2026 LetRight. Making property moves efficient.
      </footer>
    </div>
  );
}
